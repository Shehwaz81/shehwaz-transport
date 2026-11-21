import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { blob, both, box, canvas, clamp01, roundRect, cyl, dropTris, hash, heightOf, lathe, lerp, loft, merged, mirrorZ, noiseField, normalsFrom, onPlane, pair, rect, ring, roundedPath, shell, slab, smooth, softMax, softMin, strut, texture, tube, uvScale, type Geo, type V2, type V3 } from "./kit";

/*
 * Unit 878 and trailer 8007: a Freightliner Coronado with a raised-roof sleeper, white over
 * royal-blue fenders, pulling a 53 ft dry van. Measured from the photographs on the fleet section.
 * Metres; +x forward, +y up, +z the passenger side. The front axle is at x = 3.
 */

const R = 0.52; // tyre radius
const CABW = 2.34;
const ROWS = 13;
const YOURS_FROM_ROW = 10; // the last three rows by the doors are "your" skids in the LTL chapter

// trailer box
const TX0 = -18.8;
const TX1 = -2.65;
const TY0 = 1.32;
const TY1 = 4.16;
const TW = 2.6;

export type Rig = {
  truck: THREE.Group;
  body: THREE.Group;
  wheels: { g: THREE.Group; dir: number }[];
  /** 0 = trailer closed, 1 = walls clear. True when what casts a shadow changed. */
  setClear: (clear: number) => boolean;
  setGhost: (ghost: number) => void;
  setLoaded: (loaded: number) => void;
  /** How bright the headlamps are, and where the camera is, so each glow can fade as it turns away. */
  setLamps: (night: number, camX: number, camZ: number) => void;
  dispose: () => void;
};

