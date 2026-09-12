import * as THREE from "three";

const DAY_MAP =
  "https://cdn.jsdelivr.net/npm/three-globe@2.44.1/example/img/earth-blue-marble.jpg";
const NIGHT_MAP =
  "https://cdn.jsdelivr.net/npm/three-globe@2.44.1/example/img/earth-night.jpg";
const BUMP_MAP =
  "https://cdn.jsdelivr.net/npm/three-globe@2.44.1/example/img/earth-topology.png";
const CLOUD_MAP =
  "https://threejs.org/examples/textures/planets/earth_clouds_1024.png";

const earthVert = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const earthFrag = /* glsl */ `
  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform sampler2D bumpMap;
  uniform vec3 sunDirection;
  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    vec3 day = texture2D(dayMap, vUv).rgb;
    vec3 night = texture2D(nightMap, vUv).rgb;
    float height = texture2D(bumpMap, vUv).r;
    vec3 n = normalize(vNormal);
    float lambert = dot(n, normalize(sunDirection));
    float dayness = smoothstep(-0.05, 0.18, lambert);
    vec3 color = mix(night * 1.35, day, dayness);
    color *= 0.94 + height * 0.1;
    gl_FragColor = vec4(color, 1.0);
  }
`;

function dayOfYear(date) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  return (date.getTime() - start) / 86400000;
}

export function sunDirection(date = new Date()) {
  const dec =
    (-23.44 *
      Math.cos((360 / 365) * (dayOfYear(date) + 10) * (Math.PI / 180)) *
      Math.PI) /
    180;
  const utcHours =
    date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const lon = (180 - utcHours * 15) * (Math.PI / 180);
  return new THREE.Vector3(
    Math.cos(dec) * Math.cos(lon),
    Math.sin(dec),
    Math.cos(dec) * Math.sin(lon)
  ).normalize();
}

function latLonToVector(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function hash01(lat, lon, salt = 0) {
  const n = Math.sin(lat * 12.9898 + lon * 78.233 + salt * 19.19) * 43758.5453;
  return n - Math.floor(n);
}

/** Soft ground mark — looks like a satellite heat fleck, not a neon sticker. */
function makeMarkTexture(rgb, soft = 0.55) {
  const size = 128;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  const mid = size / 2;
  const grd = g.createRadialGradient(mid, mid, 0, mid, mid, mid);
  grd.addColorStop(0, `rgba(${rgb},0.95)`);
  grd.addColorStop(0.18, `rgba(${rgb},0.55)`);
  grd.addColorStop(0.42, `rgba(${rgb},${soft})`);
  grd.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  // irregular edge so it does not read as a perfect UI circle
  g.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const r = mid * (0.72 + (i % 3) * 0.08);
    g.beginPath();
    g.arc(mid + Math.cos(a) * r * 0.35, mid + Math.sin(a) * r * 0.35, mid * 0.18, 0, Math.PI * 2);
    g.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

async function addLivestockDots(parent, radius) {
  const res = await fetch("./data/livestock-points.json");
  const payload = await res.json();
  const groups = { cattle: [], pig: [] };
  for (const p of payload.points || []) {
    if (groups[p.kind]) groups[p.kind].push(p);
  }

  const layers = [
    {
      key: "cattle",
      rgb: "120,28,18",
      hazeRgb: "90,22,14",
      size: 0.018,
      hazeSize: 0.042,
      opacity: 0.72,
    },
    {
      key: "pig",
      rgb: "140,72,28",
      hazeRgb: "110,55,22",
      size: 0.014,
      hazeSize: 0.034,
      opacity: 0.65,
    },
  ];

  for (const layer of layers) {
    const pts = groups[layer.key];
    if (!pts.length) continue;

    const positions = new Float32Array(pts.length * 3);
    const sizes = new Float32Array(pts.length);
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const t = hash01(p.lat, p.lon);
      const jitterLat = p.lat + (hash01(p.lat, p.lon, 1) - 0.5) * 0.35;
      const jitterLon = p.lon + (hash01(p.lat, p.lon, 2) - 0.5) * 0.35;
      const v = latLonToVector(jitterLat, jitterLon, radius * (1.002 + t * 0.0015));
      positions[i * 3] = v.x;
      positions[i * 3 + 1] = v.y;
      positions[i * 3 + 2] = v.z;
      sizes[i] = 0.45 + t * 1.4;
    }

    // soft haze underlay — reads as a farm region, not a pin
    const hazeGeo = new THREE.BufferGeometry();
    hazeGeo.setAttribute("position", new THREE.BufferAttribute(positions.slice(0), 3));
    const haze = new THREE.Points(
      hazeGeo,
      new THREE.PointsMaterial({
        map: makeMarkTexture(layer.hazeRgb, 0.22),
        size: layer.hazeSize,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        sizeAttenuation: true,
        blending: THREE.NormalBlending,
      })
    );
    parent.add(haze);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const marks = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        map: makeMarkTexture(layer.rgb, 0.4),
        size: layer.size,
        transparent: true,
        opacity: layer.opacity,
        depthWrite: false,
        sizeAttenuation: true,
        blending: THREE.NormalBlending,
      })
    );
    parent.add(marks);
  }
}

