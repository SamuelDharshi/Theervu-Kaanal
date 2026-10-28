import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/*
 * The poster's petition threads, built in 3D.
 *
 * Every thread is one petition. It starts in its department's column at
 * "Grievance Filed", falls through the review and investigation floors, and
 * either converges on "Resolution" or, in red, peels off to the escalation gate.
 * Tube radius is the petition's priority. All threads of one colour share a
 * single merged geometry and a shader that grows them by `progress` along the
 * tube's length (uv.x), so the whole field costs two draw calls.
 */

export const STAGES = [
  { key: 'filed', name: 'Grievance Filed', y: 0 },
  { key: 'review', name: 'Under Review', y: -6 },
  { key: 'investigation', name: 'Investigation', y: -12 },
  { key: 'resolution', name: 'Resolution', y: -22 },
];

export const DEPARTMENTS = [
  { name: 'Water', x: -4.2 },
  { name: 'RTO', x: 0 },
  { name: 'Electricity', x: 4.2 },
];

const ESCALATION_GATE = new THREE.Vector3(10.5, -16.5, 0.6);
const PRIORITY_RADIUS = { High: 0.034, Medium: 0.019, Low: 0.009 };

// Deterministic randomness so the field looks the same on every visit.
function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const threadVertex = /* glsl */ `
  attribute float aDelay;
  varying float vU;
  varying float vDelay;
  varying float vDepth;
  void main() {
    vU = uv.x;
    vDelay = aDelay;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const threadFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uFogColor;
  uniform float uProgress;
  uniform float uFogNear;
  uniform float uFogFar;
  uniform float uOpacity;
  varying float vU;
  varying float vDelay;
  varying float vDepth;
  void main() {
    float local = clamp((uProgress - vDelay) / (1.0 - 0.18), 0.0, 1.0);
    if (vU > local) discard;
    vec3 col = uColor;
    float fog = smoothstep(uFogNear, uFogFar, vDepth);
    col = mix(col, uFogColor, fog * 0.82);
    gl_FragColor = vec4(col, uOpacity);
  }
`;

const pulseVertex = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  varying float vAlpha;
  uniform float uPixelRatio;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uPixelRatio * (32.0 / -mv.z);
    vAlpha = aAlpha;
    gl_Position = projectionMatrix * mv;
  }
`;

const pulseFragment = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    if (dot(c, c) > 0.25) discard;
    gl_FragColor = vec4(uColor, vAlpha);
  }
`;

// Camera keyframes along the journey (progress 0..1).
// Hero overview, then one shot per stage (filed, review, investigation,
// escalated, resolution), then a frontal pull-back that reads like the poster.
const SHOTS = [
  { at: 0.0, pos: [17, 5, 50], look: [2.5, -10, 0] },
  { at: 1 / 6, pos: [10, 5, 25], look: [0, -2, 0] },
  { at: 2 / 6, pos: [-10, -1.5, 25], look: [0, -6.5, 0] },
  { at: 3 / 6, pos: [10, -8, 25], look: [1.5, -12, 0] },
  { at: 4 / 6, pos: [16, -11.5, 20], look: [6, -15, 0] },
  { at: 5 / 6, pos: [-6, -15.5, 24], look: [0, -20, 0] },
  { at: 1.0, pos: [1.5, -10, 52], look: [1.5, -10, 0] },
];

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const INTRO_SECONDS = 3.4;
const FULL_GROWTH = 1.2;

const smooth = (t) => t * t * (3 - 2 * t);

export default class ThreadScene {
  constructor(canvas, { reducedMotion = false, onFrame } = {}) {
    this.canvas = canvas;
    this.reducedMotion = reducedMotion;
    this.onFrame = onFrame;
    this.progress = 0; // journey progress set by scroll
    this.grow = reducedMotion ? FULL_GROWTH : 0; // how far the threads have been drawn
    this.introStart = null;
    this.shiftX = 0; // fraction of width the scene is pushed right
    this.shiftY = 0; // fraction of height the scene is pushed down
    this.pointer = new THREE.Vector2();
    this.pointerEased = new THREE.Vector2();
    this.running = false;
    this.clock = new THREE.Clock();

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 200);
    this.lookAt = new THREE.Vector3();

