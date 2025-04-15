process.on('uncaughtException', (err) => {
  require('fs').writeFileSync('crashlog.txt', '[MAIN ERROR]\n' + err.stack);
});

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let mainWindow;
let botProcess = null;

function createWindow() {
  console.log("🪟 Creating splash screen...");

  const splash = new BrowserWindow({
    width: 600,
    height: 400,
    frame: false,
    transparent: false,
    alwaysOnTop: true,
    icon: path.join(__dirname, 'chaybot.ico')
  });

  splash.loadFile(path.join(__dirname, 'gui/splash.html'));

  setTimeout(() => {
    console.log("🪟 Creating main window...");
    mainWindow = new BrowserWindow({
      width: 980,
      height: 720,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false
      },
      icon: path.join(__dirname, 'chaybot.ico')
    });

    mainWindow.loadFile(path.join(__dirname, 'gui/index.html')).then(() => {
      console.log("✅ Window loaded");
    }).catch(err => {
      console.log("❌ Failed to load main window:", err);
      require('fs').writeFileSync('crashlog.txt', '[WINDOW LOAD ERROR]\n' + err.stack);
    });

    mainWindow.on('closed', () => {
      mainWindow = null;
    });

    splash.close();
  }, 2500);
}

app.whenReady().then(() => {
  console.log("💡 Electron ready");
  createWindow();
});

app.on('window-all-closed', () => {
  if (botProcess) botProcess.kill();
  app.quit();
});

ipcMain.on('open-image-dialog', async (event) => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Select Background Image',
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp'] }
    ],
    properties: ['openFile']
  });

  if (!canceled && filePaths.length > 0) {
    event.sender.send('selected-image', filePaths[0]);
  }
});

ipcMain.on('open-video-dialog', async (event) => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Select Background Video or MP3',
    filters: [
      { name: 'Video or MP3', extensions: ['mp4', 'webm', 'mp3'] }
    ],
    properties: ['openFile']
  });

  if (!canceled && filePaths.length > 0) {
    event.sender.send('selected-video', filePaths[0]);
  }
});

ipcMain.on('bot-control', (event, command) => {
  if (command === 'start') {
    if (!botProcess) {
      botProcess = fork(path.join(__dirname, 'index.js'));
    } else {
      botProcess.send('start');
    }
  } else if (command === 'stop') {
    if (botProcess) {
      botProcess.send('stop');
    }
  } else if (command === 'restart') {
    if (botProcess) {
      botProcess.send('restart');
    }
  }
});

ipcMain.on('open-settings', () => {
  const settingsWindow = new BrowserWindow({
    width: 600,
    height: 500,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, 'chaybot.ico')
  });

  settingsWindow.loadFile(path.join(__dirname, 'gui/settings.html'));
});

