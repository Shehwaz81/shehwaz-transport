import * as THREE from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { box, canvas, hash, lerp, merged, noiseField, normalsFrom, roundRect, smooth, texture } from "./kit";

/*
 * Everything round the truck: the light it sits in, the wet road under it,
 * the town on the horizon, and the lens the picture is taken through.
 */

/** How much the device can afford. Phones get the same picture with cheaper reflections. */
export type Tier = { dpr: number; msaa: number; shadow: number; mirror: number };

export function pickTier(width: number): Tier {
  const cores = navigator.hardwareConcurrency ?? 8;
  const small = width < 760;
  if (small || cores <= 4) return { dpr: Math.min(window.devicePixelRatio, small ? 1.6 : 1.25), msaa: 2, shadow: 2048, mirror: 0.4 };
  return { dpr: Math.min(window.devicePixelRatio, 2), msaa: 4, shadow: 4096, mirror: 0.75 };
}

/**
 * The surroundings the paint and chrome reflect: a night sky, long light boxes overhead and
 * down both sides (they draw the highlights along the bodywork), and sodium light on the horizon.
 */
export function makeEnvironment(renderer: THREE.WebGLRenderer) {
  const s = new THREE.Scene();
  const made: { dispose: () => void }[] = [];
  const lit = (r: number, g: number, b: number, side: THREE.Side = THREE.DoubleSide) => {
    const m = new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(r, g, b), side, toneMapped: false });
    made.push(m);
    return m;
  };
  const put = (geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0) => {
    made.push(geo);
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    s.add(m);
    return m;
  };

  // sky: near-black overhead, a little lighter and bluer toward the horizon, asphalt below
  const dome = new THREE.SphereGeometry(300, 48, 24);
  const col: number[] = [];
  const p = dome.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const h = p.getY(i) / 300;
    if (h < 0) {
      // the road, lighter near the horizon so chrome that faces it reads as metal, not as black
      const g = lerp(0.06, 0.012, Math.pow(-h, 0.5));
      col.push(g, g * 1.05, g * 1.25);
    }
    else {
      const t = Math.pow(h, 0.4);
      col.push(lerp(0.05, 0.006, t), lerp(0.08, 0.012, t), lerp(0.17, 0.035, t));
    }
  }
  dome.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  const skyMat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, toneMapped: false });
  made.push(skyMat);
  put(dome, skyMat);

  // the overhead box, long way down the truck
  put(new THREE.PlaneGeometry(70, 20), lit(6.8, 7.1, 7.6), 0, 44, -4).rotation.x = Math.PI / 2;
  // strips down each side, two heights
  for (const z of [48, -48]) {
    put(new THREE.PlaneGeometry(110, 3.2), lit(3.4, 3.8, 4.5), 0, 9, z);
    put(new THREE.PlaneGeometry(110, 1.4), lit(1.6, 1.9, 2.4), 0, 21, z);
  }
  // ahead and behind
  put(new THREE.PlaneGeometry(44, 5), lit(4.2, 4.4, 4.8), 50, 8, 0).rotation.y = Math.PI / 2;
  put(new THREE.PlaneGeometry(44, 3), lit(2.0, 2.5, 3.4), -50, 10, 0).rotation.y = Math.PI / 2;
  // sodium glow of the town, low all the way round
  put(new THREE.CylinderGeometry(140, 140, 5, 64, 1, true), lit(0.36, 0.17, 0.06, THREE.BackSide), 0, 1.5, 0);
  // the road ahead, lit by the truck's own headlamps
  put(new THREE.PlaneGeometry(70, 26), lit(0.75, 0.7, 0.58), 42, -3, 0).rotation.x = Math.PI / 2;
  // a few lamps for the chrome to catch
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.3;
    put(new THREE.SphereGeometry(0.9, 8, 6), lit(14, 9.5, 5), Math.cos(a) * 70, 11 + hash(i) * 5, Math.sin(a) * 70);
  }

  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(s, 0.015, 0.5, 600);
  pmrem.dispose();
  for (const d of made) d.dispose();
  return rt;
}

