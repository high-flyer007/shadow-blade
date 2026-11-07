import {
  FIXED_STEP,
  PLAYER_CFG,
  SCORE,
  VIEW_HEIGHT,
  clamp,
  lerp,
  type GameSettings,
  type GameStatus,
  type HudSnapshot,
} from "./GameConfig";
import { Camera } from "./core/Camera";
import { InputManager, type Control } from "./core/InputManager";
import { overlaps } from "./core/Collision";
import { Player, type PlayerContext } from "./entities/Player";
import { Guard } from "./entities/Guard";
import { Drone } from "./entities/Drone";
import type { Enemy, EnemyContext } from "./entities/Enemy";
import { ProjectileSystem } from "./entities/Projectiles";
import { ParticleSystem } from "./effects/ParticleSystem";
import { FloatingTextSystem } from "./effects/FloatingText";
import { AfterimageSystem } from "./effects/AfterimageSystem";
import { AudioManager } from "./audio/AudioManager";
import { Renderer, type RenderScene } from "./rendering/Renderer";
import { Level, buildSector07 } from "./world/Level";
import { CombatSystem } from "./combat/CombatSystem";
import type { GameFx } from "./types";
import { getSettings } from "./settings";

export interface EngineOptions {
  onHud: (snapshot: HudSnapshot) => void;
  onEnd: (status: "gameover" | "victory") => void;
  onPauseChange: (paused: boolean) => void;
  settings?: GameSettings;
}

/**
 * Owns the fixed-timestep simulation, input, rendering and game-session state.
 * React only receives throttled HUD snapshots and lifecycle callbacks.
 */
export class GameEngine {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private input = new InputManager();
  private audio: AudioManager;
  private camera: Camera;
  private level: Level;
  private player: Player;
  private enemies: Enemy[] = [];
  private projectiles = new ProjectileSystem();
  private particles = new ParticleSystem();
  private texts = new FloatingTextSystem();
  private afterimages = new AfterimageSystem();
  private combat = new CombatSystem();
  private fx: GameFx;
  private playerCtx: PlayerContext;
  private enemyCtx: EnemyContext;
  private scene: RenderScene;

  private status: GameStatus = "playing";
  private score = 0;
  private kills = 0;
  private totalEnemies = 0;
  private time = 0;
  private accumulator = 0;
  private lastTimestamp = 0;
  private rafId = 0;
  private destroyed = false;
  private hitStopTimer = 0;
  private hudTimer = 0;
  private fps = 60;
  private message = "";
  private messageTimer = 0;
  private lockedCooldown = 0;
  private settings: GameSettings;
  private options: EngineOptions;
  private onVisibility: () => void;
  private lastEnemiesAlive = 0;

