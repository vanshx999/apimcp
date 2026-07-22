import yaml from 'js-yaml';
const parseYaml = yaml.load;

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>apimcp — Turn any API into an AI agent</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-deep: #0a0a1a;
      --bg-mid: #12122a;
      --bg-card: rgba(255,255,255,0.05);
      --accent: #5ac8fa;
      --accent-hover: #7dd4ff;
      --accent-glow: rgba(90,200,250,0.3);
      --text-primary: #e0e0f0;
      --text-secondary: #6c6c8a;
      --text-muted: #4a4a6a;
      --success: #4cd964;
      --error: #ff3b30;
      --border: rgba(255,255,255,0.08);
      --get: #34c759;
      --post: #5ac8fa;
      --put: #ffcc00;
      --delete: #ff3b30;
      --patch: #af52de;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: linear-gradient(135deg, var(--bg-deep) 0%, #1a1a3e 100%);
      color: var(--text-primary);
      min-height: 100vh;
      overflow-x: hidden;
      position: relative;
    }

    .particles {
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none;
      z-index: 0;
      overflow: hidden;
    }
    .particle {
      position: absolute;
      width: 2px; height: 2px;
      background: var(--accent);
      border-radius: 50%;
      opacity: 0;
      animation: float 8s infinite ease-in-out;
    }
    @keyframes float {
      0%, 100% { opacity: 0; transform: translateY(0) scale(1); }
      50% { opacity: 0.6; transform: translateY(-60px) scale(1.5); }
    }

    .grid-overlay {
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background-image: 
        linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
      background-size: 60px 60px;
      pointer-events: none;
      z-index: 1;
    }

    .container {
      position: relative;
      z-index: 2;
      max-width: 800px;
      margin: 0 auto;
      padding: 60px 24px 40px;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 80px;
      animation: fadeInDown 0.8s ease-out;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 700;
      font-size: 1.2rem;
      color: var(--text-primary);
    }
    .logo-icon {
      width: 32px; height: 32px;
      background: linear-gradient(135deg, var(--accent), #2d8cf0);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
      color: white;
    }
    .nav-links a {
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 0.85rem;
      font-weight: 500;
      transition: color 0.2s;
      margin-left: 24px;
    }
    .nav-links a:hover { color: var(--accent); }

    .hero {
      text-align: center;
      margin-bottom: 48px;
      animation: fadeInUp 0.8s ease-out 0.2s both;
    }
    .hero h1 {
      font-size: clamp(2rem, 5vw, 3.5rem);
      font-weight: 800;
      line-height: 1.1;
      margin-bottom: 16px;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, #fff 0%, var(--accent) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .hero p {
      font-size: 1.1rem;
      color: var(--text-secondary);
      max-width: 500px;
      margin: 0 auto 32px;
      line-height: 1.6;
    }

    .input-section {
      animation: fadeInUp 0.8s ease-out 0.4s both;
      margin-bottom: 32px;
    }
    .input-group {
      display: flex;
      gap: 12px;
      background: var(--bg-card);
      backdrop-filter: blur(20px);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 8px;
      transition: border-color 0.3s, box-shadow 0.3s;
    }
    .input-group:focus-within {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-glow);
    }
    .input-group input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: var(--text-primary);
      font-size: 0.95rem;
      padding: 12px 16px;
      font-family: 'JetBrains Mono', monospace;
    }
    .input-group input::placeholder {
      color: var(--text-muted);
      font-family: 'Inter', sans-serif;
    }
    .btn {
      background: linear-gradient(135deg, var(--accent), #2d8cf0);
      color: white;
      border: none;
      padding: 12px 28px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      transition: transform 0.15s, box-shadow 0.2s;
      position: relative;
      overflow: hidden;
      white-space: nowrap;
    }
    .btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 20px var(--accent-glow);
    }
    .btn:active { transform: translateY(0); }
    .btn::after {
      content: '';
      position: absolute;
      top: 50%; left: 50%;
      width: 0; height: 0;
      background: rgba(255,255,255,0.3);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      transition: width 0.4s, height 0.4s;
    }
    .btn:active::after {
      width: 200px; height: 200px;
    }

    .examples {
      display: flex;
      gap: 10px;
      justify-content: center;
      flex-wrap: wrap;
      margin-top: 20px;
      animation: fadeInUp 0.8s ease-out 0.5s both;
    }
    .pill {
      background: var(--bg-card);
      backdrop-filter: blur(10px);
      border: 1px solid var(--border);
      color: var(--text-secondary);
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .pill:hover {
      border-color: var(--accent);
      color: var(--accent);
      transform: translateY(-1px);
    }

    .loading-card {
      display: none;
      background: var(--bg-card);
      backdrop-filter: blur(20px);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 48px;
      text-align: center;
      margin-top: 32px;
      animation: slideUp 0.5s ease-out;
    }
    .loading-card.active { display: block; }
    .spinner {
      width: 48px; height: 48px;
      margin: 0 auto 20px;
      position: relative;
    }
    .spinner::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 3px solid transparent;
      border-top-color: var(--accent);
      border-right-color: #2d8cf0;
      animation: spin 1s linear infinite;
    }
    .spinner::after {
      content: '';
      position: absolute;
      inset: 6px;
      border-radius: 50%;
      border: 3px solid transparent;
      border-bottom-color: var(--accent);
      border-left-color: #2d8cf0;
      animation: spin 1.5s linear infinite reverse;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-card p {
      color: var(--text-secondary);
      font-size: 0.95rem;
    }

    .spec-card {
      display: none;
      background: var(--bg-card);
      backdrop-filter: blur(20px);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 32px;
      margin-top: 32px;
      animation: slideUp 0.6s ease-out;
    }
    .spec-card.active { display: block; }
    .spec-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .spec-title h2 {
      font-size: 1.4rem;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .spec-title .version {
      color: var(--text-secondary);
      font-size: 0.85rem;
    }
    .endpoint-count {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .count-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 600;
      background: rgba(255,255,255,0.03);
    }
    .count-badge .dot {
      width: 6px; height: 6px;
      border-radius: 50%;
    }

    .endpoint-list {
      max-height: 320px;
      overflow-y: auto;
      border: 1px solid var(--border);
      border-radius: 12px;
      margin-bottom: 24px;
    }
    .endpoint-list::-webkit-scrollbar { width: 6px; }
    .endpoint-list::-webkit-scrollbar-track { background: transparent; }
    .endpoint-list::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.1);
      border-radius: 3px;
    }
    .endpoint-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
      transition: background 0.15s;
    }
    .endpoint-item:last-child { border-bottom: none; }
    .endpoint-item:hover { background: rgba(255,255,255,0.02); }
    .method-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.65rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      text-transform: uppercase;
      min-width: 44px;
      text-align: center;
    }
    .method-tag.get { background: rgba(52,199,89,0.15); color: var(--get); }
    .method-tag.post { background: rgba(90,200,250,0.15); color: var(--post); }
    .method-tag.put { background: rgba(255,204,0,0.15); color: var(--put); }
    .method-tag.delete { background: rgba(255,59,48,0.15); color: var(--delete); }
    .method-tag.patch { background: rgba(175,82,222,0.15); color: var(--patch); }
    .endpoint-path {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      color: var(--text-primary);
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .endpoint-name {
      font-size: 0.75rem;
      color: var(--text-secondary);
      font-style: italic;
    }

    .deploy-btn {
      width: 100%;
      padding: 14px;
      font-size: 1rem;
    }

    .success-card {
      display: none;
      background: var(--bg-card);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(76,217,100,0.2);
      border-radius: 20px;
      padding: 40px;
      margin-top: 32px;
      text-align: center;
      animation: slideUp 0.6s ease-out;
    }
    .success-card.active { display: block; }
    .success-icon {
      width: 72px; height: 72px;
      margin: 0 auto 24px;
      position: relative;
    }
    .success-circle {
      width: 72px; height: 72px;
      border-radius: 50%;
      background: rgba(76,217,100,0.1);
      border: 2px solid var(--success);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: scaleIn 0.5s ease-out;
    }
    @keyframes scaleIn {
      0% { transform: scale(0); opacity: 0; }
      60% { transform: scale(1.1); }
      100% { transform: scale(1); opacity: 1; }
    }
    .success-circle svg {
      width: 32px; height: 32px;
      stroke: var(--success);
      stroke-width: 3;
      fill: none;
      stroke-dasharray: 48;
      stroke-dashoffset: 48;
      animation: drawCheck 0.5s ease-out 0.3s forwards;
    }
    @keyframes drawCheck { to { stroke-dashoffset: 0; } }
    .success-card h2 {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .success-card .success-sub {
      color: var(--text-secondary);
      font-size: 0.9rem;
      margin-bottom: 28px;
    }

    .url-field {
      display: flex;
      gap: 8px;
      background: rgba(0,0,0,0.2);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 4px;
      margin-bottom: 28px;
    }
    .url-field input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: var(--accent);
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      padding: 10px 12px;
    }
    .copy-btn {
      background: rgba(255,255,255,0.08);
      color: var(--text-primary);
      border: none;
      padding: 10px 18px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .copy-btn:hover { background: rgba(255,255,255,0.12); }
    .copy-btn.copied {
      background: rgba(76,217,100,0.2);
      color: var(--success);
    }

    .code-block {
      background: rgba(0,0,0,0.3);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      text-align: left;
      margin-bottom: 20px;
    }
    .code-block h4 {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
    }
    .code-block pre {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      color: var(--text-primary);
      overflow-x: auto;
      line-height: 1.6;
    }
    .code-block pre::-webkit-scrollbar { height: 4px; }
    .code-block pre::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.1);
      border-radius: 2px;
    }
    .code-block .comment { color: var(--text-muted); }
    .code-block .string { color: var(--accent); }
    .code-block .keyword { color: var(--put); }

    .footer {
      margin-top: auto;
      padding-top: 60px;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.8rem;
      animation: fadeInUp 0.8s ease-out 0.6s both;
    }
    .footer a {
      color: var(--text-secondary);
      text-decoration: none;
      transition: color 0.2s;
    }
    .footer a:hover { color: var(--accent); }
    .footer-divider {
      display: inline-block;
      margin: 0 8px;
      color: var(--text-muted);
    }

    .error-msg {
      display: none;
      background: rgba(255,59,48,0.1);
      border: 1px solid rgba(255,59,48,0.2);
      color: var(--error);
      padding: 12px 16px;
      border-radius: 12px;
      margin-top: 16px;
      font-size: 0.9rem;
      animation: shake 0.4s ease-out;
    }
    .error-msg.active { display: block; }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-6px); }
      75% { transform: translateX(6px); }
    }

    @keyframes fadeInDown {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    @media (max-width: 600px) {
      .container { padding: 32px 16px 24px; }
      .header { margin-bottom: 48px; }
      .hero h1 { font-size: 2rem; }
      .input-group { flex-direction: column; }
      .input-group .btn { width: 100%; }
      .spec-header { flex-direction: column; }
      .endpoint-item { flex-wrap: wrap; }
      .endpoint-name { width: 100%; margin-top: 4px; padding-left: 56px; }
      .url-field { flex-direction: column; }
      .copy-btn { width: 100%; }
    }
  </style>
</head>
<body>
  <div class="particles" id="particles"></div>
  <div class="grid-overlay"></div>
  <div class="container">
    <header class="header">
      <div class="logo">
        <div class="logo-icon">⚡</div>
        <span>apimcp</span>
      </div>
      <nav class="nav-links">
        <a href="#" id="docsLink">Docs</a>
        <a href="https://github.com/vanshx999/apimcp">GitHub</a>
      </nav>
    </header>

    <section class="hero">
      <h1>Turn any API into an AI agent</h1>
      <p>Paste an OpenAPI spec URL, get a deployable MCP server. No setup, no config.</p>
    </section>

    <section class="input-section">
      <div class="input-group">
        <input type="text" id="specUrl" placeholder="https://petstore.swagger.io/api/v3/openapi.json" autocomplete="off">
        <button class="btn" id="deployBtn" onclick="parseSpec()">Deploy →</button>
      </div>
      <div class="error-msg" id="errorMsg"></div>
    </section>

    <div class="examples">
      <button class="pill" onclick="fillExample('https://petstore.swagger.io/api/v3/openapi.json')">Petstore API</button>
      <button class="pill" onclick="fillExample('https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/api.github.com/api.github.com.json')">GitHub API</button>
      <button class="pill" onclick="fillExample('https://raw.githubusercontent.com/stripe/openapi/master/openapi/spec3.json')">Stripe API</button>
    </div>

    <div class="loading-card" id="loadingCard">
      <div class="spinner"></div>
      <p>Discovering spec...</p>
    </div>

    <div class="spec-card" id="specCard">
      <div class="spec-header">
        <div class="spec-title">
          <h2 id="specName">API Name</h2>
          <span class="version" id="specVersion">v1.0.0</span>
        </div>
        <div class="endpoint-count" id="endpointCount"></div>
      </div>
      <div class="endpoint-list" id="endpointList"></div>
      <button class="btn deploy-btn" id="cloudflareBtn" onclick="deployToCloudflare()">
        Deploy to Cloudflare Workers
      </button>
    </div>

    <div class="success-card" id="successCard">
      <div class="success-icon">
        <div class="success-circle">
          <svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
        </div>
      </div>
      <h2>Deployed successfully!</h2>
      <p class="success-sub">Your MCP server is live and ready to use</p>
      <div class="url-field">
        <input type="text" id="deployedUrl" readonly value="">
        <button class="copy-btn" id="copyBtn" onclick="copyUrl()">Copy URL</button>
      </div>
      <div class="code-block">
        <h4>List available tools</h4>
        <pre id="listToolsCode"></pre>
      </div>
      <div class="code-block">
        <h4>Call a tool</h4>
        <pre id="callToolCode"></pre>
      </div>
    </div>

    <footer class="footer">
      <p>
        Built for the 2026-07-28 MCP spec
        <span class="footer-divider">·</span>
        <a href="https://github.com/vanshx999/apimcp">GitHub</a>
        <span class="footer-divider">·</span>
        apimcp — OpenAPI → MCP
      </p>
    </footer>
  </div>

  <script>
    const particlesContainer = document.getElementById('particles');
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.top = Math.random() * 100 + '%';
      p.style.animationDelay = Math.random() * 8 + 's';
      p.style.animationDuration = (6 + Math.random() * 4) + 's';
      particlesContainer.appendChild(p);
    }

    let currentSpec = null;
    let currentUrl = '';

    const lastUrl = localStorage.getItem('apimcp_last_deployed');
    if (lastUrl) document.getElementById('specUrl').value = lastUrl;

    function fillExample(url) {
      const input = document.getElementById('specUrl');
      input.value = url;
      input.focus();
      input.style.background = 'rgba(90,200,250,0.1)';
      setTimeout(() => { input.style.background = 'transparent'; }, 200);
    }

    function showError(msg) {
      const el = document.getElementById('errorMsg');
      el.textContent = msg;
      el.classList.add('active');
      setTimeout(() => el.classList.remove('active'), 6000);
    }

    function hideAllCards() {
      document.getElementById('loadingCard').classList.remove('active');
      document.getElementById('specCard').classList.remove('active');
      document.getElementById('successCard').classList.remove('active');
    }

    async function parseSpec() {
      const url = document.getElementById('specUrl').value.trim();
      if (!url) { showError('Please enter an OpenAPI spec URL'); return; }
      currentUrl = url;
      hideAllCards();
      document.getElementById('loadingCard').classList.add('active');

      try {
        const res = await fetch('/api/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to parse spec');
        }
        const data = await res.json();
        currentSpec = data;
        renderSpec(data);
      } catch (err) {
        hideAllCards();
        showError(err.message || 'Failed to parse spec. Check the URL and try again.');
      }
    }

    function renderSpec(data) {
      document.getElementById('loadingCard').classList.remove('active');
      document.getElementById('specCard').classList.add('active');
      document.getElementById('specName').textContent = data.name || 'Unknown API';
      document.getElementById('specVersion').textContent = 'v' + (data.version || '1.0.0');

      const counts = {};
      (data.endpoints || []).forEach(ep => {
        const m = (ep.method || 'GET').toUpperCase();
        counts[m] = (counts[m] || 0) + 1;
      });

      const countContainer = document.getElementById('endpointCount');
      countContainer.innerHTML = '';
      const methodColors = { GET: 'var(--get)', POST: 'var(--post)', PUT: 'var(--put)', DELETE: 'var(--delete)', PATCH: 'var(--patch)' };
      Object.entries(counts).forEach(([method, count]) => {
        const badge = document.createElement('div');
        badge.className = 'count-badge';
        badge.innerHTML = '<span class="dot" style="background:' + (methodColors[method] || '#888') + '"></span>' + count + ' ' + method;
        countContainer.appendChild(badge);
      });

      const list = document.getElementById('endpointList');
      list.innerHTML = '';
      (data.endpoints || []).forEach(ep => {
        const item = document.createElement('div');
        item.className = 'endpoint-item';
        const method = (ep.method || 'GET').toLowerCase();
        item.innerHTML = '<span class="method-tag ' + method + '">' + (ep.method || 'GET') + '</span><span class="endpoint-path">' + (ep.path || '/') + '</span><span class="endpoint-name">' + (ep.toolName || ep.operationId || 'unnamed') + '</span>';
        list.appendChild(item);
      });
    }

    async function deployToCloudflare() {
      if (!currentSpec || !currentUrl) return;
      const btn = document.getElementById('cloudflareBtn');
      btn.textContent = 'Deploying...';
      btn.disabled = true;

      try {
        const res = await fetch('/api/deploy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: currentUrl, name: currentSpec.name || 'api' })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Deploy failed');
        }
        const data = await res.json();
        showSuccess(data.url);
      } catch (err) {
        showError(err.message || 'Deploy failed. Try again.');
        btn.textContent = 'Deploy to Cloudflare Workers';
        btn.disabled = false;
      }
    }

    function showSuccess(url) {
      hideAllCards();
      document.getElementById('successCard').classList.add('active');
      document.getElementById('deployedUrl').value = url;
      localStorage.setItem('apimcp_last_deployed', currentUrl);

      document.getElementById('listToolsCode').innerHTML = '<span class="comment"># List all available tools</span>\n<span class="keyword">curl</span> ' + url + '/tools';
      document.getElementById('callToolCode').innerHTML = '<span class="comment"># Call a tool (e.g., findPetsByStatus)</span>\n<span class="keyword">curl</span> -X POST ' + url + ' \\\n  -H <span class="string">"Content-Type: application/json"</span> \\\n  -d <span class="string">\'{"name":"findPetsByStatus","arguments":{"status":"available"}}\'</span>';
    }

    function copyUrl() {
      const input = document.getElementById('deployedUrl');
      navigator.clipboard.writeText(input.value).then(() => {
        const btn = document.getElementById('copyBtn');
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = 'Copy URL'; btn.classList.remove('copied'); }, 2000);
      });
    }

    document.getElementById('specUrl').addEventListener('keypress', (e) => { if (e.key === 'Enter') parseSpec(); });
    document.getElementById('docsLink').addEventListener('click', (e) => { e.preventDefault(); alert('Documentation coming soon! Check GitHub for now.'); });
  </script>
