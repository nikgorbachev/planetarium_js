const canvas = document.getElementById("sky");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();




function raToRad(ra) {
  const [h, m, s] = ra.split(":").map(Number);
  return ((h + m / 60 + s / 3600) * 15) * Math.PI / 180;
}

function decToRad(dec) {
  const sign = dec.startsWith("-") ? -1 : 1;
  const [d, m, s] = dec.replace("+", "").replace("-", "").split(":").map(Number);
  return sign * (d + m / 60 + s / 3600) * Math.PI / 180;
}








/* ===============================
   Camera
================================ */

const camera = {
  yaw: 0,
  pitch: 0,              // START looking at zenith
  fov: Math.PI / 3
};




const atmosphere = {
  x: 0,
  y: 0
};

/* ===============================
   Star generation (angular sky)
================================ */

const STAR_COUNT = 1500;
const stars = [];

for (let i = 0; i < STAR_COUNT; i++) {
  stars.push({
    az: Math.random() * Math.PI * 2,      // azimuth
    alt: (Math.random() - 0.1) * Math.PI * 0.55,   // altitude (above horizon)
    mag: Math.random() * 1.5 + 0.3,       // brightness proxy
    a: Math.random() * 0.5 + 0.4
  });
}

/* ===============================
   Projection (dome, no edges)
================================ */

function projectStar(s) {
  // Convert star to direction vector
  const x = Math.cos(s.alt) * Math.cos(s.az);
  const y = Math.cos(s.alt) * Math.sin(s.az);
  const z = Math.sin(s.alt);

  // Rotate by camera yaw
  const cosYaw = Math.cos(-camera.yaw);
  const sinYaw = Math.sin(-camera.yaw);
  let dx = x * cosYaw - y * sinYaw;
  let dy = x * sinYaw + y * cosYaw;
  let dz = z;

  // Rotate by camera pitch
  // Rotate by camera pitch (planetarium mode)
  // Rotate by camera pitch (planetarium mode)
  const cosPitch = Math.cos(camera.pitch);
  const sinPitch = Math.sin(camera.pitch);

  const dz2 = dz * cosPitch + dx * sinPitch;
  dx = -dz * sinPitch + dx * cosPitch;
  dz = dz2;



  // Star behind camera → not visible
  if (dz <= 0) return null;

  // Perspective projection
  const f = 0.5 * window.innerHeight / Math.tan(camera.fov / 2);

  return {
    x: window.innerWidth / 2 + (dy / dz) * f,
    y: window.innerHeight / 2 - (dx / dz) * f
  };
}


/* ===============================
   Background (sky gradient)
================================ */
function projectZenith() {
  // Zenith vector in world space
  const zx = 0;
  const zy = 0;
  const zz = 1;

  // Rotate by camera yaw
  const cosYaw = Math.cos(-camera.yaw);
  const sinYaw = Math.sin(-camera.yaw);
  let dx = zx * cosYaw - zy * sinYaw;
  let dy = zx * sinYaw + zy * cosYaw;
  let dz = zz;

  // Rotate by camera pitch
  // Rotate by camera pitch (planetarium mode)
  const cosPitch = Math.cos(camera.pitch);
  const sinPitch = Math.sin(camera.pitch);

  const dz2 = dz * cosPitch + dx * sinPitch;
  dx = -dz * sinPitch + dx * cosPitch;
  dz = dz2;

  // Perspective projection
  if (dz <= 0) return null;

  const f = 0.5 * window.innerHeight / Math.tan(camera.fov / 2);

  return {
    x: window.innerWidth / 2 + (dy / dz) * f,
    y: window.innerHeight / 2 - (dx / dz) * f
  };
}
function drawBackground() {
  const w = window.innerWidth;
  const h = window.innerHeight;

  const zenith = projectZenith();

  const zx = zenith ? zenith.x : w / 2;
  const zy = zenith ? zenith.y : h / 2;

  const R = Math.max(w, h) * 1.1;

  const g = ctx.createRadialGradient(
    zx,
    zy,
    R * 0.05,   // zenith
    zx,
    zy,
    R          // horizon
  );

  // DARK zenith
  g.addColorStop(0.0, "#000000");
  g.addColorStop(0.4, "#02060b");
  g.addColorStop(0.7, "#06131f");
  g.addColorStop(1.0, "#0c2435"); // faint horizon glow

  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}




/* ===============================
   Draw sky (clipped dome)
================================ */

function drawSky() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBackground();

  

  for (const s of stars) {
    const p = projectStar(s);
    if (!p) continue;

    ctx.beginPath();
    const extinction = Math.pow(Math.sin(s.alt), 0.4);
    ctx.fillStyle = `rgba(255,255,255,${s.a * extinction})`;

    const r = Math.max(0.6, 1.5 - s.mag);
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
  }


}

  /* ===============================
    Interaction
  ================================ */

  let dragging = false;
  let lastX = 0;



  let lastY = 0;

  canvas.addEventListener("mousedown", e => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  });

  window.addEventListener("mouseup", () => dragging = false);

  window.addEventListener("mousemove", e => {
    if (!dragging) return;

    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;

    // Camera rotation
    camera.yaw += dx * 0.002;
    camera.pitch = Math.max(
      -Math.PI / 2,
      Math.min(0, camera.pitch + dy * 0.002)
    );



    // Atmospheric parallax (slower than stars)
    atmosphere.x -= dx * 0.15;
    atmosphere.y -= dy * 0.25;

    // Clamp atmosphere so it never detaches
    atmosphere.x = Math.max(-200, Math.min(200, atmosphere.x));
    atmosphere.y = Math.max(-150, Math.min(150, atmosphere.y));
  });





  canvas.addEventListener("wheel", e => {
    e.preventDefault();

    camera.fov *= Math.exp(e.deltaY * 0.001);
    camera.fov = Math.max(
      Math.PI / 6,   // ~30°
      Math.min(Math.PI / 2, camera.fov) // ~90°
    );
  }, { passive: false });


  canvas.addEventListener("contextmenu", e => e.preventDefault());

  /* ===============================
    Animation loop (Earth rotation)
  ================================ */

  let lastTime = performance.now();

  function animate(time) {
    const dt = (time - lastTime) / 1000;
    lastTime = time;

    camera.yaw += dt * 0.005;// very slow celestial drift

    atmosphere.x *= 0.98;
    atmosphere.y *= 0.98;

    drawSky();
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);