  constructor(canvas: HTMLCanvasElement, options: EngineOptions) {
    this.canvas = canvas;
    this.options = options;
    this.settings = options.settings ?? getSettings();
    this.renderer = new Renderer(canvas);
    this.audio = new AudioManager(this.settings);
    this.level = new Level(buildSector07());
    this.camera = new Camera(this.level.width, this.level.height);
    this.camera.shakeEnabled = this.settings.screenShake;

    const engine = this;
    this.fx = {
      particles: this.particles,
      texts: this.texts,
      afterimages: this.afterimages,
      audio: this.audio,
      camera: this.camera,
      get time() {
        return engine.time;
      },
      shake(strength: number) {
        engine.camera.addShake(strength);
      },
      hitStop(seconds: number) {
        engine.hitStopTimer = Math.max(engine.hitStopTimer, seconds);
      },
    };

    this.player = new Player(this.level, this.level.data.spawn.x, this.level.data.spawn.y);
    this.playerCtx = {
      level: this.level,
      fx: this.fx,
      spawnShuriken: (x, y, dir) => this.projectiles.spawnShuriken(x, y, dir),
    };
    this.enemyCtx = this.buildEnemyCtx();

    for (const spawn of this.level.data.guards) {
      this.enemies.push(
        new Guard(this.enemies.length + 1, spawn.x, spawn.y, spawn.minX, spawn.maxX, this.level),
      );
    }
    for (const spawn of this.level.data.drones) {
      this.enemies.push(
        new Drone(this.enemies.length + 1, spawn.x, spawn.y, spawn.minX, spawn.maxX, this.level),
      );
    }
    this.totalEnemies = this.enemies.length;
    this.lastEnemiesAlive = this.totalEnemies;

    this.scene = {
      level: this.level,
      player: this.player,
      enemies: this.enemies,
      projectiles: this.projectiles,
      particles: this.particles,
      texts: this.texts,
      afterimages: this.afterimages,
      camera: this.camera,
      time: 0,
      status: this.status,
      fps: 60,
      showFps: this.settings.showFps,
      exitUnlocked: false,
    };

    this.input.onInteraction(() => {
      this.audio.init();
      this.audio.applySettings(this.settings);
      this.audio.startAmbient();
    });

    this.onVisibility = () => {
      if (document.hidden && this.status === "playing") {
        this.pause();
      }
    };
    document.addEventListener("visibilitychange", this.onVisibility);

    this.newGame();
    this.emitHud();
    this.lastTimestamp = performance.now();
    this.rafId = requestAnimationFrame(this.frame);
  }

  private buildEnemyCtx(): EnemyContext {
    return {
      player: this.player,
      level: this.level,
      fx: this.fx,
      time: this.time,
      spawnBolt: (x, y, dx, dy) => this.projectiles.spawnBolt(x, y, dx, dy),
      onAlert: () => undefined,
    };
  }

