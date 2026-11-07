import {
  ATTACKS,
  COLORS,
  COMBO_WINDOW,
  PLAYER_CFG,
  clamp,
  moveTowards,
  type PlayerState,
} from "../GameConfig";
import { moveAndCollide, type Box } from "../core/Collision";
import type { InputManager } from "../core/InputManager";
import type { Level } from "../world/Level";
import type { GameFx } from "../types";

export interface PlayerContext {
  level: Level;
  fx: GameFx;
  spawnShuriken: (x: number, y: number, dir: number) => void;
}

interface ScarfPoint {
  x: number;
  y: number;
}

export interface SlashFx {
  step: number;
  x: number;
  y: number;
  facing: number;
  life: number;
  maxLife: number;
}

export class Player {
  x: number;
  y: number;
  w = PLAYER_CFG.width;
  h = PLAYER_CFG.height;
  px: number;
  py: number;
  vx = 0;
  vy = 0;
  facing = 1;
  state: PlayerState = "RESPAWNING";
  stateTime = 0;
  hp: number = PLAYER_CFG.maxHp;
  onGround = false;
  wasOnGround = false;
  wallDir: -1 | 0 | 1 = 0;
  wallTouch = 0;
  wallJumpLock = 0;
  jumpsUsed = 0;
  coyote = 0;
  jumpBuffer = 0;
  dashTimer = 0;
  dashCooldown = 0;
  dashDir = 1;
  attackStep = -1;
  attackTime = 0;
  attackQueued = false;
  comboStep = -1;
  comboTimer = 0;
  hitEnemyIds = new Set<number>();
  invuln = 0;
  hurtFlash = 0;
  shurikens = PLAYER_CFG.shurikenMax;
  shurikenCooldown = 0;
  shurikenRegenTimer = 0;
  runTime = 0;
  scarf: ScarfPoint[] = [];
  slash: SlashFx | null = null;
  deathTimer = 0;
  respawnTimer = PLAYER_CFG.respawnTime;
  ghostTimer = 0;
  sparkTimer = 0;
  stepTimer = 0;
  landFlash = 0;
  level: Level;

  constructor(level: Level, spawnX: number, spawnY: number) {
    this.level = level;
    this.x = spawnX;
    this.y = spawnY;
    this.px = spawnX;
    this.py = spawnY;
    for (let i = 0; i < 8; i += 1) {
      this.scarf.push({ x: spawnX, y: spawnY + 16 });
    }
  }

  get centerX(): number {
    return this.x + this.w / 2;
  }

  get centerY(): number {
    return this.y + this.h / 2;
  }

  get isDead(): boolean {
    return this.state === "DYING" || this.state === "RESPAWNING" || this.hp <= 0;
  }

  get isInvulnerable(): boolean {
    return this.invuln > 0 || this.state === "DASHING";
  }

  get dashCharge(): number {
    if (this.dashCooldown <= 0) return 1;
    return clamp(1 - this.dashCooldown / PLAYER_CFG.dashCooldown, 0, 1);
  }

  get attackActive(): boolean {
    if (this.state !== "ATTACKING" || this.attackStep < 0) return false;
    const def = ATTACKS[this.attackStep];
    return this.attackTime >= def.activeStart && this.attackTime <= def.activeEnd;
  }

  /** World-space hitbox for the currently active sword frame. */
  getAttackHitbox(): Box | null {
    if (!this.attackActive) return null;
    const def = ATTACKS[this.attackStep];
    const centerX =
      this.attackStep === 2
        ? this.centerX
        : this.centerX + this.facing * (def.reach * 0.42 + 8);
    return {
      x: centerX - def.reach / 2,
      y: this.centerY + def.yOffset - def.height / 2,
      w: def.reach,
      h: def.height,
    };
  }

