const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('councilCompanion', {
  isDesktop: true,
  platform: process.platform,
  detectLocalTools: () => ipcRenderer.invoke('companion:detect'),
  loadProjectConfig: () => ipcRenderer.invoke('companion:load-project-config'),
  runOpenCodePrompt: (prompt, options = {}) => ipcRenderer.invoke('opencode:run-prompt', {
    prompt,
    model: typeof options.model === 'string' ? options.model : undefined
  }),
  startCouncilRun: (prompt, options = {}) => ipcRenderer.invoke('council:start', { prompt, model: typeof options.model === 'string' ? options.model : undefined }),
  cancelCouncilRun: runId => ipcRenderer.invoke('council:cancel', runId),
  getCouncilHistory: () => ipcRenderer.invoke('council:history'),
  recordCouncilApproval: (runId, approved, note = '') => ipcRenderer.invoke('council:approval', { runId, approved: approved === true, note: String(note || '') }),
  onCouncilEvent: callback => {
    if (typeof callback !== 'function') return () => {};
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('council:event', listener);
    return () => ipcRenderer.removeListener('council:event', listener);
  },
  onScanRequested: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const listener = () => callback();
    ipcRenderer.on('companion:scan-requested', listener);
    return () => ipcRenderer.removeListener('companion:scan-requested', listener);
  }
});
