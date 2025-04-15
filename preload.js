const { contextBridge, ipcRenderer, shell } = require('electron');
const fs = require('fs');
const path = require('path');

contextBridge.exposeInMainWorld('electronAPI', {
  send: (channel, data) => ipcRenderer.send(channel, data),
  on: (channel, func) => ipcRenderer.on(channel, func),
  openExternal: (url) => shell.openExternal(url),
  getMediaConfig: () => {
    const configPath = path.join(__dirname, 'config.json');
    if (!fs.existsSync(configPath)) return {};
    try {
      return JSON.parse(fs.readFileSync(configPath));
    } catch (err) {
      console.error("Failed to read config.json:", err);
      return {};
    }
  },
  saveMediaConfig: (paths) => {
    const configPath = path.join(__dirname, 'config.json');
    let config = {};
    try {
      if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath));
      }
    } catch {}
    config.background_image = paths.image || '';
    config.background_video = paths.video || '';
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  },
  resetMediaConfig: () => {
    const configPath = path.join(__dirname, 'config.json');
    let config = {};
    try {
      if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath));
      }
    } catch {}
    delete config.background_image;
    delete config.background_video;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }
});
