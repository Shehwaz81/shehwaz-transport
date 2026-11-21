import * as THREE from "three";
import { box, canvas, cyl, lerp, merged, smooth } from "./kit";
import { buildRig } from "./model";
import { makeEnvironment, makeLens, makeRoad, makeTown, pickTier } from "./world";

/*
 * Unit 878 on a wet road at night. The truck itself is in model.ts and its
 * surroundings in world.ts; this file holds the camera and the story.
 *
 * The scene is driven by one number, the chapter position `c`:
 *   0 hero · 1 full truckload · 2 less than truckload · 3 expedited and emergency · 4 the border
 */

const NAVY = 0x071738;

type Pose = {
  yaw: number; // degrees round the truck, 0 = dead ahead
  pitch: number;
  fit: number; // metres of world that must fit across the view
  t: [number, number, number]; // look-at target
  ox: number; // shift the picture right (fraction of width)
  oy: number; // shift the picture up (fraction of height)
};

const WIDE: Pose[] = [
  { yaw: -26, pitch: 5, fit: 15.5, t: [0.4, 1.9, 0], ox: 0.16, oy: -0.2 },
  { yaw: 78, pitch: 11, fit: 26, t: [-7.3, 2.0, 0], ox: 0.01, oy: -0.24 },
  { yaw: 146, pitch: 20, fit: 16, t: [-14.8, 2.4, 0], ox: 0.2, oy: -0.08 },
  { yaw: 250, pitch: 4, fit: 15, t: [0.2, 1.7, 0], ox: 0.18, oy: -0.14 },
  { yaw: 286, pitch: 3, fit: 100, t: [-11, 14, 0], ox: 0.02, oy: -0.04 },
];

const TALL: Pose[] = [
  { yaw: -30, pitch: 6, fit: 8.5, t: [1.6, 1.9, 0], ox: 0, oy: -0.2 },
  { yaw: 132, pitch: 15, fit: 10.5, t: [-12.5, 2.2, 0], ox: 0, oy: -0.2 },
  { yaw: 152, pitch: 21, fit: 8, t: [-15.8, 2.1, 0], ox: 0, oy: -0.2 },
  { yaw: 250, pitch: 4, fit: 9.5, t: [1.2, 1.7, 0], ox: 0, oy: -0.2 },
  { yaw: 300, pitch: 5, fit: 42, t: [-6, 10, 0], ox: 0, oy: -0.1 },
];

export type TruckScene = {
  setChapter: (c: number) => void;
  setActive: (on: boolean) => void;
  dispose: () => void;
};

