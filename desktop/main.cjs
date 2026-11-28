const { app, BrowserWindow, ipcMain, Menu, Tray, shell } = require('electron');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { runOpenCodePrompt } = require('./opencode-runner.cjs');
const { createOpenAICompatibleProvider } = require('../runtime/providers/openai-compatible.cjs');

let mainWindow;
let tray;

const candidates = [
  { id: 'opencode', name: 'OpenCode', commands: ['opencode'] },
  { id: 'claude', name: 'Claude Code', commands: ['claude'] },
  { id: 'cursor', name: 'Cursor', commands: ['cursor'] },
  { id: 'cline', name: 'Cline CLI', commands: ['cline'] },
  { id: 'aider', name: 'Aider', commands: ['aider'] },
  { id: 'gemini', name: 'Gemini CLI', commands: ['gemini'] },
  { id: 'git', name: 'Git', commands: ['git'] },
  { id: 'node', name: 'Node.js', commands: ['node'] },
  { id: 'python', name: 'Python', commands: ['python', 'py'] },
  { id: 'docker', name: 'Docker', commands: ['docker'] },
  { id: 'code', name: 'VS Code', commands: ['code'] }
];

function runCommand(command, args, timeout = 2500) {
  return new Promise(resolve => {
    execFile(command, args, { windowsHide: true, timeout }, (error, stdout, stderr) => {
      if (error) return resolve({ ok: false, error: error.code || 'not_found' });
      resolve({ ok: true, output: String(stdout || stderr || '').trim().split(/\r?\n/)[0].slice(0, 160) });
    });
  });
}

async function detectLocalTools() {
  const results = [];
  for (const candidate of candidates) {
    let found = null;
    for (const command of candidate.commands) {
      const probe = process.platform === 'win32' ? await runCommand('where.exe', [command]) : await runCommand('which', [command]);
      if (probe.ok) {
        const version = await runCommand(command, ['--version']);
        found = { command, path: probe.output, version: version.ok ? version.output : 'unknown' };
        break;
      }
    }
    results.push({
      id: candidate.id,
      name: candidate.name,
      status: found ? 'available' : 'not_found',
      capabilities: found ? inferCapabilities(candidate.id) : [],
      details: found || null
    });
  }
  return { platform: process.platform, hostname: require('node:os').hostname(), scannedAt: new Date().toISOString(), agents: results };
}

function inferCapabilities(id) {
  if (['opencode', 'claude', 'cursor', 'cline', 'aider', 'gemini'].includes(id)) return ['code', 'read_files', 'run_tests', 'git'];
  if (id === 'git') return ['branch', 'commit', 'diff'];
  if (id === 'docker') return ['sandbox', 'containers'];
  if (id === 'node' || id === 'python') return ['runtime', 'tests'];
  return ['detected'];
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 980,
    minWidth: 1080,
    minHeight: 700,
    backgroundColor: '#080f1b',
    title: 'Council Room',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));
  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
  ipcMain.handle('companion:detect', detectLocalTools);
  ipcMain.handle('opencode:run-prompt', async (_event, payload = {}) => {
    try {
      return { ok: true, result: await runOpenCodePrompt(payload.prompt, { model: payload.model, cwd: payload.cwd }) };
    } catch (error) {
      return { ok: false, error: error.message || 'opencode_failed' };
    }
  });
  ipcMain.handle('provider:test', async (_event, payload = {}) => {
    try {
      const parsed = new URL(String(payload.baseUrl || ''));
      const allowedKeys = new Map([
        ['api.openai.com', 'OPENAI_API_KEY'],
        ['openrouter.ai', 'OPENROUTER_API_KEY'],
        ['api.openrouter.ai', 'OPENROUTER_API_KEY'],
        ['api.groq.com', 'GROQ_API_KEY'],
        ['api.z.ai', 'ZAI_API_KEY'],
        ['localhost', 'OMNIROUTE_API_KEY'],
        ['127.0.0.1', 'OMNIROUTE_API_KEY']
      ]);
      const expectedKey = allowedKeys.get(parsed.hostname);
      if (!expectedKey) throw new Error('provider_host_not_allowed');
      if (payload.apiKeyEnv !== expectedKey) throw new Error('provider_secret_mapping_not_allowed');
      if (parsed.protocol === 'http:' && (!['localhost', '127.0.0.1'].includes(parsed.hostname) || parsed.port !== '20128')) {
        throw new Error('provider_local_endpoint_not_allowed');
      }
      if (parsed.protocol === 'https:' && parsed.port && parsed.port !== '443') {
        throw new Error('provider_port_not_allowed');
      }
      const allowedPaths = {
        'api.openai.com': ['/v1'],
        'openrouter.ai': ['/api/v1'],
        'api.openrouter.ai': ['/api/v1', '/v1'],
        'api.groq.com': ['/openai/v1'],
        'api.z.ai': ['/v1', '/api/paas/v4']
      };
      if (allowedPaths[parsed.hostname] && !allowedPaths[parsed.hostname].includes(parsed.pathname.replace(/\/+$/, ''))) {
        throw new Error('provider_path_not_allowed');
      }
      if (['localhost', '127.0.0.1'].includes(parsed.hostname) && parsed.pathname.replace(/\/+$/, '') !== '/v1') {
        throw new Error('provider_local_path_not_allowed');
      }
      const provider = createOpenAICompatibleProvider({
        id: payload.id,
        baseUrl: payload.baseUrl,
        model: payload.model,
        apiKeyEnv: payload.apiKeyEnv
      }, { env: process.env });
      return { ok: true, result: await provider.healthCheck() };
    } catch (error) {
      return { ok: false, error: error.message || 'provider_test_failed' };
    }
  });
  ipcMain.handle('companion:open-path', (_event, target) => shell.openPath(target));
  createWindow();
  tray = new Tray(path.join(__dirname, 'tray-icon.png'));
  tray.setToolTip('Council Room — Windows Companion');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'باز کردن Council Room', click: () => mainWindow?.show() },
    { label: 'شناسایی ایجنت‌های ویندوز', click: () => mainWindow?.webContents.send('companion:scan-requested') },
    { type: 'separator' },
    { label: 'خروج', click: () => app.quit() }
  ]));
  app.on('activate', () => { if (!mainWindow) createWindow(); else mainWindow.show(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
