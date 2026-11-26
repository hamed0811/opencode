const { app, BrowserWindow, ipcMain, Menu, Tray, shell, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { execFile } = require('node:child_process');
const { runOpenCodePrompt, listOpenCodeModels, buildChildEnv } = require('./opencode-runner.cjs');
const { createCouncilRuntime } = require('./council-runtime.cjs');
const { ConcatMcpClient, MUTATING_TOOLS } = require('./concat-mcp.cjs');

let mainWindow;
let tray;
let workspaceRoot;
let councilRuntime;
let concatClient;

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

function assertTrustedSender(event) {
  if (!mainWindow || event.sender !== mainWindow.webContents || event.senderFrame !== event.sender.mainFrame) {
    throw new Error('untrusted_ipc_sender');
  }
  let url;
  try { url = new URL(event.senderFrame.url); } catch { throw new Error('invalid_ipc_origin'); }
  if (url.protocol !== 'file:' || !url.pathname.toLowerCase().endsWith('/index.html')) {
    throw new Error('untrusted_ipc_origin');
  }
}

function runCommand(command, args, timeout = 2500) {
  return new Promise(resolve => {
    const isWindowsScript = process.platform === 'win32' && /\.(cmd|bat)$/i.test(command);
    const executable = isWindowsScript ? 'powershell.exe' : command;
    const commandArgs = isWindowsScript
      ? ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', '$target=$env:COUNCIL_DETECT_COMMAND; $items=ConvertFrom-Json $env:COUNCIL_DETECT_ARGS; & $target @items; if ($LASTEXITCODE -ne $null) { exit $LASTEXITCODE }']
      : args;
    const env = buildChildEnv(process.env);
    if (isWindowsScript) {
      env.COUNCIL_DETECT_COMMAND = command;
      env.COUNCIL_DETECT_ARGS = JSON.stringify(args);
    }
    execFile(executable, commandArgs, { env, windowsHide: true, timeout }, (error, stdout, stderr) => {
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
        const resolvedCommand = probe.output;
        const version = await runCommand(resolvedCommand, ['--version']);
        found = { command, path: resolvedCommand, version: version.ok ? version.output : 'unknown' };
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
  return ['executable_detected'];
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
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', event => event.preventDefault());
  mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));
  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
  workspaceRoot = path.resolve(process.env.COUNCIL_WORKSPACE || path.join(app.getPath('userData'), 'workspace'));
  fs.mkdirSync(workspaceRoot, { recursive: true });

  const runtimeConfigPath = path.join(__dirname, '..', 'config', 'council.config.json');
  let runtimeConfig = {};
  try { runtimeConfig = JSON.parse(fs.readFileSync(runtimeConfigPath, 'utf8')).councilRuntime || {}; } catch {}
  councilRuntime = createCouncilRuntime({
    dataRoot: path.join(app.getPath('userData'), 'council-runs'),
    concurrency: runtimeConfig.concurrency,
    agentModels: runtimeConfig.agentModels,
    runAgent: (prompt, options = {}) => runOpenCodePrompt(prompt, { model: options.model, agent: 'plan', signal: options.signal, workspaceRoot }),
    emit: event => mainWindow?.webContents.send('council:event', event)
  });

  ipcMain.handle('council:start', (event, payload = {}) => {
    assertTrustedSender(event);
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('invalid_payload');
    return councilRuntime.start(payload.prompt, { model: payload.model, agentModels: payload.agentModels });
  });
  ipcMain.handle('council:cancel', (event, runId) => {
    assertTrustedSender(event);
    return councilRuntime.cancel(runId);
  });
  ipcMain.handle('council:models', async event => {
    assertTrustedSender(event);
    return listOpenCodeModels({ workspaceRoot });
  });
  ipcMain.handle('council:history', event => {
    assertTrustedSender(event);
    return councilRuntime.history(20);
  });
  ipcMain.handle('council:approval', (event, payload = {}) => {
    assertTrustedSender(event);
    if (!payload || typeof payload !== 'object' || typeof payload.runId !== 'string') throw new Error('invalid_approval_payload');
    return councilRuntime.recordApproval(payload.runId, payload.approved === true, payload.note || '');
  });

  ipcMain.handle('concat:connect', async event => {
    assertTrustedSender(event);
    if (!concatClient) concatClient = new ConcatMcpClient();
    try { return await concatClient.start(); }
    catch (error) {
      concatClient?.close();
      concatClient = null;
      throw new Error(error.message || 'concat_connection_failed');
    }
  });
  ipcMain.handle('concat:disconnect', event => {
    assertTrustedSender(event);
    concatClient?.close();
    concatClient = null;
    return { ok: true };
  });
  ipcMain.handle('concat:call', async (event, payload = {}) => {
    assertTrustedSender(event);
    if (!concatClient || !concatClient.started) throw new Error('concat_not_connected');
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('invalid_concat_payload');
    const name = String(payload.name || '');
    const args = payload.args === undefined ? {} : payload.args;
    if (MUTATING_TOOLS.has(name)) {
      const choice = await dialog.showMessageBox(mainWindow, {
        type: 'warning',
        title: 'تأیید تغییر در Motion Studio',
        message: 'این ابزار می‌تواند پروژه و فایل‌های ویدئویی را تغییر دهد.',
        detail: 'ابزار: ' + name + '\nورودی:\n' + JSON.stringify(args, null, 2).slice(0, 5000) + '\nفقط در صورتی ادامه بده که این تغییر را تأیید می‌کنی.',
        buttons: ['لغو', 'اجرا'],
        defaultId: 0,
        cancelId: 0,
        noLink: true
      });
      if (choice.response !== 1) return { ok: false, cancelled: true };
    }
    return { ok: true, result: await concatClient.callTool(name, args) };
  });
  ipcMain.handle('companion:detect', async event => {
    assertTrustedSender(event);
    return detectLocalTools();
  });
  ipcMain.handle('companion:load-project-config', event => {
    assertTrustedSender(event);
    const configPath = path.join(__dirname, '..', 'config', 'council.config.json');
    try { return JSON.parse(fs.readFileSync(configPath, 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') return {}; throw new Error('project_config_invalid_or_unreadable'); }
  });
  ipcMain.handle('opencode:run-prompt', async (event, payload = {}) => {
    assertTrustedSender(event);
    try {
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('invalid_payload');
      if (typeof payload.prompt !== 'string') throw new Error('invalid_prompt');
      if (payload.cwd !== undefined) throw new Error('caller_cannot_select_workspace_path');
      return { ok: true, result: await runOpenCodePrompt(payload.prompt, { model: payload.model, workspaceRoot }) };
    } catch (error) {
      return { ok: false, error: error.message || 'opencode_failed' };
    }
  });
  ipcMain.handle('companion:open-path', (event, target) => {
    assertTrustedSender(event);
    if (typeof target !== 'string' || !path.isAbsolute(target)) throw new Error('invalid_path');
    let canonical;
    try { canonical = fs.realpathSync(target); } catch { throw new Error('path_not_found'); }
    const relative = path.relative(workspaceRoot, canonical);
    if (relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) throw new Error('path_outside_workspace');
    return shell.openPath(canonical);
  });

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

app.on('before-quit', () => { concatClient?.close(); concatClient = null; });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
