import {
  COLORS,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  clamp,
  type GameStatus,
} from "../GameConfig";
import type { Camera } from "../core/Camera";
import type { Enemy } from "../entities/Enemy";
import type { Guard } from "../entities/Guard";
import type { Drone } from "../entities/Drone";
import type { ParticleSystem } from "../effects/ParticleSystem";
import type { FloatingTextSystem } from "../effects/FloatingText";
import type { AfterimageSystem } from "../effects/AfterimageSystem";
import type { Player } from "../entities/Player";
import type { ProjectileSystem } from "../entities/Projectiles";
import type { Level, PlatformDef } from "../world/Level";
import { drawGlow } from "./Glow";
import {
  drawBolt,
  drawDrone,
  drawGuard,
  drawNinja,
  drawNinjaGhost,
  drawShuriken,
  drawSlash,
} from "./CharacterArt";

interface Building {
  x: number;
  y: number;
  w: number;
  h: number;
  windows: { x: number; y: number; w: number; h: number; color: string }[];
  antenna: number;
}

interface RainDrop {
  x: number;
  y: number;
  speed: number;
  length: number;
  alpha: number;
  drift: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  phase: number;
}

interface Mote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  phase: number;
}

export interface RenderScene {
  level: Level;
  player: Player;
  enemies: Enemy[];
  projectiles: ProjectileSystem;
  particles: ParticleSystem;
  texts: FloatingTextSystem;
  afterimages: AfterimageSystem;
  camera: Camera;
  time: number;
  status: GameStatus;
  fps: number;
  showFps: boolean;
  exitUnlocked: boolean;
}

