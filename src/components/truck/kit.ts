import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries, toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/*
 * Modelling kit for the truck: small functions that return plain geometry in
 * world units (metres, +x forward, +y up, +z the passenger side). Everything is
 * built in place and merged by material, so the whole rig is a few dozen draws.
 */

export type V2 = [number, number];
export type V3 = [number, number, number];
export type Geo = THREE.BufferGeometry;

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const hash = (n: number) => {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
};
/** Like Math.min, but rounds the corner where the two values meet. */
export const softMin = (a: number, b: number, k: number) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
};
export const softMax = (a: number, b: number, k: number) => -softMin(-a, -b, k);

// ---- solids ----------------------------------------------------------------

/** Box spanning x0..x1, y0..y1, centred on z with width w. */
export function box(x0: number, x1: number, y0: number, y1: number, w: number, z = 0, r = 0.03): Geo {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const g = new RoundedBoxGeometry(dx, dy, w, 2, Math.min(r, w / 2.01, dy / 2.01, dx / 2.01));
  g.translate((x0 + x1) / 2, (y0 + y1) / 2, z);
  return g;
}

/** Cylinder lying along an axis, centred on (x, y, z). */
export function cyl(r: number, len: number, axis: "x" | "y" | "z", x: number, y: number, z: number, seg = 24): Geo {
  const g = new THREE.CylinderGeometry(r, r, len, seg);
  if (axis === "x") g.rotateZ(Math.PI / 2);
  if (axis === "z") g.rotateX(Math.PI / 2);
  g.translate(x, y, z);
  return g;
}

/** Round bar from a to b; r at a, r2 at b. */
export function strut(a: V3, b: V3, r: number, seg = 10, r2 = r): Geo {
  const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const g = new THREE.CylinderGeometry(r2, r, d.length(), seg);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
  g.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
  return g;
}

/** Smooth pipe through points. */
export function tube(points: V3[], r: number, segments = 32, radial = 8): Geo {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  return new THREE.TubeGeometry(curve, segments, r, radial, false);
}

/**
 * Solid of revolution about an axis through `at`. The profile is [radius, distance along the axis];
 * run it counter-clockwise (radius to the right, axis up) and the surface faces out.
 */
export function lathe(profile: V2[], axis: "x" | "y" | "z", at: V3, seg = 40): Geo {
  const g = new THREE.LatheGeometry(profile.map(([r, a]) => new THREE.Vector2(Math.max(r, 1e-4), a)), seg);
  if (axis === "x") g.rotateZ(-Math.PI / 2);
  if (axis === "z") g.rotateX(Math.PI / 2);
  g.translate(...at);
  return g;
}

/** A sphere squashed to an ellipsoid. */
export function blob(at: V3, rx: number, ry: number, rz: number, seg = 14): Geo {
  const g = new THREE.SphereGeometry(1, seg, Math.max(6, seg >> 1));
  g.scale(rx, ry, rz);
  g.translate(...at);
  return g;
}

// ---- skins -----------------------------------------------------------------

/**
 * One cross-section of a rounded body at station x: a rounded rectangle in the y/z plane.
 * Runs up the +z side, across the top, down the -z side; loft() of these faces outward.
 */
export function ring(x: number, hw: number, y0: number, y1: number, rTop: number, rBottom = 0, n = 6): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  const rt = Math.max(0, Math.min(rTop, hw, (y1 - y0) / 2));
  const rb = Math.max(0, Math.min(rBottom, hw, (y1 - y0) / 2));
  const arc = (cz: number, cy: number, r: number, a0: number) => {
    for (let k = 0; k <= n; k++) {
      const a = a0 + (Math.PI / 2) * (k / n);
      pts.push(new THREE.Vector3(x, cy + r * Math.sin(a), cz + r * Math.cos(a)));
    }
  };
  arc(hw - rb, y0 + rb, rb, -Math.PI / 2);
  arc(hw - rt, y1 - rt, rt, 0);
  arc(-hw + rt, y1 - rt, rt, Math.PI / 2);
  arc(-hw + rb, y0 + rb, rb, Math.PI);
  return pts;
}

