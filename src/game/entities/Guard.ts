import { COLORS, GUARD_CFG } from "../GameConfig";
import { moveAndCollide, type Box } from "../core/Collision";
import type { GameFx } from "../types";
import type { Level } from "../world/Level";
import type { Player } from "./Player";
import type { Enemy, EnemyContext } from "./Enemy";

export type GuardState =
  | "PATROL"
  | "IDLE"
  | "ALERT"
  | "CHASE"
  | "SEARCH"
  | "ATTACK"
  | "STUNNED"
  | "DEAD";

export class Guard implements Enemy {
  readonly kind = "guard" as const;
  id: number;
  x: number;
  y: number;
  w = GUARD_CFG.width;
  h = GUARD_CFG.height;
  px: number;
  py: number;
  vx = 0;
  vy = 0;
  hp: number = GUARD_CFG.hp;
  maxHp: number = GUARD_CFG.hp;
  score = GUARD_CFG.score;
  facing: number = -1;
  dead = false;
  gone = false;
  deathTimer = 0;
  hitFlash = 0;
  state: GuardState = "PATROL";
  stateTime = 0;
  minX: number;
  maxX: number;
  onGround = false;
  attackTimer = 0;
  attackCooldown = 0;
  attackConnected = false;
  lostTimer = 0;
  searchTimer = 0;
  lastKnownX: number;
  pauseTimer = 0;
  alertMarker = 0;
  private level: Level;

