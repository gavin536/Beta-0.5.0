console.log("✅ renderer.js is running");

window.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const restartBtn = document.getElementById('restartBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const configureBtn = document.getElementById('configureBtn');
  const statusLight = document.getElementById('statusLight');

  if (!window.electronAPI) {
    console.error("❌ electronAPI not found — preload.js failed");
    return;
  }

  // 🎮 Button wiring
  startBtn?.addEventListener('click', () => {
    console.log("🟢 Start clicked");
    window.electronAPI.send('bot-control', 'start');
    statusLight?.classList.remove('status-off');
    statusLight?.classList.add('status-on');
  });

  stopBtn?.addEventListener('click', () => {
    console.log("🔴 Stop clicked");
    window.electronAPI.send('bot-control', 'stop');
    statusLight?.classList.remove('status-on');
    statusLight?.classList.add('status-off');
  });

  restartBtn?.addEventListener('click', () => {
    console.log("🔁 Restart clicked");
    window.electronAPI.send('bot-control', 'restart');
    statusLight?.classList.remove('status-off');
    statusLight?.classList.add('status-on');
  });

  settingsBtn?.addEventListener('click', () => {
    console.log("⚙️ Settings clicked");
    window.electronAPI.send('open-settings');
  });

  configureBtn?.addEventListener('click', () => {
    console.log("🌐 Configure clicked");
    window.electronAPI.openExternal('http://localhost:3000/configure');
  });

  // 🎥 Background loader (video + image)
  const config = window.electronAPI.getMediaConfig?.() || {};

  if (config.background_video) {
    const video = document.createElement('video');
    video.src = config.background_video;
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.style.position = 'fixed';
    video.style.top = 0;
    video.style.left = 0;
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.zIndex = '-2';
    document.body.appendChild(video);
  }

  if (config.background_image) {
    const image = document.createElement('img');
    image.src = config.background_image;
    image.style.position = 'fixed';
    image.style.top = 0;
    image.style.left = 0;
    image.style.width = '100%';
    image.style.height = '100%';
    image.style.zIndex = '-1';
    image.style.pointerEvents = 'none';
    document.body.appendChild(image);
  }
});
