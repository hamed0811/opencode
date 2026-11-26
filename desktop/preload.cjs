const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('councilCompanion', {
  isDesktop: true,
  platform: process.platform,
  detectLocalTools: () => ipcRenderer.invoke('companion:detect'),
  runOpenCodePrompt: (prompt, options = {}) => ipcRenderer.invoke('opencode:run-prompt', {
    prompt,
    model: typeof options.model === 'string' ? options.model : undefined
  }),
  onScanRequested: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const listener = () => callback();
    ipcRenderer.on('companion:scan-requested', listener);
    return () => ipcRenderer.removeListener('companion:scan-requested', listener);
  }
});
