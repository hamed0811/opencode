const { execFile, execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const MAX_PROMPT_LENGTH = 12000;
const SAFE_ENV_KEYS = ['PATH','PATHEXT','COMSPEC','SYSTEMROOT','WINDIR','SYSTEMDRIVE','HOMEDRIVE','HOMEPATH','USERPROFILE','HOME','APPDATA','LOCALAPPDATA','PROGRAMDATA','PROGRAMFILES','PROGRAMFILES(X86)','PUBLIC','TEMP','TMP','OS','PROCESSOR_ARCHITECTURE','NUMBER_OF_PROCESSORS','LANG','LC_ALL','TERM','XDG_CONFIG_HOME','XDG_DATA_HOME','XDG_CACHE_HOME','OLLAMA_HOST'];

function buildChildEnv(source = process.env) {
  const safe = {};
  for (const key of SAFE_ENV_KEYS) if (typeof source[key] === 'string') safe[key] = source[key];
  return safe;
}
const TIMEOUT_MS = 10 * 60 * 1000;

function resolveWorkspace(workspaceRoot, requestedCwd) {
  if (!workspaceRoot) throw new Error('workspace_root_required');
  if (requestedCwd !== undefined && typeof requestedCwd !== 'string') throw new Error('invalid_workspace_path');
  const root = fs.realpathSync(path.resolve(workspaceRoot));
  const candidate = fs.realpathSync(path.resolve(root, requestedCwd || '.'));
  if (!fs.statSync(candidate).isDirectory()) throw new Error('workspace_path_must_be_directory');
  const relative = path.relative(root, candidate);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error('workspace_path_not_allowed');
  }
  return candidate;
}

function findOpenCodeCommand() {
  if (process.platform !== 'win32') return 'opencode';
  try {
    const matches = execFileSync('where.exe', ['opencode'], {
      encoding: 'utf8',
      windowsHide: true,
      timeout: 3000
    }).split(/\r?\n/).map(value => value.trim()).filter(Boolean);
    if (matches.length) return matches[0];
  } catch {}
  throw new Error('opencode_not_found_in_path');
}

function runOpenCodePrompt(prompt, options = {}) {
  const text = String(prompt || '').trim();
  if (!text) return Promise.reject(new Error('prompt_empty'));
  if (text.length > MAX_PROMPT_LENGTH) return Promise.reject(new Error('prompt_too_long'));

  let cwd;
  try {
    cwd = resolveWorkspace(options.workspaceRoot, options.cwd);
  } catch (error) {
    return Promise.reject(error);
  }

  let command;
  try {
    command = findOpenCodeCommand();
  } catch (error) {
    return Promise.reject(error);
  }

  const agent = options.agent === undefined ? undefined : String(options.agent);
  if (agent !== undefined && !/^[a-z0-9][a-z0-9/_-]{0,63}$/i.test(agent)) return Promise.reject(new Error('invalid_agent_id'));

  // Start from an explicit allowlist. Do not inherit arbitrary credentials.
  const env = { ...buildChildEnv(process.env), COUNCIL_OPENCODE_CLI: command, COUNCIL_OPENCODE_PROMPT: text };
  if (options.model) env.COUNCIL_OPENCODE_MODEL = String(options.model);
  if (agent) env.COUNCIL_OPENCODE_AGENT = agent;

  const windows = process.platform === 'win32';
  const executable = windows ? 'powershell.exe' : command;
  const args = windows
    ? ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command',
      "$ErrorActionPreference='Stop'; $cliArgs=@('run'); if ($env:COUNCIL_OPENCODE_AGENT) { $cliArgs += @('--agent',$env:COUNCIL_OPENCODE_AGENT) }; if ($env:COUNCIL_OPENCODE_MODEL) { $cliArgs += @('--model',$env:COUNCIL_OPENCODE_MODEL) }; $cliArgs += $env:COUNCIL_OPENCODE_PROMPT; & $env:COUNCIL_OPENCODE_CLI @cliArgs; exit $LASTEXITCODE"]
    : ['run', ...(agent ? ['--agent', agent] : []), ...(options.model ? ['--model', String(options.model)] : []), text];

  return new Promise((resolve, reject) => {
    const child = execFile(executable, args, {
      cwd,
      env,
      windowsHide: true,
      timeout: TIMEOUT_MS,
      maxBuffer: 2 * 1024 * 1024,
      ...(options.signal ? { signal: options.signal } : {})
    }, (error, stdout, stderr) => {
      const output = String(stdout || '').trim();
      const diagnostic = String(stderr || '').trim();
      if (error) {
        const reason = options.signal?.aborted || error.code === 'ABORT_ERR' ? 'opencode_cancelled' : error.killed ? 'opencode_timeout' : (error.code || 'opencode_failed');
        reject(new Error(`${reason}${diagnostic ? `: ${diagnostic.slice(0, 500)}` : ''}`));
        return;
      }
      resolve({
        provider: 'opencode-local',
        model: options.model || 'opencode-selected-catalog-model',
        text: output || diagnostic || 'OpenCode پاسخی برنگرداند.',
        cwd
      });
    });
  });
}

module.exports = { runOpenCodePrompt, resolveWorkspace, findOpenCodeCommand, buildChildEnv, SAFE_ENV_KEYS, MAX_PROMPT_LENGTH };
