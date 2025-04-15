const imagePathSpan = document.getElementById('imagePath');
const videoPathSpan = document.getElementById('videoPath');

let imagePath = '';
let videoPath = '';

window.electronAPI.on('selected-image', (event, filePath) => {
  imagePath = filePath;
  imagePathSpan.textContent = filePath ? filePath.split(/[/\\]/).pop() : 'None selected';
});

window.electronAPI.on('selected-video', (event, filePath) => {
  videoPath = filePath;
  videoPathSpan.textContent = filePath ? filePath.split(/[/\\]/).pop() : 'None selected';
});

document.getElementById('selectImage').addEventListener('click', () => {
  window.electronAPI.send('open-image-dialog');
});

document.getElementById('selectVideo').addEventListener('click', () => {
  window.electronAPI.send('open-video-dialog');
});

document.getElementById('resetMedia').addEventListener('click', () => {
  imagePath = '';
  videoPath = '';
  imagePathSpan.textContent = 'None selected';
  videoPathSpan.textContent = 'None selected';
  window.electronAPI.resetMediaConfig();
  alert('✅ Backgrounds cleared!');
});

document.getElementById('saveSettings').addEventListener('click', () => {
  window.electronAPI.saveMediaConfig({ image: imagePath, video: videoPath });
  alert('✅ Media settings saved!');
});

document.getElementById('returnMain').addEventListener('click', () => {
  window.close();
});

