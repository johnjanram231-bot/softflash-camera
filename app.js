const video = document.querySelector('#video');
const canvas = document.querySelector('#photoCanvas');
const placeholder = document.querySelector('#placeholder');
const shutter = document.querySelector('#shutter');
const cameraStatus = document.querySelector('#cameraStatus');
const resolution = document.querySelector('#resolution');
const filterOverlayName = document.querySelector('#filterOverlayName');
const aspectLabel = document.querySelector('#aspectLabel');
const toast = document.querySelector('#toast');
const galleryModal = document.querySelector('#galleryModal');
const galleryGrid = document.querySelector('#galleryGrid');

const looks = {
  digicam: {name:'DIGICAM', filter:'contrast(1.13) saturate(1.18) brightness(1.02)', flash:true, grain:0.11, warmth:0.035},
  golden: {name:'GOLDEN HOUR', filter:'sepia(.23) saturate(1.3) brightness(1.06) contrast(1.02)', flash:false, grain:0.09, warmth:0.12},
  film: {name:'35MM FILM', filter:'sepia(.14) saturate(.82) contrast(.91) brightness(1.03)', flash:false, grain:0.18, warmth:0.05},
  portrait: {name:'PORTRAIT', filter:'brightness(1.06) saturate(.88) contrast(.96)', flash:false, grain:0.025, warmth:0.02},
  cool: {name:'COOL BLUE', filter:'hue-rotate(8deg) saturate(.82) contrast(1.08)', flash:false, grain:0.06, warmth:-0.06},
  mono: {name:'BLACK & WHITE', filter:'grayscale(1) contrast(1.13)', flash:false, grain:0.1, warmth:0},
  faded: {name:'FADED MEMORY', filter:'sepia(.2) brightness(1.1) contrast(.8) saturate(.78)', flash:false, grain:0.13, warmth:0.035}
};
let activeLook = 'digicam';
let stream = null;
let facing = 'user';
let flashLook = true;
let timerSeconds = 0;
let timerInterval = null;
let photos = [];
let toastTimer;
let cameraStartedAt = null;
let clockTimer = null;

