import { NextResponse } from 'next/server'

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'

type Message = { role: 'user' | 'assistant' | 'system'; content: string }
type ToolCall = { name: string; args: any; result?: string }

async function fetchMCPTools(serverUrl: string): Promise<{ name: string; description: string; inputSchema: any }[]> {
  const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' })
  const res = await fetch(serverUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })
  if (!res.ok) throw new Error('Failed to fetch tools: HTTP ' + res.status)
  const data = await res.json()
  return data?.result?.tools || []
}

async function callMCPTool(serverUrl: string, name: string, args: any): Promise<string> {
  const res = await fetch(serverUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, arguments: args }),
  })
  const body = await res.text()
  try {
    const parsed = JSON.parse(body)
    return typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2)
  } catch {
    return body
  }
}

export async function POST(request: Request) {
  try {
    const { message, serverUrl, history } = await request.json()
    if (!message || !serverUrl) {
      return NextResponse.json({ error: 'Missing message or serverUrl' }, { status: 400 })
    }

    const tools = await fetchMCPTools(serverUrl)
    if (tools.length === 0) {
      return NextResponse.json({ error: 'No tools found on MCP server' }, { status: 400 })
    }

    const groqTools = tools.map(t => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description || '',
        parameters: t.inputSchema?.properties
          ? {
              type: 'object',
              properties: t.inputSchema.properties,
              required: t.inputSchema.required || [],
            }
          : { type: 'object', properties: {} },
      },
    }))

    const messages: any[] = [
      {
        role: 'system',
        content: 'You are an AI assistant that helps users interact with APIs. You have access to tools that call an API on the user\'s behalf. When the user asks for something, use the appropriate tool to fulfill their request. Respond naturally and show the results clearly.',
      },
      ...(history || []),
      { role: 'user', content: message },
    ]

    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: 'GROQ_API_KEY not configured on server' }, { status: 500 })
    }

    const initRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + GROQ_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        tools: groqTools,
        tool_choice: 'auto',
        max_tokens: 2048,
      }),
    })

    if (!initRes.ok) {
      const errText = await initRes.text()
      return NextResponse.json({ error: 'Groq API error: ' + errText }, { status: 502 })
    }

    const initData = await initRes.json()
    const choice = initData.choices?.[0]
    if (!choice) {
      return NextResponse.json({ error: 'No response from Groq' }, { status: 502 })
    }

    const toolCalls: ToolCall[] = []
    let finalContent = choice.message?.content || ''

    if (choice.message?.tool_calls) {
      for (const tc of choice.message.tool_calls) {
        const name = tc.function.name
        let args: any = {}
        try { args = JSON.parse(tc.function.arguments) } catch {}
        const result = await callMCPTool(serverUrl, name, args)
        toolCalls.push({ name, args, result: result.slice(0, 3000) })
      }

      const toolMessages: any[] = [...messages, choice.message]
      for (const tc of choice.message.tool_calls) {
        const tcResult = toolCalls.find(t => t.name === tc.function.name)
        toolMessages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: tcResult?.result || 'No result',
        })
      }

      const finalRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + GROQ_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: toolMessages,
          max_tokens: 2048,
        }),
      })

      if (finalRes.ok) {
        const finalData = await finalRes.json()
        finalContent = finalData.choices?.[0]?.message?.content || finalContent
      }
    }

    return NextResponse.json({
      content: finalContent,
      toolCalls,
      toolCount: tools.length,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