/** Skin stretched over a row of cross-sections. Smooth shaded; caps are closed flat. */
export function loft(rings: THREE.Vector3[][], o: { closed?: boolean; flip?: boolean; capStart?: boolean; capEnd?: boolean } = {}): Geo {
  const closed = o.closed ?? true;
  const n = rings[0].length;
  const m = rings.length;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  rings.forEach((r, i) =>
    r.forEach((p, j) => {
      pos.push(p.x, p.y, p.z);
      uv.push(j / (n - 1), i / (m - 1));
    }),
  );
  const cols = closed ? n : n - 1;
  for (let i = 0; i < m - 1; i++)
    for (let j = 0; j < cols; j++) {
      const a = i * n + j;
      const b = (i + 1) * n + j;
      const c = (i + 1) * n + ((j + 1) % n);
      const d = i * n + ((j + 1) % n);
      if (o.flip) idx.push(a, c, b, a, d, c);
      else idx.push(a, b, c, a, c, d);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const parts: Geo[] = [g];
  const cap = (r: THREE.Vector3[]) => {
    const c = r.reduce((s, p) => s.add(p), new THREE.Vector3()).multiplyScalar(1 / r.length);
    const p: number[] = [];
    // both windings: a cap is seen from one side only, and this saves working out which
    for (let j = 0; j < r.length; j++) {
      const a = r[j];
      const b = r[(j + 1) % r.length];
      p.push(c.x, c.y, c.z, a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z, b.x, b.y, b.z, a.x, a.y, a.z);
    }
    const cg = new THREE.BufferGeometry();
    cg.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
    cg.setAttribute("uv", new THREE.Float32BufferAttribute(new Array((p.length / 3) * 2).fill(0), 2));
    cg.computeVertexNormals();
    parts.push(cg);
  };
  if (o.capStart) cap(rings[0]);
  if (o.capEnd) cap(rings[m - 1]);
  return parts.length === 1 ? g : merged(parts);
}

/** Grow (d > 0) or shrink a simple polygon, keeping its edges parallel. */
export function offsetPoly(pts: V2[], d: number): V2[] {
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % pts.length];
    area += x0 * y1 - x1 * y0;
  }
  const sgn = area > 0 ? 1 : -1;
  return pts.map((p, i) => {
    const a = pts[(i - 1 + pts.length) % pts.length];
    const b = pts[(i + 1) % pts.length];
    const l1 = Math.hypot(p[0] - a[0], p[1] - a[1]) || 1;
    const l2 = Math.hypot(b[0] - p[0], b[1] - p[1]) || 1;
    const n1: V2 = [((p[1] - a[1]) / l1) * sgn, (-(p[0] - a[0]) / l1) * sgn];
    const n2: V2 = [((b[1] - p[1]) / l2) * sgn, (-(b[0] - p[0]) / l2) * sgn];
    let mx = n1[0] + n2[0];
    let my = n1[1] + n2[1];
    const ml = Math.hypot(mx, my) || 1;
    mx /= ml;
    my /= ml;
    const k = d / Math.max(0.35, mx * n1[0] + my * n1[1]);
    return [p[0] + mx * k, p[1] + my * k] as V2;
  });
}

/** Closed outline through pts with every corner rounded to r. */
export function roundedPath<T extends THREE.Path>(path: T, pts: V2[], r: number): T {
  pts.forEach((p, i) => {
    const a = pts[(i - 1 + pts.length) % pts.length];
    const b = pts[(i + 1) % pts.length];
    const d1 = Math.hypot(a[0] - p[0], a[1] - p[1]);
    const d2 = Math.hypot(b[0] - p[0], b[1] - p[1]);
    const rr = Math.min(r, d1 / 2, d2 / 2);
    const sx = p[0] + ((a[0] - p[0]) / d1) * rr;
    const sy = p[1] + ((a[1] - p[1]) / d1) * rr;
    if (i === 0) path.moveTo(sx, sy);
    else path.lineTo(sx, sy);
    path.quadraticCurveTo(p[0], p[1], p[0] + ((b[0] - p[0]) / d2) * rr, p[1] + ((b[1] - p[1]) / d2) * rr);
  });
  path.closePath();
  return path;
}

export const rect = (cx: number, cy: number, w: number, h: number): V2[] => [
  [cx - w / 2, cy - h / 2],
  [cx + w / 2, cy - h / 2],
  [cx + w / 2, cy + h / 2],
  [cx - w / 2, cy + h / 2],
];

