import * as THREE from "three";
import { HOTSPOTS } from "./data.js";

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
  varying vec3 vWorldPos;
  void main() {
    vUv = uv;
    vNormal = normalize(mat3(modelMatrix) * normal);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPos = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const earthFrag = /* glsl */ `
  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform sampler2D bumpMap;
  uniform vec3 sunDirection;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;

  void main() {
    vec3 day = texture2D(dayMap, vUv).rgb;
    vec3 night = texture2D(nightMap, vUv).rgb;
    float height = texture2D(bumpMap, vUv).r;
    vec3 n = normalize(vNormal);
    float lambert = dot(n, normalize(sunDirection));
    float dayness = smoothstep(-0.08, 0.22, lambert);
    float twilight = 1.0 - smoothstep(0.0, 0.28, abs(lambert));
    vec3 nightGlow = night * vec3(1.15, 1.05, 0.85) * 1.65;
    vec3 color = mix(nightGlow, day, dayness);
    color += vec3(1.0, 0.55, 0.25) * twilight * 0.18;
    color *= 0.92 + height * 0.16;
    float fresnel = pow(1.0 - max(dot(n, normalize(cameraPosition - vWorldPos)), 0.0), 2.4);
    color += vec3(0.35, 0.6, 1.0) * fresnel * 0.22;
    gl_FragColor = vec4(color, 1.0);
  }
`;

const atmosVert = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  void main() {
    vNormal = normalize(mat3(modelMatrix) * normal);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPos = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const atmosFrag = /* glsl */ `
  uniform vec3 sunDirection;
  uniform float intensity;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  void main() {
    vec3 n = normalize(vNormal);
    vec3 view = normalize(cameraPosition - vWorldPos);
    float fresnel = pow(1.0 - max(dot(n, view), 0.0), 2.15);
    float sun = pow(max(dot(n, normalize(sunDirection)), 0.0), 1.2);
    vec3 color = mix(vec3(0.15, 0.4, 1.0), vec3(0.75, 0.88, 1.0), sun);
    float alpha = fresnel * intensity * (0.35 + sun * 0.65);
    gl_FragColor = vec4(color, alpha);
  }
`;

function dayOfYear(date) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  return (date.getTime() - start) / 86400000;
}

/** Approximate sun vector in Earth texture space. */
export function sunDirection(date = new Date()) {
  const dec =
    (-23.44 *
      Math.cos((360 / 365) * (dayOfYear(date) + 10) * (Math.PI / 180)) *
      Math.PI) /
    180;
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const lon = (180 - utcHours * 15) * (Math.PI / 180);
  const x = Math.cos(dec) * Math.cos(lon);
  const y = Math.sin(dec);
  const z = Math.cos(dec) * Math.sin(lon);
  return new THREE.Vector3(x, y, z).normalize();
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
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
  camera.position.set(0.15, 0.28, 3.35);

  const earthGroup = new THREE.Group();
  earthGroup.rotation.z = THREE.MathUtils.degToRad(-23.4);
  scene.add(earthGroup);

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

  const earth = new THREE.Mesh(new THREE.SphereGeometry(radius, 96, 96), earthMat);
  earthGroup.add(earth);

  let clouds = null;
  try {
    const cloudTex = await loadTexture(CLOUD_MAP);
    clouds = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 1.008, 64, 64),
      new THREE.MeshPhongMaterial({
        map: cloudTex,
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
      })
    );
    earthGroup.add(clouds);
  } catch {
    clouds = null;
  }

  const atmosMat = new THREE.ShaderMaterial({
    uniforms: {
      sunDirection: { value: sun.clone() },
      intensity: { value: 1.15 },
    },
    vertexShader: atmosVert,
    fragmentShader: atmosFrag,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
  });
  const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.08, 64, 64), atmosMat);
  earthGroup.add(atmosphere);

  const innerGlow = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.018, 64, 64),
    new THREE.ShaderMaterial({
      uniforms: {
        sunDirection: { value: sun.clone() },
        intensity: { value: 0.45 },
      },
      vertexShader: atmosVert,
      fragmentShader: atmosFrag,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
      transparent: true,
      depthWrite: false,
    })
  );
  earthGroup.add(innerGlow);

  const starGeo = new THREE.BufferGeometry();
  const starCount = 1600;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const r = 40 + Math.random() * 60;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = r * Math.cos(phi);
    starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  const stars = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({ color: 0xc8d4ee, size: 0.08, transparent: true, opacity: 0.7 })
  );
  scene.add(stars);

  const ambient = new THREE.AmbientLight(0x6b7c9a, 0.35);
  scene.add(ambient);
  const sunLight = new THREE.DirectionalLight(0xfff4e5, 1.35);
  scene.add(sunLight);

  const markers = [];
  const markerRoot = new THREE.Group();
  earthGroup.add(markerRoot);

  for (const spot of HOTSPOTS) {
    const pos = latLonToVector(spot.lat, spot.lon, radius * 1.012);
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.012, 12, 12),
      new THREE.MeshBasicMaterial({
        color: spot.kind === "forest" ? 0xff6b4a : 0xf0d08a,
      })
    );
    dot.position.copy(pos);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.018, 0.028, 32),
      new THREE.MeshBasicMaterial({
        color: spot.kind === "forest" ? 0xff6b4a : 0xf0d08a,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
      })
    );
    ring.position.copy(pos);
    ring.lookAt(pos.clone().multiplyScalar(2));
    markerRoot.add(dot, ring);
    markers.push({ spot, ring, phase: Math.random() * Math.PI * 2 });
  }

  const targetLabel = { text: "", visible: 0 };

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const mobile = w < 800;
    camera.position.set(mobile ? 0 : 0.55, mobile ? 0.12 : 0.18, mobile ? 3.7 : 2.85);
  }

  resize();
  window.addEventListener("resize", resize);

  let raf = 0;
  let last = performance.now();
  const drift = { x: 0, y: 0 };
  let pointer = { x: 0, y: 0 };
  const drag = { active: false, x: 0, y: 0, velY: 0 };

  canvas.addEventListener("pointermove", (e) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = (e.clientX - rect.left) / rect.width - 0.5;
    pointer.y = (e.clientY - rect.top) / rect.height - 0.5;
    if (drag.active) {
      const dx = e.clientX - drag.x;
      drag.velY = dx * 0.005;
      earthGroup.rotation.y += drag.velY;
      drag.x = e.clientX;
      drag.y = e.clientY;
    }
  });
  canvas.addEventListener("pointerdown", (e) => {
    drag.active = true;
    drag.x = e.clientX;
    drag.y = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointerup", () => {
    drag.active = false;
  });

  function tick(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const date = new Date();
    const s = sunDirection(date);
    earthMat.uniforms.sunDirection.value.copy(s);
    atmosMat.uniforms.sunDirection.value.copy(s);
    innerGlow.material.uniforms.sunDirection.value.copy(s);
    sunLight.position.copy(s.clone().multiplyScalar(8));

    const spin = reducedMotion ? 0.004 : 0.018;
    earthGroup.rotation.y += dt * spin;
    if (clouds) clouds.rotation.y += dt * spin * 1.15;

    drift.x += (pointer.x * 0.18 - drift.x) * 0.03;
    drift.y += (-pointer.y * 0.1 - drift.y) * 0.03;
    camera.position.x += ( (canvas.clientWidth < 800 ? 0 : 0.55) + drift.x - camera.position.x) * 0.04;
    camera.position.y += ( (canvas.clientWidth < 800 ? 0.12 : 0.18) + drift.y - camera.position.y) * 0.04;
    camera.lookAt(0.08, 0, 0);

    const t = now * 0.001;
    for (const m of markers) {
      const pulse = 1 + Math.sin(t * 1.6 + m.phase) * 0.35;
      m.ring.scale.setScalar(pulse);
      m.ring.material.opacity = 0.25 + Math.sin(t * 1.6 + m.phase) * 0.2;
    }

    stars.rotation.y += dt * 0.002;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  }

  raf = requestAnimationFrame(tick);

  return {
    targetLabel,
    resize,
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      renderer.dispose();
    },
  };
}