    this.readColors();
    this.build();
    this.resize();
  }

  readColors() {
    const css = getComputedStyle(document.documentElement);
    const get = (name, fallback) => (css.getPropertyValue(name).trim() || fallback);
    this.colors = {
      ink: new THREE.Color(get('--ink', '#141416')),
      accent: new THREE.Color(get('--accent', '#d2402a')),
      paper: new THREE.Color(get('--paper', '#e8e6e1')),
      line: new THREE.Color(get('--line', '#c4c0b7')),
    };
  }

  build() {
    const rand = mulberry32(1606);
    const inkTubes = [];
    const redTubes = [];
    this.curves = [];

    DEPARTMENTS.forEach((dept, d) => {
      const count = 46;
      for (let i = 0; i < count; i += 1) {
        const spread = 1.05;
        const x0 = dept.x + (rand() - 0.5) * 2 * spread * Math.sqrt(rand());
        const z0 = (rand() - 0.5) * 2.2;
        const escalated = rand() < 0.13;
        const reassigned = !escalated && rand() < 0.08;
        const p = rand();
        const priority = escalated
          ? (rand() < 0.75 ? 'High' : 'Medium')
          : p < 0.18 ? 'High' : p < 0.6 ? 'Medium' : 'Low';

        const sway = () => (rand() - 0.5) * 0.5;
        const pts = [
          new THREE.Vector3(x0, 2.2, z0),
          new THREE.Vector3(x0, 0, z0),
          new THREE.Vector3(x0 + sway(), -6, z0 + sway()),
        ];

        if (escalated) {
          pts.push(new THREE.Vector3(x0 + sway() * 0.6, -11, z0 + sway()));
          pts.push(new THREE.Vector3(x0 + 2.2 + rand(), -13.4 - rand() * 0.6, z0 * 0.6));
          pts.push(new THREE.Vector3(
            ESCALATION_GATE.x - 3.2 - rand() * 0.6,
            ESCALATION_GATE.y + (rand() - 0.5) * 0.7,
            ESCALATION_GATE.z + (rand() - 0.5) * 0.8,
          ));
          pts.push(new THREE.Vector3(
            ESCALATION_GATE.x,
            ESCALATION_GATE.y + (rand() - 0.5) * 0.45,
            ESCALATION_GATE.z + (rand() - 0.5) * 0.3,
          ));
        } else {
          const other = DEPARTMENTS[(d + 1 + Math.floor(rand() * 2)) % 3];
          const xi = reassigned ? other.x + (rand() - 0.5) * 1.2 : x0 + sway() * 1.4;
          pts.push(new THREE.Vector3(xi, -12, z0 + sway()));
          pts.push(new THREE.Vector3(xi * 0.85 + sway(), -16, z0 * 0.7));
          const xEnd = dept.x * 0.16 + (d - 1) * 0.55 + (rand() - 0.5) * 0.5;
          pts.push(new THREE.Vector3(xEnd, -20.4, z0 * 0.18));
          pts.push(new THREE.Vector3(xEnd, -22, z0 * 0.1));
        }

        const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.35);
        const tube = new THREE.TubeGeometry(curve, 110, PRIORITY_RADIUS[priority], 5, false);
        const delay = rand() * 0.18;
        const delays = new Float32Array(tube.attributes.position.count).fill(delay);
        tube.setAttribute('aDelay', new THREE.BufferAttribute(delays, 1));
        (escalated ? redTubes : inkTubes).push(tube);
        this.curves.push({ curve, escalated, delay, speed: 0.035 + rand() * 0.05, offset: rand() });
      }
    });

    const makeMaterial = (color, opacity) => new THREE.ShaderMaterial({
      vertexShader: threadVertex,
      fragmentShader: threadFragment,
      transparent: opacity < 1,
      uniforms: {
        uColor: { value: color.clone() },
        uFogColor: { value: this.colors.paper.clone() },
        uProgress: { value: 0 },
        uFogNear: { value: 14 },
        uFogFar: { value: 46 },
        uOpacity: { value: opacity },
      },
    });

    this.inkMaterial = makeMaterial(this.colors.ink, 1);
    this.redMaterial = makeMaterial(this.colors.accent, 1);
    this.inkMesh = new THREE.Mesh(mergeGeometries(inkTubes), this.inkMaterial);
    this.redMesh = new THREE.Mesh(mergeGeometries(redTubes), this.redMaterial);
    inkTubes.concat(redTubes).forEach((g) => g.dispose());
    this.root = new THREE.Group();
    this.root.add(this.inkMesh, this.redMesh);

    // Stage floors: thin open frames the threads pass through.
    this.floorMaterial = new THREE.LineBasicMaterial({ color: this.colors.line, transparent: true, opacity: 0.9 });
    this.floors = STAGES.map((stage) => {
      const w = 8.6;
      const dz = 2.2;
      const g = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-w, stage.y, -dz), new THREE.Vector3(w, stage.y, -dz),
        new THREE.Vector3(w, stage.y, dz), new THREE.Vector3(-w, stage.y, dz),
      ]);
      const loop = new THREE.LineLoop(g, this.floorMaterial);
      this.root.add(loop);
      return loop;
    });

    // Escalation gate: a short red bar, as on the poster.
    const gateGeo = new THREE.BoxGeometry(0.06, 1.6, 0.06);
    this.gateMaterial = new THREE.MeshBasicMaterial({ color: this.colors.accent });
    this.gate = new THREE.Mesh(gateGeo, this.gateMaterial);
    this.gate.position.copy(ESCALATION_GATE).add(new THREE.Vector3(0.35, 0, 0));
    this.root.add(this.gate);

    // Moving petitions: one point travelling down each thread.
    const n = this.curves.length;
    const positions = new Float32Array(n * 3);
    const sizes = new Float32Array(n);
    const alphas = new Float32Array(n);
    this.curves.forEach((c, i) => { sizes[i] = c.escalated ? 5.5 : 3.6; });
    this.pulseGeometry = new THREE.BufferGeometry();
    this.pulseGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.pulseGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    this.pulseGeometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));
    const pulseMaterial = (color) => new THREE.ShaderMaterial({
      vertexShader: pulseVertex,
      fragmentShader: pulseFragment,
      transparent: true,
      depthWrite: false,
      uniforms: { uColor: { value: color.clone() }, uPixelRatio: { value: this.renderer.getPixelRatio() } },
    });
    // Ink pulses read better slightly lifted from the threads; red keep the accent.
    this.pulseMaterial = pulseMaterial(this.colors.accent);
    this.pulses = new THREE.Points(this.pulseGeometry, this.pulseMaterial);
    this.root.add(this.pulses);

    this.scene.add(this.root);
    this.tmp = new THREE.Vector3();
  }

  // Screen positions (CSS px) of anchors the HTML labels follow.
  anchors() {
    const list = [
      ...DEPARTMENTS.map((d) => ({ id: `dept-${d.name}`, v: new THREE.Vector3(d.x, 3.1, 0) })),
      ...STAGES.map((s) => ({ id: `stage-${s.key}`, v: new THREE.Vector3(-8.6, s.y, 2.2) })),
      { id: 'gate', v: ESCALATION_GATE.clone().add(new THREE.Vector3(0.4, 1.3, 0)) },
    ];
    const out = {};
    list.forEach(({ id, v }) => {
      v.project(this.camera);
      out[id] = {
        // The view offset is already part of the projection matrix.
        x: (v.x * 0.5 + 0.5) * this.width,
        y: (-v.y * 0.5 + 0.5) * this.height,
        visible: v.z < 1 && v.z > -1,
      };
    });
    return out;
  }

  setProgress(p) {
    this.progress = THREE.MathUtils.clamp(p, 0, 1);
  }

  setPointer(x, y) {
    this.pointer.set(x, y);
  }

  setViewShift(x, y = 0) {
    this.shiftX = x;
    this.shiftY = y;
    this.resize();
  }

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.width = w;
    this.height = h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // Wider fov on narrow screens keeps the three columns in frame.
    this.camera.fov = w / h < 0.8 ? 50 : 34;
    // Push the field off-centre so text can own the rest of the screen.
    this.offsetX = w * this.shiftX;
    this.offsetY = h * this.shiftY;
    this.camera.setViewOffset(w, h, -this.offsetX, -this.offsetY, w, h);
    this.camera.updateProjectionMatrix();
  }

  shot(p) {
    let i = 0;
    while (i < SHOTS.length - 2 && p > SHOTS[i + 1].at) i += 1;
    const a = SHOTS[i];
    const b = SHOTS[i + 1];
    const t = smooth(THREE.MathUtils.clamp((p - a.at) / (b.at - a.at), 0, 1));
    const lerp = (u, v) => u.map((x, k) => x + (v[k] - x) * t);
    return { pos: lerp(a.pos, b.pos), look: lerp(a.look, b.look) };
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.clock.getDelta();
    const loop = () => {
      if (!this.running) return;
      this.frame = requestAnimationFrame(loop);
      this.render();
    };
    loop();
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.frame);
  }

  render() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const time = this.clock.elapsedTime;

    // The threads draw themselves once, on load, from filing to resolution.
    if (!this.reducedMotion) {
      if (this.introStart === null) this.introStart = time;
      this.grow = easeOutCubic(Math.min((time - this.introStart) / INTRO_SECONDS, 1)) * FULL_GROWTH;
    }
    const g = this.grow;
    this.inkMaterial.uniforms.uProgress.value = g;
    this.redMaterial.uniforms.uProgress.value = g;

    // Camera follows the journey; pointer adds a little parallax.
    const { pos, look } = this.shot(this.progress);
    const pk = 1 - Math.pow(0.02, dt);
    this.pointerEased.lerp(this.pointer, this.reducedMotion ? 0 : pk);
    const drift = this.reducedMotion ? 0 : Math.sin(time * 0.25) * 0.35;
    this.camera.position.set(
      pos[0] + this.pointerEased.x * 1.4 + drift,
      pos[1] + this.pointerEased.y * 0.9,
      pos[2],
    );
    this.lookAt.set(look[0], look[1], look[2]);
    this.camera.lookAt(this.lookAt);

    // Fog starts just behind the focus point, wherever the camera is.
    const dist = this.camera.position.distanceTo(this.lookAt);
    [this.inkMaterial, this.redMaterial].forEach((m) => {
      m.uniforms.uFogNear.value = dist + 2;
      m.uniforms.uFogFar.value = dist + 30;
    });

    // Move the petitions along their threads, only where the thread has grown.
    const pos3 = this.pulseGeometry.attributes.position.array;
    const alpha = this.pulseGeometry.attributes.aAlpha.array;
    this.curves.forEach((c, i) => {
      const reach = THREE.MathUtils.clamp((g - c.delay) / 0.82, 0, 1);
      const t = this.reducedMotion ? 0.5 * reach : ((c.offset + time * c.speed) % 1) * reach;
      c.curve.getPointAt(t, this.tmp);
      pos3[i * 3] = this.tmp.x;
      pos3[i * 3 + 1] = this.tmp.y;
      pos3[i * 3 + 2] = this.tmp.z;
      alpha[i] = c.escalated && reach > 0.05 ? 1 : 0;
    });
    this.pulseGeometry.attributes.position.needsUpdate = true;
    this.pulseGeometry.attributes.aAlpha.needsUpdate = true;

    this.gate.scale.y = THREE.MathUtils.clamp((g - 0.78) * 4, 0.001, 1);

    this.renderer.render(this.scene, this.camera);
    if (this.onFrame) this.onFrame(this.anchors(), g);
  }

  dispose() {
    this.stop();
    this.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) o.material.dispose();
    });
    this.renderer.dispose();
  }
}