function slice(g: THREE.ExtrudeGeometry, materialIndex: number): Geo {
  const out = new THREE.BufferGeometry();
  const groups = g.groups.filter((x) => x.materialIndex === materialIndex);
  for (const name of ["position", "normal", "uv"] as const) {
    const a = g.attributes[name];
    const arr: number[] = [];
    for (const gr of groups) for (let i = gr.start * a.itemSize; i < (gr.start + gr.count) * a.itemSize; i++) arr.push(a.array[i]);
    out.setAttribute(name, new THREE.Float32BufferAttribute(arr, a.itemSize));
  }
  g.dispose();
  return out;
}

/**
 * A hollow body from its side silhouette (x, y), `width` across, every outer edge rounded to
 * `bevel`. Returns the two flat sides (with any holes cut through them) apart from the band of
 * roof, ends and floor, so a wall can be swapped for something else.
 */
export function shell(outline: V2[], holes: THREE.Path[], width: number, bevel: number, o: { bevelSegments?: number; crease?: number } = {}) {
  const lidPts = bevel > 0 ? offsetPoly(outline, -bevel) : outline;
  const make = (withHoles: boolean) => {
    const s = new THREE.Shape(lidPts.map(([x, y]) => new THREE.Vector2(x, y)));
    if (withHoles) s.holes = holes;
    return new THREE.ExtrudeGeometry(s, {
      depth: width - 2 * bevel,
      bevelEnabled: bevel > 0,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelOffset: 0,
      bevelSegments: o.bevelSegments ?? 5,
      steps: 1,
      curveSegments: 10,
    });
  };
  const walls = slice(make(false), 1);
  const lids = slice(make(true), 0);
  for (const g of [walls, lids]) g.translate(0, 0, -(width / 2 - bevel));
  return { lids, walls: toCreasedNormals(walls, o.crease ?? 0.7) };
}

/** A solid slab from an outline, extruded and bevelled. Shape is in (x, y); thickness runs along z. */
export function slab(shape: THREE.Shape, depth: number, bevel = 0.01, crease = 0.6): Geo {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: depth - 2 * bevel,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: -bevel,
    bevelSegments: 3,
    steps: 1,
    curveSegments: 12,
  });
  g.translate(0, 0, -(depth / 2 - bevel));
  return toCreasedNormals(g, crease);
}

/** Remove the triangles a test picks out. */
export function dropTris(g: Geo, test: (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => boolean): Geo {
  const src = g.index ? g.toNonIndexed() : g;
  const p = src.attributes.position;
  const keep: number[] = [];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i);
    b.fromBufferAttribute(p, i + 1);
    c.fromBufferAttribute(p, i + 2);
    if (!test(a, b, c)) keep.push(i, i + 1, i + 2);
  }
  const out = new THREE.BufferGeometry();
  for (const name of Object.keys(src.attributes)) {
    const at = src.attributes[name];
    const arr = new Float32Array(keep.length * at.itemSize);
    keep.forEach((vi, k) => {
      for (let q = 0; q < at.itemSize; q++) arr[k * at.itemSize + q] = at.array[vi * at.itemSize + q];
    });
    out.setAttribute(name, new THREE.BufferAttribute(arr, at.itemSize));
  }
  return out;
}

// ---- placing ---------------------------------------------------------------

/** Mirror to the other side of the truck, keeping the faces pointing out. */
export function mirrorZ(g: Geo): Geo {
  const n = g.index ? g.toNonIndexed() : g.clone();
  const p = n.attributes.position;
  const nm = n.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    p.setZ(i, -p.getZ(i));
    if (nm) nm.setZ(i, -nm.getZ(i));
  }
  for (const at of Object.values(n.attributes)) {
    const arr = at.array as Float32Array;
    const k = at.itemSize;
    for (let i = 0; i + 2 < at.count; i += 3)
      for (let q = 0; q < k; q++) {
        const t = arr[(i + 1) * k + q];
        arr[(i + 1) * k + q] = arr[(i + 2) * k + q];
        arr[(i + 2) * k + q] = t;
      }
  }
  return n;
}

export const pair = (g: Geo): Geo[] => [g, mirrorZ(g)];
export const both = (fn: (s: 1 | -1) => Geo[]): Geo[] => [...fn(1), ...fn(-1)];

/** Place flat (u, v) geometry on a plane: origin, then where +u and +v point. Faces along u × v. */
export function onPlane(g: Geo, origin: V3, u: V3, v: V3): Geo {
  const U = new THREE.Vector3(...u).normalize();
  const V = new THREE.Vector3(...v).normalize();
  const N = new THREE.Vector3().crossVectors(U, V);
  g.applyMatrix4(new THREE.Matrix4().makeBasis(U, V, N).setPosition(...origin));
  return g;
}