function notify(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function setLook(key) {
  activeLook = key;
  const look = looks[key];
  document.querySelectorAll('.filter').forEach(btn => btn.classList.toggle('active', btn.dataset.filter === key));
  video.style.setProperty('--live-filter', look.filter);
  filterOverlayName.textContent = look.name;
  if (look.flash !== flashLook) {
    // Keep the flash-look toggle independent from the color preset.
  }
}
document.querySelectorAll('.filter').forEach(btn => btn.addEventListener('click', () => setLook(btn.dataset.filter)));

async function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    notify('Camera needs HTTPS or localhost. Open the GitHub Pages link.');
    return;
  }
  stopCamera();
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1440 } }
    });
    video.srcObject = stream;
    await video.play();
    placeholder.hidden = true;
    shutter.disabled = false;
    cameraStatus.textContent = 'CAMERA READY';
    document.querySelector('.status-dot').classList.add('on');
    const track = stream.getVideoTracks()[0];
    const settings = track.getSettings();
    resolution.textContent = `PHOTO · ${settings.width || 'AUTO'} × ${settings.height || 'AUTO'}`;
    cameraStartedAt = Date.now();
    clearInterval(clockTimer);
    clockTimer = setInterval(() => {
      if (!cameraStartedAt) return;
      const seconds = Math.floor((Date.now() - cameraStartedAt) / 1000);
      document.querySelector('#clock').textContent = `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
    }, 1000);
  } catch (error) {
    console.error(error);
    let msg = 'Could not open camera. Check browser permission.';
    if (error.name === 'NotAllowedError') msg = 'Camera permission was blocked. Allow it in browser settings.';
    if (error.name === 'NotFoundError') msg = 'No camera was found on this device.';
    if (error.name === 'NotReadableError') msg = 'Camera is busy in another app. Close it and try again.';
    notify(msg);
  }
}

function stopCamera() {
  if (stream) stream.getTracks().forEach(track => track.stop());
  stream = null;
  if (video) video.srcObject = null;
}

document.querySelector('#startCamera').addEventListener('click', startCamera);
document.querySelector('#flipCamera').addEventListener('click', async () => {
  facing = facing === 'user' ? 'environment' : 'user';
  if (stream) await startCamera();
  else notify('Turn on the camera first.');
});

document.querySelector('#timerBtn').addEventListener('click', () => {
  timerSeconds = timerSeconds === 0 ? 3 : timerSeconds === 3 ? 10 : 0;
  document.querySelector('#timerLabel').textContent = timerSeconds ? `TIMER ${timerSeconds}S` : 'TIMER OFF';
  notify(timerSeconds ? `${timerSeconds}-second self timer selected.` : 'Self timer turned off.');
});

document.querySelector('#flashToggle').addEventListener('click', event => {
  flashLook = !flashLook;
  const btn = event.currentTarget;
  btn.classList.toggle('active', flashLook);
  btn.setAttribute('aria-pressed', String(flashLook));
  btn.querySelector('b').textContent = flashLook ? 'ON' : 'OFF';
});

function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function takePhoto() {
  if (!stream || !video.videoWidth) return;
  if (timerSeconds) {
    const btn = document.querySelector('#timerBtn');
    const original = btn.querySelector('small').textContent;
    for (let i = timerSeconds; i > 0; i--) {
      btn.querySelector('small').textContent = `${i}...`;
      await wait(1000);
    }
    btn.querySelector('small').textContent = original;
  }
  const vw = video.videoWidth, vh = video.videoHeight;
  const ratioValue = document.querySelector('#aspectSelect').value;
  const ratio = ratioValue.split(':').map(Number).reduce((a,b) => a/b);
  let sw = vw, sh = vh;
  if (vw / vh > ratio) sw = vh * ratio;
  else sh = vw / ratio;
  const sx = (vw - sw) / 2, sy = (vh - sh) / 2;
  canvas.width = Math.round(sw);
  canvas.height = Math.round(sh);
  const ctx = canvas.getContext('2d');
  const look = looks[activeLook];
  ctx.save();
  if (facing === 'user') {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }
  ctx.filter = look.filter;
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  ctx.restore();
  ctx.filter = 'none';
  if (flashLook) {
    ctx.fillStyle = 'rgba(255,245,232,0.075)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  if (look.warmth > 0) {
    ctx.fillStyle = `rgba(255,174,90,${look.warmth})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (look.warmth < 0) {
    ctx.fillStyle = `rgba(100,170,255,${Math.abs(look.warmth)})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  addGrain(ctx, canvas.width, canvas.height, look.grain);
  const quality = Number(document.querySelector('#qualitySelect').value);
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
  if (!blob) { notify('Photo could not be created. Please try again.'); return; }
  const url = URL.createObjectURL(blob);
  const timestamp = new Date();
  const filename = `softflash-${timestamp.getFullYear()}${String(timestamp.getMonth()+1).padStart(2,'0')}${String(timestamp.getDate()).padStart(2,'0')}-${String(timestamp.getHours()).padStart(2,'0')}${String(timestamp.getMinutes()).padStart(2,'0')}${String(timestamp.getSeconds()).padStart(2,'0')}.jpg`;
  photos.unshift({url, blob, filename, look: look.name, time: timestamp.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})});
  renderGallery();
  notify('Photo captured! Your memory is ready ✳');
}

function addGrain(ctx, width, height, amount) {
  if (!amount) return;
  // A low-resolution grain overlay keeps the effect lightweight on phones.
  const gw = Math.max(1, Math.floor(width / 4)), gh = Math.max(1, Math.floor(height / 4));
  const grainCanvas = document.createElement('canvas');
  grainCanvas.width = gw; grainCanvas.height = gh;
  const gctx = grainCanvas.getContext('2d');
  const image = gctx.createImageData(gw, gh);
  for (let i = 0; i < image.data.length; i += 4) {
    const v = Math.random() * 255;
    image.data[i] = v; image.data[i+1] = v; image.data[i+2] = v;
    image.data[i+3] = Math.random() * 255 * amount;
  }
  gctx.putImageData(image, 0, 0);
  ctx.save();
  ctx.globalAlpha = 0.4;
  ctx.globalCompositeOperation = 'soft-light';
  ctx.drawImage(grainCanvas, 0, 0, width, height);
  ctx.restore();
}

shutter.addEventListener('click', takePhoto);

function renderGallery() {
  document.querySelector('#photoCount').textContent = photos.length;
  if (!photos.length) {
    galleryGrid.innerHTML = '<div class="empty-gallery">Your photos will appear here after you take them. ✳</div>';
    return;
  }
  galleryGrid.innerHTML = '';
  photos.forEach(photo => {
    const item = document.createElement('article');
    item.className = 'gallery-item';
    const img = document.createElement('img');
    img.src = photo.url; img.alt = `${photo.look} photo`;
    const label = document.createElement('p');
    label.textContent = `${photo.look} · ${photo.time}`;
    const link = document.createElement('a');
    link.href = photo.url; link.download = photo.filename; link.textContent = '↓ Download photo';
    item.append(img, label, link);
    galleryGrid.append(item);
  });
}
document.querySelector('#galleryToggle').addEventListener('click', () => { galleryModal.hidden = false; renderGallery(); });
document.querySelector('#closeGallery').addEventListener('click', () => { galleryModal.hidden = true; });
galleryModal.addEventListener('click', event => { if (event.target === galleryModal) galleryModal.hidden = true; });
document.addEventListener('keydown', event => { if (event.key === 'Escape') galleryModal.hidden = true; });

document.querySelector('#aspectSelect').addEventListener('change', event => {
  const value = event.target.value;
  aspectLabel.textContent = value;
  document.querySelector('.viewfinder').style.aspectRatio = value.replace(':',' / ');
});
setLook('digicam');
window.addEventListener('pagehide', stopCamera);