</body>
</html>`;

function resolveRef(ref, spec) {
  const parts = ref.replace(/^#\//, '').split('/');
  let obj = spec;
  for (const part of parts) {
    if (obj && typeof obj === 'object' && part in obj) {
      obj = obj[part];
    } else {
      return null;
    }
  }
  return obj;
}

function resolveSchema(schema, spec) {
  if (!schema || typeof schema !== 'object') return schema;
  if (schema.$ref) {
    const resolved = resolveRef(schema.$ref, spec);
    return resolved ? resolveSchema(resolved, spec) : schema;
  }
  if (schema.items) schema.items = resolveSchema(schema.items, spec);
  if (schema.properties) {
    for (const key of Object.keys(schema.properties)) {
      schema.properties[key] = resolveSchema(schema.properties[key], spec);
    }
  }
  if (schema.allOf) {
    schema.allOf = schema.allOf.map(s => resolveSchema(s, spec));
  }
  return schema;
}

function resolveParams(params, spec) {
  return (params || []).map(p => {
    if (p.$ref) {
      const resolved = resolveRef(p.$ref, spec);
      return resolved || p;
    }
    if (p.schema && p.schema.$ref) {
      p.schema = resolveSchema(p.schema, spec);
    }
    return p;
  });
}

function resolveRequestBody(reqBody, spec) {
  if (!reqBody) return null;
  if (reqBody.$ref) return resolveRef(reqBody.$ref, spec) || reqBody;
  if (reqBody.content) {
    for (const ct of Object.keys(reqBody.content)) {
      const mediaType = reqBody.content[ct];
      if (mediaType.schema) {
        mediaType.schema = resolveSchema(mediaType.schema, spec);
      }
    }
  }
  return reqBody;
}

function parseOpenAPISimple(specData) {
  const info = specData.info || {};
  const paths = specData.paths || {};
  const components = specData.components || {};
  const schemas = components.schemas || {};
  const mergedSpec = { ...specData, components: { ...components, schemas } };
  const endpoints = [];

  for (const [path, methods] of Object.entries(paths)) {
    if (!methods || typeof methods !== 'object') continue;
    for (const [method, details] of Object.entries(methods)) {
      if (!details || typeof details !== 'object') continue;
      if (method === 'parameters') continue;

      const rawParams = details.parameters || [];
      const params = resolveParams(rawParams, mergedSpec);
      const body = resolveRequestBody(details.requestBody, mergedSpec);

      endpoints.push({
        method: method.toUpperCase(),
        path,
        toolName: details.operationId || path.replace(/[^a-zA-Z0-9]/g, '_').replace(/^_|_$/g, ''),
        summary: details.summary || '',
        description: details.description || '',
        hasBody: !!body,
        parameters: params.map(p => ({
          name: p.name,
          in: p.in || 'query',
          required: !!p.required,
          type: (p.schema && p.schema.type) || 'string',
          description: p.description || '',
        })),
      });
    }
  }

  return {
    name: info.title || 'Unknown API',
    version: info.version || '1.0.0',
    serverUrl: ((specData.servers || [])[0] || {}).url || 'https://unknown',
    endpoints,
  };
}

function generateWorkerCode(parsed) {
  const endpoints = parsed.endpoints.map(ep => ({
    name: ep.toolName,
    method: ep.method,
    path: ep.path,
    params: ep.parameters.filter(p => p.in !== 'header').map(p => ({ name: p.name, required: p.required, type: p.type })),
    hasBody: ep.hasBody,
  }));

  return `