  constructor(id: number, x: number, y: number, minX: number, maxX: number, level: Level) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.px = x;
    this.py = y;
    this.minX = minX;
    this.maxX = maxX;
    this.lastKnownX = x;
    this.level = level;
  }

  canSee(player: Player): boolean {
    if (this.dead || player.state === "DYING") return false;
    const eyeX = this.x + this.w / 2 + this.facing * 6;
    const eyeY = this.y + 16;
    const dx = player.centerX - eyeX;
    const dy = player.centerY - eyeY;
    const dist = Math.hypot(dx, dy);
    if (dist > GUARD_CFG.visionRange) return false;
    if (dist < 52) {
      return this.level.lineOfSight(eyeX, eyeY, player.centerX, player.centerY);
    }
    const dirX = dx / dist;
    const dirY = dy / dist;
    const dot = dirX * this.facing;
    if (dot < Math.cos(GUARD_CFG.visionHalfAngle)) return false;
    if (Math.abs(dirY) > 0.72) return false;
    return this.level.lineOfSight(eyeX, eyeY, player.centerX, player.centerY);
  }

  getAttackHitbox(): Box | null {
    if (this.dead || this.state !== "ATTACK") return null;
    if (this.attackTimer < GUARD_CFG.attackWindup) return null;
    if (this.attackTimer > GUARD_CFG.attackWindup + GUARD_CFG.attackActive) return null;
    if (this.attackConnected) return null;
    return {
      x: this.facing > 0 ? this.x + this.w - 4 : this.x - 46,
      y: this.y + 12,
      w: 50,
      h: 44,
    };
  }

  markAttackConnected(): void {
    this.attackConnected = true;
  }

  private setState(state: GuardState): void {
    this.state = state;
    this.stateTime = 0;
  }

  update(dt: number, ctx: EnemyContext): void {
    this.px = this.x;
    this.py = this.y;
    this.hitFlash = Math.max(0, this.hitFlash - dt * 3.4);

    if (this.dead) {
      this.deathTimer += dt;
      this.vy = Math.min(this.vy + GUARD_CFG.gravity * dt, GUARD_CFG.maxFall);
      moveAndCollide(this, this.level.solids, dt);
      if (this.deathTimer > 1.1) this.gone = true;
      return;
    }

    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.attackTimer += dt;
    this.stateTime += dt;
    this.alertMarker = Math.max(0, this.alertMarker - dt);

    const player = ctx.player;
    const playerAlive = player.state !== "DYING" && player.hp > 0;
    const sees = playerAlive && this.canSee(player);

    if (this.state === "STUNNED") {
      this.vx *= Math.max(0, 1 - dt * 8);
      if (this.stateTime > GUARD_CFG.stunTime) this.setState(sees ? "CHASE" : "PATROL");
    }

    if (this.state === "ATTACK") {
      this.vx *= Math.max(0, 1 - dt * 10);
      if (
        this.attackTimer > GUARD_CFG.attackWindup &&
        this.attackTimer < GUARD_CFG.attackWindup + GUARD_CFG.attackActive &&
        !this.attackConnected
      ) {
        const box = this.getAttackHitbox();
        if (box) {
          ctx.fx.particles.spawn(box.x + box.w / 2, box.y + box.h / 2, {
            vx: this.facing * 180,
            vy: 0,
            life: 0.18,
            size: 2,
            color: COLORS.crimson,
            kind: "spark",
          });
        }
      }
      if (this.attackTimer > GUARD_CFG.attackWindup + GUARD_CFG.attackActive + GUARD_CFG.attackRecovery) {
        this.attackCooldown = GUARD_CFG.attackCooldown;
        if (sees) {
          this.setState("CHASE");
        } else {
          this.setState("SEARCH");
          this.searchTimer = GUARD_CFG.searchTime;
        }
      }
    }

    if (this.state === "ALERT") {
      this.vx *= Math.max(0, 1 - dt * 9);
      if (playerAlive) this.facing = player.centerX > this.x ? 1 : -1;
      if (this.stateTime > GUARD_CFG.alertTime) {
        this.lostTimer = 0;
        this.lastKnownX = player.centerX;
        this.setState("CHASE");
      }
    }

    if (this.state === "PATROL" || this.state === "IDLE") {
      this.pauseTimer = Math.max(0, this.pauseTimer - dt);
      if (this.pauseTimer <= 0) {
        if (this.state === "IDLE") {
          this.setState("PATROL");
        } else {
          if (this.x <= this.minX + 2) this.facing = 1;
          else if (this.x + this.w >= this.maxX - 2) this.facing = -1;
          const speed = GUARD_CFG.patrolSpeed;
          this.vx = this.facing * speed;
          if (!this.hasGroundAhead(this.facing) || this.isWallAhead(this.facing)) {
            this.facing *= -1;
            this.vx = 0;
            this.pauseTimer = 0.5;
            this.setState("IDLE");
          }
          if (this.x < this.minX || this.x + this.w > this.maxX) {
            this.facing = this.x < this.minX ? 1 : -1;
            this.vx = 0;
          }
        }
      } else {
        this.vx = 0;
      }

      if (sees) {
        this.alertMarker = 0.9;
        this.lastKnownX = player.centerX;
        this.setState("ALERT");
        ctx.fx.audio.play("alert");
        ctx.fx.texts.add(this.x + this.w / 2, this.y - 14, "!", COLORS.crimson, 24, true);
        ctx.fx.particles.ring(this.x + this.w / 2, this.y, 28, "rgba(255,49,85,0.7)", 0.4, 2);
        ctx.onAlert(this.x + this.w / 2, this.y);
      }
    }

    if (this.state === "CHASE" || this.state === "SEARCH") {
      if (this.state === "SEARCH" && sees) {
        this.lastKnownX = player.centerX;
        this.lostTimer = 0;
        this.setState("CHASE");
      }
      let targetX = this.x;
      if (this.state === "CHASE") {
        if (sees) {
          this.lastKnownX = player.centerX;
          this.lostTimer = 0;
        } else {
          this.lostTimer += dt;
          if (this.lostTimer > GUARD_CFG.loseSightTime) {
            this.setState("SEARCH");
            this.searchTimer = GUARD_CFG.searchTime;
          }
        }
        targetX = this.lastKnownX;
        if (Math.abs(player.centerX - this.x) < 82 && Math.abs(player.centerY - this.y) < 90) {
          targetX = player.centerX;
        }
      } else {
        this.searchTimer -= dt;
        targetX = this.lastKnownX;
        if (this.searchTimer <= 0) {
          this.facing *= -1;
          this.lostTimer = 0;
          this.setState("PATROL");
        }
      }

      const dx = targetX - (this.x + this.w / 2);
      const dir = Math.abs(dx) > 10 ? Math.sign(dx) : 0;
      if (dir !== 0) this.facing = dir;
      const speed =
        this.state === "CHASE" && sees ? GUARD_CFG.chaseSpeed : GUARD_CFG.patrolSpeed;
      if (dir !== 0 && this.hasGroundAhead(dir)) {
        this.vx = dir * speed;
      } else {
        this.vx = 0;
      }

      const distToPlayer = Math.hypot(
        player.centerX - this.x - this.w / 2,
        player.centerY - this.y - this.h / 2,
      );
      if (
        this.state === "CHASE" &&
        sees &&
        distToPlayer < GUARD_CFG.attackRange &&
        this.attackCooldown <= 0 &&
        playerAlive
      ) {
        this.attackTimer = 0;
        this.attackConnected = false;
        this.attackCooldown = 0;
        this.vx = 0;
        this.facing = player.centerX > this.x ? 1 : -1;
        this.setState("ATTACK");
        ctx.fx.audio.play("enemyAttack");
        ctx.fx.texts.add(this.x + this.w / 2, this.y - 8, "!!", COLORS.crimson, 16);
      }
    }

    if (this.state !== "ATTACK" && this.state !== "STUNNED") {
      this.vy = Math.min(this.vy + GUARD_CFG.gravity * dt, GUARD_CFG.maxFall);
    }
    const result = moveAndCollide(this, this.level.solids, dt);
    this.onGround = result.landed;
    if (this.state === "PATROL" && result.hitWall !== 0) {
      this.facing *= -1;
      this.pauseTimer = 0.3;
      this.setState("IDLE");
    }
    if (this.onGround) this.vy = 0;

    if (this.y > this.level.height + 100) this.gone = true;
  }

  private hasGroundAhead(dir: number): boolean {
    const probeX = this.x + this.w / 2 + dir * (this.w / 2 + 14);
    // Query slightly above the feet so the platform currently stood on counts.
    const ground = this.level.groundBelow(probeX, this.y + this.h - 6, 60);
    return ground !== Infinity;
  }

  private isWallAhead(dir: number): boolean {
    const probe: Box = {
      x: this.x + (dir > 0 ? this.w : -10),
      y: this.y + this.h - 16,
      w: 10,
      h: 14,
    };
    return this.level.overlapsSolid(probe);
  }

  takeDamage(amount: number, dirX: number, crit: boolean, ctx: EnemyContext): void {
    if (this.dead) return;
    this.hp -= amount;
    this.hitFlash = 1;
    this.vx = dirX * (crit ? 260 : 170);
    this.attackConnected = true;
    ctx.fx.audio.play(crit ? "crit" : "hit");
    ctx.fx.particles.burst(this.x + this.w / 2, this.y + this.h / 2 - 6, crit ? 18 : 10, {
      angle: dirX > 0 ? 0 : Math.PI,
      spread: 1.5,
      speed: crit ? 300 : 200,
      life: 0.42,
      size: 2.4,
      color: crit ? COLORS.crimson : COLORS.cyan,
      kind: "spark",
      drag: 2,
    });
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
      this.vx = dirX * 220;
      this.vy = -170;
      this.deathTimer = 0;
      ctx.fx.audio.play("enemyDeath");
      ctx.fx.shake(4);
      ctx.fx.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 20, {
        speed: 210,
        life: 0.8,
        size: 3.2,
        color: COLORS.crimson,
        kind: "shard",
        drag: 1.4,
      });
      ctx.fx.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 16, {
        speed: 130,
        life: 0.9,
        size: 2,
        color: "#8B5CF6",
        kind: "glow",
        drag: 2,
      });
      ctx.fx.texts.add(this.x + this.w / 2, this.y - 20, "ELIMINATED", COLORS.green, 12);
    } else {
      this.setState("STUNNED");
    }
  }
}
