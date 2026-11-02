"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { BEDIStatus } from "@/lib/bediEngine";
import type { DoshaKey } from "@/lib/ktMapping";
import {
  BORDER_SEGMENTS,
  HEX_RADIUS,
  LATTICE,
  WORLD_SIZE,
  ZONES,
  baryWeights,
  displaceForDeviation,
  fromWorld,
  toWorld,
  type Point2,
} from "@/lib/bediField";

export interface FieldHistoryPoint {
  label: string;
  deviation: number;
  status: BEDIStatus;
}

export interface FieldLabels {
  pin: string;
  now: string;
  aria: string;
  viewTop: string;
  viewSide: string;
  hint: string;
  zoneNames: Record<DoshaKey, string>;
}

export interface BediFieldSceneProps {
  doshaKey: DoshaKey;
  deviation: number;
  status: BEDIStatus;
  /** Earlier measurements, oldest first, without the current one. */
  history: FieldHistoryPoint[];
  labels: FieldLabels;
  /** Called once when WebGL cannot start; the caller shows a fallback. */
  onUnsupported: () => void;
}

// Same hues as DoshaRadar so the two charts read as one family.
const ZONE_HUE: Record<"H" | "S" | "B" | "T", string> = { H: "#00626b", S: "#c96a12", B: "#4b596e", T: "#059669" };
const STATUS_HUE: Record<BEDIStatus, string> = { khii_excess: "#00626b", balanced: "#059669", shar_badgan_excess: "#b45309" };
const zoneHue = (key: DoshaKey) =>
  key === "Tentsveertei" ? ZONE_HUE.T : key.startsWith("Khii") ? ZONE_HUE.H : key.startsWith("Shar") ? ZONE_HUE.S : ZONE_HUE.B;
const zoneOpacity = (key: DoshaKey) =>
  key === "Tentsveertei" ? 0.3 : key === "Khii" || key === "Shar" || key === "Badgan" ? 0.46 : 0.24;

const TEX = 1024;
const PLANE = 7.6;
const SEG = 48;
const DEPTH = 0.95;
const PITCH_MIN = 0.08, PITCH_MAX = 1.5, DIST_MIN = 6, DIST_MAX = 16;
const DIST_DEFAULT = 9.6, PITCH_DEFAULT = 0.58;
/** Seen from above the triangle is taller than wide, so the camera backs off as the pitch rises. */
const fitFactor = (pitch: number) => 1 + 0.4 * (pitch / PITCH_MAX);

type Scene = {
  apply: (p: BediFieldSceneProps) => void;
  setView: (pitch: number, dist: number) => void;
  dispose: () => void;
};

function cssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/** Builds the three.js scene inside `box`; returns handles or null when WebGL is unavailable. */
function createScene(box: HTMLDivElement, host: HTMLDivElement, tagLayer: HTMLDivElement): Scene | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.append(renderer.domElement);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const ink = cssVar("--on-surface", "#132428");
  const muted = cssVar("--on-surface-variant", "#52626a");
  const card = cssVar("--surface-container-lowest", "#ffffff");
  const faint = cssVar("--outline", "#7f8e94");

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 0.9));
  const sun = new THREE.DirectionalLight(0xffffff, 0.65);
  sun.position.set(3, 7, 4);
  scene.add(sun);
  const world = new THREE.Group();
  scene.add(world);

  // ── The field: a lit plane with a painted zone texture that sinks toward the excess corner ──
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = TEX;
  const ctx = canvas.getContext("2d")!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const faceMat = new THREE.MeshStandardMaterial({
    map: texture, emissive: 0xffffff, emissiveMap: texture, emissiveIntensity: 0.5,
    transparent: true, roughness: 0.9, metalness: 0, side: THREE.DoubleSide,
  });
  const faceGeo = new THREE.PlaneGeometry(PLANE, PLANE, SEG, SEG);
  const face = new THREE.Mesh(faceGeo, faceMat);
  face.rotation.x = -Math.PI / 2;
  world.add(face);
  const K2W = WORLD_SIZE / 300; // field units → world units (see bediField.ts)
  const kTex = TEX / PLANE;     // world units → texture px
  const t2 = (x: number, y: number): Point2 => {
    const [wx, wz] = toWorld(x, y);
    return [TEX / 2 + wx * kTex, TEX / 2 + wz * kTex];
  };

  const depthI = { H: 0, S: 0, B: 0 };
  const surfaceY = (wx: number, wz: number) => {
    const [h, s, b] = baryWeights(fromWorld(wx, wz));
    return -DEPTH * (depthI.H * h * h + depthI.S * s * s + depthI.B * b * b);
  };
  function deform() {
    const pos = faceGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setZ(i, surfaceY(pos.getX(i), -pos.getY(i)));
    pos.needsUpdate = true;
    faceGeo.computeVertexNormals();
  }

  // Zones that matter to this person keep full colour and a bold name; the rest fade to context.
  type Level = 0 | 1 | 2;
  let faceState: { level: Record<string, Level>; constKey: DoshaKey; curKey: DoshaKey; statusColor: string; names: Record<DoshaKey, string> } | null = null;
  let paintedYaw: number | null = null;
  function paintFace() {
    if (!faceState) return;
    const { level, constKey, curKey, statusColor, names } = faceState;
    ctx.clearRect(0, 0, TEX, TEX);
    const k = K2W * kTex;
    for (const p of LATTICE) {
      const [cx, cy] = t2(p.x, p.y);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = Math.PI / 6 + (i * Math.PI) / 3;
        const px = cx + HEX_RADIUS * k * Math.cos(a), py = cy + HEX_RADIUS * k * Math.sin(a);
        if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
      }
      ctx.closePath();
      const zo = zoneOpacity(p.key), lv = level[p.key] ?? 0;
      ctx.globalAlpha = lv === 2 ? Math.min(0.88, zo + 0.38) : lv === 1 ? Math.min(0.7, zo + 0.14) : zo * 0.3;
      ctx.fillStyle = zoneHue(p.key);
      ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.strokeStyle = card; ctx.lineWidth = 3;
    for (const s of BORDER_SEGMENTS) {
      const [x1, y1] = t2(s.x1, s.y1), [x2, y2] = t2(s.x2, s.y2);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    const outline = (zone: DoshaKey, color: string, width: number) => {
      ctx.strokeStyle = color; ctx.lineWidth = width;
      for (const s of BORDER_SEGMENTS) {
        if (s.a !== zone && s.b !== zone) continue;
        const [x1, y1] = t2(s.x1, s.y1), [x2, y2] = t2(s.x2, s.y2);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }
    };
    outline(constKey, ink, 7);
    if (curKey !== constKey) outline(curKey, statusColor, 7);
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const ORIENT: DoshaKey[] = ["Khii", "Shar", "Badgan", "Tentsveertei"];
    for (const [key, z] of Object.entries(ZONES) as [DoshaKey, (typeof ZONES)[DoshaKey]][]) {
      const lv = level[key] ?? 0;
      if (lv === 0 && !ORIENT.includes(key)) continue; // faint zones stay unlabelled: less clutter
      const size = (lv === 2 ? 17 : lv === 1 ? 14 : 12) * k, lh = size * 1.1;
      ctx.font = `${lv === 2 ? 700 : lv === 1 ? 600 : 500} ${size}px Inter, "Segoe UI", system-ui, sans-serif`;
      ctx.strokeStyle = card; ctx.lineWidth = size * 0.3;
      ctx.fillStyle = lv === 2 ? ink : muted;
      const [cx, cy] = t2(z.centre[0], z.centre[1]);
      const parts = names[key].split("-");
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(-yaw);
      parts.forEach((part, i) => {
        const text = i < parts.length - 1 ? part + "-" : part;
        const yy = (i - (parts.length - 1) / 2) * lh;
        ctx.strokeText(text, 0, yy); ctx.fillText(text, 0, yy);
      });
      ctx.restore();
    }
    texture.needsUpdate = true;
    paintedYaw = yaw;
  }

  // ── Markers: the constitution pin, the current ball, the arc, the trail ──
  const inkMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(ink), roughness: 0.45, metalness: 0.15 });
  const pinG = new THREE.Group(); world.add(pinG);
  const pinRing = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 8, 48), inkMat); pinRing.rotation.x = Math.PI / 2; pinRing.position.y = 0.03; pinG.add(pinRing);
  const pinStem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.42, 8), inkMat); pinStem.position.y = 0.21; pinG.add(pinStem);
  const pinHead = new THREE.Mesh(new THREE.SphereGeometry(0.085, 20, 14), inkMat); pinHead.position.y = 0.44; pinG.add(pinHead);
  const curMat = new THREE.MeshStandardMaterial({ roughness: 0.3, metalness: 0.05, emissiveIntensity: 0.25 });
  const curBall = new THREE.Mesh(new THREE.SphereGeometry(0.17, 28, 20), curMat); world.add(curBall);
  const curShadow = new THREE.Mesh(new THREE.CircleGeometry(0.2, 32), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18, depthWrite: false }));
  curShadow.rotation.x = -Math.PI / 2; world.add(curShadow);
  const arcMat = new THREE.MeshStandardMaterial({ roughness: 0.4 });
  let arcMesh: THREE.Mesh | null = null, arcCurve: THREE.QuadraticBezierCurve3 | null = null;
  const bead = new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(card) })); world.add(bead);
  const trailLineMat = new THREE.LineBasicMaterial({ color: new THREE.Color(faint), transparent: true, opacity: 0.8 });
  const trail: { mesh: THREE.Mesh; tag: HTMLSpanElement }[] = [];
  let trailLine: THREE.Line | null = null;

  const makeTag = (cls: string) => {
    const tag = document.createElement("span");
    tag.className = `bedi-tag ${cls}`;
    tag.setAttribute("aria-hidden", "true");
    tagLayer.append(tag);
    return tag;
  };
  const pinTag = makeTag("bedi-tag-quiet bedi-tag-pin");
  const curTag = makeTag("bedi-tag-cur");

  // ── Orbit: drag turns and tilts, wheel zooms, arrows for keyboards ──
  let yaw = 0.22, yawTarget = 0.22, pitch = PITCH_DEFAULT, pitchTarget = PITCH_DEFAULT, dist = DIST_DEFAULT, distTarget = DIST_DEFAULT;
  let dragging = false, lastX = 0, lastY = 0, visible = true, disposed = false;
  const clampPitch = (p: number) => Math.max(PITCH_MIN, Math.min(PITCH_MAX, p));
  const clampDist = (d: number) => Math.max(DIST_MIN, Math.min(DIST_MAX, d));
  const onDown = (e: PointerEvent) => {
    dragging = true; lastX = e.clientX; lastY = e.clientY; box.setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    if (!dragging) return;
    yawTarget += (e.clientX - lastX) * 0.008;
    pitchTarget = clampPitch(pitchTarget + (e.clientY - lastY) * 0.006);
    lastX = e.clientX; lastY = e.clientY;
  };
  const onUp = () => { dragging = false; };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") yawTarget -= 0.25;
    else if (e.key === "ArrowRight") yawTarget += 0.25;
    else if (e.key === "ArrowUp") pitchTarget = clampPitch(pitchTarget + 0.12);
    else if (e.key === "ArrowDown") pitchTarget = clampPitch(pitchTarget - 0.12);
    else if (e.key === "+" || e.key === "=") distTarget = clampDist(distTarget - 1);
    else if (e.key === "-") distTarget = clampDist(distTarget + 1);
    else return;
    e.preventDefault();
  };
  box.addEventListener("pointerdown", onDown);
  box.addEventListener("pointermove", onMove);
  box.addEventListener("pointerup", onUp);
  box.addEventListener("pointercancel", onUp);
  box.addEventListener("keydown", onKey);

  function resize() {
    const w = box.clientWidth, h = box.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h);
    box.classList.toggle("bedi-compact", w < 360);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(box);
  resize();
  const io = new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; });
  io.observe(box);

  const v = new THREE.Vector3();
  function placeTag(tag: HTMLSpanElement, x: number, y: number, z: number) {
    v.set(x, y, z).project(camera);
    const half = tag.offsetWidth / 2 + 4;
    const left = Math.min(box.clientWidth - half, Math.max(half, ((v.x + 1) / 2) * box.clientWidth));
    tag.style.left = `${left}px`;
    tag.style.top = `${((1 - v.y) / 2) * box.clientHeight}px`;
  }
  const t0 = performance.now();
  let raf = 0;
  function frame(now: number) {
    if (disposed) return;
    raf = requestAnimationFrame(frame);
    if (!visible) return;
    const instant = reduceMotion.matches;
    const ease = instant ? 1 : 0.14;
    yaw += (yawTarget - yaw) * ease;
    pitch += (pitchTarget - pitch) * ease;
    dist += (distTarget - dist) * ease;
    const d = dist * fitFactor(pitch);
    camera.position.set(Math.sin(yaw) * Math.cos(pitch) * d, Math.sin(pitch) * d, Math.cos(yaw) * Math.cos(pitch) * d);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0.1, 0);
    if (faceState && (paintedYaw === null || Math.abs(yaw - paintedYaw) > 0.07)) paintFace();
    if (arcCurve) {
      const t = instant ? 0.72 : ((now - t0) % 2600) / 2600;
      bead.position.copy(arcCurve.getPoint(t));
    }
    placeTag(pinTag, pinG.position.x, pinG.position.y + 0.72, pinG.position.z);
    if (curBall.visible) placeTag(curTag, curBall.position.x, curBall.position.y + 0.42, curBall.position.z);
    else placeTag(curTag, pinG.position.x, pinG.position.y + 0.3, pinG.position.z);
    trail.forEach((t, i) => placeTag(t.tag, t.mesh.position.x, t.mesh.position.y + 0.24 + (i % 2) * 0.24, t.mesh.position.z));
    renderer.render(scene, camera);
  }

  /** A polyline across the field that follows the sunken surface. */
  function onSurface(x0: number, z0: number, x1: number, z1: number, lift: number) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t;
      pts.push(new THREE.Vector3(x, surfaceY(x, z) + lift, z));
    }
    return pts;
  }

  function apply(p: BediFieldSceneProps) {
    const { doshaKey, deviation, status, history, labels } = p;
    const cur = displaceForDeviation(doshaKey, deviation, status);
    const statusColor = STATUS_HUE[status];
    const level: Record<string, Level> = {};
    const trailPts = history.map((h) => displaceForDeviation(doshaKey, h.deviation, h.status));
    for (const t of trailPts) level[t.zone] = 1;
    level[doshaKey] = 2;
    level[cur.zone] = 2;
    faceState = { level, constKey: doshaKey, curKey: cur.zone, statusColor, names: labels.zoneNames };
    paintFace();

    // Basin toward the displaced direction, depth by |Δ| (capped), flat when balanced.
    const d = Math.min(1, Math.abs(deviation));
    const displaced = cur.scores;
    depthI.H = 0; depthI.S = 0; depthI.B = 0;
    if (status === "khii_excess") depthI.H = d;
    else if (status === "shar_badgan_excess") { if (displaced[1] >= displaced[2]) depthI.S = d; else depthI.B = d; }
    deform();

    const rep = ZONES[doshaKey].rep;
    const [px, pz] = toWorld(rep.x, rep.y);
    const py = surfaceY(px, pz);
    pinG.position.set(px, py, pz);
    pinTag.textContent = labels.pin;

    const [qx, qz] = toWorld(cur.point[0], cur.point[1]);
    const qy = surfaceY(qx, qz);
    const stColor = new THREE.Color(statusColor);
    curMat.color = stColor; curMat.emissive = stColor; arcMat.color = stColor;
    curBall.position.set(qx, qy + 0.19, qz);
    curShadow.position.set(qx, qy + 0.012, qz);
    curTag.textContent = labels.now;
    curBall.visible = curShadow.visible = bead.visible = cur.moved;
    curTag.classList.toggle("bedi-tag-balanced", !cur.moved);
    if (arcMesh) { world.remove(arcMesh); arcMesh.geometry.dispose(); arcMesh = null; arcCurve = null; }
    if (cur.moved) {
      const a = new THREE.Vector3(px, py + 0.3, pz), b = new THREE.Vector3(qx, qy + 0.19, qz);
      const mid = a.clone().add(b).multiplyScalar(0.5);
      mid.y = Math.max(a.y, b.y) + 0.25 + a.distanceTo(b) * 0.4;
      arcCurve = new THREE.QuadraticBezierCurve3(a, mid, b);
      arcMesh = new THREE.Mesh(new THREE.TubeGeometry(arcCurve, 40, 0.028, 8, false), arcMat);
      world.add(arcMesh);
    }

    for (const t of trail) { world.remove(t.mesh); t.mesh.geometry.dispose(); (t.mesh.material as THREE.Material).dispose(); t.tag.remove(); }
    trail.length = 0;
    if (trailLine) { world.remove(trailLine); trailLine.geometry.dispose(); trailLine = null; }
    if (trailPts.length) {
      const pts: Point2[] = [];
      trailPts.forEach((t, i) => {
        const [hx, hz] = toWorld(t.point[0], t.point[1]);
        const hy = surfaceY(hx, hz);
        const mat = new THREE.MeshStandardMaterial({
          roughness: 0.4, transparent: true,
          opacity: 0.35 + 0.45 * (i / Math.max(1, trailPts.length - 1)),
          color: new THREE.Color(STATUS_HUE[history[i].status]),
        });
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 14), mat);
        mesh.position.set(hx, hy + 0.1, hz);
        world.add(mesh);
        const tag = makeTag("bedi-tag-trail");
        tag.textContent = history[i].label;
        trail.push({ mesh, tag });
        pts.push([hx, hz]);
      });
      pts.push(cur.moved ? [qx, qz] : [px, pz]);
      const linePts: THREE.Vector3[] = [];
      for (let i = 0; i + 1 < pts.length; i++) linePts.push(...onSurface(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 0.05));
      trailLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(linePts), trailLineMat);
      world.add(trailLine);
    }
  }

  raf = requestAnimationFrame(frame);

  return {
    apply,
    setView(p, d) { pitchTarget = clampPitch(p); distTarget = clampDist(d); },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      box.removeEventListener("pointerdown", onDown);
      box.removeEventListener("pointermove", onMove);
      box.removeEventListener("pointerup", onUp);
      box.removeEventListener("pointercancel", onUp);
      box.removeEventListener("keydown", onKey);
      for (const t of trail) t.tag.remove();
      pinTag.remove(); curTag.remove();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose()); else mat?.dispose();
      });
      texture.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}