const TOOLS = ${JSON.stringify(endpoints, null, 2)};

function url(path) { return ${JSON.stringify(parsed.serverUrl)}.replace(/\\/+$/, '') + path; }

async function callTool(name, args) {
  const tool = TOOLS.find(t => t.name === name);
  if (!tool) return { error: 'Unknown tool: ' + name };
  let path = tool.path;
  const query = new URLSearchParams();
  let body;
  for (const k of Object.keys(args || {})) {
    if (path.includes('{' + k + '}')) path = path.replace('{' + k + '}', encodeURIComponent(String(args[k])));
    else if (k === 'body') body = typeof args.body === 'string' ? args.body : JSON.stringify(args.body);
    else query.set(k, String(args[k]));
  }
  const res = await fetch(url(path) + (query.toString() ? '?' + query.toString() : ''), {
    method: tool.method, headers: { 'Content-Type': 'application/json', 'User-Agent': 'apimcp-worker/1.0' },
    body: tool.method !== 'GET' ? body : undefined,
  });
  return { status: res.status, body: await res.text() };
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
    if (request.method === 'GET' && url.pathname === '/tools') return new Response(JSON.stringify(TOOLS.map(t => ({ name: t.name, method: t.method, path: t.path }))), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    if (request.method === 'POST') {
      try {
        const { name, arguments: args } = await request.json();
        const result = await callTool(name, args || {});
        return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }); }
    }
    return new Response('Not found', { status: 404 });
  }
};`.trim();
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    if (url.pathname === '/api/parse' && request.method === 'POST') {
      try {
        const { url: specUrl } = await request.json();
        if (!specUrl) return json({ message: 'URL is required' }, 400);
        const res = await fetch(specUrl);
        if (!res.ok) return json({ message: 'Failed to fetch spec: HTTP ' + res.status }, 400);
        const text = await res.text();
        const contentType = res.headers.get('content-type') || '';
        let specData;
        if (contentType.includes('yaml') || specUrl.match(/\.(yaml|yml)$/i)) {
          specData = parseYaml(text);
        } else {
          try { specData = JSON.parse(text); } catch { specData = parseYaml(text); }
        }
        const parsed = parseOpenAPISimple(specData);
        return json(parsed);
      } catch (err) {
        return json({ message: err.message || 'Parse failed' }, 400);
      }
    }

    if (url.pathname === '/api/deploy' && request.method === 'POST') {
      try {
        const { url: specUrl, name } = await request.json();
        if (!specUrl) return json({ message: 'URL is required' }, 400);
        const res = await fetch(specUrl);
        if (!res.ok) return json({ message: 'Failed to fetch spec: HTTP ' + res.status }, 400);
        const text = await res.text();
        let specData;
        try { specData = JSON.parse(text); } catch { specData = parseYaml(text); }
        const parsed = parseOpenAPISimple(specData);
        const safeName = (name || parsed.name || 'api').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'api-server';
        const workerCode = generateWorkerCode(parsed);

        const cfToken = env.CF_API_TOKEN;
        const accountId = env.CF_ACCOUNT_ID;

        if (!cfToken || !accountId) {
          const deployUrl = 'https://' + safeName + '.apimcp-demo.workers.dev';
          return json({
            url: deployUrl,
            note: 'Dry run — deploy the CLI version for a live URL: apimcp deploy <spec>',
          });
        }

        const subdomain = safeName + '-' + Date.now().toString(36);
        const form = new FormData();
        form.append('worker.js', new Blob([workerCode], { type: 'application/javascript' }));
        form.append('metadata', JSON.stringify({ main_module: 'worker.js' }));

        const cfRes = await fetch('https://api.cloudflare.com/client/v4/accounts/' + accountId + '/workers/scripts/' + subdomain, {
          method: 'PUT',
          headers: { 'Authorization': 'Bearer ' + cfToken },
          body: form,
        });

        const cfResult = await cfRes.json();
        if (!cfResult.success) {
          return json({ message: (cfResult.errors && cfResult.errors[0] && cfResult.errors[0].message) || 'Cloudflare API error' }, 500);
        }

        const deployUrl = 'https://' + subdomain + '.apimcp-demo.workers.dev';
        return json({ url: deployUrl });
      } catch (err) {
        return json({ message: err.message || 'Deploy failed' }, 500);
      }
    }

    return new Response(HTML, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  },
};