function loadTexture(url) {
  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        resolve(tex);
      },
      undefined,
      reject
    );
  });
}

export async function createGlobe(canvas, { reducedMotion = false } = {}) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 2.55);

  const pitch = new THREE.Group();
  const yaw = new THREE.Group();
  yaw.rotation.z = THREE.MathUtils.degToRad(-23.4);
  pitch.add(yaw);
  scene.add(pitch);

  const radius = 1;
  const sun = sunDirection();

  const [dayMap, nightMap, bumpMap] = await Promise.all([
    loadTexture(DAY_MAP),
    loadTexture(NIGHT_MAP),
    loadTexture(BUMP_MAP),
  ]);
  bumpMap.colorSpace = THREE.NoColorSpace;

  const earthMat = new THREE.ShaderMaterial({
    uniforms: {
      dayMap: { value: dayMap },
      nightMap: { value: nightMap },
      bumpMap: { value: bumpMap },
      sunDirection: { value: sun.clone() },
    },
    vertexShader: earthVert,
    fragmentShader: earthFrag,
  });
  yaw.add(new THREE.Mesh(new THREE.SphereGeometry(radius, 96, 96), earthMat));

  let clouds = null;
  try {
    const cloudTex = await loadTexture(CLOUD_MAP);
    clouds = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 1.006, 64, 64),
      new THREE.MeshLambertMaterial({
        map: cloudTex,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
      })
    );
    yaw.add(clouds);
  } catch {
    clouds = null;
  }

  const ambient = new THREE.AmbientLight(0xffffff, 0.45);
  scene.add(ambient);
  const sunLight = new THREE.DirectionalLight(0xffffff, 1.15);
  scene.add(sunLight);

  try {
    await addLivestockDots(yaw, radius);
  } catch (err) {
    console.error(err);
  }

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    camera.position.z = w < 800 ? 3.05 : 2.55;
  }

  resize();
  window.addEventListener("resize", resize);

  const drag = { active: false, x: 0, y: 0, vx: 0, vy: 0 };
  let last = performance.now();
  let raf = 0;

  canvas.style.touchAction = "none";

  canvas.addEventListener("pointerdown", (e) => {
    drag.active = true;
    drag.x = e.clientX;
    drag.y = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drag.active) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    drag.vx = dx * 0.005;
    drag.vy = dy * 0.005;
    yaw.rotation.y += drag.vx;
    pitch.rotation.x = THREE.MathUtils.clamp(
      pitch.rotation.x + drag.vy,
      -1.15,
      1.15
    );
    drag.x = e.clientX;
    drag.y = e.clientY;
  });
  const endDrag = () => {
    drag.active = false;
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  function tick(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const s = sunDirection(new Date());
    earthMat.uniforms.sunDirection.value.copy(s);
    sunLight.position.copy(s.clone().multiplyScalar(6));

    if (!drag.active && !reducedMotion) {
      yaw.rotation.y += dt * 0.12;
      if (Math.abs(drag.vx) > 0.0002 || Math.abs(drag.vy) > 0.0002) {
        yaw.rotation.y += drag.vx;
        pitch.rotation.x = THREE.MathUtils.clamp(
          pitch.rotation.x + drag.vy,
          -1.15,
          1.15
        );
        drag.vx *= 0.95;
        drag.vy *= 0.95;
      }
    }
    if (clouds) clouds.rotation.y += dt * 0.04;

    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  }

  raf = requestAnimationFrame(tick);

  return {
    resize,
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      renderer.dispose();
    },
  };
}