export type Road = {
  group: THREE.Group;
  /** metres the road has rolled back under the truck */
  roll: (travel: number) => void;
  /** 0 = open road, 1 = handed over to the bridge deck */
  setSpan: (span: number) => void;
  resize: (w: number, h: number) => void;
  dispose: () => void;
};

const TILE = 2.6; // metres of road one tile of fine grain covers
const PATCH = 38; // metres one tile of wet and dry covers
const DASH = 12;

/** Wet asphalt that mirrors the truck, lane paint, and the soft shadow that sits a vehicle on its road. */
export function makeRoad(truck: THREE.Object3D, tier: Tier): Road {
  const group = new THREE.Group();
  const made: { dispose: () => void }[] = [];
  const keep = <T extends { dispose: () => void }>(o: T) => {
    made.push(o);
    return o;
  };

  // fine grain: aggregate you can see up close
  const N = 512;
  const lumps = noiseField(N, 48, 3, 3);
  const grain = new Float32Array(N * N);
  for (let i = 0; i < grain.length; i++) grain[i] = lumps[i] * 0.72 + hash(i * 0.731 + 5) * 0.28;
  const albedo = canvas(N, N, (ctx) => {
    const img = ctx.createImageData(N, N);
    for (let i = 0; i < N * N; i++) {
      const stone = hash(i * 1.917 + 11) > 0.93 ? 16 : 0;
      const v = 13 + grain[i] * 15 + stone;
      img.data[i * 4] = v * 0.86;
      img.data[i * 4 + 1] = v * 0.95;
      img.data[i * 4 + 2] = v * 1.2;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  });
  // wet and dry: standing water where the surface dips
  const M = 256;
  const dips = noiseField(M, 4, 4, 9);
  const wetness = canvas(M, M, (ctx) => {
    const img = ctx.createImageData(M, M);
    for (let i = 0; i < M * M; i++) {
      const wet = smooth(0.36, 0.72, dips[i]);
      const v = lerp(0.52, 0.09, wet) * 255;
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  });

  const SIZE = 720;
  const map = keep(texture(albedo, { srgb: true, repeat: [SIZE / TILE, SIZE / TILE], aniso: 16 }));
  const normalMap = keep(texture(normalsFrom(grain, N, 2.4), { repeat: [SIZE / TILE, SIZE / TILE], aniso: 16 }));
  const roughnessMap = keep(texture(wetness, { repeat: [SIZE / PATCH, SIZE / PATCH], aniso: 4 }));

  // specular turned well down: lamps should glint off the water, not light the whole road like frost
  const mat = keep(new THREE.MeshPhysicalMaterial({ map, normalMap, roughnessMap, roughness: 1, metalness: 0, envMapIntensity: 0.06, specularIntensity: 0.2 }));
  mat.normalScale.set(0.4, 0.4);

  // The mirror: three's Reflector draws the scene upside down into a texture each frame. It is
  // kept in the scene but writes nothing itself; the asphalt reads its texture and decides,
  // from how wet each spot is, how much of the truck shows in it and how sharp.
  let mirror: Reflector | null = null;
  const uniforms = {
    tMirror: { value: null as THREE.Texture | null },
    uMirror: { value: new THREE.Matrix4() },
    uMirrorOn: { value: 0 },
  };
  if (tier.mirror > 0) {
    mirror = new Reflector(keep(new THREE.PlaneGeometry(SIZE, SIZE)), { textureWidth: 512, textureHeight: 256, multisample: 0, clipBias: 0.002 });
    mirror.rotation.x = -Math.PI / 2;
    mirror.renderOrder = -10; // before the asphalt, so its texture is this frame's
    const mm = mirror.material as THREE.ShaderMaterial;
    mm.colorWrite = false;
    mm.depthWrite = false;
    const rt = mirror.getRenderTarget();
    rt.texture.generateMipmaps = true;
    rt.texture.minFilter = THREE.LinearMipmapLinearFilter;
    uniforms.tMirror.value = rt.texture;
    uniforms.uMirror.value = mm.uniforms.textureMatrix.value;
    uniforms.uMirrorOn.value = 1;
    group.add(mirror);
  }
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nuniform mat4 uMirror;\nvarying vec4 vMirror;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvMirror = uMirror * vec4( transformed, 1.0 );");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform sampler2D tMirror;\nuniform float uMirrorOn;\nvarying vec4 vMirror;")
      // standing water lies flat whatever the stones under it do
      .replace("#include <normal_fragment_maps>", "#include <normal_fragment_maps>\nfloat wet = 1.0 - roughnessFactor;\nnormal = normalize( mix( normal, nonPerturbedNormal, wet * wet ) );")
      .replace(
        "#include <opaque_fragment>",
        `{
          vec2 muv = vMirror.xy / vMirror.w;
          vec3 bump = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
          muv += bump.xy * 0.012 * ( 1.0 - wet );
          vec3 mir = texture2D( tMirror, muv, 0.6 + ( 1.0 - wet ) * 2.8 ).rgb;
          float fres = pow( 1.0 - saturate( dot( normalize( vViewPosition ), normal ) ), 3.0 );
          outgoingLight += mir * uMirrorOn * mix( 0.04, 0.8, fres ) * ( 0.1 + 0.9 * wet * wet );
        }
        #include <opaque_fragment>`,
      );
  };

  const ground = new THREE.Mesh(keep(new THREE.PlaneGeometry(SIZE, SIZE)), mat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  // lane paint, a little worn
  const paint = keep(new THREE.MeshStandardMaterial({ color: 0xb9bfcc, roughness: 0.55, envMapIntensity: 0.4 }));
  const dashGeos: THREE.BufferGeometry[] = [];
  for (let k = -12; k <= 12; k++) for (const z of [1.95, -1.95]) dashGeos.push(box(k * DASH, k * DASH + 3, 0.002, 0.008, 0.12, z, 0.001));
  const dashes = new THREE.Mesh(keep(merged(dashGeos)), paint);
  dashes.receiveShadow = true;
  const edges = new THREE.Mesh(keep(merged([5.7, -5.7].map((z) => box(-180, 180, 0.002, 0.008, 0.12, z, 0.001)))), paint);
  edges.receiveShadow = true;
  group.add(dashes, edges);

  // The dark under a vehicle that no single lamp explains: soft all round, deepest by the tyres.
  const shade = keep(
    texture(
      canvas(512, 128, (ctx, w, h) => {
        // Soft edges come from the canvas's own drop shadow: the shapes are drawn off to the
        // left and only their blurred shadows land in the picture. (ctx.filter is not in Safari.)
        ctx.fillStyle = "#000";
        ctx.shadowOffsetX = w * 2;
        ctx.shadowColor = "rgba(0,0,0,0.78)";
        ctx.shadowBlur = 20;
        roundRect(ctx, w * 0.04 - w * 2, h * 0.24, w * 0.91, h * 0.52, h * 0.2);
        ctx.fill();
        ctx.shadowColor = "rgba(0,0,0,0.9)";
        ctx.shadowBlur = 9;
        // x of each axle group across the 25.4 m the texture spans, front of the truck on the right
        for (const x of [0.9, 0.669, 0.618, 0.134, 0.083])
          for (const y of [0.27, 0.73]) {
            ctx.beginPath();
            ctx.ellipse(w * x - w * 2, h * y, w * 0.024, h * 0.1, 0, 0, Math.PI * 2);
            ctx.fill();
          }
      }),
    ),
  );
  shade.wrapS = shade.wrapT = THREE.ClampToEdgeWrapping;
  const shadow = new THREE.Mesh(keep(new THREE.PlaneGeometry(25.4, 4.6)), keep(new THREE.MeshBasicMaterial({ map: shade, transparent: true, depthWrite: false, toneMapped: false })));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(-7.2, 0.012, 0);
  shadow.renderOrder = 2;
  truck.add(shadow);

  if (mirror) {
    // the mirror image must not contain the road itself
    const draw = mirror.onBeforeRender;
    mirror.onBeforeRender = function (...args) {
      ground.visible = dashes.visible = edges.visible = shadow.visible = false;
      draw.apply(this, args);
      ground.visible = dashes.visible = edges.visible = shadow.visible = true;
    };
  }

  let offset = 0;
  return {
    group,
    roll(travel) {
      offset += travel;
      map.offset.x = normalMap.offset.x = (offset / TILE) % 1;
      roughnessMap.offset.x = (offset / PATCH) % 1;
      dashes.position.x = -(offset % DASH);
    },
    setSpan(span) {
      const on = span < 0.999;
      ground.visible = dashes.visible = edges.visible = on;
      if (mirror) mirror.visible = on;
      mat.transparent = paint.transparent = span > 0.001;
      mat.opacity = paint.opacity = 1 - span;
    },
    resize(w, h) {
      mirror?.getRenderTarget().setSize(Math.max(64, Math.round(w * tier.mirror)), Math.max(64, Math.round(h * tier.mirror)));
    },
    dispose() {
      for (const d of made) d.dispose();
      mirror?.dispose();
    },
  };
}

/** The town: lamps strung along the horizon, far enough off to blur into dots. They stream past at speed. */
export function makeTown(glow: THREE.Texture) {
  const N = 300;
  const SPAN = 380;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    // two bands, one each side of the road, thicker in places
    const side = i % 2 ? 1 : -1;
    const along = (hash(i * 3.1) * 2 - 1) * SPAN;
    const cluster = 0.35 + 0.65 * smooth(0.35, 0.75, hash(Math.floor(along / 60) * 7.7 + side));
    pos[i * 3] = along;
    pos[i * 3 + 1] = 1.5 + Math.pow(hash(i * 5.3), 2.2) * 22 * cluster;
    pos[i * 3 + 2] = side * (120 + hash(i * 9.7) * 170);
    const kind = hash(i * 2.3);
    const lum = (0.35 + hash(i * 6.1) * 0.65) * cluster;
    const c = kind < 0.68 ? [1, 0.6, 0.26] : kind < 0.9 ? [0.8, 0.88, 1] : [1, 0.16, 0.1];
    col[i * 3] = c[0] * lum;
    col[i * 3 + 1] = c[1] * lum;
    col[i * 3 + 2] = c[2] * lum;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({ map: glow, size: 5.5, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return {
    points,
    mat,
    roll(travel: number) {
      for (let i = 0; i < N; i++) {
        let x = pos[i * 3] - travel;
        if (x < -SPAN) x += SPAN * 2;
        pos[i * 3] = x;
      }
      geo.attributes.position.needsUpdate = true;
    },
    dispose() {
      geo.dispose();
      mat.dispose();
    },
  };
}

/** The lens: lamps and hot reflections bloom a little, then the picture is graded for the screen. */
export function makeLens(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, tier: Tier) {
  const target = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: tier.msaa });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.22, 0.5, 2.8);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  return {
    render: () => composer.render(),
    /** 1 = close work. A lamp's halo is a fixed size on screen, so it is turned down as the truck gets small. */
    setGlow(k: number) {
      bloom.strength = 0.22 * k;
    },
    resize(w: number, h: number) {
      composer.setPixelRatio(tier.dpr);
      composer.setSize(w, h);
    },
    dispose() {
      composer.dispose();
      target.dispose();
    },
  };
}
