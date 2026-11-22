// Bubbles — soap bubbles that float up through the [data-bubbles] section (Characters) once it scrolls into view.
// Vanilla Three.js port of the R3F sandbox (MeshDistortMaterial + iridescence):
//   - MeshPhysicalMaterial with iridescence + clearcoat, lit by RoomEnvironment
//   - vertex wobble stands in for drei's `distort`
//   - fresnel alpha keeps the centre clear and the rim bright, so they read as soap film
// Three.js is only downloaded when the section is near, and the loop pauses off-screen.

const footer = document.querySelector('[data-bubbles]');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (footer && !reduceMotion) {
  let started = false;
  let api = null;

  const io = new IntersectionObserver(async ([entry]) => {
    if (entry.isIntersecting && !started) {
      started = true;
      api = await init(footer);
    }
    if (api) entry.isIntersecting ? api.play() : api.pause();
  }, { rootMargin: '200px 0px' });

  io.observe(footer);
}

async function init(host) {
  const THREE = await import('three');
  const { RoomEnvironment } = await import('../assets/vendor/three/RoomEnvironment.js');

  const canvas = document.createElement('canvas');
  canvas.className = 'bubbles';
  canvas.setAttribute('aria-hidden', 'true');
  host.querySelector('.art').after(canvas);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch {
    canvas.remove();
    return null; // no WebGL — the footer simply stays as is
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.z = 10;

  // ---- material (shared by every bubble) ----
  const uniforms = { uTime: { value: 0 } };
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0,
    metalness: 0,
    iridescence: 1,
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [100, 800],
    clearcoat: 1,
    clearcoatRoughness: 0,
    envMapIntensity: 1.6,
    transparent: true,
    depthWrite: false,
  });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        uniform float uTime;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float t = uTime * 1.2 + modelMatrix[3].x * 2.0; // per-bubble offset
        float wobble = sin(position.x * 3.1 + t) * sin(position.y * 2.7 + t * 1.3) * sin(position.z * 2.9 + t * 0.8);
        transformed += normal * wobble * 0.06;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform float uTime;`)
      .replace('#include <opaque_fragment>', `#include <opaque_fragment>
        vec3 n = normalize(normal);
        float fres = pow(1.0 - abs(dot(n, normalize(vViewPosition))), 2.6);
        // thin-film rainbow along the rim (what makes it read as soap)
        vec3 film = 0.5 + 0.5 * cos(6.2831 * (fres * 1.4 + vec3(0.0, 0.33, 0.67)) + uTime * 0.6);
        // small window highlight, upper left
        float spec = pow(max(dot(n, normalize(vec3(-0.45, 0.55, 0.7))), 0.0), 48.0);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, film, 0.8 * fres) * 0.85 + spec * 0.6; // tinted rim, less white
        gl_FragColor.a = clamp(fres * 0.75 + spec * 0.7, 0.0, 1.0);`);
  };

  const geometry = new THREE.SphereGeometry(1, 48, 48);

  // ---- bubbles ----
  const isSmall = () => host.clientWidth < 768;
  const count = isSmall() ? 9 : 18;
  const bubbles = [];
  let viewW = 1, viewH = 1;
  const pxToWorld = () => viewH / Math.max(host.clientHeight, 1);

  const rand = (a, b) => a + Math.random() * (b - a);

  function reset(b, initial) {
    b.size = rand(10, isSmall() ? 28 : 40) * pxToWorld(); // radius in CSS px, so size is the same in any section height
    b.x = rand(-viewW / 2, viewW / 2);
    b.y = initial ? rand(-viewH / 2, viewH / 2) : -viewH / 2 - b.size - rand(0, 1.5);
    b.speed = rand(0.35, 0.8);
    b.drift = rand(0.2, 0.6);
    b.phase = rand(0, Math.PI * 2);
    b.popAt = rand(viewH * 0.15, viewH * 0.48); // pops somewhere in the upper half
    b.age = initial ? 1 : 0;
  }

  for (let i = 0; i < count; i++) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.set(rand(0, 6), rand(0, 6), 0);
    scene.add(mesh);
    const b = { mesh };
    bubbles.push(b);
  }

  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    viewH = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    viewW = viewH * camera.aspect;
  }
  resize();
  bubbles.forEach((b) => reset(b, true));
  new ResizeObserver(resize).observe(host);

  // ---- loop ----
  const clock = new THREE.Clock(false);
  let raf = 0;

  function frame() {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    uniforms.uTime.value += dt;

    for (const b of bubbles) {
      b.age += dt;
      b.y += b.speed * dt;
      const sway = Math.sin(uniforms.uTime.value * b.drift + b.phase) * 0.35;
      // grow in at spawn, pop (quick shrink) near the top
      const grow = Math.min(b.age / 0.8, 1);
      const pop = b.y > b.popAt ? Math.max(1 - (b.y - b.popAt) * 4, 0) : 1;
      const s = b.size * grow * (pop < 1 ? pop * 1.1 : 1);
      b.mesh.position.set(b.x + sway, b.y, 0);
      b.mesh.scale.setScalar(Math.max(s, 0.0001));
      b.mesh.rotation.y += dt * 0.2;
      if (pop <= 0) reset(b, false);
    }
    renderer.render(scene, camera);
  }

  return {
    play() { if (!raf) { clock.start(); frame(); } },
    pause() { cancelAnimationFrame(raf); raf = 0; clock.stop(); },
  };
}
