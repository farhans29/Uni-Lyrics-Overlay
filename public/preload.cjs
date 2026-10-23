const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  closeWindow: () => ipcRenderer.invoke('window-close'),
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  setAlwaysOnTop: (flag) => ipcRenderer.invoke('window-set-always-on-top', flag),
  searchYTLyrics: (query) => ipcRenderer.invoke('ytmusic-search-lyrics', query),
  getSystemMedia: () => ipcRenderer.invoke('get-system-media'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
  isElectron: true,
});