/** The three.js махбод field. Loaded through next/dynamic by BediField; do not import directly. */
export default function BediFieldScene(props: BediFieldSceneProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const { doshaKey, deviation, status, history, labels, onUnsupported } = props;

  // Build the scene once; the effect below applies the data after it exists.
  useEffect(() => {
    const box = boxRef.current, host = hostRef.current, tags = tagsRef.current;
    if (!box || !host || !tags) return;
    const scene = createScene(box, host, tags);
    if (!scene) { onUnsupported(); return; }
    sceneRef.current = scene;
    return () => { scene.dispose(); sceneRef.current = null; };
  }, [onUnsupported]);

  useEffect(() => {
    sceneRef.current?.apply({ doshaKey, deviation, status, history, labels, onUnsupported });
  }, [doshaKey, deviation, status, history, labels, onUnsupported]);

  const viewButton = "rounded-lg px-2 py-1 text-xs font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface";
  return (
    <div className="space-y-2">
      <div
        ref={boxRef}
        role="group"
        tabIndex={0}
        aria-label={labels.hint}
        className="bedi-field relative aspect-[16/11] w-full cursor-grab select-none overflow-hidden [touch-action:pan-y] rounded-lg bg-surface-container-low outline-none focus-visible:ring-2 focus-visible:ring-primary active:cursor-grabbing"
      >
        <div ref={hostRef} role="img" aria-label={labels.aria} className="absolute inset-0" />
        <div ref={tagsRef} aria-hidden="true" className="pointer-events-none absolute inset-0" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <p className="text-xs text-on-surface-variant">{labels.hint}</p>
        <div className="-mr-2 flex gap-1">
          <button type="button" onClick={() => sceneRef.current?.setView(PITCH_MAX, DIST_DEFAULT)} className={viewButton}>
            {labels.viewTop}
          </button>
          <button type="button" onClick={() => sceneRef.current?.setView(0.22, DIST_DEFAULT)} className={viewButton}>
            {labels.viewSide}
          </button>
        </div>
      </div>
    </div>
  );
}
