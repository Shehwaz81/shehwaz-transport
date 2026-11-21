import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/*
 * A stylised model of unit 878: white Freightliner-style conventional with a
 * sleeper, royal-blue fenders, chrome grille and stacks, and a dry van trailer.
 * World units are metres. +x is forward, +y is up.
 *
 * The scene is driven by one number, the chapter position `c`:
 *   0 hero · 1 full truckload · 2 less than truckload · 3 expedited and emergency · 4 the border
 */

const NAVY = 0x071738;
const ROWS = 13;
const YOURS_FROM_ROW = 10; // the last three rows by the doors are "your" skids in the LTL chapter

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

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const hash = (n: number) => {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
};

export type TruckScene = {
  setChapter: (c: number) => void;
  setActive: (on: boolean) => void;
  dispose: () => void;
};

export function createTruckScene(
  canvas: HTMLCanvasElement,
  opts: { reducedMotion: boolean; logoUrl: string; fontFamily: string; onFirstFrame: () => void },
): TruckScene {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  // Neutral keeps dark colours where they are, so the road meets the page's navy exactly.
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(NAVY);
  const fog = new THREE.Fog(NAVY, 30, 96);
  scene.fog = fog;

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envRT.texture;
  scene.environmentIntensity = 0.55;

  const camera = new THREE.PerspectiveCamera(26, 1, 0.5, 300);

  // ---- lights -------------------------------------------------------------
  scene.add(new THREE.HemisphereLight(0xeef2ff, 0x1a2748, 0.6));
  // a pool of light on the road so the truck stands on something
  const pool = new THREE.SpotLight(0xe6ecff, 1200, 70, 0.62, 1, 1.3);
  pool.position.set(-6, 30, 4);
  pool.target.position.set(-6, 0, 0);
  scene.add(pool, pool.target);
  const key = new THREE.DirectionalLight(0xffffff, 2.9);
  key.position.set(14, 22, 16);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
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
  scene.add(key, key.target);
  key.target.position.set(-6, 0, 0);
  const rim = new THREE.DirectionalLight(0xdfe7ff, 1.7);
  rim.position.set(-18, 9, -14);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffffff, 1.5);
  fill.position.set(10, 10, -16);
  scene.add(fill);

  // ---- materials ----------------------------------------------------------
  const paint = new THREE.MeshPhysicalMaterial({ color: 0xf4f6fa, roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.2 });
  const blue = new THREE.MeshPhysicalMaterial({ color: 0x2740c4, roughness: 0.28, clearcoat: 0.9, clearcoatRoughness: 0.15 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xf2f4f8, metalness: 1, roughness: 0.12, envMapIntensity: 2.6 });
  const alu = new THREE.MeshStandardMaterial({ color: 0xd6dbe3, metalness: 0.9, roughness: 0.34, envMapIntensity: 1.8 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x0d0f14, roughness: 0.92 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x151a26, roughness: 0.7, metalness: 0.3 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x0a1120, roughness: 0.06, metalness: 0.4, clearcoat: 1 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x9a7448, roughness: 0.85 });
  const shell = new THREE.MeshPhysicalMaterial({
    color: 0xf1f3f7,
    roughness: 0.5,
    clearcoat: 0.3,
    transparent: true,
    side: THREE.DoubleSide,
  });
  const amber = new THREE.MeshStandardMaterial({ color: 0xffb01f, emissive: 0xff9a00, emissiveIntensity: 2.4 });
  const red = new THREE.MeshStandardMaterial({ color: 0xff2a1a, emissive: 0xff1500, emissiveIntensity: 2.2 });
  const lamp = new THREE.MeshStandardMaterial({ color: 0xfff4d6, emissive: 0xffe9b0, emissiveIntensity: 1.5 });
  const carton = new THREE.MeshStandardMaterial({ color: 0xc9a473, roughness: 0.75 });
  const cartonGhost = new THREE.MeshStandardMaterial({ color: 0xc9a473, roughness: 0.75, transparent: true });
  const woodGhost = new THREE.MeshStandardMaterial({ color: 0x9a7448, roughness: 0.85, transparent: true });

  const disposables: { dispose: () => void }[] = [envRT, pmrem];
  const track = <T extends { dispose: () => void }>(o: T) => {
    disposables.push(o);
    return o;
  };

  // ---- helpers ------------------------------------------------------------
  const truck = new THREE.Group();
  scene.add(truck);
  const body = new THREE.Group(); // everything sprung: bobs a little at speed
  truck.add(body);
  truck.position.x = opts.reducedMotion ? 0 : -15;

  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, parent: THREE.Object3D = body, shadow = true) => {
    const m = new THREE.Mesh(track(geo), mat);
    m.castShadow = shadow;
    m.receiveShadow = shadow;
    parent.add(m);
    return m;
  };
  /** Box spanning x0..x1, y0..y1, centred on z with width w. */
  const box = (x0: number, x1: number, y0: number, y1: number, w: number, z = 0, r = 0.03) => {
    const g = new RoundedBoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), w, 2, Math.min(r, w / 2.01, Math.abs(y1 - y0) / 2.01, Math.abs(x1 - x0) / 2.01));
    g.translate((x0 + x1) / 2, (y0 + y1) / 2, z);
    return g;
  };
  /** Cylinder lying along an axis. */
  const cyl = (r: number, len: number, axis: "x" | "y" | "z", x: number, y: number, z: number, seg = 24) => {
    const g = new THREE.CylinderGeometry(r, r, len, seg);
    if (axis === "x") g.rotateZ(Math.PI / 2);
    if (axis === "z") g.rotateX(Math.PI / 2);
    g.translate(x, y, z);
    return g;
  };
  const both = (fn: (s: 1 | -1) => THREE.BufferGeometry[]) => [...fn(1), ...fn(-1)];
  const merged = (geos: THREE.BufferGeometry[]) => {
    const flat = geos.map((g) => (g.index ? g.toNonIndexed() : g));
    const out = mergeGeometries(flat, false)!;
    geos.forEach((g) => g.dispose());
    return out;
  };

  // ---- wheels -------------------------------------------------------------
  const R = 0.52;
  const tireGeo = track(cyl(R, 0.29, "z", 0, 0, 0, 36));
  const rimGeo = track(
    merged([
      cyl(0.33, 0.3, "z", 0, 0, 0, 28),
      cyl(0.13, 0.36, "z", 0, 0, 0, 16),
      ...Array.from({ length: 10 }, (_, i) => cyl(0.022, 0.34, "z", Math.cos((i / 10) * Math.PI * 2) * 0.19, Math.sin((i / 10) * Math.PI * 2) * 0.19, 0, 6)),
    ]),
  );
  const holeGeo = track(
    merged(Array.from({ length: 5 }, (_, i) => cyl(0.05, 0.31, "z", Math.cos((i / 5) * Math.PI * 2) * 0.265, Math.sin((i / 5) * Math.PI * 2) * 0.265, 0, 10))),
  );
  const wheels: THREE.Group[] = [];
  const wheel = (x: number, z: number, dual: boolean, parent: THREE.Object3D) => {
    const g = new THREE.Group();
    g.position.set(x, R, z);
    const offs = dual ? [-0.16, 0.16] : [0];
    for (const o of offs) {
      const t = new THREE.Mesh(tireGeo, rubber);
      t.position.z = o;
      t.castShadow = true;
      g.add(t);
    }
    const out = Math.sign(z) * (dual ? 0.16 : 0);
    const rimM = new THREE.Mesh(rimGeo, alu);
    rimM.position.z = out;
    const holes = new THREE.Mesh(holeGeo, dark);
    holes.position.z = out;
    g.add(rimM, holes);
    parent.add(g);
    wheels.push(g);
  };
  wheel(3.0, 1.06, false, truck);
  wheel(3.0, -1.06, false, truck);
  for (const x of [-2.9, -4.2, -16.5, -17.8]) {
    wheel(x, 0.98, true, truck);
    wheel(x, -0.98, true, truck);
  }

  // ---- tractor ------------------------------------------------------------
  // frame, fifth wheel, mud flaps
  add(merged([box(-5.0, 4.0, 0.78, 1.06, 0.86), cyl(0.52, 0.09, "y", -3.55, 1.13, 0), box(-3.9, -3.2, 1.06, 1.12, 0.9)]), dark);
  add(merged(both((s) => [box(-5.02, -4.98, 0.22, 0.95, 0.62, s * 0.98, 0.01)])), rubber);

  // hood: tapers and drops toward the nose
  {
    const g = new THREE.BoxGeometry(2, 1, 1, 6, 1, 1);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const t = (p.getX(i) + 1) / 2; // 0 at the cab, 1 at the nose
      const top = p.getY(i) > 0;
      p.setX(i, lerp(1.9, 3.92, t));
      p.setZ(i, p.getZ(i) * lerp(2.12, 1.5, Math.pow(t, 1.4)));
      p.setY(i, top ? lerp(2.16, 1.93, Math.pow(t, 1.6)) : 1.12);
    }
    g.computeVertexNormals();
    add(g, paint);
  }
  // grille: dark core, chrome surround and bars
  add(box(3.86, 3.96, 1.06, 1.94, 1.32, 0, 0.02), dark);
  add(
    merged([
      box(3.9, 4.0, 1.9, 2.0, 1.5, 0, 0.03),
      box(3.9, 4.0, 1.0, 1.08, 1.5, 0, 0.03),
      ...both((s) => [box(3.9, 4.0, 1.0, 2.0, 0.09, s * 0.71, 0.03)]),
      ...Array.from({ length: 11 }, (_, i) => box(3.93, 3.99, 1.13 + i * 0.07, 1.165 + i * 0.07, 1.34, 0, 0.012)),
      // bumper
      box(3.94, 4.28, 0.5, 0.9, 2.56, 0, 0.1),
      // mirrors, visor, horns, stacks, tank straps
      ...both((s) => [
        box(1.92, 2.0, 2.02, 2.62, 0.24, s * 1.47, 0.03),
        cyl(0.018, 0.34, "z", 1.9, 2.5, s * 1.3, 6),
        cyl(0.018, 0.34, "z", 1.9, 2.12, s * 1.3, 6),
        cyl(0.075, 3.0, "y", 0.36, 2.65, s * 1.3, 18),
        cyl(0.045, 0.5, "x", 1.3, 3.0, s * 0.42, 10),
        box(3.62, 3.94, 1.08, 1.5, 0.52, s * 0.99, 0.08),
      ]),
      box(1.86, 2.22, 2.8, 2.87, 2.34, 0, 0.02),
    ]),
    chrome,
  );
  add(merged(both((s) => [cyl(0.115, 1.25, "y", 0.36, 2.2, s * 1.3, 18)])), alu);

  // fenders and blue lower body
  add(
    merged(
      both((s) => {
        const arch = new THREE.CylinderGeometry(0.76, 0.76, 0.56, 30, 1, false, Math.PI / 2, Math.PI);
        arch.rotateX(Math.PI / 2);
        arch.translate(3.0, 0.62, s * 1.04);
        return [arch, box(3.5, 3.94, 0.62, 1.1, 0.56, s * 1.04, 0.06), box(-1.3, 2.3, 1.06, 1.2, 0.08, s * 1.16, 0.02), box(0.6, 1.8, 0.5, 0.58, 0.34, s * 1.2, 0.02), box(0.6, 1.8, 0.84, 0.9, 0.3, s * 1.18, 0.02)];
      }),
    ),
    blue,
  );
  // headlights
  const lampGeo = merged(both((s) => [cyl(0.105, 0.06, "x", 3.94, 1.3, s * 0.87, 16), cyl(0.085, 0.06, "x", 3.94, 1.28, s * 1.1, 16)]));
  add(lampGeo, lamp, body, false);

  // cab, sleeper, roof fairing
  add(merged([box(0.5, 1.92, 1.12, 2.86, 2.3, 0, 0.09), box(-1.3, 0.52, 1.12, 3.32, 2.42, 0, 0.1)]), paint);
  {
    const g = new THREE.BoxGeometry(2, 1, 1, 6, 1, 1);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const t = (p.getX(i) + 1) / 2; // 0 at the back of the sleeper, 1 above the windshield
      const top = p.getY(i) > 0;
      p.setX(i, lerp(-1.3, 1.9, t));
      p.setZ(i, p.getZ(i) * lerp(2.42, 2.0, t));
      p.setY(i, top ? lerp(4.0, 2.9, Math.pow(t, 0.8)) : 2.8);
    }
    g.computeVertexNormals();
    add(g, paint);
  }
  // glass: two-piece windshield, door and sleeper windows
  add(
    merged([
      ...both((s) => [box(1.9, 1.95, 2.06, 2.72, 0.98, s * 0.52, 0.02), box(0.78, 1.72, 2.06, 2.68, 0.05, s * 1.14, 0.02), box(-0.9, -0.3, 2.3, 2.75, 0.05, s * 1.2, 0.02)]),
    ]),
    glass,
  );
  // door seams and sleeper join
  add(
    merged(
      both((s) => [
        box(0.68, 0.695, 1.22, 2.78, 0.012, s * 1.153, 0.002),
        box(1.8, 1.815, 1.22, 2.78, 0.012, s * 1.153, 0.002),
        box(0.68, 1.815, 1.22, 1.235, 0.012, s * 1.153, 0.002),
        box(0.5, 0.52, 1.2, 2.86, 0.012, s * 1.156, 0.002),
      ]),
    ),
    dark,
    body,
    false,
  );
  // handles, grab bars, window surrounds
  add(
    merged(
      both((s) => [
        box(0.76, 0.96, 1.9, 1.95, 0.05, s * 1.17, 0.015),
        cyl(0.02, 1.1, "y", 0.58, 2.1, s * 1.19, 8),
        box(0.76, 1.74, 2.69, 2.72, 0.03, s * 1.155, 0.006),
        box(0.76, 1.74, 2.03, 2.06, 0.03, s * 1.155, 0.006),
      ]),
    ),
    chrome,
    body,
    false,
  );
  // fuel tanks, tool boxes, steps
  add(merged(both((s) => [cyl(0.34, 1.5, "x", 1.05, 0.72, s * 1.0, 28), box(-1.2, 0.1, 0.42, 1.02, 0.5, s * 1.0, 0.04)])), alu);
  // roof marker lights
  add(merged(Array.from({ length: 5 }, (_, i) => box(1.94, 2.06, 2.87, 2.94, 0.13, (i - 2) * 0.46, 0.02))), amber, body, false);

  // ---- trailer ------------------------------------------------------------
  const TX0 = -18.8;
  const TX1 = -2.65;
  const TY0 = 1.32;
  const TY1 = 4.16;
  const TW = 2.6;
  // deck, rails, landing gear, bogie, bumper
  add(box(TX0, TX1, 1.2, TY0, TW, 0, 0.02), dark);
  add(box(TX0 + 0.05, TX1 - 0.05, TY0, TY0 + 0.035, TW - 0.12, 0, 0.005), wood, body, false);
  add(
    merged([
      box(TX0 + 0.3, TX1 - 1.2, 1.02, 1.2, 0.9),
      box(-18.4, -15.9, 0.72, 1.02, 1.1),
      ...both((s) => [box(-5.7, -5.56, 0.12, 1.2, 0.14, s * 0.85, 0.01), box(-5.82, -5.44, 0.08, 0.13, 0.3, s * 0.85, 0.01), box(-18.84, -18.8, 0.2, 0.95, 0.62, s * 0.98, 0.01)]),
      box(-18.86, -18.74, 0.52, 0.64, 2.4, 0, 0.02),
      ...both((s) => [box(-18.84, -18.76, 0.6, 1.2, 0.1, s * 0.7, 0.02)]),
    ]),
    dark,
  );
  // aero skirts and the corner frame that stays visible when the walls go clear
  add(merged(both((s) => [box(-15.6, -6.6, 0.42, 1.2, 0.04, s * 1.26, 0.01)])), paint);
  const railGeos: THREE.BufferGeometry[] = [];
  for (const s of [1, -1] as const) {
    railGeos.push(box(TX0, TX1, TY0, TY0 + 0.1, 0.05, s * (TW / 2), 0.01), box(TX0, TX1, TY1 - 0.1, TY1, 0.05, s * (TW / 2), 0.01));
    for (const x of [TX0 + 0.04, TX1 - 0.04]) railGeos.push(box(x - 0.04, x + 0.04, TY0, TY1, 0.07, s * (TW / 2), 0.01));
  }
  for (const x of [TX0 + 0.03, TX1 - 0.03]) railGeos.push(box(x - 0.03, x + 0.03, TY1 - 0.1, TY1, TW, 0, 0.01));
  add(merged(railGeos), alu);
  // walls, roof, nose, doors: one material so the whole box fades together
  const wallGeos: THREE.BufferGeometry[] = [];
  for (const s of [1, -1] as const) {
    wallGeos.push(box(TX0, TX1, TY0 + 0.1, TY1 - 0.1, 0.03, s * (TW / 2 - 0.02), 0.004));
    for (let x = TX0 + 1.22; x < TX1 - 0.4; x += 1.22) wallGeos.push(box(x - 0.025, x + 0.025, TY0 + 0.1, TY1 - 0.1, 0.02, s * (TW / 2 + 0.002), 0.004));
  }
  wallGeos.push(box(TX0, TX1, TY1 - 0.04, TY1, TW - 0.06, 0, 0.004), box(TX1 - 0.03, TX1, TY0 + 0.1, TY1 - 0.1, TW - 0.06, 0, 0.004), box(TX0, TX0 + 0.03, TY0 + 0.1, TY1 - 0.1, TW - 0.06, 0, 0.004));
  const walls = add(merged(wallGeos), shell);
  // door hardware, trailer marker and tail lights
  add(merged([...both((s) => [cyl(0.02, 2.5, "y", TX0 - 0.03, 2.74, s * 0.35, 6), cyl(0.02, 2.5, "y", TX0 - 0.03, 2.74, s * 0.95, 6)]), box(TX0 - 0.02, TX0 + 0.02, TY0 + 0.1, TY1 - 0.1, 0.03, 0, 0.004)]), alu, body, false);
  add(merged(both((s) => Array.from({ length: 5 }, (_, i) => box(-4 - i * 3.5 - 0.06, -4 - i * 3.5 + 0.06, 1.23, 1.29, 0.03, s * (TW / 2 + 0.01), 0.008)))), amber, body, false);
  add(
    merged([
      ...both((s) => [box(TX0 - 0.03, TX0 + 0.02, 1.2, 1.31, 0.42, s * 0.95, 0.02)]),
      ...[-0.25, 0, 0.25].map((z) => box(TX0 - 0.03, TX0 + 0.02, TY1 - 0.09, TY1 - 0.03, 0.12, z, 0.01)),
    ]),
    red,
    body,
    false,
  );

  // red and white conspicuity tape along the lower rail
  {
    const tapeRed = track(new THREE.MeshBasicMaterial({ color: 0xc8261c }));
    const tapeWhite = track(new THREE.MeshBasicMaterial({ color: 0xdfe3ea }));
    const redG: THREE.BufferGeometry[] = [];
    const whiteG: THREE.BufferGeometry[] = [];
    for (const s of [1, -1] as const) {
      let i = 0;
      for (let x = TX0 + 0.2; x < TX1 - 0.4; x += 0.28, i++) {
        (i % 2 ? whiteG : redG).push(box(x, x + 0.28, TY0 + 0.022, TY0 + 0.078, 0.008, s * (TW / 2 + 0.028), 0.001));
      }
    }
    add(merged(redG), tapeRed, body, false);
    add(merged(whiteG), tapeWhite, body, false);
  }

  // ---- decals -------------------------------------------------------------
  const decalMats: THREE.MeshBasicMaterial[] = [];
  const decal = (draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, w: number, h: number, wm: number, pos: [number, number, number], fades: boolean) => {
    const cv = document.createElement("canvas");
    cv.width = w;
    cv.height = h;
    draw(cv.getContext("2d")!, w, h);
    const tex = track(new THREE.CanvasTexture(cv));
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    for (const s of [1, -1] as const) {
      const mat = track(new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false }));
      const m = new THREE.Mesh(track(new THREE.PlaneGeometry(wm, (wm * h) / w)), mat);
      m.position.set(pos[0], pos[1], s * pos[2]);
      if (s === -1) m.rotation.y = Math.PI;
      body.add(m);
      if (fades) decalMats.push(mat);
    }
  };
  const fitText = (ctx: CanvasRenderingContext2D, text: string, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // Chrome honours fontStretch on canvas; elsewhere the text is fitted by width alone.
    (ctx as unknown as { fontStretch: string }).fontStretch = "extra-condensed";
    let size = h * 0.9;
    ctx.font = `800 ${size}px ${opts.fontFamily}`;
    const m = ctx.measureText(text).width;
    if (m > w * 0.96) size *= (w * 0.96) / m;
    ctx.font = `800 ${size}px ${opts.fontFamily}`;
    ctx.fillText(text, w / 2, h / 2 + size * 0.04);
  };
  decal((ctx, w, h) => fitText(ctx, "SHEHWAZ TRANSPORT INC.", w, h, "#1f33a8"), 2048, 200, 9.6, [-10.6, 3.0, TW / 2 + 0.02], true);
  decal((ctx, w, h) => fitText(ctx, "878", w, h, "#2740c4"), 256, 128, 0.5, [2.75, 1.82, 1.06], false);
  new THREE.TextureLoader().load(opts.logoUrl, (tex) => {
    track(tex);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    for (const s of [1, -1] as const) {
      const m = new THREE.Mesh(track(new THREE.CircleGeometry(0.33, 40)), track(new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })));
      m.position.set(1.22, 1.62, s * 1.156);
      if (s === -1) m.rotation.y = Math.PI;
      body.add(m);
    }
    dirty = true;
  });

  // ---- lamp glows ---------------------------------------------------------
  const glowTex = (() => {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 128;
    const ctx = cv.getContext("2d")!;
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.25, "rgba(255,255,255,0.35)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    return track(new THREE.CanvasTexture(cv));
  })();
  const glow = (color: number, size: number, x: number, y: number, z: number) => {
    const m = track(new THREE.SpriteMaterial({ map: glowTex, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    const s = new THREE.Sprite(m);
    s.scale.setScalar(size);
    s.position.set(x, y, z);
    body.add(s);
    return m;
  };
  const headGlows = [glow(0xfff0c8, 1.5, 4.02, 1.3, 0.95), glow(0xfff0c8, 1.5, 4.02, 1.3, -0.95)];
  const tailGlows = [glow(0xff2a10, 1.1, TX0 - 0.08, 1.26, 0.95), glow(0xff2a10, 1.1, TX0 - 0.08, 1.26, -0.95)];
  for (let i = 0; i < 5; i++) glow(0xff9a00, 0.5, 2.08, 2.9, (i - 2) * 0.46);
  const beam = new THREE.SpotLight(0xfff0d0, 0, 60, 0.42, 1, 1.2);
  beam.position.set(4.0, 1.4, 0);
  beam.target.position.set(40, 0, 0);
  truck.add(beam, beam.target);

  // ---- freight ------------------------------------------------------------
  const loadGeo = track(new RoundedBoxGeometry(1.06, 1, 0.98, 2, 0.03));
  const baseGeo = track(new THREE.BoxGeometry(1.1, 0.13, 1.0));
  const nOthers = YOURS_FROM_ROW * 2;
  const nYours = (ROWS - YOURS_FROM_ROW) * 2;
  const inst = (geo: THREE.BufferGeometry, mat: THREE.Material, n: number) => {
    const m = new THREE.InstancedMesh(geo, mat, n);
    m.castShadow = false;
    m.frustumCulled = false;
    body.add(m);
    return m;
  };
  const freight = {
    othersLoad: inst(loadGeo, cartonGhost, nOthers),
    othersBase: inst(baseGeo, woodGhost, nOthers),
    yoursLoad: inst(loadGeo, carton, nYours),
    yoursBase: inst(baseGeo, wood, nYours),
  };
  const mtx = new THREE.Matrix4();
  const vPos = new THREE.Vector3();
  const vScl = new THREE.Vector3();
  const qId = new THREE.Quaternion();
  const layoutFreight = (loaded: number) => {
    for (let r = 0; r < ROWS; r++) {
      const q = clamp01(loaded * (ROWS + 3) - r);
      const e = 1 - Math.pow(1 - q, 3);
      for (let k = 0; k < 2; k++) {
        const id = r * 2 + k;
        const yours = r >= YOURS_FROM_ROW;
        const i = yours ? id - nOthers : id;
        const slotX = -3.4 - r * 1.19;
        const x = lerp(-21.5, slotX, e);
        const z = (k ? 1 : -1) * 0.62;
        const h = 1.2 + hash(id + 1) * 0.6;
        const show = q > 0 ? 1 : 0;
        vPos.set(x, TY0 + 0.035 + 0.065, z);
        vScl.setScalar(show);
        (yours ? freight.yoursBase : freight.othersBase).setMatrixAt(i, mtx.compose(vPos, qId, vScl));
        vPos.y = TY0 + 0.035 + 0.13 + h / 2;
        vScl.set(show, show * h, show);
        (yours ? freight.yoursLoad : freight.othersLoad).setMatrixAt(i, mtx.compose(vPos, qId, vScl));
      }
    }
    for (const m of Object.values(freight)) m.instanceMatrix.needsUpdate = true;
  };

  // ---- road ---------------------------------------------------------------
  const ground = new THREE.Mesh(track(new THREE.PlaneGeometry(700, 700)), track(new THREE.MeshStandardMaterial({ color: 0x04091a, roughness: 0.9, metalness: 0, envMapIntensity: 0.1 })));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  const DASH = 12;
  const lineMat = track(new THREE.MeshBasicMaterial({ color: 0x6f7fb0, fog: true }));
  const dashGeos: THREE.BufferGeometry[] = [];
  for (let k = -9; k <= 9; k++) for (const z of [1.95, -1.95]) dashGeos.push(box(k * DASH, k * DASH + 3, 0.004, 0.012, 0.13, z, 0.001));
  const dashes = new THREE.Mesh(track(merged(dashGeos)), lineMat);
  scene.add(dashes);
  const edgeGeos = [5.7, -5.7].map((z) => box(-120, 120, 0.004, 0.012, 0.13, z, 0.001));
  scene.add(new THREE.Mesh(track(merged(edgeGeos)), lineMat));

  // ---- the crossing ------------------------------------------------------
  // A suspension bridge that takes over from the open road in the last chapter.
  // The deck sits a hair under the road, so it only shows once the ground fades.
  const groundMat = ground.material as THREE.MeshStandardMaterial;
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
    const frame = new THREE.Mesh(track(merged(steelG)), steel);
    bridge.add(frame);
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

  // ---- state --------------------------------------------------------------
  let target = 0; // chapter position requested by scroll
  let cur = 0; // smoothed chapter position
  let intro = opts.reducedMotion ? 1 : 0;
  let roadOffset = 0;
  let speed = 0;
  let lastLoaded = -1;
  let active = true;
  let dirty = true;
  let raf = 0;
  let last = performance.now();
  let first = true;
  let w = 0;
  let h = 0;

  const resize = () => {
    const el = canvas.parentElement!;
    const nw = el.clientWidth;
    const nh = el.clientHeight;
    if (!nw || !nh || (nw === w && nh === h)) return;
    w = nw;
    h = nh;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, w < 700 ? 1.75 : 2));
    renderer.setSize(w, h, false);
    dirty = true;
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas.parentElement!);
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

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!active) return;

    // Follow the scroll with a little weight; reduced motion tracks it exactly.
    const before = cur;
    cur = opts.reducedMotion ? target : cur + (target - cur) * (1 - Math.exp(-dt * 7));
    if (Math.abs(target - cur) < 0.0005) cur = target;
    if (cur !== before) dirty = true;

    if (intro < 1) {
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

    if (!dirty) return;
    dirty = false;

    // freight and walls
    const loaded = smooth(0.5, 1.0, cur);
    if (Math.abs(loaded - lastLoaded) > 0.0005) {
      layoutFreight(loaded);
      lastLoaded = loaded;
    }
    const clear = smooth(0.38, 0.8, cur) * (1 - smooth(2.3, 2.7, cur));
    shell.opacity = 1 - 0.9 * clear;
    shell.depthWrite = clear < 0.05;
    walls.castShadow = clear < 0.5;
    for (const m of decalMats) m.opacity = 1 - clear;
    const ghost = smooth(1.45, 1.9, cur);
    cartonGhost.opacity = woodGhost.opacity = 1 - 0.87 * ghost;
    cartonGhost.depthWrite = woodGhost.depthWrite = ghost < 0.05;

    // the road gives way to the bridge
    const span = smooth(3.12, 3.65, cur);
    bridge.visible = water.visible = span > 0.001;
    ground.visible = span < 0.999;
    groundMat.transparent = span > 0.001;
    groundMat.opacity = 1 - span;
    steel.opacity = deckMat.opacity = span;
    steel.transparent = deckMat.transparent = span < 0.999;
    necklace.opacity = span;
    pool.intensity = 1200 * (1 - 0.55 * span);
    bridge.position.x = (4 - Math.min(4, cur)) * 60;

    // motion
    const travel = speed * dt;
    roadOffset = (roadOffset + travel) % DASH;
    dashes.position.x = -roadOffset;
    // Wheels turn with the roll-in; at speed they are capped so the spokes read as spinning, not strobing.
    const spin = (Math.min(speed, 7) * dt + (introX - truck.position.x)) / R;
    for (const wl of wheels) wl.rotation.z -= spin;
    truck.position.x = introX;
    body.position.y = speed > 0 ? Math.sin(now / 90) * 0.006 * Math.min(1, speed / 20) : 0;

    // lamps
    const night = 0.55 + 0.6 * smooth(2.5, 3, cur);
    lamp.emissiveIntensity = 1.2 + 2.2 * night;
    for (const g of headGlows) g.opacity = 0.5 * night;
    for (const g of tailGlows) g.opacity = 0.75;
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

    renderer.render(scene, camera);
    if (first) {
      first = false;
      opts.onFirstFrame();
    }
  };
  raf = requestAnimationFrame(frame);

  return {
    setChapter(c) {
      target = Math.min(WIDE.length - 1, Math.max(0, c));
    },
    setActive(on) {
      active = on;
      if (on) {
        last = performance.now();
        dirty = true;
      }
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      for (const d of disposables) d.dispose();
      for (const m of [paint, blue, chrome, alu, rubber, dark, glass, wood, shell, amber, red, lamp, carton, cartonGhost, woodGhost]) m.dispose();
      renderer.dispose();
    },
  };
}