export function createTruckScene(
  canvasEl: HTMLCanvasElement,
  opts: { reducedMotion: boolean; logoUrl: string; fontFamily: string; onFirstFrame: () => void },
): TruckScene {
  const stage = canvasEl.parentElement!;
  const tier = pickTier(stage.clientWidth);
  // The lens does its own anti-aliasing, so the canvas itself needs none.
  const renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: false, powerPreference: "high-performance" });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  // Nothing that casts a shadow moves once the truck has parked, so shadows are drawn on request.
  renderer.shadowMap.autoUpdate = false;
  // Neutral keeps dark colours where they are, so the night meets the page's navy exactly.
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(NAVY);
  const fog = new THREE.Fog(NAVY, 30, 96);
  scene.fog = fog;
  const envRT = makeEnvironment(renderer);
  scene.environment = envRT.texture;
  scene.environmentIntensity = 0.8;

  const camera = new THREE.PerspectiveCamera(26, 1, 0.5, 900);

  const disposables: { dispose: () => void }[] = [envRT];
  const track = <T extends { dispose: () => void }>(o: T) => {
    disposables.push(o);
    return o;
  };

  // ---- lights -------------------------------------------------------------
  scene.add(new THREE.HemisphereLight(0x9fb2e6, 0x0a0d16, 0.18));
  // the overhead box in the reflections, as a light: cool, from ahead and above
  const key = new THREE.DirectionalLight(0xf2f5ff, 1.95);
  key.position.set(12, 24, 13);
  key.castShadow = true;
  key.shadow.mapSize.set(tier.shadow, tier.shadow);
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.03;
  key.shadow.radius = 5;
  const sc = key.shadow.camera;
  sc.left = -26;
  sc.right = 12;
  sc.top = 12;
  sc.bottom = -12;
  sc.near = 1;
  sc.far = 70;
  key.target.position.set(-6, 0, 0);
  scene.add(key, key.target);
  // edge light from behind, and the town's sodium from low on the far side
  const rim = new THREE.DirectionalLight(0xc4d4ff, 1.5);
  rim.position.set(-20, 10, -15);
  const warm = new THREE.DirectionalLight(0xffa65c, 0.55);
  warm.position.set(-4, 3, 20);
  scene.add(rim, warm);
  // a lamp standing over the road, so the truck is parked in something
  const pool = new THREE.SpotLight(0xe9eeff, 260, 70, 0.62, 1, 1.3);
  pool.position.set(-6, 30, 4);
  pool.target.position.set(-6, 0, 0);
  scene.add(pool, pool.target);

  // ---- truck, road, town --------------------------------------------------
  const glowTex = track(
    new THREE.CanvasTexture(
      canvas(128, 128, (ctx) => {
        const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        g.addColorStop(0, "rgba(255,255,255,1)");
        g.addColorStop(0.25, "rgba(255,255,255,0.35)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 128, 128);
      }),
    ),
  );
  const rig = buildRig({ logoUrl: opts.logoUrl, fontFamily: opts.fontFamily, glow: glowTex, onChange: () => wake() });
  const { truck, body, wheels } = rig;
  scene.add(truck);
  truck.position.x = opts.reducedMotion ? 0 : -15;
  const beam = new THREE.SpotLight(0xfff0d0, 0, 70, 0.46, 1, 1.2);
  beam.position.set(4.0, 1.2, 0);
  beam.target.position.set(40, -1, 0);
  truck.add(beam, beam.target);

  const road = makeRoad(truck, tier);
  scene.add(road.group);
  const town = makeTown(glowTex);
  scene.add(town.points);

  // ---- the crossing ------------------------------------------------------
  // A suspension bridge that takes over from the open road in the last chapter.
  // The deck sits a hair under the road, so it only shows once the road fades.
  const steel = track(new THREE.MeshStandardMaterial({ color: 0xb4bccb, roughness: 0.55, metalness: 0.35, transparent: true }));
  const deckMat = track(new THREE.MeshStandardMaterial({ color: 0x060c1e, roughness: 0.9, transparent: true }));
  const bridge = new THREE.Group();
  bridge.visible = false;
  scene.add(bridge);
  const TOWERS = [36, -64];
  const MID = (TOWERS[0] + TOWERS[1]) / 2;
  const TOP = 50;
  const WATER = -40;
  const CZ = 8.3;
  const cableY = (x: number) => {
    const half = (TOWERS[0] - TOWERS[1]) / 2;
    const d = x - MID;
    if (Math.abs(d) <= half) return 7 + (TOP - 7) * (d / half) ** 2;
    return Math.max(1, TOP - (TOP - 1) * ((Math.abs(d) - half) / 70));
  };
  {
    const deck = new THREE.Mesh(track(box(-320, 320, -1.4, -0.015, 14.6, 0, 0.01)), deckMat);
    deck.receiveShadow = true;
    bridge.add(deck);
    const steelG: THREE.BufferGeometry[] = [];
    for (const z of [7.2, -7.2]) steelG.push(box(-320, 320, -1.6, 1.15, 0.3, z, 0.01), box(-320, 320, 1.05, 1.2, 0.5, z, 0.01));
    for (const tx of TOWERS) {
      for (const z of [CZ, -CZ]) steelG.push(box(tx - 1.3, tx + 1.3, WATER, TOP + 1.5, 2.4, z, 0.05));
      for (const y of [-6, 9, 30, TOP - 1]) steelG.push(box(tx - 0.9, tx + 0.9, y - 1.1, y + 1.1, CZ * 2, 0, 0.05));
    }
    for (let x = TOWERS[1] + 4; x < TOWERS[0]; x += 4) for (const z of [CZ, -CZ]) steelG.push(cyl(0.06, cableY(x) - 1, "y", x, (cableY(x) + 1) / 2, z, 5));
    for (const z of [CZ, -CZ]) {
      const pts: THREE.Vector3[] = [];
      for (let x = TOWERS[1] - 70; x <= TOWERS[0] + 70; x += 3.5) pts.push(new THREE.Vector3(x, cableY(x), z));
      steelG.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.24, 6));
    }
    bridge.add(new THREE.Mesh(track(merged(steelG)), steel));
  }
  // the string of lights along the main cables
  const necklace = track(new THREE.PointsMaterial({ map: glowTex, color: 0xffd9a0, size: 2.2, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  {
    const pos: number[] = [];
    for (let x = TOWERS[1] - 68; x <= TOWERS[0] + 68; x += 4) for (const z of [CZ, -CZ]) pos.push(x, cableY(x) + 0.3, z);
    const g = track(new THREE.BufferGeometry());
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    bridge.add(new THREE.Points(g, necklace));
  }
  const water = new THREE.Mesh(track(new THREE.PlaneGeometry(900, 900)), track(new THREE.MeshStandardMaterial({ color: 0x030818, roughness: 0.25, metalness: 0.6, envMapIntensity: 0.5 })));
  water.rotation.x = -Math.PI / 2;
  water.position.y = WATER;
  water.visible = false;
  scene.add(water);

  const lens = makeLens(renderer, scene, camera, tier);

  // ---- state --------------------------------------------------------------
  let target = 0; // chapter position requested by scroll
  let cur = 0; // smoothed chapter position
  let intro = opts.reducedMotion ? 1 : 0;
  let speed = 0;
  let active = true;
  let dirty = true;
  let primed = false; // the first chapter position has arrived
  let raf = 0;
  let last = performance.now();
  let first = true;
  let w = 0;
  let h = 0;

  const resize = () => {
    const nw = stage.clientWidth;
    const nh = stage.clientHeight;
    if (!nw || !nh || (nw === w && nh === h)) return;
    w = nw;
    h = nh;
    renderer.setPixelRatio(tier.dpr);
    renderer.setSize(w, h, false);
    lens.resize(w, h);
    road.resize(w * tier.dpr, h * tier.dpr);
    wake();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(stage);
  resize();

  const pose = (c: number): Pose => {
    const set = w / h < 0.95 ? TALL : WIDE;
    const i = Math.min(set.length - 2, Math.floor(c));
    const e = smooth(0.1, 0.9, c - i);
    const a = set[i];
    const b = set[i + 1];
    return {
      yaw: lerp(a.yaw, b.yaw, e),
      pitch: lerp(a.pitch, b.pitch, e),
      fit: lerp(a.fit, b.fit, e),
      t: [lerp(a.t[0], b.t[0], e), lerp(a.t[1], b.t[1], e), lerp(a.t[2], b.t[2], e)],
      ox: lerp(a.ox, b.ox, e),
      oy: lerp(a.oy, b.oy, e),
    };
  };

  // The loop only runs while something is moving; anything that changes the picture calls wake().
  function wake() {
    dirty = true;
    if (raf || !active) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function frame(now: number) {
    raf = 0;
    if (!active) return;
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;

    // Follow the scroll with a little weight. Reduced motion gets one still per chapter instead of a moving camera.
    const before = cur;
    if (opts.reducedMotion) cur = Math.round(target);
    else {
      cur += (target - cur) * (1 - Math.exp(-dt * 7));
      if (Math.abs(target - cur) < 0.0005) cur = target;
    }
    if (cur !== before) {
      dirty = true;
      if (opts.reducedMotion && !first) canvasEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: "ease-out" });
    }

    const rolling = intro < 1;
    if (rolling) {
      intro = Math.min(1, intro + dt / 1.9);
      dirty = true;
    }
    const introE = 1 - Math.pow(1 - intro, 4);
    const introX = -(1 - introE) * 15;

    // Up to speed for the rush chapter, then easing to a stand on the bridge.
    const wantSpeed = opts.reducedMotion ? 0 : 28 * smooth(2.45, 3, cur) * (1 - smooth(3.5, 3.95, cur));
    speed += (wantSpeed - speed) * (1 - Math.exp(-dt * 3));
    if (speed < 0.02 && wantSpeed === 0) speed = 0;
    if (speed > 0) dirty = true;

    const settling = !opts.reducedMotion && cur !== target;
    if (settling || intro < 1 || speed > 0 || wantSpeed > 0) raf = requestAnimationFrame(frame);

    if (!dirty) return;
    dirty = false;

    // freight and walls
    rig.setLoaded(smooth(0.5, 1.0, cur));
    const wallsChanged = rig.setClear(smooth(0.38, 0.8, cur) * (1 - smooth(2.3, 2.7, cur)));
    rig.setGhost(smooth(1.45, 1.9, cur));

    // the road gives way to the bridge
    const span = smooth(3.12, 3.65, cur);
    bridge.visible = water.visible = span > 0.001;
    road.setSpan(span);
    steel.opacity = deckMat.opacity = span;
    steel.transparent = deckMat.transparent = span < 0.999;
    necklace.opacity = span;
    town.mat.opacity = 0.85 * (1 - span);
    town.points.visible = span < 0.999;
    pool.intensity = 260 * (1 - 0.55 * span);
    bridge.position.x = (4 - Math.min(4, cur)) * 60;

    // motion
    const travel = speed * dt;
    if (travel > 0) {
      road.roll(travel);
      town.roll(travel);
    }
    // Wheels turn with the roll-in; at speed they are capped so the spokes read as spinning, not strobing.
    const spin = (Math.min(speed, 7) * dt + (introX - truck.position.x)) / 0.52;
    for (const wl of wheels) wl.g.rotation.z -= spin * wl.dir;
    truck.position.x = introX;
    body.position.y = speed > 0 ? Math.sin(now / 90) * 0.006 * Math.min(1, speed / 20) : 0;

    // lamps
    const night = 0.55 + 0.6 * smooth(2.5, 3, cur);
    rig.setNight(night);
    beam.intensity = 70 * night;

    // camera
    const p = pose(cur);
    const vfov = (camera.fov * Math.PI) / 180;
    const aspect = w / h;
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspect);
    const dist = Math.max(p.fit / 2 / Math.tan(hfov / 2), 5.2 / 2 / Math.tan(vfov / 2));
    const yaw = (p.yaw * Math.PI) / 180;
    const pitch = (p.pitch * Math.PI) / 180;
    camera.position.set(p.t[0] + dist * Math.cos(pitch) * Math.cos(yaw), Math.max(0.6, p.t[1] + dist * Math.sin(pitch)), p.t[2] + dist * Math.cos(pitch) * Math.sin(yaw));
    camera.lookAt(p.t[0], p.t[1], p.t[2]);
    // the haze starts behind the truck however far back the camera has to stand
    fog.near = dist + 6;
    fog.far = dist + 72;
    camera.aspect = aspect;
    camera.setViewOffset(w, h, -p.ox * w, p.oy * h, w, h);
    camera.updateProjectionMatrix();

    lens.setGlow(Math.min(1, Math.max(0.3, 34 / dist)));
    if (first || rolling || wallsChanged) renderer.shadowMap.needsUpdate = true;
    lens.render();
    if (first) {
      first = false;
      opts.onFirstFrame();
    }
  }
  wake();

  return {
    setChapter(c) {
      if (!Number.isFinite(c)) return;
      target = Math.min(WIDE.length - 1, Math.max(0, c));
      if (!primed) {
        // Start where the page is. Arriving part-way down, the truck is already parked: no roll-in, no catch-up sweep.
        primed = true;
        cur = opts.reducedMotion ? Math.round(target) : target;
        if (target > 0.05) intro = 1;
      }
      wake();
    },
    setActive(on) {
      active = on;
      if (on) wake();
    },
    dispose() {
      active = false; // a late texture load must not restart the loop
      cancelAnimationFrame(raf);
      ro.disconnect();
      rig.dispose();
      road.dispose();
      town.dispose();
      lens.dispose();
      for (const d of disposables) d.dispose();
      renderer.dispose();
    },
  };
}
