const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('councilCompanion', {
  isDesktop: true,
  platform: process.platform,
  detectLocalTools: () => ipcRenderer.invoke('companion:detect'),
  runOpenCodePrompt: (prompt, options = {}) => ipcRenderer.invoke('opencode:run-prompt', { prompt, ...options }),
  testProvider: (config) => ipcRenderer.invoke('provider:test', config),
  onScanRequested: (callback) => ipcRenderer.on('companion:scan-requested', callback)
});
