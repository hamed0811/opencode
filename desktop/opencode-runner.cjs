const { execFile, execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const MAX_PROMPT_LENGTH = 12000;
const TIMEOUT_MS = 10 * 60 * 1000;

function resolveWorkspace(workspaceRoot, requestedCwd) {
  if (!workspaceRoot) throw new Error('workspace_root_required');
  const root = fs.realpathSync(path.resolve(workspaceRoot));
  const candidate = fs.realpathSync(path.resolve(root, requestedCwd || '.'));
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

  const env = { ...process.env, COUNCIL_OPENCODE_CLI: command, COUNCIL_OPENCODE_PROMPT: text };
  if (options.model) env.COUNCIL_OPENCODE_MODEL = String(options.model);
  else delete env.COUNCIL_OPENCODE_MODEL;

  // Council Room does not forward optional cloud-provider secrets.
  for (const key of ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GEMINI_API_KEY', 'OPENROUTER_API_KEY']) {
    delete env[key];
  }

  const windows = process.platform === 'win32';
  const executable = windows ? 'powershell.exe' : command;
  const args = windows
    ? ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command',
      "$ErrorActionPreference='Stop'; if ($env:COUNCIL_OPENCODE_MODEL) { & $env:COUNCIL_OPENCODE_CLI run --model $env:COUNCIL_OPENCODE_MODEL $env:COUNCIL_OPENCODE_PROMPT } else { & $env:COUNCIL_OPENCODE_CLI run $env:COUNCIL_OPENCODE_PROMPT }; exit $LASTEXITCODE"]
    : ['run', ...(options.model ? ['--model', String(options.model)] : []), text];

  return new Promise((resolve, reject) => {
    execFile(executable, args, {
      cwd,
      env,
      windowsHide: true,
      timeout: TIMEOUT_MS,
      maxBuffer: 2 * 1024 * 1024
    }, (error, stdout, stderr) => {
      const output = String(stdout || '').trim();
      const diagnostic = String(stderr || '').trim();
      if (error) {
        const reason = error.killed ? 'opencode_timeout' : (error.code || 'opencode_failed');
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

module.exports = { runOpenCodePrompt, resolveWorkspace, findOpenCodeCommand, MAX_PROMPT_LENGTH };