  resize(cssWidth: number, cssHeight: number): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.resize(cssWidth, cssHeight, dpr);
  }

  newGame(): void {
    this.level.reset();
    this.projectiles.clear();
    this.particles.clear();
    this.texts.clear();
    this.afterimages.clear();
    this.enemies = [];
    const spawn = this.level.data.spawn;
    this.player = new Player(this.level, spawn.x, spawn.y);
    this.player.respawnTimer = PLAYER_CFG.respawnTime;

    for (const guardSpawn of this.level.data.guards) {
      this.enemies.push(
        new Guard(
          this.enemies.length + 1,
          guardSpawn.x,
          guardSpawn.y,
          guardSpawn.minX,
          guardSpawn.maxX,
          this.level,
        ),
      );
    }
    for (const droneSpawn of this.level.data.drones) {
      this.enemies.push(
        new Drone(
          this.enemies.length + 1,
          droneSpawn.x,
          droneSpawn.y,
          droneSpawn.minX,
          droneSpawn.maxX,
          this.level,
        ),
      );
    }
    this.totalEnemies = this.enemies.length;
    this.lastEnemiesAlive = this.totalEnemies;

    this.playerCtx = {
      level: this.level,
      fx: this.fx,
      spawnShuriken: (x, y, dir) => this.projectiles.spawnShuriken(x, y, dir),
    };
    this.enemyCtx = this.buildEnemyCtx();

    this.score = 0;
    this.kills = 0;
    this.time = 0;
    this.accumulator = 0;
    this.hitStopTimer = 0;
    this.hudTimer = 0;
    this.lockedCooldown = 0;
    this.message = `${this.level.data.name} // ${this.level.data.subtitle}`;
    this.messageTimer = 4.5;
    this.status = "playing";
    this.camera.snapTo({
      x: this.player.centerX,
      y: this.player.centerY,
      vx: 0,
      vy: 0,
    });
    this.input.clear();
    this.input.setEnabled(true);
    this.options.onPauseChange(false);
    this.audio.init();
    this.audio.startAmbient();
    this.emitHud();
  }

  pause(): void {
    if (this.status !== "playing") return;
    this.status = "paused";
    this.input.setEnabled(false);
    this.input.clear();
    this.audio.stopAmbient();
    this.options.onPauseChange(true);
    this.emitHud();
  }

  resume(): void {
    if (this.status !== "paused") return;
    this.status = "playing";
    this.accumulator = 0;
    this.lastTimestamp = performance.now();
    this.input.setEnabled(true);
    this.input.clear();
    this.audio.startAmbient();
    this.options.onPauseChange(false);
    this.emitHud();
  }

  togglePause(): void {
    if (this.status === "playing") this.pause();
    else if (this.status === "paused") this.resume();
  }

  restart(): void {
    this.newGame();
  }

  setVirtualControl(control: Control, down: boolean): void {
    this.input.setVirtual(control, down);
    this.audio.init();
  }

  updateSettings(settings: GameSettings): void {
    this.settings = settings;
    this.audio.applySettings(settings);
    this.camera.shakeEnabled = settings.screenShake;
    this.scene.showFps = settings.showFps;
    this.emitHud();
  }

  private frame = (timestamp: number): void => {
    if (this.destroyed) return;
    const rawDelta = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;
    const delta = clamp(rawDelta, 0, 0.1);
    if (rawDelta > 0) {
      this.fps = lerp(this.fps, Math.min(144, 1 / Math.max(rawDelta, 0.0001)), 0.06);
    }

    if (this.status === "playing") {
      this.accumulator += delta;
      let steps = 0;
      while (this.accumulator >= FIXED_STEP && steps < 5) {
        this.accumulator -= FIXED_STEP;
        if (this.hitStopTimer > 0) {
          this.hitStopTimer = Math.max(0, this.hitStopTimer - FIXED_STEP);
        } else {
          this.step(FIXED_STEP);
        }
        steps += 1;
        if (this.status !== "playing") break;
      }
    } else {
      this.accumulator = 0;
      if (this.input.consume("pause")) {
        if (this.status === "paused") this.resume();
      }
      this.input.clearPressed();
    }

    if (this.status === "playing" && this.input.consume("pause")) {
      this.pause();
    }

    const alpha = this.status === "playing" ? clamp(this.accumulator / FIXED_STEP, 0, 1) : 1;
    this.scene.player = this.player;
    this.scene.enemies = this.enemies;
    this.scene.camera = this.camera;
    this.scene.time = this.time;
    this.scene.status = this.status;
    this.scene.fps = this.fps;
    this.scene.showFps = this.settings.showFps;
    this.scene.exitUnlocked = this.exitUnlocked;
    this.renderer.render(this.scene, alpha, delta);

    this.hudTimer += delta;
    if (this.hudTimer >= 0.1) {
      this.hudTimer = 0;
      this.emitHud();
    }

    this.rafId = requestAnimationFrame(this.frame);
  };

  private get exitUnlocked(): boolean {
    return this.kills >= this.totalEnemies;
  }

  private step(dt: number): void {
    this.time += dt;
    this.level.update(dt);
    this.messageTimer = Math.max(0, this.messageTimer - dt);
    this.lockedCooldown = Math.max(0, this.lockedCooldown - dt);

    this.enemyCtx.player = this.player;
    this.enemyCtx.time = this.time;

    this.player.update(dt, this.input, this.playerCtx);

    for (const enemy of this.enemies) {
      if (enemy.gone) continue;
      enemy.update(dt, this.enemyCtx);
    }

    this.combat.update(
      this.player,
      this.enemies,
      this.projectiles,
      this.level,
      this.fx,
      this.playerCtx,
      this.enemyCtx,
      (enemy) => this.onEnemyKilled(enemy),
    );

    this.projectiles.update(dt, this.level, this.fx);
    this.particles.update(dt);
    this.texts.update(dt);
    this.afterimages.update(dt);
    this.camera.update(dt, {
      x: this.player.centerX,
      y: this.player.centerY,
      vx: this.player.vx,
      vy: this.player.vy,
    });

    // Falling into the city void is fatal.
    if (
      this.player.y > this.level.height + 30 &&
      this.player.state !== "DYING" &&
      this.status === "playing"
    ) {
      this.player.die(this.playerCtx);
    }

    if (
      this.player.state === "DYING" &&
      this.player.deathTimer > 1.35 &&
      this.status === "playing"
    ) {
      this.finishGameOver();
      return;
    }

    // Extraction gate
    if (this.player.state !== "DYING" && overlaps(this.level.data.exit, this.player)) {
      if (this.exitUnlocked) {
        this.finishVictory();
        return;
      }
      if (this.lockedCooldown <= 0) {
        this.lockedCooldown = 1.8;
        this.message = `EXTRACTION LOCKED — ${this.totalEnemies - this.kills} HOSTILES REMAIN`;
        this.messageTimer = 1.8;
        this.audio.play("locked");
        this.texts.add(
          this.level.data.exit.x + this.level.data.exit.w / 2,
          this.level.data.exit.y - 20,
          "LOCKED",
          "#FF3155",
          18,
        );
        this.camera.addShake(2);
      }
    }
  }

  private onEnemyKilled(enemy: Enemy): void {
    this.kills += 1;
    this.score += enemy.score;
    if (this.kills >= this.totalEnemies) {
      this.message = "ALL HOSTILES NEUTRALISED — REACH THE EXTRACTION GATE";
      this.messageTimer = 5;
      this.texts.add(enemy.x + enemy.w / 2, enemy.y - 40, "SECTOR CLEAR", "#39FF88", 18, true);
      this.camera.addShake(5);
    }
    this.emitHud();
  }

  private finishGameOver(): void {
    if (this.status !== "playing") return;
    this.status = "gameover";
    this.input.setEnabled(false);
    this.audio.stopAmbient();
    this.emitHud();
    this.options.onEnd("gameover");
  }

  private finishVictory(): void {
    if (this.status !== "playing") return;
    this.status = "victory";
    this.input.setEnabled(false);
    this.score += SCORE.levelClear;
    this.message = "SECTOR CLEARED";
    this.messageTimer = 5;
    this.audio.play("victory");
    this.audio.stopAmbient();
    this.camera.addShake(6);
    this.particles.ring(
      this.player.centerX,
      this.player.centerY,
      200,
      "rgba(57,255,136,0.9)",
      0.9,
      5,
    );
    this.particles.burst(this.player.centerX, this.player.centerY, 40, {
      speed: 380,
      life: 1.2,
      size: 3,
      color: "#39FF88",
      kind: "glow",
      drag: 1.4,
    });
    this.emitHud();
    this.options.onEnd("victory");
  }

  private emitHud(): void {
    if (this.destroyed) return;
    const snapshot: HudSnapshot = {
      hp: Math.ceil(this.player.hp),
      maxHp: PLAYER_CFG.maxHp,
      score: this.score,
      kills: this.kills,
      totalEnemies: this.totalEnemies,
      dashCharge: this.player.dashCharge,
      dashActive: this.player.state === "DASHING",
      shurikens: this.player.shurikens,
      maxShurikens: PLAYER_CFG.shurikenMax,
      comboStep:
        this.player.state === "ATTACKING" && this.player.attackStep >= 0
          ? this.player.attackStep + 1
          : 0,
      state: this.player.state,
      status: this.status,
      exitUnlocked: this.exitUnlocked,
      fps: Math.round(this.fps),
      elapsed: this.time,
      message: this.messageTimer > 0 ? this.message : "",
    };
    this.options.onHud(snapshot);
  }

  destroy(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.rafId);
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.input.destroy();
    this.audio.destroy();
    this.particles.clear();
    this.texts.clear();
    this.afterimages.clear();
    this.projectiles.clear();
    this.enemies = [];
  }
}