export function moved(g: Geo, m: THREE.Matrix4): Geo {
  g.applyMatrix4(m);
  return g;
}

export function uvScale(g: Geo, su: number, sv: number): Geo {
  const uv = g.attributes.uv;
  if (uv) for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
  return g;
}

/** One geometry from many, keeping only what every part has: position, normal, uv. */
export function merged(geos: Geo[]): Geo {
  const flat = geos.map((g) => {
    const n = g.index ? g.toNonIndexed() : g;
    for (const name of Object.keys(n.attributes)) if (name !== "position" && name !== "normal" && name !== "uv") n.deleteAttribute(name);
    if (!n.attributes.normal) n.computeVertexNormals();
    if (!n.attributes.uv) n.setAttribute("uv", new THREE.Float32BufferAttribute(new Array(n.attributes.position.count * 2).fill(0), 2));
    return n;
  });
  const out = mergeGeometries(flat, false)!;
  for (const g of geos) g.dispose();
  for (const g of flat) g.dispose();
  return out;
}

// ---- surfaces made on a canvas ---------------------------------------------

/** ctx.roundRect, for browsers that predate it. */
export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function canvas(w: number, h: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  draw(cv.getContext("2d")!, w, h);
  return cv;
}

/** Tiling noise in 0..1, n by n: a few octaves of smoothed random lattice. */
export function noiseField(n: number, cells: number, octaves: number, seed: number): Float32Array {
  const out = new Float32Array(n * n);
  let amp = 1;
  let total = 0;
  for (let o = 0; o < octaves; o++) {
    const c = cells << o;
    const lat = new Float32Array(c * c);
    for (let i = 0; i < lat.length; i++) lat[i] = hash(i * 1.37 + seed * 91.7 + o * 13.1);
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const fx = (x / n) * c;
        const fy = (y / n) * c;
        const x0 = Math.floor(fx);
        const y0 = Math.floor(fy);
        const tx = fx - x0;
        const ty = fy - y0;
        const sx = tx * tx * (3 - 2 * tx);
        const sy = ty * ty * (3 - 2 * ty);
        const x1 = (x0 + 1) % c;
        const y1 = (y0 + 1) % c;
        const v = lerp(lerp(lat[y0 * c + x0], lat[y0 * c + x1], sx), lerp(lat[y1 * c + x0], lat[y1 * c + x1], sx), sy);
        out[y * n + x] += v * amp;
      }
    total += amp;
    amp *= 0.5;
  }
  for (let i = 0; i < out.length; i++) out[i] /= total;
  return out;
}

/** A tangent-space normal map from a tiling height field. */
export function normalsFrom(height: Float32Array, n: number, strength: number) {
  return canvas(n, n, (ctx) => {
    const img = ctx.createImageData(n, n);
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const l = height[y * n + ((x - 1 + n) % n)];
        const r = height[y * n + ((x + 1) % n)];
        const u = height[((y - 1 + n) % n) * n + x];
        const d = height[((y + 1) % n) * n + x];
        const nx = (l - r) * strength;
        const ny = (d - u) * strength;
        const k = 1 / Math.hypot(nx, ny, 1);
        const i = (y * n + x) * 4;
        img.data[i] = (nx * k * 0.5 + 0.5) * 255;
        img.data[i + 1] = (ny * k * 0.5 + 0.5) * 255;
        img.data[i + 2] = (k * 0.5 + 0.5) * 255;
        img.data[i + 3] = 255;
      }
    ctx.putImageData(img, 0, 0);
  });
}

/** Read a drawn canvas back as a height field (red channel). */
export function heightOf(cv: HTMLCanvasElement): Float32Array {
  const d = cv.getContext("2d")!.getImageData(0, 0, cv.width, cv.height).data;
  const out = new Float32Array(cv.width * cv.height);
  for (let i = 0; i < out.length; i++) out[i] = d[i * 4] / 255;
  return out;
}

export function texture(cv: HTMLCanvasElement, o: { srgb?: boolean; repeat?: V2; aniso?: number } = {}) {
  const t = new THREE.CanvasTexture(cv);
  if (o.srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (o.repeat) t.repeat.set(...o.repeat);
  t.anisotropy = o.aniso ?? 8;
  return t;
}
