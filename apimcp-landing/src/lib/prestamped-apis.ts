export type PrestampedAPI = {
  id: string
  name: string
  description: string
  logo: string
  specUrl: string
  category: string
  tools: string
  curated: boolean
}

export const PRESTAMPED_APIS: PrestampedAPI[] = [
  {
    id: 'github',
    name: 'GitHub REST API',
    description: 'Full GitHub API — repos, issues, PRs, commits, users, orgs, and more.',
    logo: '⬡',
    specUrl: 'https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/ghes-3.17/ghes-3.17.json',
    category: 'Developer Tools',
    tools: '100+ tools across repos, issues, pulls, users',
    curated: true,
  },
  {
    id: 'stripe',
    name: 'Stripe API',
    description: 'Payments, subscriptions, customers, invoices, disputes, and balances.',
    logo: '◆',
    specUrl: 'https://raw.githubusercontent.com/stripe/openapi/master/openapi/spec3.json',
    category: 'Payments',
    tools: '200+ tools across charges, customers, subscriptions',
    curated: true,
  },
  {
    id: 'slack',
    name: 'Slack Web API',
    description: 'Messaging, channels, users, conversations, files, and workspace management.',
    logo: '◆',
    specUrl: 'https://raw.githubusercontent.com/slackapi/slack-api-specs/master/web-api/complete/slack_web_openapi_v2.json',
    category: 'Communication',
    tools: '150+ tools across channels, messages, users, files',
    curated: true,
  },
  {
    id: 'notion',
    name: 'Notion API',
    description: 'Pages, databases, blocks, comments, and users for Notion workspaces.',
    logo: '◆',
    specUrl: 'https://raw.githubusercontent.com/makenotion/notion-api-spec/main/versions/2022-06-28.yml',
    category: 'Productivity',
    tools: '30+ tools across pages, databases, blocks',
    curated: true,
  },
  {
    id: 'linear',
    name: 'Linear API',
    description: 'Issue tracking, projects, teams, cycles, and roadmap management.',
    logo: '◆',
    specUrl: 'https://raw.githubusercontent.com/linear/linear/master/packages/server/src/schema/openapi.json',
    category: 'Developer Tools',
    tools: '60+ tools across issues, projects, teams',
    curated: true,
  },
  {
    id: 'discord',
    name: 'Discord API',
    description: 'Channels, messages, guilds, users, voice, and moderation.',
    logo: '◆',
    specUrl: 'https://raw.githubusercontent.com/discord/discord-api-spec/main/specs/openapi.json',
    category: 'Communication',
    tools: '120+ tools across channels, guilds, messages',
    curated: true,
  },
  {
    id: 'jira',
    name: 'Jira Cloud API',
    description: 'Issues, projects, sprints, boards, users, and workflows.',
    logo: '◆',
    specUrl: 'https://raw.githubusercontent.com/atlassian-api-documentation/atlassian-rest-apis/refs/heads/main/openapi/jira-issues/versions/3/api.3.yaml',
    category: 'Developer Tools',
    tools: '80+ tools across issues, projects, boards',
    curated: true,
  },
  {
    id: 'vercel',
    name: 'Vercel API',
    description: 'Deployments, projects, domains, teams, and environment variables.',
    logo: '◆',
    specUrl: 'https://api.vercel.com/openapi.json',
    category: 'Developer Tools',
    tools: '40+ tools across deployments, projects, domains',
    curated: true,
  },
  {
    id: 'github-issues',
    name: 'GitHub Issues API',
    description: 'Focused GitHub issues management — create, update, search, and comment.',
    logo: '•',
    specUrl: 'https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/public/issues.json',
    category: 'Developer Tools',
    tools: '20 tools across issues, comments, labels',
    curated: true,
  },
  {
    id: 'resend',
    name: 'Resend API',
    description: 'Email delivery — send, track, and manage email campaigns.',
    logo: '◆',
    specUrl: 'https://raw.githubusercontent.com/resend/api/refs/heads/main/openapi.yaml',
    category: 'Communication',
    tools: '10 tools across emails, domains, audiences',
    curated: true,
  },
  {
    id: 'postmark',
    name: 'Postmark API',
    description: 'Transactional email delivery with open and click tracking.',
    logo: '•',
    specUrl: 'https://api.postmarkapp.com/openapi.json',
    category: 'Communication',
    tools: '30+ tools across emails, bounces, stats',
    curated: true,
  },
  {
    id: 'openai',
    name: 'OpenAI API',
    description: 'Chat completions, embeddings, models, files, images, and assistants.',
    logo: '◆',
    specUrl: 'https://raw.githubusercontent.com/openai/openai-openapi/master/openapi.yaml',
    category: 'AI',
    tools: '40+ tools across chat, embeddings, models',
    curated: true,
  },
]

export const CATEGORIES = [...new Set(PRESTAMPED_APIS.map(a => a.category))]