function createRng(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const LAYER_WIDTH = 3400;

function buildSkyline(
  seed: number,
  config: {
    minHeight: number;
    maxHeight: number;
    minWidth: number;
    maxWidth: number;
    baseY: number;
    color: string;
    windowColors: string[];
    signColors: string[];
    density: number;
  },
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = LAYER_WIDTH;
  canvas.height = VIEW_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const rng = createRng(seed);
  const buildings: Building[] = [];

  let x = -60;
  while (x < LAYER_WIDTH + 100) {
    const w = config.minWidth + rng() * (config.maxWidth - config.minWidth);
    const h = config.minHeight + rng() * (config.maxHeight - config.minHeight);
    const top = config.baseY - h;
    const windows: Building["windows"] = [];
    const cols = Math.max(1, Math.floor((w - 14) / 16));
    const rows = Math.max(1, Math.floor((h - 24) / 26));
    for (let cx = 0; cx < cols; cx += 1) {
      for (let cy = 0; cy < rows; cy += 1) {
        if (rng() > config.density) continue;
        windows.push({
          x: x + 8 + cx * 16,
          y: top + 14 + cy * 26,
          w: 3 + Math.round(rng() * 4),
          h: 5,
          color: config.windowColors[Math.floor(rng() * config.windowColors.length)],
        });
      }
    }
    buildings.push({
      x,
      y: top,
      w,
      h,
      windows,
      antenna: rng() < 0.3 ? 20 + rng() * 60 : 0,
    });
    x += w + 10 + rng() * 30;
  }

  // Base silhouette fill
  ctx.fillStyle = config.color;
  for (const b of buildings) {
    ctx.fillRect(b.x, b.y, b.w, b.h + 40);
    if (b.antenna > 0) {
      ctx.fillRect(b.x + b.w * 0.6, b.y - b.antenna, 2, b.antenna);
      ctx.fillRect(b.x + b.w * 0.6 - 6, b.y - b.antenna * 0.35, 14, 2);
    }
  }

  // Lit windows
  for (const b of buildings) {
    for (const win of b.windows) {
      ctx.globalAlpha = 0.5 + rng() * 0.4;
      ctx.fillStyle = win.color;
      ctx.fillRect(win.x, win.y, win.w, win.h);
    }
  }
  ctx.globalAlpha = 1;

  // Neon vertical signs
  const signCount = Math.floor(buildings.length * 0.35);
  for (let i = 0; i < signCount; i += 1) {
    const b = buildings[Math.floor(rng() * buildings.length)];
    const color = config.signColors[Math.floor(rng() * config.signColors.length)];
    const signW = 14 + Math.round(rng() * 10);
    const signH = 54 + Math.round(rng() * 60);
    const sx = b.x + 6 + rng() * Math.max(1, b.w - signW - 12);
    const sy = b.y + 20 + rng() * Math.max(1, b.h * 0.35);
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = "rgba(4,8,16,0.85)";
    ctx.fillRect(sx, sy, signW, signH);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(sx + 0.5, sy + 0.5, signW - 1, signH - 1);
    ctx.fillStyle = color;
    ctx.font = `600 ${Math.round(signW * 0.68)}px "Hiragino Kaku Gothic ProN", "Yu Gothic", serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const glyphs = ["影", "刃", "夜", "忍", "電", "斬", "鬼", "零", "光"];
    const glyphCount = Math.max(2, Math.floor(signH / (signW * 0.9)));
    for (let g = 0; g < glyphCount; g += 1) {
      ctx.fillText(
        glyphs[Math.floor(rng() * glyphs.length)],
        sx + signW / 2,
        sy + 12 + g * (signW * 0.92),
      );
    }
    ctx.restore();
  }

  // Atmospheric fade at the base of the layer
  const fade = ctx.createLinearGradient(0, config.baseY - 80, 0, config.baseY + 60);
  fade.addColorStop(0, "rgba(8,11,20,0)");
  fade.addColorStop(1, "rgba(8,11,20,0.9)");
  ctx.fillStyle = fade;
  ctx.fillRect(0, config.baseY - 80, LAYER_WIDTH, 140);

  return canvas;
}

/** Canvas renderer: parallax city, level geometry, characters and overlays. */
export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private scale = 1;
  private offsetX = 0;
  private offsetY = 0;
  private dpr = 1;
  private farLayer: HTMLCanvasElement;
  private midLayer: HTMLCanvasElement;
  private nearLayer: HTMLCanvasElement;
  private vignette: HTMLCanvasElement;
  private scanlines: HTMLCanvasElement;
  private rain: RainDrop[] = [];
  private stars: Star[] = [];
  private motes: Mote[] = [];
  private skyGradient: CanvasGradient | null = null;
  private fogGradient: CanvasGradient | null = null;
  private lastTime = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    this.ctx = ctx;

    this.farLayer = buildSkyline(7, {
      minHeight: 150,
      maxHeight: 320,
      minWidth: 50,
      maxWidth: 130,
      baseY: 610,
      color: "#0B1223",
      windowColors: ["#22436B", "#2F5F8F", "#3D7EA8"],
      signColors: ["#00E5FF", "#246BFD"],
      density: 0.16,
    });
    this.midLayer = buildSkyline(23, {
      minHeight: 210,
      maxHeight: 400,
      minWidth: 60,
      maxWidth: 160,
      baseY: 665,
      color: "#0A1120",
      windowColors: ["#2C5E8C", "#8B5CF6", "#00A9C4"],
      signColors: ["#8B5CF6", "#FF3155", "#00E5FF"],
      density: 0.2,
    });
    this.nearLayer = buildSkyline(41, {
      minHeight: 240,
      maxHeight: 460,
      minWidth: 70,
      maxWidth: 190,
      baseY: 740,
      color: "#060B15",
      windowColors: ["#1F4B77", "#5E3FA8", "#1D7F92"],
      signColors: ["#FF3155", "#00E5FF"],
      density: 0.14,
    });

    // Vignette + scanline textures are built once.
    this.vignette = document.createElement("canvas");
    this.vignette.width = VIEW_WIDTH;
    this.vignette.height = VIEW_HEIGHT;
    const vctx = this.vignette.getContext("2d");
    if (vctx) {
      const gradient = vctx.createRadialGradient(
        VIEW_WIDTH / 2,
        VIEW_HEIGHT / 2,
        VIEW_HEIGHT * 0.28,
        VIEW_WIDTH / 2,
        VIEW_HEIGHT / 2,
        VIEW_HEIGHT * 0.82,
      );
      gradient.addColorStop(0, "rgba(0,0,0,0)");
      gradient.addColorStop(0.65, "rgba(2,4,10,0.28)");
      gradient.addColorStop(1, "rgba(0,0,0,0.82)");
      vctx.fillStyle = gradient;
      vctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    }

    this.scanlines = document.createElement("canvas");
    this.scanlines.width = 4;
    this.scanlines.height = 4;
    const sctx = this.scanlines.getContext("2d");
    if (sctx) {
      sctx.fillStyle = "rgba(0,0,0,0.35)";
      sctx.fillRect(0, 3, 4, 1);
    }

    const rng = createRng(99);
    for (let i = 0; i < 150; i += 1) {
      this.rain.push({
        x: rng() * VIEW_WIDTH,
        y: rng() * VIEW_HEIGHT,
        speed: 520 + rng() * 620,
        length: 8 + rng() * 18,
        alpha: 0.08 + rng() * 0.22,
        drift: -60 - rng() * 70,
      });
    }
    for (let i = 0; i < 70; i += 1) {
      this.stars.push({
        x: rng() * VIEW_WIDTH,
        y: rng() * VIEW_HEIGHT * 0.6,
        size: 0.6 + rng() * 1.4,
        phase: rng() * Math.PI * 2,
      });
    }
    for (let i = 0; i < 44; i += 1) {
      this.motes.push({
        x: rng() * VIEW_WIDTH,
        y: rng() * VIEW_HEIGHT,
        vx: -10 - rng() * 26,
        vy: -6 + rng() * 16,
        size: 0.7 + rng() * 1.7,
        phase: rng() * Math.PI * 2,
      });
    }
  }

  resize(cssWidth: number, cssHeight: number, dpr: number): void {
    this.dpr = dpr;
    this.canvas.width = Math.max(1, Math.floor(cssWidth * dpr));
    this.canvas.height = Math.max(1, Math.floor(cssHeight * dpr));
    this.canvas.style.width = `${cssWidth}px`;
    this.canvas.style.height = `${cssHeight}px`;
    this.scale = Math.min(cssWidth / VIEW_WIDTH, cssHeight / VIEW_HEIGHT);
    this.offsetX = (cssWidth - VIEW_WIDTH * this.scale) / 2;
    this.offsetY = (cssHeight - VIEW_HEIGHT * this.scale) / 2;
  }

  render(scene: RenderScene, alpha: number, realDt: number): void {
    const ctx = this.ctx;
    const t = scene.time;
    this.lastTime += realDt;

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = "#04060C";
    ctx.fillRect(0, 0, this.canvas.width / this.dpr, this.canvas.height / this.dpr);

    ctx.save();
    ctx.setTransform(
      this.dpr * this.scale,
      0,
      0,
      this.dpr * this.scale,
      this.offsetX * this.dpr,
      this.offsetY * this.dpr,
    );
    ctx.beginPath();
    ctx.rect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    ctx.clip();

    const camX = scene.camera.interpolatedX(alpha);
    const camY = scene.camera.interpolatedY(alpha);

    this.drawSky(ctx, camX, camY, t, scene.status);
    this.drawParallax(ctx, camX, camY);
    this.drawFog(ctx, t);

    ctx.save();
    ctx.translate(-camX, -camY);
    this.drawWorld(ctx, scene, alpha, camX, camY, t);
    ctx.restore();

    this.drawWeather(ctx, realDt, t, scene.status);
    this.drawScreenFx(ctx, scene);
    ctx.restore();
  }

  private drawSky(
    ctx: CanvasRenderingContext2D,
    camX: number,
    camY: number,
    time: number,
    status: GameStatus,
  ): void {
    if (!this.skyGradient) {
      const gradient = ctx.createLinearGradient(0, 0, 0, VIEW_HEIGHT);
      gradient.addColorStop(0, "#04060D");
      gradient.addColorStop(0.42, "#0A1022");
      gradient.addColorStop(0.72, "#131C36");
      gradient.addColorStop(1, "#1B2340");
      this.skyGradient = gradient;
    }
    ctx.fillStyle = this.skyGradient;
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

    // Stars
    ctx.save();
    for (const star of this.stars) {
      const twinkle = 0.35 + 0.4 * Math.sin(time * 1.4 + star.phase);
      ctx.globalAlpha = twinkle * 0.55;
      ctx.fillStyle = "#BFD8FF";
      const x = ((star.x - camX * 0.015) % VIEW_WIDTH + VIEW_WIDTH) % VIEW_WIDTH;
      ctx.fillRect(x, star.y - camY * 0.02, star.size, star.size);
    }
    ctx.restore();

    // Moon
    const moonX = 1010 - camX * 0.04;
    const moonY = 128 - camY * 0.05;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    drawGlow(ctx, moonX, moonY, 160, "#6E8EC9", 0.24);
    ctx.restore();
    ctx.fillStyle = "#D7E3FF";
    ctx.beginPath();
    ctx.arc(moonX, moonY, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(180,200,235,0.5)";
    ctx.beginPath();
    ctx.arc(moonX - 12, moonY - 10, 8, 0, Math.PI * 2);
    ctx.arc(moonX + 16, moonY + 6, 12, 0, Math.PI * 2);
    ctx.arc(moonX - 2, moonY + 20, 5, 0, Math.PI * 2);
    ctx.fill();

    // Distant aircraft lights
    const craftX = ((time * 24 - camX * 0.05) % (VIEW_WIDTH + 300)) - 150;
    const craftY = 90 + Math.sin(time * 0.4) * 14 - camY * 0.04;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    drawGlow(ctx, craftX, craftY, 9, COLORS.crimson, 0.7);
    drawGlow(ctx, craftX - 34, craftY + 3, 5, COLORS.cyan, 0.5);
    ctx.restore();

    if (status === "victory") {
      ctx.fillStyle = "rgba(0,229,255,0.06)";
      ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    }
  }

  private drawParallax(ctx: CanvasRenderingContext2D, camX: number, camY: number): void {
    const layers = [
      { canvas: this.farLayer, factor: 0.08, yFactor: 0.06, offsetY: -40 },
      { canvas: this.midLayer, factor: 0.22, yFactor: 0.12, offsetY: 10 },
      { canvas: this.nearLayer, factor: 0.42, yFactor: 0.2, offsetY: 50 },
    ];
    for (const layer of layers) {
      const x = -camX * layer.factor;
      const y = layer.offsetY - camY * layer.yFactor;
      ctx.drawImage(layer.canvas, x, y);
    }

    // Reflected neon haze along the horizon.
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    drawGlow(ctx, 340 - camX * 0.1, 560, 260, COLORS.purple, 0.06);
    drawGlow(ctx, 980 - camX * 0.12, 520, 300, COLORS.cyan, 0.05);
    drawGlow(ctx, 1600 - camX * 0.08, 600, 240, COLORS.crimson, 0.04);
    ctx.restore();
  }

  private drawFog(ctx: CanvasRenderingContext2D, time: number): void {
    if (!this.fogGradient) {
      const gradient = ctx.createLinearGradient(0, 520, 0, VIEW_HEIGHT);
      gradient.addColorStop(0, "rgba(28,44,74,0)");
      gradient.addColorStop(0.55, "rgba(28,44,74,0.2)");
      gradient.addColorStop(1, "rgba(10,16,30,0.55)");
      this.fogGradient = gradient;
    }
    ctx.fillStyle = this.fogGradient;
    ctx.fillRect(0, 500, VIEW_WIDTH, VIEW_HEIGHT - 500);
    ctx.save();
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = "#3A5A8C";
    for (let i = 0; i < 3; i += 1) {
      const x = ((time * (9 + i * 5) + i * 420) % (VIEW_WIDTH + 500)) - 250;
      ctx.beginPath();
      ctx.ellipse(x, 560 + i * 42, 240, 34, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawWorld(
    ctx: CanvasRenderingContext2D,
    scene: RenderScene,
    alpha: number,
    camX: number,
    camY: number,
    time: number,
  ): void {
    const level = scene.level;

    this.drawProps(ctx, level, time, false);
    this.drawPlatforms(ctx, level, camX, time);
    this.drawHazards(ctx, level, time);
    this.drawPortal(ctx, level, scene.exitUnlocked, time);
    this.drawSigns(ctx, level, time);

    // Vision cones behind enemies
    for (const enemy of scene.enemies) {
      if (enemy.kind !== "guard" || enemy.dead) continue;
      this.drawVisionCone(ctx, enemy as Guard, time);
    }

    // Projectiles below characters
    for (const p of scene.projectiles.shurikens) {
      if (!p.active) continue;
      const x = p.px + (p.x - p.px) * alpha;
      const y = p.py + (p.y - p.py) * alpha;
      drawShuriken(ctx, x, y, p.rotation);
    }
    for (const p of scene.projectiles.bolts) {
      if (!p.active) continue;
      const x = p.px + (p.x - p.px) * alpha;
      const y = p.py + (p.y - p.py) * alpha;
      drawBolt(ctx, x, y, p.rotation);
    }

    // Enemies
    for (const enemy of scene.enemies) {
      if (enemy.gone) continue;
      const dx = (enemy.px + (enemy.x - enemy.px) * alpha) - enemy.x;
      const dy = (enemy.py + (enemy.y - enemy.py) * alpha) - enemy.y;
      ctx.save();
      ctx.translate(dx, dy);
      if (enemy.kind === "guard") {
        drawGuard(ctx, enemy as Guard);
      } else {
        drawDrone(ctx, enemy as Drone, time);
        this.drawDroneTelegraph(ctx, enemy as Drone);
      }
      ctx.restore();
    }

    // Player
    this.drawPlayer(ctx, scene, alpha, time);

    scene.particles.render(ctx);
    scene.texts.render(ctx);
  }

  private drawPlayer(
    ctx: CanvasRenderingContext2D,
    scene: RenderScene,
    alpha: number,
    time: number,
  ): void {
    const player = scene.player;
    const dx = player.px + (player.x - player.px) * alpha - player.x;
    const dy = player.py + (player.y - player.py) * alpha - player.y;

    scene.afterimages.render(ctx, drawNinjaGhost);

    ctx.save();
    ctx.translate(dx, dy);

    // Dash streak behind the ninja
    if (player.state === "DASHING") {
      const dir = player.dashDir;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const gradient = ctx.createLinearGradient(
        player.centerX - dir * 120,
        player.centerY,
        player.centerX,
        player.centerY,
      );
      gradient.addColorStop(0, "rgba(255,49,85,0)");
      gradient.addColorStop(0.6, "rgba(0,229,255,0.18)");
      gradient.addColorStop(1, "rgba(255,49,85,0.42)");
      ctx.fillStyle = gradient;
      ctx.fillRect(player.centerX - dir * 120, player.centerY - 22, 120, 44);
      ctx.restore();
    }

    drawNinja(ctx, player, player.state === "DYING" ? Math.max(0, 1 - player.deathTimer / 1.2) : 1);
    if (player.slash) drawSlash(ctx, player.slash);
    ctx.restore();

    if (player.state === "DASHING") {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      drawGlow(ctx, player.centerX, player.centerY, 46, COLORS.cyan, 0.3 + Math.sin(time * 40) * 0.08);
      ctx.restore();
    }
  }

  private drawPlatforms(
    ctx: CanvasRenderingContext2D,
    level: Level,
    camX: number,
    time: number,
  ): void {
    for (const platform of level.solids) {
      if (platform.x + platform.w < camX - 80 || platform.x > camX + VIEW_WIDTH + 80) continue;
      this.drawPlatform(ctx, platform, time);
    }
  }

  private drawPlatform(ctx: CanvasRenderingContext2D, p: PlatformDef, time: number): void {
    const edgeColor =
      p.kind === "neon" ? COLORS.purple : p.kind === "metal" ? COLORS.blue : COLORS.cyan;
    const topLight =
      p.kind === "neon" ? "#8B5CF6" : p.kind === "metal" ? "#3F6499" : "#2C4B6E";

    ctx.fillStyle = p.kind === "metal" ? "#0A1220" : "#0B1322";
    ctx.fillRect(p.x, p.y, p.w, p.h);

    // Face banding
    ctx.fillStyle = p.kind === "metal" ? "#101C30" : "#101B2E";
    ctx.fillRect(p.x, p.y + 6, p.w, Math.min(18, Math.max(0, p.h - 6)));

    // Ambient bounce under the lip
    const shade = ctx.createLinearGradient(0, p.y, 0, p.y + Math.min(p.h, 110));
    shade.addColorStop(0, "rgba(6,10,18,0)");
    shade.addColorStop(1, "rgba(3,6,12,0.85)");
    ctx.fillStyle = shade;
    ctx.fillRect(p.x, p.y, p.w, Math.min(p.h, 110));

    // Top surface
    ctx.fillStyle = p.kind === "metal" ? "#1B2B45" : "#1D2B44";
    ctx.fillRect(p.x, p.y, p.w, 5);
    ctx.fillStyle = topLight;
    ctx.globalAlpha = 0.55;
    ctx.fillRect(p.x, p.y, p.w, 1.6);
    ctx.globalAlpha = 1;

    // Rim light
    if (p.kind !== "wall") {
      ctx.strokeStyle = edgeColor;
      ctx.globalAlpha = 0.12;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.w, p.y);
      ctx.stroke();
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Surface details
    if (p.kind === "concrete") {
      ctx.strokeStyle = "rgba(70,100,140,0.18)";
      ctx.lineWidth = 1;
      for (let x = p.x + 26; x < p.x + p.w; x += 64) {
        ctx.beginPath();
        ctx.moveTo(x, p.y + 8);
        ctx.lineTo(x, p.y + Math.min(p.h, 60));
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(120,160,200,0.1)";
      for (let x = p.x + 14; x < p.x + p.w; x += 28) {
        ctx.fillRect(x, p.y + 8, 2, 2);
      }
    } else if (p.kind === "metal") {
      ctx.strokeStyle = "rgba(0,229,255,0.2)";
      ctx.lineWidth = 1;
      for (let x = p.x + 18; x < p.x + p.w; x += 34) {
        ctx.beginPath();
        ctx.moveTo(x, p.y + 6);
        ctx.lineTo(x, p.y + Math.min(p.h, 50));
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(0,229,255,0.45)";
      for (let x = p.x + 8; x < p.x + p.w; x += 34) {
        ctx.fillRect(x, p.y + 7, 2, 2);
      }
    } else if (p.kind === "neon") {
      const pulse = 0.55 + Math.sin(time * 2.4 + p.x * 0.02) * 0.25;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      drawGlow(ctx, p.x + p.w / 2, p.y + 3, p.w * 0.55, COLORS.purple, 0.1 * pulse + 0.05);
      ctx.restore();
      ctx.fillStyle = `rgba(139,92,246,${pulse})`;
      ctx.fillRect(p.x + 8, p.y + 3, p.w - 16, 1.4);
    } else if (p.kind === "wall") {
      ctx.strokeStyle = "rgba(0,229,255,0.35)";
      ctx.lineWidth = 1;
      for (let y = p.y + 16; y < p.y + p.h; y += 38) {
        ctx.beginPath();
        ctx.moveTo(p.x + 3, y);
        ctx.lineTo(p.x + p.w - 3, y);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(0,229,255,0.5)";
      ctx.fillRect(p.x + 4, p.y + 8, 1.6, p.h - 16);
    }

    // Bottom shadow edge
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(p.x, p.y + p.h - 2, p.w, 2);
  }

  private drawHazards(ctx: CanvasRenderingContext2D, level: Level, time: number): void {
    for (const hazard of level.data.hazards) {
      if (hazard.type === "electric") {
        const cx = hazard.x + hazard.w / 2;
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        drawGlow(ctx, cx, hazard.y + 2, hazard.w * 0.62, COLORS.cyan, 0.22);
        ctx.strokeStyle = "rgba(0,229,255,0.9)";
        ctx.lineWidth = 1.4;
        for (let arc = 0; arc < 3; arc += 1) {
          ctx.beginPath();
          const segments = 8;
          for (let i = 0; i <= segments; i += 1) {
            const x = hazard.x + (hazard.w / segments) * i;
            const jitter =
              Math.sin(time * (12 + arc * 3) + i * 1.7 + arc) * 4 +
              (Math.random() - 0.5) * 2.2;
            const y = hazard.y + 3 + jitter;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        ctx.fillStyle = "rgba(0,229,255,0.16)";
        ctx.fillRect(hazard.x, hazard.y, hazard.w, hazard.h);
        ctx.restore();
        // Warning pylons
        ctx.fillStyle = "#15243B";
        ctx.fillRect(hazard.x - 4, hazard.y - 8, 4, 16);
        ctx.fillRect(hazard.x + hazard.w, hazard.y - 8, 4, 16);
        ctx.fillStyle = COLORS.cyan;
        ctx.fillRect(hazard.x - 4, hazard.y - 9, 4, 2);
        ctx.fillRect(hazard.x + hazard.w, hazard.y - 9, 4, 2);
      } else {
        const active = level.isLaserActive(hazard);
        const pulse = 0.6 + Math.sin(time * 12) * 0.2;
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        if (active) {
          drawGlow(ctx, hazard.x + hazard.w / 2, hazard.y + hazard.h / 2, 46, COLORS.crimson, 0.28);
          ctx.strokeStyle = `rgba(255,49,85,${pulse})`;
          ctx.lineWidth = hazard.w * 0.55;
          ctx.beginPath();
          ctx.moveTo(hazard.x + hazard.w / 2, hazard.y);
          ctx.lineTo(hazard.x + hazard.w / 2, hazard.y + hazard.h);
          ctx.stroke();
          ctx.strokeStyle = "rgba(255,220,230,0.9)";
          ctx.lineWidth = 1.6;
          ctx.stroke();
        } else {
          ctx.strokeStyle = "rgba(255,49,85,0.18)";
          ctx.lineWidth = 1;
          ctx.setLineDash([6, 12]);
          ctx.beginPath();
          ctx.moveTo(hazard.x + hazard.w / 2, hazard.y);
          ctx.lineTo(hazard.x + hazard.w / 2, hazard.y + hazard.h);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.restore();
        // Emitters
        for (const y of [hazard.y - 8, hazard.y + hazard.h - 4]) {
          ctx.fillStyle = "#1B2740";
          ctx.fillRect(hazard.x - 5, y, hazard.w + 10, 12);
          ctx.fillStyle = active ? COLORS.crimson : "#5A2230";
          ctx.fillRect(hazard.x - 2, y + 4, hazard.w + 4, 3);
        }
      }
    }
  }

  private drawProps(
    ctx: CanvasRenderingContext2D,
    level: Level,
    time: number,
    foreground: boolean,
  ): void {
    if (!foreground) {
      for (const cable of level.data.cables) {
        ctx.strokeStyle = "rgba(30,44,68,0.9)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cable.x1, cable.y1);
        ctx.quadraticCurveTo(
          (cable.x1 + cable.x2) / 2,
          (cable.y1 + cable.y2) / 2 + cable.sag,
          cable.x2,
          cable.y2,
        );
        ctx.stroke();
        ctx.strokeStyle = "rgba(0,229,255,0.12)";
        ctx.lineWidth = 1;
        ctx.stroke();
        // Hanging lantern
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        drawGlow(ctx, cable.x2, cable.y2 + 6, 20, COLORS.crimson, 0.25);
        ctx.restore();
        ctx.fillStyle = "#FF3155";
        ctx.fillRect(cable.x2 - 1.5, cable.y2, 3, 8);
      }
    }

    if (!foreground) {
      for (const pipe of level.data.pipes) {
        ctx.fillStyle = "#0C1524";
        ctx.fillRect(pipe.x, pipe.y, pipe.w, pipe.h);
        ctx.fillStyle = "#233652";
        ctx.fillRect(pipe.x, pipe.y + 1, pipe.w, 2);
        ctx.fillStyle = "rgba(0,229,255,0.45)";
        for (let x = pipe.x + 8; x < pipe.x + pipe.w - 4; x += 22) {
          ctx.fillRect(x, pipe.y + 4, 3, 3);
        }
        ctx.save();
        ctx.globalAlpha = 0.05 + Math.sin(time * 1.4 + pipe.x) * 0.02;
        ctx.fillStyle = "#B6CEF0";
        const steamY = pipe.y - ((time * 14) % 40);
        ctx.beginPath();
        ctx.ellipse(pipe.x + pipe.w * 0.7, steamY, 16, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  private drawSigns(ctx: CanvasRenderingContext2D, level: Level, time: number): void {
    for (const sign of level.data.signs) {
      const pulse = 0.7 + Math.sin(time * 1.6 + sign.x * 0.01) * 0.2;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      drawGlow(ctx, sign.x + sign.size / 2, sign.y + sign.size * 0.6, sign.size * 1.3, sign.color, 0.22 * pulse);
      ctx.restore();
      ctx.font = `700 ${sign.size}px "Hiragino Kaku Gothic ProN", "Yu Gothic", serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(4,8,16,0.7)";
      ctx.fillRect(sign.x - sign.size * 0.16, sign.y - 4, sign.size * 1.32, sign.size * 1.42);
      ctx.fillStyle = sign.color;
      ctx.globalAlpha = pulse;
      ctx.fillText(sign.text, sign.x + sign.size / 2, sign.y + sign.size * 0.65);
      ctx.globalAlpha = 1;
    }
  }

  private drawPortal(
    ctx: CanvasRenderingContext2D,
    level: Level,
    unlocked: boolean,
    time: number,
  ): void {
    const exit = level.data.exit;
    const cx = exit.x + exit.w / 2;
    const baseY = exit.y + exit.h;
    const color = unlocked ? COLORS.green : COLORS.crimson;
    const pulse = 0.6 + Math.sin(time * 3) * 0.25;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    drawGlow(ctx, cx, baseY - 50, 90, color, unlocked ? 0.3 * pulse : 0.16);
    ctx.restore();

    // Torii silhouette
    ctx.fillStyle = "#131A2B";
    ctx.fillRect(exit.x + 6, exit.y + 24, 10, exit.h - 24);
    ctx.fillRect(exit.x + exit.w - 16, exit.y + 24, 10, exit.h - 24);
    ctx.fillRect(exit.x - 8, exit.y + 12, exit.w + 16, 11);
    ctx.fillRect(exit.x - 2, exit.y + 30, exit.w + 4, 7);
    ctx.fillStyle = unlocked ? "rgba(57,255,136,0.8)" : "rgba(255,49,85,0.65)";
    ctx.fillRect(exit.x - 8, exit.y + 12, exit.w + 16, 2);
    ctx.fillRect(exit.x + 6, exit.y + 24, 2, exit.h - 24);
    ctx.fillRect(exit.x + exit.w - 16, exit.y + 24, 2, exit.h - 24);

    // Portal energy
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    if (unlocked) {
      for (let i = 0; i < 4; i += 1) {
        const radius = 22 + i * 9 + Math.sin(time * 3 + i) * 3;
        ctx.strokeStyle = i % 2 === 0 ? "rgba(57,255,136,0.55)" : "rgba(0,229,255,0.35)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(cx, baseY - 52, radius * 0.62, radius, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else {
      ctx.strokeStyle = "rgba(255,49,85,0.35)";
      ctx.lineWidth = 1.2;
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.moveTo(cx + i * 16, baseY - 96);
        ctx.lineTo(cx + i * 16, baseY - 12);
        ctx.stroke();
      }
    }
    ctx.restore();

    ctx.font = "600 10px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.8;
    ctx.fillText(unlocked ? "EXTRACTION READY" : "SECTOR LOCKED", cx, exit.y - 6);
    ctx.globalAlpha = 1;
  }

  private drawVisionCone(ctx: CanvasRenderingContext2D, guard: Guard, time: number): void {
    const eyeX = guard.x + guard.w / 2 + guard.facing * 6;
    const eyeY = guard.y + 16;
    const range = 340;
    const halfAngle = 0.52;
    const baseAngle = guard.facing > 0 ? 0 : Math.PI;
    const alert = guard.state === "ALERT" || guard.state === "CHASE" || guard.state === "ATTACK";
    const alpha = alert ? 0.13 : 0.055;

    ctx.save();
    const gradient = ctx.createRadialGradient(eyeX, eyeY, 8, eyeX, eyeY, range);
    const color = alert ? "255,49,85" : "0,229,255";
    gradient.addColorStop(0, `rgba(${color},${alpha * 1.6})`);
    gradient.addColorStop(0.7, `rgba(${color},${alpha})`);
    gradient.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(eyeX, eyeY);
    ctx.arc(eyeX, eyeY, range, baseAngle - halfAngle, baseAngle + halfAngle);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawDroneTelegraph(ctx: CanvasRenderingContext2D, drone: Drone): void {
    if (drone.charge <= 0 || drone.dead) return;
    const p = Math.min(1, drone.charge / 0.42);
    const cx = drone.x + drone.w / 2;
    const cy = drone.y + drone.h / 2;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = `rgba(255,49,85,${0.15 + p * 0.5})`;
    ctx.lineWidth = 1 + p;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.moveTo(cx, cy + 4);
    ctx.lineTo(cx + Math.cos(drone.aimAngle) * 380, cy + 4 + Math.sin(drone.aimAngle) * 380);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  private drawAmbientMotes(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const mote of this.motes) {
      const x = ((mote.x % VIEW_WIDTH) + VIEW_WIDTH) % VIEW_WIDTH;
      const y = ((mote.y % VIEW_HEIGHT) + VIEW_HEIGHT) % VIEW_HEIGHT;
      ctx.globalAlpha = 0.22 + Math.sin(this.lastTime * 2 + mote.phase) * 0.14;
      ctx.fillStyle = "#6FB7D6";
      ctx.fillRect(x, y, mote.size, mote.size);
    }
    ctx.restore();
  }

  private drawWeather(
    ctx: CanvasRenderingContext2D,
    dt: number,
    time: number,
    status: GameStatus,
  ): void {
    ctx.save();
    for (const drop of this.rain) {
      drop.y += drop.speed * dt;
      drop.x += drop.drift * dt;
      if (drop.y > VIEW_HEIGHT + 20) {
        drop.y = -20;
        drop.x = Math.random() * VIEW_WIDTH;
      }
      if (drop.x < -20) drop.x = VIEW_WIDTH + 20;
      ctx.globalAlpha = drop.alpha;
      ctx.strokeStyle = "#9CC9F0";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x - drop.drift * 0.018, drop.y - drop.length);
      ctx.stroke();
    }
    ctx.restore();

    for (const mote of this.motes) {
      mote.x += mote.vx * dt;
      mote.y += mote.vy * dt;
      if (mote.x < -40) mote.x = VIEW_WIDTH + 40;
      if (mote.y < -40) mote.y = VIEW_HEIGHT + 40;
    }
    this.drawAmbientMotes(ctx);

    if (status === "victory") {
      ctx.save();
      ctx.fillStyle = `rgba(220,255,255,${0.04 + Math.sin(time * 3) * 0.02})`;
      ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
      ctx.restore();
    }
  }

  private drawScreenFx(ctx: CanvasRenderingContext2D, scene: RenderScene): void {
    ctx.drawImage(this.vignette, 0, 0);

    // Low health pulse.
    const hpRatio = scene.player.hp / 100;
    if (hpRatio < 0.35 && scene.player.state !== "DYING") {
      const pulse = 0.16 + Math.sin(scene.time * 5.5) * 0.08;
      const gradient = ctx.createRadialGradient(
        VIEW_WIDTH / 2,
        VIEW_HEIGHT / 2,
        VIEW_HEIGHT * 0.3,
        VIEW_WIDTH / 2,
        VIEW_HEIGHT / 2,
        VIEW_HEIGHT * 0.75,
      );
      gradient.addColorStop(0, "rgba(255,49,85,0)");
      gradient.addColorStop(1, `rgba(255,49,85,${Math.max(0.08, pulse)})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    }

    if (scene.player.hurtFlash > 0) {
      ctx.save();
      ctx.globalAlpha = scene.player.hurtFlash * 0.16;
      ctx.fillStyle = COLORS.crimson;
      ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
      ctx.restore();
    }

    // Scanlines
    ctx.save();
    const pattern = ctx.createPattern(this.scanlines, "repeat");
    if (pattern) {
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    }
    ctx.restore();

  }
}
