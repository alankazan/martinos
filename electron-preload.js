const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  powerOff: () => ipcRenderer.send("system-poweroff"),
  reboot: () => ipcRenderer.send("system-reboot"),
  quit: () => ipcRenderer.send("quit-app"),
});