export function buildRig(o: { logoUrl: string; fontFamily: string; glow: THREE.Texture; onChange: () => void }): Rig {
  const made: { dispose: () => void }[] = [];
  const keep = <T extends { dispose: () => void }>(x: T) => {
    made.push(x);
    return x;
  };

  const truck = new THREE.Group();
  const body = new THREE.Group(); // everything sprung: bobs a little at speed
  truck.add(body);

  // ---- surfaces ------------------------------------------------------------
  const flatGrey = (ctx: CanvasRenderingContext2D, w: number, h: number, v = 128) => {
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(0, 0, w, h);
  };
  const treadBump = canvas(256, 256, (ctx, w, h) => {
    flatGrey(ctx, w, h);
    ctx.fillStyle = "#2a2a2a";
    for (let i = 0; i < 8; i++) {
      ctx.fillRect(i * 32, h * 0.2, 5, h * 0.6);
      ctx.fillRect(i * 32 + 16, h * 0.27, 3, h * 0.46);
    }
    ctx.fillStyle = "#a8a8a8";
    for (const y of [0.04, 0.09, 0.14, 0.86, 0.91, 0.96]) ctx.fillRect(0, h * y, w, 3);
  });
  const plateBump = canvas(128, 128, (ctx, w, h) => {
    flatGrey(ctx, w, h, 90);
    ctx.fillStyle = "#e8e8e8";
    for (let iy = 0; iy < 4; iy++)
      for (let ix = 0; ix < 4; ix++) {
        ctx.save();
        ctx.translate(ix * 32 + 16, iy * 32 + 16);
        ctx.rotate(((ix + iy) % 2 ? 1 : -1) * (Math.PI / 4));
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 3.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
  });
  // one bay of trailer side: a post seam with its rivets, and road film low down
  const wallArt = (bump: boolean) =>
    canvas(256, 256, (ctx, w, h) => {
      if (bump) flatGrey(ctx, w, h, 128);
      else {
        ctx.fillStyle = "#f6f7f9";
        ctx.fillRect(0, 0, w, h);
        const film = ctx.createLinearGradient(0, h * 0.72, 0, h);
        film.addColorStop(0, "rgba(120,128,140,0)");
        film.addColorStop(1, "rgba(120,128,140,0.2)");
        ctx.fillStyle = film;
        ctx.fillRect(0, 0, w, h);
      }
      ctx.fillStyle = bump ? "#606060" : "rgba(70,80,96,0.5)";
      ctx.fillRect(0, 0, 2, h);
      ctx.fillStyle = bump ? "#b4b4b4" : "rgba(255,255,255,0.7)";
      ctx.fillRect(2, 0, 2, h);
      ctx.fillStyle = bump ? "#d8d8d8" : "rgba(140,148,160,0.75)";
      for (let y = 6; y < h; y += 12) {
        ctx.beginPath();
        ctx.arc(8, y, 1.6, 0, Math.PI * 2);
        ctx.arc(w - 6, y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let x = 20; x < w; x += 14) {
        ctx.beginPath();
        ctx.arc(x, 5, 1.6, 0, Math.PI * 2);
        ctx.arc(x, h - 5, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  const cartonArt = canvas(256, 256, (ctx, w, h) => {
    ctx.fillStyle = "#c8a274";
    ctx.fillRect(0, 0, w, h);
    const tone = noiseField(64, 8, 2, 4);
    for (let iy = 0; iy < 4; iy++)
      for (let ix = 0; ix < 3; ix++) {
        const x = (ix * w) / 3;
        const y = (iy * h) / 4;
        ctx.fillStyle = `rgba(${tone[(iy * 3 + ix) * 37] > 0.5 ? "255,240,210" : "90,60,30"},0.09)`;
        ctx.fillRect(x, y, w / 3, h / 4);
        ctx.strokeStyle = "rgba(60,38,16,0.55)";
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, w / 3 - 2, h / 4 - 2);
        ctx.fillStyle = "rgba(226,206,170,0.9)"; // tape
        ctx.fillRect(x + w / 6 - 5, y, 10, h / 4);
        ctx.fillStyle = "rgba(250,250,250,0.9)"; // label
        ctx.fillRect(x + 10, y + h / 4 - 24, 26, 15);
      }
    ctx.fillStyle = "rgba(255,255,255,0.1)"; // wrap sheen
    for (let x = -h; x < w; x += 46) {
      ctx.beginPath();
      ctx.moveTo(x, h);
      ctx.lineTo(x + h, 0);
      ctx.lineTo(x + h + 12, 0);
      ctx.lineTo(x + 12, h);
      ctx.fill();
    }
  });
  const plankArt = canvas(256, 256, (ctx, w, h) => {
    const grain = noiseField(256, 6, 4, 2);
    const img = ctx.createImageData(w, h);
    for (let i = 0; i < w * h; i++) {
      const y = Math.floor(i / w);
      const board = Math.floor(y / 32);
      const g = grain[(y % 256) * 256 + ((((i % w) * 5) + board * 71) % 256)];
      const gap = y % 32 < 2 ? 0.45 : 1;
      const v = (0.78 + g * 0.3 + (hash(board * 3.3) - 0.5) * 0.14) * gap;
      img.data[i * 4] = 138 * v;
      img.data[i * 4 + 1] = 104 * v;
      img.data[i * 4 + 2] = 68 * v;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  });
  const holesArt = canvas(64, 64, (ctx, w, h) => {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#101216";
    for (const [x, y] of [[16, 16], [48, 16], [0, 48], [32, 48], [64, 48]]) {
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  const meshArt = canvas(64, 64, (ctx, w, h) => {
    ctx.fillStyle = "#050608";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#3a3f4a";
    ctx.lineWidth = 2;
    for (let i = 0; i <= 64; i += 8) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, h);
      ctx.moveTo(0, i);
      ctx.lineTo(w, i);
      ctx.stroke();
    }
  });

  const tex = (cv: HTMLCanvasElement, srgb: boolean, repeat?: V2) => keep(texture(cv, { srgb, repeat }));
  const bumpOf = (cv: HTMLCanvasElement, strength: number, repeat?: V2) => keep(texture(normalsFrom(heightOf(cv), cv.width, strength), { repeat }));

  // ---- materials -----------------------------------------------------------
  const std = (p: THREE.MeshStandardMaterialParameters) => keep(new THREE.MeshStandardMaterial(p));
  const phys = (p: THREE.MeshPhysicalMaterialParameters) => keep(new THREE.MeshPhysicalMaterial(p));
  const glowing = (color: number, emissive: number, intensity: number) => std({ color, emissive, emissiveIntensity: intensity, roughness: 0.3 });
  const wallMap = tex(wallArt(false), true);
  const wallBump = bumpOf(wallArt(true), 2.2);
  const M = {
    paint: phys({ color: 0xf1f2f4, roughness: 0.38, clearcoat: 1, clearcoatRoughness: 0.06 }),
    blue: phys({ color: 0x0f2296, roughness: 0.34, clearcoat: 1, clearcoatRoughness: 0.05 }),
    chrome: std({ color: 0xffffff, metalness: 1, roughness: 0.045 }),
    polished: std({ color: 0xe8ebef, metalness: 1, roughness: 0.24 }),
    brushed: std({ color: 0xbfc4cc, metalness: 0.95, roughness: 0.44 }),
    plate: std({ color: 0xc9cdd4, metalness: 0.95, roughness: 0.36, normalMap: bumpOf(plateBump, 3.5, [5, 3]) }),
    perforated: std({ color: 0xffffff, metalness: 1, roughness: 0.16, map: tex(holesArt, true, [9, 20]) }),
    steel: std({ color: 0x111317, metalness: 0.45, roughness: 0.62 }),
    liner: std({ color: 0x08090b, roughness: 0.95, side: THREE.BackSide }),
    rubber: std({ color: 0x0b0c0e, roughness: 0.92 }),
    tyre: std({ color: 0x0c0d10, roughness: 0.86, normalMap: bumpOf(treadBump, 3, [5, 1]) }),
    trim: std({ color: 0x0c0e12, roughness: 0.42 }),
    mesh: std({ color: 0xffffff, roughness: 0.6, metalness: 0.4, map: tex(meshArt, true, [18, 14]) }),
    cabin: std({ color: 0x14161b, roughness: 0.95, side: THREE.BackSide }),
    seat: std({ color: 0x22252c, roughness: 0.9 }),
    gauge: glowing(0x0c2a30, 0x35c4d8, 1.6),
    // glazing is two layers: a dark tint you can see through, and the reflections laid over it at full strength
    tint: std({ color: 0x04070a, roughness: 0.3, transparent: true, opacity: 0.5, depthWrite: false }),
    shine: phys({ color: 0x000000, roughness: 0.025, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, envMapIntensity: 2.4 }),
    privacy: phys({ color: 0x05080b, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.5 }),
    hoseRed: std({ color: 0xb01a14, roughness: 0.5 }),
    hoseBlue: std({ color: 0x1640b8, roughness: 0.5 }),
    amber: glowing(0xff9a1a, 0xff8a00, 4.5),
    red: glowing(0xff2a1a, 0xff1200, 5),
    lamp: glowing(0xfff3d8, 0xffe7b0, 4),
    daylight: glowing(0xf4f8ff, 0xdfeaff, 3),
    tapeRed: glowing(0xc4241b, 0xc4241b, 0.35),
    tapeWhite: glowing(0xe4e7ec, 0xe4e7ec, 0.35),
    wood: std({ color: 0xffffff, roughness: 0.82, map: tex(plankArt, true, [6, 1.2]) }),
    pallet: std({ color: 0x9a7448, roughness: 0.88 }),
    carton: phys({ color: 0xffffff, roughness: 0.6, clearcoat: 0.35, clearcoatRoughness: 0.4, map: tex(cartonArt, true) }),
    // one material for walls, roof, nose and doors so the whole box fades together
    shell: phys({ color: 0xffffff, roughness: 0.5, clearcoat: 0.3, map: wallMap, normalMap: wallBump, transparent: true, side: THREE.DoubleSide }),
  };
  const palletGhost = std({ color: 0x9a7448, roughness: 0.88, transparent: true });
  const cartonGhost = phys({ color: 0xffffff, roughness: 0.6, transparent: true, map: M.carton.map });
  const hardware = std({ color: 0xbfc4cc, metalness: 0.95, roughness: 0.44, transparent: true });

  // ---- collecting ----------------------------------------------------------
  type Slot = keyof typeof M;
  const parts: Partial<Record<Slot, Geo[]>> = {};
  const put = (slot: Slot, ...g: Geo[]) => {
    (parts[slot] ??= []).push(...g);
  };
  const quiet: Slot[] = ["tint", "shine", "amber", "red", "lamp", "daylight", "gauge", "tapeRed", "tapeWhite", "cabin", "liner"];
  const mesh = (geo: Geo, mat: THREE.Material, parent: THREE.Object3D = body, shadow = true) => {
    const m = new THREE.Mesh(keep(geo), mat);
    m.castShadow = shadow;
    m.receiveShadow = shadow;
    parent.add(m);
    return m;
  };
  const tilt = (g: Geo, px: number, py: number, deg: number) => {
    g.translate(-px, -py, 0);
    g.rotateZ((deg * Math.PI) / 180);
    g.translate(px, py, 0);
    return g;
  };
  /** Flat shape (x, y) laid on one side of the truck at |z|, facing out. */
  const onSide = (shape: THREE.Shape, z: number) => {
    const g = new THREE.ShapeGeometry(shape, 10);
    g.translate(0, 0, z);
    return g;
  };
  const rounded = (pts: V2[], r: number) => roundedPath(new THREE.Shape(), pts, r);
  /** A thin frame round an opening: the rubber a window sits in. */
  const seal = (pts: V2[], r: number, wide: number) => {
    const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
    const cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
    const grow = (k: number) => pts.map(([x, y]) => [x + Math.sign(x - cx) * k, y + Math.sign(y - cy) * k] as V2);
    const outer = rounded(grow(wide), r + wide);
    outer.holes = [roundedPath(new THREE.Path(), grow(-0.004), r)];
    return outer;
  };

  // ---- wheels --------------------------------------------------------------
  const tyreProfile: V2[] = [
    [0.292, -0.118], [0.33, -0.136], [0.4, -0.148], [0.455, -0.146], [0.492, -0.134], [0.511, -0.118], [0.52, -0.104],
    ...[-0.062, 0, 0.062].flatMap((a): V2[] => [[0.52, a - 0.012], [0.506, a - 0.009], [0.506, a + 0.009], [0.52, a + 0.012]]),
    [0.52, 0.104], [0.511, 0.118], [0.492, 0.134], [0.455, 0.146], [0.4, 0.148], [0.33, 0.136], [0.292, 0.118],
  ];
  const rimLip: V2[] = [[0.303, -0.12], [0.303, 0.128], [0.289, 0.134], [0.27, 0.118]];
  const circle = (n: number, r: number, fn: (x: number, y: number, i: number) => Geo) =>
    Array.from({ length: n }, (_, i) => fn(Math.cos((i / n) * Math.PI * 2) * r, Math.sin((i / n) * Math.PI * 2) * r, i));
  const O: V3 = [0, 0, 0];
  const wheelKinds = {
    // steer: the polished disc bows out to a hub with its cap
    steer: {
      tyre: keep(lathe(tyreProfile, "z", O, 56)),
      rim: keep(lathe([...rimLip, [0.26, 0.086], [0.243, 0.094], [0.215, 0.124], [0.19, 0.142], [0.16, 0.151], [0.118, 0.151], [0.093, 0.153], [0.09, 0.2], [0.08, 0.226], [0.05, 0.239], [0, 0.243]], "z", O, 48)),
      bright: keep(merged(circle(10, 0.143, (x, y) => merged([cyl(0.017, 0.05, "z", x, y, 0.172, 6), blob([x, y, 0.2], 0.015, 0.015, 0.012, 8)])))),
      dark: keep(merged([...circle(10, 0.213, (x, y) => blob([x, y, 0.127], 0.027, 0.027, 0.012, 10)), cyl(0.24, 0.16, "z", 0, 0, -0.02, 20)])),
    },
    // drive and trailer: a pair of tyres, the outer wheel dished in round the axle end
    dual: {
      tyre: keep(merged([lathe(tyreProfile, "z", [0, 0, 0.165], 56), lathe(tyreProfile, "z", [0, 0, -0.165], 56)])),
      rim: keep(lathe([...rimLip, [0.262, 0.08], [0.25, 0.03], [0.225, -0.02], [0.19, -0.045], [0.15, -0.052], [0.119, -0.052], [0.116, 0.07], [0.105, 0.086], [0.06, 0.094], [0, 0.097]], "z", [0, 0, 0.165], 48)),
      bright: keep(merged(circle(10, 0.146, (x, y) => merged([cyl(0.016, 0.045, "z", x, y, 0.165 - 0.03, 6), blob([x, y, 0.165 - 0.006], 0.014, 0.014, 0.011, 8)])))),
      dark: keep(merged([...circle(10, 0.222, (x, y) => blob([x, y, 0.165 - 0.018], 0.026, 0.026, 0.012, 10)), cyl(0.25, 0.3, "z", 0, 0, -0.02, 20)])),
    },
  };
  const wheels: { g: THREE.Group; dir: number }[] = [];
  const wheel = (kind: keyof typeof wheelKinds, x: number, z: number) => {
    const k = wheelKinds[kind];
    const g = new THREE.Group();
    g.position.set(x, R, z);
    if (z < 0) g.rotation.y = Math.PI;
    const tyre = new THREE.Mesh(k.tyre, M.tyre);
    tyre.castShadow = true;
    g.add(tyre, new THREE.Mesh(k.rim, M.polished), new THREE.Mesh(k.bright, M.chrome), new THREE.Mesh(k.dark, M.steel));
    truck.add(g);
    wheels.push({ g, dir: z < 0 ? -1 : 1 });
  };
  wheel("steer", 3.0, 1.02);
  wheel("steer", 3.0, -1.02);
  for (const x of [-2.9, -4.2, -16.5, -17.8]) {
    wheel("dual", x, 0.98);
    wheel("dual", x, -0.98);
  }
  // axles and differentials
  put("steel", ...[3.0, -2.9, -4.2, -16.5, -17.8].map((x) => cyl(0.075, 1.9, "z", x, R, 0, 12)), blob([-2.9, R, 0], 0.27, 0.25, 0.25), blob([-4.2, R, 0], 0.27, 0.25, 0.25));

  // ---- hood and fenders ----------------------------------------------------
  const hoodT = (x: number) => clamp01((x - 1.9) / 2.02);
  const hoodHalf = (x: number) => lerp(1.02, 0.64, hoodT(x));
  const hoodTop = (x: number) => 2.11 - 0.13 * Math.pow(hoodT(x), 1.5);
  put("paint", loft(Array.from({ length: 11 }, (_, k) => {
    const x = 1.9 + (1.96 * k) / 10;
    return ring(x, hoodHalf(x), 1.1, hoodTop(x), lerp(0.25, 0.17, k / 10), 0.02, 7);
  }), { capStart: true, capEnd: true }));

  // The fender is one skin swept round the wheel: out of the hood side, over a rounded shoulder,
  // down to a lip above the tyre. Its nose is cut off flat for the lamps and swept back at the corner.
  const fender = (() => {
    const across = new THREE.CatmullRomCurve3(([[0.64, 1.1], [0.9, 1.09], [1.1, 1.02], [1.22, 0.92], [1.27, 0.82], [1.275, 0.735], [1.215, 0.72]] as V2[]).map(([z, rho]) => new THREE.Vector3(z, rho, 0)), false, "centripetal").getSpacedPoints(20);
    const rows: THREE.Vector3[][] = [];
    for (let i = 0; i <= 48; i++) {
      const deg = lerp(-42, 190, i / 48);
      const phi = (deg * Math.PI) / 180;
      const swell = 1 + 0.36 * (1 - smooth(8, 72, deg)); // taller at the front, where the lamps sit
      rows.push(across.map((p) => {
        const rho = 0.735 + (p.y - 0.735) * swell;
        const nose = 3.93 - 0.36 * Math.pow(clamp01((p.x - 0.66) / 0.615), 2.2);
        const x = softMin(3.0 + rho * Math.cos(phi), nose, 0.12);
        const y = softMax(R + rho * Math.sin(phi), deg < 90 ? 0.6 : 0.47, 0.1);
        return new THREE.Vector3(x, y, p.x);
      }));
    }
    return loft(rows, { closed: false });
  })();
  put("blue", fender.clone(), mirrorZ(fender), box(3.78, 3.93, 0.86, 1.03, 1.36, 0, 0.03));
  put("liner", fender.clone(), mirrorZ(fender));
  fender.dispose();
  put("amber", ...both((s) => [blob([3.25, 1.34, s * 1.283], 0.05, 0.022, 0.012, 8)]));

  // ---- grille --------------------------------------------------------------
  {
    const lean = (g: Geo) => tilt(g, 3.96, 0.99, 3);
    const surround = rounded([[-0.7, 0.99], [0.7, 0.99], [0.655, 2.04], [-0.655, 2.04]], 0.08);
    surround.holes = [roundedPath(new THREE.Path(), [[-0.62, 1.05], [0.62, 1.05], [0.575, 1.87], [-0.575, 1.87]], 0.04)];
    const bars: Geo[] = [];
    for (let k = 0; k < 13; k++) {
      const y = 1.085 + k * 0.0605;
      bars.push(box(3.955, 4.005, y - 0.019, y + 0.019, 2 * lerp(0.62, 0.575, (y - 1.05) / 0.82) - 0.01, 0, 0.012));
    }
    const badge = new THREE.TorusGeometry(1, 0.12, 8, 36);
    badge.scale(0.15, 0.034, 0.05);
    badge.rotateY(Math.PI / 2);
    badge.translate(4.02, 1.955, 0);
    put("chrome", lean(onPlane(slab(surround, 0.11, 0.02), [3.96, 0, 0], [0, 0, -1], [0, 1, 0])), ...bars.map(lean), lean(badge), lean(blob([3.84, 2.07, 0], 0.1, 0.022, 0.022, 10)));
    put("mesh", lean(box(3.85, 3.92, 1.03, 1.89, 1.26, 0, 0.005)));
    put("trim", lean(blob([4.022, 1.955, 0], 0.012, 0.03, 0.14, 12)));
  }

  // ---- headlamps -----------------------------------------------------------
  {
    // built flat, then stood on the fender nose turned a little outward; the big lamp is outboard
    const pod = rounded(rect(0, 0, 0.52, 0.27), 0.135);
    const lamps: [number, number][] = [[-0.118, 0.103], [0.135, 0.078]];
    pod.holes = lamps.map(([x, r]) => new THREE.Path().absarc(x, 0, r, 0, Math.PI * 2, true));
    const place = (g: Geo) => onPlane(g, [3.875, 1.13, 0.985], [0.407, 0, -0.914], [0, 1, 0]);
    const bowls = lamps.map(([x, r]) => lathe([[r, 0], [r * 0.82, -0.03], [r * 0.45, -0.056], [0, -0.066]], "z", [x, 0, 0.02], 28));
    const chromeSide = merged([place(slab(pod, 0.07, 0.018)), ...bowls.map(place)]);
    const bulbs = merged(lamps.map(([x, r]) => place(blob([x, 0, -0.02], r * 0.34, r * 0.34, 0.02, 10))));
    const lenses = merged(lamps.map(([x, r]) => place(new THREE.CircleGeometry(r, 28).translate(x, 0, 0.03))));
    put("chrome", chromeSide.clone(), mirrorZ(chromeSide));
    put("lamp", bulbs.clone(), mirrorZ(bulbs));
    put("shine", lenses.clone(), mirrorZ(lenses));
    for (const g of [chromeSide, bulbs, lenses]) g.dispose();
  }

  // ---- bumper --------------------------------------------------------------
  {
    const face = (z: number) => 4.14 - 0.22 * Math.pow(Math.max(0, Math.abs(z) - 0.8) / 0.48, 2);
    const plan = new THREE.Shape();
    const zs = Array.from({ length: 33 }, (_, i) => lerp(-1.28, 1.28, i / 32));
    zs.forEach((z, i) => (i ? plan.lineTo(z, face(z)) : plan.moveTo(z, face(z))));
    [...zs].reverse().forEach((z) => plan.lineTo(z, face(z) - 0.09));
    plan.closePath();
    put("chrome", onPlane(slab(plan, 0.5, 0.016), [0, 0.68, 0], [0, 0, 1], [1, 0, 0]), box(4.141, 4.15, 0.69, 0.702, 0.78), box(4.141, 4.15, 0.73, 0.742, 0.78), box(4.141, 4.15, 0.77, 0.782, 0.78));
    put("trim", box(4.134, 4.144, 0.665, 0.805, 0.82, 0, 0.004));
    for (const s of [1, -1] as const) {
      const ringG = new THREE.TorusGeometry(0.05, 0.011, 8, 20).rotateY(Math.PI / 2 - s * 0.35).translate(face(1.02) + 0.004, 0.53, s * 1.02);
      put("chrome", ringG);
      put("daylight", blob([face(1.02) + 0.002, 0.53, s * 1.02], 0.008, 0.042, 0.042, 10));
    }
  }

  // ---- cab -----------------------------------------------------------------
  const B = 0.07;
  const half = CABW / 2;
  const A0: V2 = [1.95, 2.13]; // cowl, foot of the windshield
  const A1: V2 = [1.7, 2.99]; // head of the windshield
  const doorGlass: V2[] = [[0.74, 2.12], [1.74, 2.12], [1.52, 2.86], [0.74, 2.86]];
  {
    const cab = shell([[-1.3, 1.15], [1.93, 1.15], A0, A1, [-1.3, 2.99]], [roundedPath(new THREE.Path(), doorGlass, 0.06)], CABW, B);
    // the windshield wall comes out; a frame with two panes goes in its place
    const L = Math.hypot(A1[0] - A0[0], A1[1] - A0[1]);
    const dir: V2 = [(A1[0] - A0[0]) / L, (A1[1] - A0[1]) / L];
    const out: V3 = [dir[1], -dir[0], 0];
    const walls = dropTris(cab.walls, (a, b, c) =>
      [a, b, c].every((p) => {
        const t = (p.x - A0[0]) * dir[0] + (p.y - A0[1]) * dir[1];
        const d = Math.abs((p.x - A0[0]) * dir[1] - (p.y - A0[1]) * dir[0]);
        return d < 2e-3 && t > -2e-3 && t < L + 2e-3 && Math.abs(p.z) < half - B + 2e-3;
      }),
    );
    const w = half - B;
    const frame = new THREE.Shape([new THREE.Vector2(-w, 0), new THREE.Vector2(w, 0), new THREE.Vector2(w, L), new THREE.Vector2(-w, L)]);
    const panes = ([1, -1] as const).map((s): V2[] => rect(s * 0.535, L / 2, 0.99, L - 0.13));
    frame.holes = panes.map((p) => roundedPath(new THREE.Path(), p, 0.06));
    const lay = (g: Geo, lift = 0): Geo => onPlane(g, [A0[0] + out[0] * lift, A0[1] + out[1] * lift, 0], [0, 0, -1], [dir[0], dir[1], 0]);
    const body3 = merged([cab.lids, walls, lay(new THREE.ShapeGeometry(frame))]);
    put("paint", body3.clone());
    put("cabin", body3);
    const glass = merged([...panes.map((p) => lay(new THREE.ShapeGeometry(rounded(p, 0.06)), -0.012)), ...pair(onSide(rounded(doorGlass, 0.06), half - 0.012))]);
    put("tint", glass.clone());
    put("shine", glass);
    put("trim", ...panes.map((p) => lay(new THREE.ShapeGeometry(seal(p, 0.06, 0.016)), 0.002)), ...pair(onSide(seal(doorGlass, 0.06, 0.016), half + 0.002)));
    // wipers, parked
    put("trim", ...([1, -1] as const).flatMap((s) => [lay(box(s * 0.2 - 0.25, s * 0.2 + 0.25, 0.05, 0.062, 0.012, 0, 0.004).rotateZ(0.12 * s), 0.012)]));
  }

  // door seams, handle, grab bar, the bright sill with its markers
  put("trim", ...both((s) => [
    box(0.6, 0.612, 1.24, 2.925, 0.008, s * (half + 0.001), 0.002),
    box(0.6, 1.88, 1.24, 1.252, 0.008, s * (half + 0.001), 0.002),
    box(1.868, 1.88, 1.24, 2.1, 0.008, s * (half + 0.001), 0.002),
    strut([1.874, 2.1, s * (half + 0.001)], [1.672, 2.9, s * (half + 0.001)], 0.006, 4),
    box(0.6, 1.672, 2.905, 2.917, 0.008, s * (half + 0.001), 0.002),
  ]));
  put("chrome", ...both((s) => [
    box(0.69, 0.86, 1.93, 1.975, 0.03, s * (half + 0.014), 0.012),
    tube([[0.5, 1.55, s * (half + 0.004)], [0.5, 1.6, s * (half + 0.06)], [0.5, 2.62, s * (half + 0.06)], [0.5, 2.67, s * (half + 0.004)]], 0.016, 24, 8),
    box(-1.3, 1.93, 1.1, 1.165, 0.02, s * (half + 0.004), 0.008),
  ]));
  put("brushed", ...both((s) => [box(-1.3, 1.9, 1.0, 1.1, 0.03, s * (half - 0.02), 0.01)]));
  put("amber", ...both((s) => [-0.9, -0.1, 0.7, 1.5].map((x) => blob([x, 1.132, s * (half + 0.016)], 0.04, 0.02, 0.012, 8))));
  // privacy glass in the sleeper wall
  {
    const low = rect(0.05, 2.47, 0.26, 0.64);
    put("privacy", ...pair(onSide(rounded(low, 0.08), half + 0.004)));
    put("trim", ...pair(onSide(seal(low, 0.08, 0.018), half + 0.002)));
  }

  // raised roof: a fairing that climbs from the windshield head to full trailer height
  const roofH = (x: number) => 2.99 + (1 - Math.pow(1 - clamp01((1.76 - x) / 3.06), 2.4));
  put("paint", loft(Array.from({ length: 25 }, (_, k) => {
    const x = lerp(-1.3, 1.76, k / 24);
    const h = roofH(x);
    return ring(x, 1.135, 2.96, h, Math.min(0.3, (h - 2.96) * 0.92), 0, 7);
  }), { capStart: true, capEnd: true }));
  put("paint", ...both((s) => [box(-1.56, -1.3, 1.45, 3.93, 0.03, s * 1.15, 0.012)]));
  {
    // dark glass let into the roof slope, and a window high in each sleeper side
    const sx = 1.02;
    const slope = Math.atan((roofH(sx + 0.01) - roofH(sx - 0.01)) / 0.02);
    put("privacy", box(-0.09, 0.09, -0.004, 0.008, 0.92, 0, 0.004).rotateZ(slope).translate(sx, roofH(sx) + 0.002, 0));
    const high = rect(-0.62, 3.28, 0.5, 0.4);
    put("privacy", ...pair(onSide(rounded(high, 0.1), 1.139)));
    put("trim", ...pair(onSide(seal(high, 0.1, 0.018), 1.137)));
  }
  // bright visor with the five cab lights, and the smoked shade under it
  put("polished", box(1.66, 2.03, 2.97, 3.12, 2.38, 0, 0.06));
  put("trim", box(1.72, 2.05, 2.915, 2.94, 2.24, 0, 0.008));
  put("amber", ...[-0.92, -0.46, 0, 0.46, 0.92].map((z) => blob([2.034, 3.05, z], 0.022, 0.03, 0.05, 10)));

  // mirrors on the doors and out on the hood, and the two aerials
  put("chrome", ...both((s) => [
    tube([[1.8, 2.9, s * half], [1.84, 2.92, s * 1.4], [1.86, 2.86, s * 1.52], [1.86, 2.1, s * 1.52], [1.84, 2.04, s * 1.4], [1.8, 2.06, s * half]], 0.014, 40, 8),
    box(1.83, 1.93, 2.2, 2.76, 0.2, s * 1.56, 0.035),
    blob([1.875, 2.08, s * 1.585], 0.045, 0.07, 0.07, 12),
    box(3.36, 3.45, 2.12, 2.34, 0.25, s * 1.19, 0.04),
  ]));
  put("privacy", ...both((s) => [box(1.822, 1.832, 2.22, 2.74, 0.17, s * 1.56, 0.004), box(3.352, 3.362, 2.135, 2.325, 0.22, s * 1.19, 0.004)]));
  put("trim", ...both((s) => [tube([[3.3, 1.64, s * 0.92], [3.36, 1.9, s * 1.08], [3.4, 2.14, s * 1.17]], 0.022, 16, 8), strut([1.86, 2.76, s * 1.56], [1.8, 4.4, s * 1.56], 0.006, 5, 0.003)]));

  // stacks: chrome pipe through a perforated heat shield, tip turned back
  put("chrome", ...both((s) => [
    cyl(0.064, 3.05, "y", 0.3, 2.55, s * 1.275, 20),
    tube([[0.3, 4.05, s * 1.275], [0.29, 4.2, s * 1.275], [0.21, 4.31, s * 1.275], [0.08, 4.35, s * 1.275]], 0.064, 16, 14),
    cyl(0.106, 0.035, "y", 0.3, 1.52, s * 1.275, 20),
    cyl(0.106, 0.035, "y", 0.3, 2.98, s * 1.275, 20),
    box(0.26, 0.34, 2.0, 2.05, 0.12, s * 1.2, 0.01),
  ]));
  put("perforated", ...both((s) => [cyl(0.1, 1.44, "y", 0.3, 2.25, s * 1.275, 24)]));

  // hood-side intakes
  put("chrome", ...both((s) => {
    const z = hoodHalf(2.3) + 0.012;
    return [box(2.06, 2.56, 1.56, 1.9, 0.03, s * z, 0.05), ...Array.from({ length: 6 }, (_, k) => box(2.1, 2.52, 1.6 + k * 0.047, 1.622 + k * 0.047, 0.045, s * z, 0.008))];
  }));
  put("amber", ...both((s) => [blob([2.05, 1.73, s * (hoodHalf(2.05) + 0.02)], 0.02, 0.06, 0.012, 8)]));

  // ---- cab interior --------------------------------------------------------
  put("seat", box(1.52, 1.87, 1.95, 2.17, 2.0, 0, 0.05), box(0.5, 0.53, 1.2, 2.95, 2.16, 0, 0.01), strut([1.62, 2.06, -0.55], [1.4, 2.24, -0.55], 0.025, 8));
  for (const z of [-0.55, 0.55]) put("seat", box(0.82, 1.32, 1.6, 1.74, 0.5, z, 0.05), box(0.74, 0.88, 1.7, 2.5, 0.5, z, 0.06), box(0.75, 0.86, 2.52, 2.72, 0.26, z, 0.05));
  put("seat", new THREE.TorusGeometry(0.2, 0.018, 8, 28).rotateY(Math.PI / 2).rotateZ(-0.5).translate(1.38, 2.26, -0.55));
  put("gauge", box(1.5, 1.515, 2.06, 2.13, 0.38, -0.55, 0.004));

  // ---- chassis -------------------------------------------------------------
  put("steel", ...both((s) => [box(-5.08, 3.85, 0.8, 1.08, 0.09, s * 0.43, 0.012)]), ...[-4.9, -3.55, -2.0, 0.2, 2.2].map((x) => box(x - 0.05, x + 0.05, 0.84, 1.04, 0.86, 0, 0.01)));
  put("steel", cyl(0.5, 0.06, "y", -3.55, 1.15, 0, 30), box(-4.25, -3.75, 1.08, 1.16, 0.9, 0, 0.02), box(-3.2, -2.6, 1.08, 1.13, 0.7, 0, 0.02));
  // fuel tanks between two diamond-plate boxes, the running board under them
  put("polished", ...both((s) => [lathe([[0, -0.78], [0.26, -0.776], [0.312, -0.745], [0.32, -0.7], [0.32, 0.7], [0.312, 0.745], [0.26, 0.776], [0, 0.78]], "x", [0.33, 0.8, s * 0.97], 36)]));
  put("brushed", ...both((s) => [cyl(0.327, 0.06, "x", -0.12, 0.8, s * 0.97, 30), cyl(0.327, 0.06, "x", 0.78, 0.8, s * 0.97, 30), cyl(0.045, 0.05, "y", 0.92, 1.13, s * 0.97, 12)]));
  put("plate", ...both((s) => [box(1.2, 1.96, 0.5, 1.04, 0.5, s * 0.99, 0.03), box(-1.32, -0.52, 0.5, 1.04, 0.5, s * 0.99, 0.03), box(-1.36, 2.0, 0.4, 0.45, 0.36, s * 1.08, 0.01)]));
  put("blue", ...both((s) => [box(-1.36, 2.0, 0.335, 0.455, 0.03, s * 1.27, 0.01)]));
  // back of the tractor
  put("red", ...both((s) => [box(-5.11, -5.07, 0.86, 1.0, 0.34, s * 0.62, 0.01)]));
  put("rubber", ...both((s) => [box(-5.04, -5.01, 0.2, 0.98, 0.62, s * 0.98, 0.005), box(2.3, 2.33, 0.3, 0.7, 0.5, s * 1.0, 0.005)]));
  put("chrome", ...both((s) => [box(-5.045, -5.005, 0.2, 0.26, 0.62, s * 0.98, 0.008)]));
  // air and light lines coiled across to the trailer
  const hose = (z: number) => {
    const pts: V3[] = [];
    for (let k = 0; k <= 200; k++) {
      const t = k / 200;
      const a = 0.03 * smooth(0, 0.12, t) * (1 - smooth(0.88, 1, t));
      const ang = t * Math.PI * 2 * 12;
      pts.push([lerp(-1.32, -2.63, t), lerp(2.3, 1.98, t) - 0.26 * Math.sin(Math.PI * t) + a * Math.cos(ang), z + a * Math.sin(ang)]);
    }
    return tube(pts, 0.008, 200, 5);
  };
  put("hoseRed", hose(-0.12));
  put("hoseBlue", hose(0.12));
  put("trim", hose(0));

  // ---- trailer -------------------------------------------------------------
  put("steel", box(TX0, TX1, 1.2, TY0, TW, 0, 0.02));
  put("wood", box(TX0 + 0.05, TX1 - 0.05, TY0, TY0 + 0.035, TW - 0.12, 0, 0.005));
  {
    const under: Geo[] = [];
    for (let x = TX0 + 0.4; x < TX1 - 0.3; x += 0.31) under.push(box(x - 0.02, x + 0.02, 1.07, 1.2, TW - 0.1, 0, 0.004));
    put("steel", ...under);
  }
  put("steel",
    box(TX0 + 0.3, TX1 - 1.2, 1.02, 1.2, 0.9),
    // sliding bogie
    ...both((s) => [box(-18.5, -15.5, 0.94, 1.07, 0.12, s * 0.52, 0.01), box(-17.25, -17.05, 0.56, 0.96, 0.1, s * 0.52, 0.01), box(-16.25, -16.05, 0.56, 0.96, 0.1, s * 0.52, 0.01)]),
    ...both((s) => [-16.9, -18.2].map((x) => blob([x, 0.76, s * 0.52], 0.13, 0.15, 0.13, 10))),
    // landing gear
    ...both((s) => [box(-5.72, -5.58, 0.18, 1.2, 0.14, s * 0.84, 0.012), box(-5.84, -5.46, 0.1, 0.16, 0.3, s * 0.84, 0.012), strut([-5.65, 0.6, s * 0.84], [-4.85, 1.16, s * 0.84], 0.028, 8)]),
    strut([-5.65, 0.78, -0.84], [-5.65, 0.78, 0.84], 0.03, 8),
    strut([-5.65, 0.45, -0.84], [-5.65, 1.12, 0.84], 0.022, 8),
    strut([-5.65, 0.9, 0.84], [-5.65, 0.9, 1.16], 0.014, 6),
    // rear impact guard
    box(-18.87, -18.76, 0.5, 0.62, 2.44, 0, 0.018),
    ...both((s) => [box(-18.85, -18.77, 0.6, 1.2, 0.1, s * 0.72, 0.012), strut([-18.81, 0.62, s * 0.72], [-18.2, 1.15, s * 0.72], 0.025, 8)]),
    // rear sill
    box(TX0 - 0.035, TX0 + 0.06, 1.14, TY0 + 0.03, TW, 0, 0.01),
  );
  put("rubber", ...both((s) => [box(-18.44, -18.41, 0.2, 0.96, 0.62, s * 0.98, 0.005)]));
  // aero skirts, toed in at the front
  {
    const skirt = box(-15.4, -6.5, 0.42, 1.2, 0.035, 1.27, 0.01);
    const p = skirt.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) - 0.34 * smooth(-10.2, -6.5, p.getX(i)));
    skirt.computeVertexNormals();
    put("paint", ...pair(skirt));
  }
  // the frame that stays when the walls go clear: rails, corner posts, rounded nose corners, door frame
  {
    const frame: Geo[] = [];
    for (const s of [1, -1] as const) {
      frame.push(box(TX0, TX1, TY0, TY0 + 0.11, 0.05, s * (TW / 2), 0.012), box(TX0, TX1, TY1 - 0.11, TY1, 0.05, s * (TW / 2), 0.012));
      frame.push(box(TX0 - 0.03, TX0 + 0.07, TY0, TY1, 0.075, s * (TW / 2 - 0.02), 0.012));
      frame.push(cyl(0.085, TY1 - TY0, "y", TX1 - 0.07, (TY0 + TY1) / 2, s * (TW / 2 - 0.07), 16));
    }
    frame.push(box(TX0 - 0.03, TX0 + 0.07, TY1 - 0.15, TY1, TW, 0, 0.012), box(TX1 - 0.06, TX1, TY1 - 0.1, TY1, TW, 0, 0.012));
    put("brushed", ...frame);
  }
  const wallGeos: Geo[] = [];
  for (const s of [1, -1] as const) wallGeos.push(uvScale(box(TX0 + 0.05, TX1 - 0.12, TY0 + 0.1, TY1 - 0.1, 0.03, s * (TW / 2 - 0.02), 0.004), 13, 1));
  wallGeos.push(
    uvScale(box(TX0, TX1, TY1 - 0.04, TY1, TW - 0.06, 0, 0.004), 13, 2),
    uvScale(box(TX1 - 0.03, TX1, TY0 + 0.1, TY1 - 0.1, TW - 0.3, 0, 0.004), 2, 1),
    uvScale(box(TX0, TX0 + 0.03, TY0 + 0.1, TY1 - 0.15, TW - 0.12, 0, 0.004), 2, 1),
  );
  const walls = mesh(merged(wallGeos), M.shell);
  // door hardware fades with the doors it hangs on
  const doorSet: Geo[] = [];
  for (const z of [-0.97, -0.33, 0.33, 0.97]) {
    doorSet.push(cyl(0.018, 2.56, "y", TX0 - 0.03, 2.72, z, 8), box(TX0 - 0.06, TX0 - 0.02, 2.02, 2.07, 0.3, z + (z > 0 ? -0.12 : 0.12), 0.008));
    for (const y of [TY0 + 0.16, TY1 - 0.22]) doorSet.push(box(TX0 - 0.05, TX0 - 0.005, y - 0.04, y + 0.04, 0.08, z, 0.008));
  }
  for (const s of [1, -1] as const) for (let k = 0; k < 5; k++) doorSet.push(box(TX0 - 0.035, TX0 + 0.01, 1.7 + k * 0.52, 1.78 + k * 0.52, 0.11, s * (TW / 2 - 0.1), 0.008));
  doorSet.push(box(TX0 - 0.012, TX0 + 0.002, TY0 + 0.1, TY1 - 0.15, 0.02, 0, 0.003));
  mesh(merged(doorSet), hardware, body, false);
  // lamps: amber forward, red aft
  put("amber", ...both((s) => [...[0, 1, 2, 3, 4].map((i) => box(-4 - i * 3.5 - 0.06, -4 - i * 3.5 + 0.06, 1.235, 1.285, 0.03, s * (TW / 2 + 0.012), 0.008)), box(TX1 - 0.01, TX1 + 0.02, TY1 - 0.09, TY1 - 0.04, 0.12, s * 1.12, 0.01)]));
  put("red", ...both((s) => [box(TX0 - 0.045, TX0 - 0.02, 1.185, 1.295, 0.17, s * 0.99, 0.02), box(TX0 - 0.045, TX0 - 0.02, 1.185, 1.295, 0.17, s * 0.78, 0.02), box(TX0 + 0.3, TX0 + 0.42, TY1 - 0.09, TY1 - 0.04, 0.03, s * (TW / 2 + 0.012), 0.008)]), ...[-0.25, 0, 0.25].map((z) => box(TX0 - 0.04, TX0 - 0.02, TY1 - 0.105, TY1 - 0.045, 0.12, z, 0.01)));
  put("hoseRed", box(TX1, TX1 + 0.05, 1.86, 1.94, 0.07, -0.12, 0.01));
  put("hoseBlue", box(TX1, TX1 + 0.05, 1.86, 1.94, 0.07, 0.12, 0.01));
  // red and white conspicuity tape along the lower rail and across the guard
  {
    const redG: Geo[] = [];
    const whiteG: Geo[] = [];
    for (const s of [1, -1] as const) {
      let i = 0;
      for (let x = TX0 + 0.2; x < TX1 - 0.4; x += 0.28, i++) (i % 2 ? whiteG : redG).push(box(x, x + 0.28, TY0 + 0.026, TY0 + 0.084, 0.008, s * (TW / 2 + 0.028), 0.001));
    }
    for (let k = 0; k < 8; k++) (k % 2 ? whiteG : redG).push(box(-18.875, -18.868, 0.53, 0.59, 0.3, -1.05 + k * 0.3, 0.001));
    put("tapeRed", ...redG);
    put("tapeWhite", ...whiteG);
  }

  // ---- build the meshes ----------------------------------------------------
  for (const slot of Object.keys(parts) as Slot[]) {
    const m = mesh(merged(parts[slot]!), M[slot], body, !quiet.includes(slot));
    if (slot === "tint") m.renderOrder = 3;
    if (slot === "shine") m.renderOrder = 4;
  }

  // ---- lettering -----------------------------------------------------------
  const fading: THREE.Material[] = [hardware];
  const sticker = (map: THREE.Texture, fades = false) => {
    const m = std({ map, transparent: true, roughness: 0.45, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 });
    if (fades) fading.push(m);
    return m;
  };
  const lettered = (w: number, h: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) => {
    const t = keep(new THREE.CanvasTexture(canvas(w, h, draw)));
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  };
  const fitText = (ctx: CanvasRenderingContext2D, text: string, w: number, h: number, color: string, cy = h / 2, maxW = w * 0.96) => {
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // Chrome honours fontStretch on canvas; elsewhere the text is fitted by width alone.
    (ctx as unknown as { fontStretch: string }).fontStretch = "extra-condensed";
    let size = h * 0.9;
    ctx.font = `800 ${size}px ${o.fontFamily}`;
    const m = ctx.measureText(text).width;
    if (m > maxW) size *= maxW / m;
    ctx.font = `800 ${size}px ${o.fontFamily}`;
    ctx.fillText(text, w / 2, cy + size * 0.04);
  };
  /** A flat sticker on each side of the truck. `turn` swings it to follow a tapering panel. */
  const stick = (mat: THREE.Material, geo: Geo, x: number, y: number, z: number, turn = 0) => {
    keep(geo);
    for (const s of [1, -1] as const) {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, s * z);
      m.rotation.y = s === 1 ? turn : Math.PI - turn;
      m.renderOrder = 1;
      body.add(m);
    }
  };
  stick(sticker(lettered(2048, 200, (ctx, w, h) => fitText(ctx, "SHEHWAZ TRANSPORT INC.", w, h, "#1f33a8")), true), new THREE.PlaneGeometry(8.6, (8.6 * 200) / 2048), -10.6, 3.0, TW / 2 + 0.02);
  stick(sticker(lettered(256, 128, (ctx, w, h) => fitText(ctx, "878", w, h, "#2238b4"))), new THREE.PlaneGeometry(0.44, 0.22), 3.36, 1.8, hoodHalf(3.36) + 0.006, Math.atan(0.38 / 2.02));
  stick(sticker(lettered(96, 384, (ctx, w, h) => "8007".split("").forEach((d, i) => fitText(ctx, d, w, h / 4, "#2238b4", (i + 0.5) * (h / 4)))), true), new THREE.PlaneGeometry(0.17, 0.68), -3.12, 3.3, TW / 2 + 0.02);
  stick(
    sticker(lettered(512, 400, (ctx, w, h) => {
      ctx.strokeStyle = "#1c2f9c";
      ctx.lineWidth = 9;
      roundRect(ctx, 8, 8, w - 16, h - 16, 44);
      ctx.stroke();
      fitText(ctx, "SHEHWAZ", w, 120, "#2238b4", 105, w - 90);
      fitText(ctx, "TRANSPORT INC.", w, 84, "#2238b4", 205, w - 90);
      fitText(ctx, "WINDSOR, ON", w, 74, "#2238b4", 305, w - 90);
    })),
    new THREE.PlaneGeometry(0.42, 0.33), -0.62, 1.66, half + 0.004,
  );
  // number plate
  {
    const plate = new THREE.Mesh(keep(new THREE.PlaneGeometry(0.31, 0.155)), sticker(lettered(256, 128, (ctx, w, h) => {
      ctx.fillStyle = "#f4f5f7";
      roundRect(ctx, 0, 0, w, h, 10);
      ctx.fill();
      fitText(ctx, "ONTARIO", w, 26, "#2238b4", 18, w * 0.5);
      fitText(ctx, "SHEHWAZ", w, 78, "#1c2f9c", 76, w - 36);
    })));
    plate.rotation.y = Math.PI / 2;
    plate.position.set(4.146, 0.555, -0.02);
    plate.renderOrder = 1;
    body.add(plate);
  }
  new THREE.TextureLoader().load(o.logoUrl, (t) => {
    keep(t);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    stick(sticker(t), new THREE.CircleGeometry(0.3, 40), 1.2, 1.7, half + 0.004);
    o.onChange();
  });

  // ---- lamp glows ----------------------------------------------------------
  // A glow is a flat sprite, so it cannot be half hidden behind the cab without looking cut off.
  // Instead it ignores what is in front of it and dims by angle: full when the lamp faces the
  // camera, gone by the time the camera is side-on.
  const flares: { m: THREE.SpriteMaterial; x: number; z: number; face: 1 | -1; base: number; head: boolean }[] = [];
  const flare = (color: number, size: number, x: number, y: number, z: number, face: 1 | -1, base: number, head = false) => {
    const m = keep(new THREE.SpriteMaterial({ map: o.glow, color, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, transparent: true, opacity: 0 }));
    const s = new THREE.Sprite(m);
    s.scale.setScalar(size);
    s.position.set(x, y, z);
    s.renderOrder = 5;
    body.add(s);
    flares.push({ m, x, z, face, base, head });
  };
  for (const z of [1.07, -1.07]) flare(0xfff0c8, 1.25, 4.0, 1.13, z, 1, 0.22, true);
  for (const z of [0.86, -0.86]) flare(0xfff0c8, 0.6, 3.98, 1.13, z, 1, 0.22, true);
  for (const z of [0.99, -0.99, 0.78, -0.78]) flare(0xff2a10, 0.42, TX0 - 0.09, 1.24, z, -1, 0.45);
  for (const z of [-0.92, -0.46, 0, 0.46, 0.92]) flare(0xff9a00, 0.22, 2.07, 3.05, z, 1, 0.5);

  // ---- freight -------------------------------------------------------------
  const palletGeo = keep(merged([
    ...[-0.44, 0, 0.44].map((z) => new THREE.BoxGeometry(1.1, 0.09, 0.1).translate(0, 0, z)),
    ...Array.from({ length: 7 }, (_, i) => new THREE.BoxGeometry(0.11, 0.02, 0.98).translate(-0.495 + i * 0.165, 0.055, 0)),
    ...[-0.46, 0, 0.46].map((x) => new THREE.BoxGeometry(0.11, 0.02, 0.98).translate(x, -0.055, 0)),
  ]));
  const loadGeo = keep(new RoundedBoxGeometry(1.04, 1, 0.96, 2, 0.025));
  const nOthers = YOURS_FROM_ROW * 2;
  const nYours = (ROWS - YOURS_FROM_ROW) * 2;
  const inst = (geo: Geo, mat: THREE.Material, n: number) => {
    const m = new THREE.InstancedMesh(geo, mat, n);
    m.frustumCulled = false;
    body.add(m);
    return m;
  };
  const freight = {
    othersLoad: inst(loadGeo, cartonGhost, nOthers),
    othersBase: inst(palletGeo, palletGhost, nOthers),
    yoursLoad: inst(loadGeo, M.carton, nYours),
    yoursBase: inst(palletGeo, M.pallet, nYours),
  };
  // skids differ a little: kraft, white and shrink-wrapped grey
  const shades = [0xffffff, 0xf2e4cf, 0xe9eef5, 0xfff3de, 0xd9dde4];
  const tintOf = new THREE.Color();
  for (let id = 0; id < ROWS * 2; id++) {
    const yours = id >= nOthers;
    (yours ? freight.yoursLoad : freight.othersLoad).setColorAt(yours ? id - nOthers : id, tintOf.setHex(shades[Math.floor(hash(id * 7.3 + 2) * shades.length)]));
  }
  const mtx = new THREE.Matrix4();
  const vPos = new THREE.Vector3();
  const vScl = new THREE.Vector3();
  const qId = new THREE.Quaternion();
  let lastLoaded = -1;
  const setLoaded = (loaded: number) => {
    if (Math.abs(loaded - lastLoaded) < 0.0005) return;
    lastLoaded = loaded;
    for (let r = 0; r < ROWS; r++) {
      const q = clamp01(loaded * (ROWS + 3) - r);
      const e = 1 - Math.pow(1 - q, 3);
      for (let k = 0; k < 2; k++) {
        const id = r * 2 + k;
        const yours = r >= YOURS_FROM_ROW;
        const i = yours ? id - nOthers : id;
        const x = lerp(-21.5, -3.4 - r * 1.19, e);
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

  return {
    truck,
    body,
    wheels,
    setClear(clear) {
      M.shell.opacity = 1 - 0.9 * clear;
      M.shell.depthWrite = clear < 0.05;
      for (const m of fading) m.opacity = 1 - clear;
      const casts = clear < 0.5;
      const changed = walls.castShadow !== casts;
      walls.castShadow = casts;
      return changed;
    },
    setGhost(ghost) {
      cartonGhost.opacity = palletGhost.opacity = 1 - 0.87 * ghost;
      cartonGhost.depthWrite = palletGhost.depthWrite = ghost < 0.05;
    },
    setLoaded,
    setLamps(night, camX, camZ) {
      M.lamp.emissiveIntensity = 3 + 3 * night;
      for (const f of flares) {
        const dx = camX - (truck.position.x + f.x);
        const facing = (dx / Math.hypot(dx, camZ - f.z)) * f.face;
        f.m.opacity = f.base * (f.head ? night : 1) * smooth(0, 0.5, facing);
      }
    },
    dispose() {
      for (const d of made) d.dispose();
      for (const k of Object.values(wheelKinds)) for (const g of Object.values(k)) g.dispose();
    },
  };
}
