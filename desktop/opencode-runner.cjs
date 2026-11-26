const { execFile } = require('node:child_process');
const os = require('node:os');

const MAX_PROMPT_LENGTH = 12000;
const TIMEOUT_MS = 10 * 60 * 1000;

function runOpenCodePrompt(prompt, options = {}) {
  const text = String(prompt || '').trim();
  if (!text) return Promise.reject(new Error('prompt_empty'));
  if (text.length > MAX_PROMPT_LENGTH) return Promise.reject(new Error('prompt_too_long'));

  const command = process.platform === 'win32' ? 'opencode.exe' : 'opencode';
  const args = ['run'];
  if (options.model) args.push('--model', String(options.model));
  args.push(text);

  const env = { ...process.env };
  // Never pass Council Room API keys as CLI arguments or prompt content.
  delete env.OPENAI_API_KEY;
  delete env.ANTHROPIC_API_KEY;
  delete env.GEMINI_API_KEY;
  delete env.OPENROUTER_API_KEY;

  return new Promise((resolve, reject) => {
    execFile(command, args, {
      cwd: options.cwd || os.homedir(),
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
        cwd: options.cwd || os.homedir()
      });
    });
  });
}

module.exports = { runOpenCodePrompt };