  update(dt: number, input: InputManager, ctx: PlayerContext): void {
    this.px = this.x;
    this.py = this.y;
    this.stateTime += dt;

    // Timers
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    this.shurikenCooldown = Math.max(0, this.shurikenCooldown - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    this.hurtFlash = Math.max(0, this.hurtFlash - dt * 2.6);
    this.wallJumpLock = Math.max(0, this.wallJumpLock - dt);
    this.wallTouch = Math.max(0, this.wallTouch - dt);
    this.landFlash = Math.max(0, this.landFlash - dt * 3);
    this.coyote = Math.max(0, this.coyote - dt);
    this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    if (this.comboTimer > 0) {
      this.comboTimer = Math.max(0, this.comboTimer - dt);
      if (this.comboTimer === 0) this.comboStep = -1;
    }
    if (this.slash) {
      this.slash.life -= dt;
      if (this.slash.life <= 0) this.slash = null;
    }
    if (this.shurikens < PLAYER_CFG.shurikenMax) {
      this.shurikenRegenTimer += dt;
      if (this.shurikenRegenTimer >= PLAYER_CFG.shurikenRegen) {
        this.shurikenRegenTimer = 0;
        this.shurikens += 1;
      }
    }

    if (this.state === "DYING") {
      this.vy = Math.min(this.vy + PLAYER_CFG.gravity * dt, PLAYER_CFG.maxFall);
      moveAndCollide(this, this.level.solids, dt);
      this.deathTimer += dt;
      this.updateScarf(dt);
      if (Math.random() < 0.25) {
        ctx.fx.particles.spawn(this.centerX, this.centerY, {
          vx: (Math.random() - 0.5) * 80,
          vy: -40 - Math.random() * 50,
          life: 0.7,
          size: 2.4,
          color: COLORS.crimson,
          kind: "glow",
        });
      }
      return;
    }

    if (this.state === "RESPAWNING") {
      this.respawnTimer -= dt;
      this.vy = Math.min(this.vy + PLAYER_CFG.gravity * dt, PLAYER_CFG.maxFall);
      const result = moveAndCollide(this, this.level.solids, dt);
      this.onGround = result.landed;
      if (this.onGround) this.vy = 0;
      this.updateScarf(dt);
      if (this.respawnTimer <= 0) {
        this.state = "IDLE";
        this.stateTime = 0;
        this.invuln = Math.max(this.invuln, 0.8);
      }
      return;
    }

    const move = input.moveAxis();
    const attackPressed = input.consume("attack");
    const dashPressed = input.consume("dash");
    const jumpPressed = input.consume("jump");
    const throwPressed = input.consume("shuriken");

    if (jumpPressed) this.jumpBuffer = PLAYER_CFG.jumpBuffer;

    // --- Shadow Dash -------------------------------------------------------
    if (dashPressed && this.dashCooldown <= 0 && this.state !== "TAKING_DAMAGE") {
      this.startDash(move, ctx);
    }

    if (this.state === "DASHING") {
      this.dashTimer -= dt;
      this.vx = this.dashDir * PLAYER_CFG.dashSpeed;
      this.vy = 0;
      const before = this.vx;
      const result = moveAndCollide(this, this.level.solids, dt);
      this.onGround = result.landed;
      if (result.hitWall !== 0) {
        this.dashTimer = Math.min(this.dashTimer, 0.02);
      }
      this.ghostTimer -= dt;
      if (this.ghostTimer <= 0) {
        this.ghostTimer = 0.028;
        ctx.fx.afterimages.push(
          {
            x: this.x,
            y: this.y,
            facing: this.facing,
            state: this.state,
            attackStep: -1,
            attackTime: 0,
            wallDir: 0,
          },
          Math.random() < 0.5 ? COLORS.crimson : COLORS.cyan,
          0.3,
        );
      }
      ctx.fx.particles.spawn(this.centerX - this.dashDir * 12, this.centerY + 10, {
        vx: -this.dashDir * (140 + Math.random() * 200),
        vy: (Math.random() - 0.5) * 60,
        life: 0.28,
        size: 2.4,
        color: Math.random() < 0.4 ? COLORS.crimson : COLORS.cyan,
        kind: "glow",
      });
      if (this.dashTimer <= 0) {
        this.vx = this.dashDir * PLAYER_CFG.maxSpeed * 0.82;
        this.state = this.onGround ? "RUNNING" : "FALLING";
        this.stateTime = 0;
      }
      this.updateScarf(dt);
      this.emitRunDust(ctx, before, dt);
      return;
    }

    // --- Attack ------------------------------------------------------------
    if (attackPressed) {
      if (this.state === "ATTACKING") {
        if (this.attackStep < 2 && this.attackTime > ATTACKS[this.attackStep].activeStart) {
          this.attackQueued = true;
        }
      } else if (this.state !== "TAKING_DAMAGE") {
        const next = this.comboTimer > 0 && this.comboStep >= 0 ? (this.comboStep + 1) % 3 : 0;
        this.startAttack(next, ctx);
      }
    }

    if (this.state === "ATTACKING") {
      this.attackTime += dt;
      const def = ATTACKS[this.attackStep];
      if (this.attackQueued && this.attackTime >= def.activeEnd && this.attackStep < 2) {
        this.startAttack(this.attackStep + 1, ctx);
      } else if (this.attackTime >= def.duration) {
        this.state = this.onGround ? "IDLE" : "FALLING";
        this.stateTime = 0;
        this.comboTimer = COMBO_WINDOW;
        this.attackStep = -1;
      }
    }

    // --- Shuriken ----------------------------------------------------------
    if (throwPressed && this.shurikenCooldown <= 0 && this.shurikens > 0) {
      this.shurikens -= 1;
      this.shurikenCooldown = 0.26;
      const sx = this.centerX + this.facing * 18;
      const sy = this.centerY - 4;
      ctx.spawnShuriken(sx, sy, this.facing);
      ctx.fx.audio.play("shuriken");
      ctx.fx.particles.burst(sx, sy, 4, {
        angle: this.facing > 0 ? 0 : Math.PI,
        spread: 1.1,
        speed: 130,
        life: 0.2,
        size: 1.8,
        color: COLORS.cyan,
      });
    }

    // --- Horizontal movement ----------------------------------------------
    const attacking = this.state === "ATTACKING";
    const control = attacking ? PLAYER_CFG.attackMoveFactor : 1;
    if (move !== 0 && !attacking) {
      this.facing = move;
    }
    if (this.state !== "TAKING_DAMAGE") {
      if (this.onGround) {
        if (move !== 0) {
          this.vx = moveTowards(this.vx, move * PLAYER_CFG.maxSpeed, PLAYER_CFG.groundAccel * control * dt);
        } else {
          this.vx = moveTowards(this.vx, 0, PLAYER_CFG.groundFriction * dt);
        }
      } else if (move !== 0) {
        this.vx = moveTowards(this.vx, move * PLAYER_CFG.maxSpeed, PLAYER_CFG.airAccel * dt);
      } else {
        this.vx = moveTowards(this.vx, 0, PLAYER_CFG.airDrag * dt);
      }
    } else {
      this.vx = moveTowards(this.vx, 0, 700 * dt);
      if (this.stateTime > 0.26) {
        this.state = this.onGround ? "IDLE" : "FALLING";
      }
    }

    // --- Jumps -------------------------------------------------------------
    if (this.jumpBuffer > 0 && this.state !== "TAKING_DAMAGE") {
      if (this.onGround || this.coyote > 0) {
        this.performJump(PLAYER_CFG.jumpVelocity, ctx, "JUMPING");
        this.jumpBuffer = 0;
        ctx.fx.audio.play("jump");
        ctx.fx.particles.burst(this.centerX, this.y + this.h, 7, {
          angle: -Math.PI / 2,
          spread: 2.1,
          speed: 90,
          life: 0.35,
          size: 2.2,
          color: "#8FA6D8",
          kind: "dust",
        });
      } else if (this.wallDir !== 0 && this.wallJumpLock <= 0) {
        this.wallJump(ctx);
        this.jumpBuffer = 0;
      } else if (this.jumpsUsed < 2) {
        this.performJump(PLAYER_CFG.doubleJumpVelocity, ctx, "DOUBLE_JUMPING");
        this.jumpsUsed = 2;
        this.jumpBuffer = 0;
        this.doubleJumpFx(ctx);
      }
    }

    // Variable jump height: releasing early adds extra gravity.
    if (!input.isDown("jump") && this.vy < -200) {
      this.vy += 2300 * dt;
    }

    // --- Gravity + wall slide ---------------------------------------------
    this.vy = Math.min(this.vy + PLAYER_CFG.gravity * dt, PLAYER_CFG.maxFall);
    const pressingIntoWall = this.wallDir !== 0 && move === this.wallDir;
    if (!this.onGround && this.wallDir !== 0 && pressingIntoWall && this.vy > 0) {
      this.vy = Math.min(this.vy, PLAYER_CFG.wallSlideSpeed);
      if (this.state !== "WALL_SLIDING") {
        this.state = "WALL_SLIDING";
        this.stateTime = 0;
      }
      this.sparkTimer -= dt;
      if (this.sparkTimer <= 0) {
        this.sparkTimer = 0.055;
        const wallX = this.wallDir > 0 ? this.x + this.w : this.x;
        ctx.fx.particles.spawn(wallX, this.y + 18 + Math.random() * 28, {
          vx: -this.wallDir * (40 + Math.random() * 90),
          vy: -20 - Math.random() * 70,
          life: 0.34,
          size: 1.7,
          color: Math.random() < 0.6 ? COLORS.cyan : COLORS.white,
          kind: "spark",
        });
      }
    }

    this.wasOnGround = this.onGround;
    const fallSpeed = this.vy;
    const result = moveAndCollide(this, this.level.solids, dt);
    this.onGround = result.landed;
    if (result.hitWall !== 0 && !this.onGround) {
      this.wallDir = result.hitWall;
      this.wallTouch = 0.1;
      if (this.vy > PLAYER_CFG.wallSlideSpeed && move !== result.hitWall) {
        this.vy = Math.min(this.vy, PLAYER_CFG.wallSlideSpeed + 90);
      }
    } else if (this.wallTouch <= 0) {
      this.wallDir = 0;
    }

    if (this.onGround) {
      this.coyote = PLAYER_CFG.coyoteTime;
      this.jumpsUsed = 0;
      if (!this.wasOnGround) this.onLand(fallSpeed, ctx);
    }

    this.emitRunDust(ctx, this.vx, dt);

    // --- Resolve animation state ------------------------------------------
    if (
      this.state !== "ATTACKING" &&
      this.state !== "TAKING_DAMAGE" &&
      this.state !== "WALL_SLIDING"
    ) {
      if (!this.onGround) {
        if (this.state !== "DOUBLE_JUMPING" || this.stateTime > 0.28) {
          this.state = this.vy < 0 ? "JUMPING" : "FALLING";
        }
      } else if (Math.abs(this.vx) > 22) {
        this.state = "RUNNING";
      } else {
        this.state = "IDLE";
      }
    }

    if (this.onGround && this.state === "WALL_SLIDING") {
      this.state = "IDLE";
    }

    this.runTime += dt * (this.onGround ? Math.abs(this.vx) / PLAYER_CFG.maxSpeed : 0.4);
    this.updateScarf(dt);
  }

  private performJump(velocity: number, ctx: PlayerContext, state: PlayerState): void {
    this.vy = velocity;
    this.onGround = false;
    this.state = state;
    this.stateTime = 0;
    this.wallDir = 0;
    this.jumpsUsed = Math.max(1, this.jumpsUsed);
    if (state === "JUMPING") this.jumpsUsed = 1;
    ctx.fx.particles.ring(this.centerX, this.y + this.h, 34, "rgba(0,229,255,0.6)", 0.3, 2);
  }

  private wallJump(ctx: PlayerContext): void {
    this.vx = -this.wallDir * PLAYER_CFG.wallJumpX;
    this.vy = PLAYER_CFG.wallJumpY;
    this.facing = -this.wallDir as 1 | -1;
    this.wallDir = 0;
    this.wallJumpLock = PLAYER_CFG.wallJumpLock;
    this.jumpsUsed = 1;
    this.state = "WALL_JUMPING";
    this.stateTime = 0;
    this.onGround = false;
    ctx.fx.audio.play("wallJump");
    ctx.fx.shake(4);
    ctx.fx.particles.burst(this.centerX, this.centerY, 12, {
      speed: 180,
      life: 0.32,
      size: 2,
      color: COLORS.cyan,
      kind: "spark",
      drag: 2,
    });
    ctx.fx.afterimages.push(
      { x: this.x, y: this.y, facing: this.facing, state: "WALL_SLIDING", attackStep: -1, attackTime: 0, wallDir: 0 },
      COLORS.cyan,
      0.24,
    );
  }

  private doubleJumpFx(ctx: PlayerContext): void {
    ctx.fx.audio.play("doubleJump");
    ctx.fx.shake(3.4);
    ctx.fx.particles.ring(this.centerX, this.centerY + 14, 78, "rgba(0,229,255,0.9)", 0.5, 4);
    ctx.fx.particles.ring(this.centerX, this.centerY + 14, 52, "rgba(139,92,246,0.7)", 0.36, 2);
    ctx.fx.particles.burst(this.centerX, this.centerY + 16, 26, {
      speed: 260,
      life: 0.6,
      size: 2.8,
      color: COLORS.cyan,
      kind: "glow",
      drag: 2.4,
    });
    ctx.fx.afterimages.push(
      { x: this.x, y: this.y, facing: this.facing, state: "DOUBLE_JUMPING", attackStep: -1, attackTime: 0, wallDir: 0 },
      COLORS.cyan,
      0.28,
    );
  }

  private startDash(move: number, ctx: PlayerContext): void {
    this.dashDir = move !== 0 ? move : this.facing;
    this.facing = this.dashDir;
    this.dashTimer = PLAYER_CFG.dashDuration;
    this.dashCooldown = PLAYER_CFG.dashCooldown;
    this.vy = 0;
    this.attackStep = -1;
    this.state = "DASHING";
    this.stateTime = 0;
    this.ghostTimer = 0;
    this.invuln = Math.max(this.invuln, PLAYER_CFG.dashDuration + 0.06);
    ctx.fx.audio.play("dash");
    ctx.fx.shake(3.2);
    ctx.fx.particles.ring(this.centerX, this.centerY, 56, "rgba(255,49,85,0.75)", 0.35, 3);
    ctx.fx.particles.burst(this.centerX, this.centerY, 16, {
      speed: 220,
      life: 0.4,
      size: 2.4,
      color: COLORS.crimson,
      kind: "glow",
      drag: 3,
    });
  }

  private startAttack(step: number, ctx: PlayerContext): void {
    this.attackStep = step;
    this.attackTime = 0;
    this.attackQueued = false;
    this.hitEnemyIds.clear();
    this.state = "ATTACKING";
    this.stateTime = 0;
    this.comboTimer = 0;
    this.comboStep = step;
    this.slash = {
      step,
      x: this.centerX,
      y: this.centerY,
      facing: this.facing,
      life: 0.26 + step * 0.05,
      maxLife: 0.26 + step * 0.05,
    };
    ctx.fx.audio.play(step === 0 ? "slash1" : step === 1 ? "slash2" : "slash3");
    if (step === 2) ctx.fx.shake(2.5);
    ctx.fx.particles.burst(
      this.centerX + this.facing * 26,
      this.centerY,
      step === 2 ? 10 : 5,
      {
        vx: this.facing * 140,
        vy: 0,
        spread: 1.6,
        speed: 190,
        life: 0.22,
        size: 1.8,
        color: COLORS.cyan,
        kind: "spark",
      },
    );
  }

  private onLand(impact: number, ctx: PlayerContext): void {
    if (impact > 320) {
      this.landFlash = 1;
      ctx.fx.audio.play("land");
      ctx.fx.particles.burst(this.centerX, this.y + this.h, Math.min(14, 4 + Math.floor(impact / 90)), {
        angle: 0,
        spread: Math.PI,
        speed: 110 + impact * 0.05,
        life: 0.4,
        size: 2.4,
        color: "#8BA3C7",
        kind: "dust",
        drag: 2,
      });
      ctx.fx.particles.ring(this.centerX, this.y + this.h, 30 + impact * 0.03, "rgba(0,229,255,0.35)", 0.25, 1.5);
    }
  }

  private emitRunDust(ctx: PlayerContext, speed: number, dt: number): void {
    if (!this.onGround || Math.abs(speed) < 90) return;
    this.stepTimer -= dt;
    if (this.stepTimer <= 0) {
      this.stepTimer = 0.2;
      ctx.fx.audio.play("step");
      ctx.fx.particles.spawn(this.centerX - this.facing * 8, this.y + this.h - 2, {
        vx: -this.facing * (20 + Math.random() * 40),
        vy: -10 - Math.random() * 24,
        life: 0.32,
        size: 1.6 + Math.random() * 1.6,
        color: "#60739A",
        kind: "dust",
      });
    }
  }

  private updateScarf(dt: number): void {
    const anchorX = this.x + this.w / 2 - this.facing * 3;
    const anchorY = this.y + 15;
    const first = this.scarf[0];
    if (first) {
      first.x += (anchorX - first.x) * Math.min(1, dt * 24);
      first.y += (anchorY - first.y) * Math.min(1, dt * 24);
    }
    for (let i = 1; i < this.scarf.length; i += 1) {
      const point = this.scarf[i];
      const prev = this.scarf[i - 1];
      const lag = -this.facing * (6 + i * 0.7) - this.vx * 0.008;
      const targetX = prev.x + lag;
      const targetY = prev.y + 3.5 + Math.sin(this.runTime * 4 + i * 0.7) * 2.2;
      const k = Math.min(1, dt * (18 - i));
      point.x += (targetX - point.x) * k;
      point.y += (targetY - point.y) * k;
    }
  }

  hurt(amount: number, sourceX: number, ctx: PlayerContext): boolean {
    if (this.isInvulnerable || this.state === "DYING" || this.state === "RESPAWNING" || this.hp <= 0) {
      return false;
    }
    this.hp = Math.max(0, this.hp - amount);
    this.invuln = PLAYER_CFG.invulnTime;
    this.hurtFlash = 1;
    this.state = "TAKING_DAMAGE";
    this.stateTime = 0;
    this.attackStep = -1;
    const dir = this.centerX < sourceX ? -1 : 1;
    this.vx = dir * 290;
    this.vy = -310;
    this.onGround = false;
    ctx.fx.audio.play("hurt");
    ctx.fx.shake(7.5);
    ctx.fx.hitStop(0.07);
    ctx.fx.particles.burst(this.centerX, this.centerY, 16, {
      speed: 230,
      life: 0.5,
      size: 2.6,
      color: COLORS.crimson,
      kind: "glow",
      drag: 2.6,
    });
    ctx.fx.texts.add(this.centerX, this.y - 8, `-${amount}`, "#FF3155", 18);
    if (this.hp <= 0) this.die(ctx);
    return true;
  }

  die(ctx: PlayerContext): void {
    if (this.state === "DYING") return;
    this.hp = 0;
    this.state = "DYING";
    this.stateTime = 0;
    this.deathTimer = 0;
    this.vy = -280;
    this.vx = -this.facing * 90;
    this.attackStep = -1;
    ctx.fx.audio.play("gameOver");
    ctx.fx.shake(10);
    ctx.fx.particles.burst(this.centerX, this.centerY, 26, {
      speed: 260,
      life: 0.9,
      size: 3,
      color: COLORS.crimson,
      kind: "glow",
      drag: 2,
    });
  }

  respawn(): void {
    this.hp = PLAYER_CFG.maxHp;
    this.vx = 0;
    this.vy = 0;
    this.state = "RESPAWNING";
    this.respawnTimer = PLAYER_CFG.respawnTime;
    this.invuln = 1.2;
    this.deathTimer = 0;
    this.dashCooldown = 0;
    this.shurikens = PLAYER_CFG.shurikenMax;
  }
}
