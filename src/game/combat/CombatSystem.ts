import {
  ATTACKS,
  COLORS,
  CRIT_CHANCE,
  CRIT_MULTIPLIER,
  DRONE_CFG,
  GUARD_CFG,
  HAZARD_CFG,
  SHURIKEN_CFG,
} from "../GameConfig";
import { overlaps } from "../core/Collision";
import type { Enemy, EnemyContext } from "../entities/Enemy";
import type { Player, PlayerContext } from "../entities/Player";
import type { ProjectileSystem } from "../entities/Projectiles";
import type { Level } from "../world/Level";
import type { GameFx } from "../types";

/**
 * Resolves sword hitboxes, shuriken hits, guard melee, drone bolts and
 * environmental hazards. Owns all damage numbers, crits and impact feedback.
 */
export class CombatSystem {
  update(
    player: Player,
    enemies: Enemy[],
    projectiles: ProjectileSystem,
    level: Level,
    fx: GameFx,
    playerCtx: PlayerContext,
    enemyCtx: EnemyContext,
    onKill: (enemy: Enemy) => void,
  ): void {
    this.resolveSword(player, enemies, fx, enemyCtx, onKill);
    this.resolveEnemyMelee(player, enemies, playerCtx);
    this.resolveShurikens(player, enemies, projectiles, fx, enemyCtx, onKill);
    this.resolveBolts(player, projectiles, playerCtx);
    this.resolveHazards(player, level, playerCtx);
  }

  private resolveSword(
    player: Player,
    enemies: Enemy[],
    fx: GameFx,
    enemyCtx: EnemyContext,
    onKill: (enemy: Enemy) => void,
  ): void {
    const hitbox = player.getAttackHitbox();
    if (!hitbox) return;
    const def = ATTACKS[player.attackStep];
    for (const enemy of enemies) {
      if (enemy.dead || enemy.gone) continue;
      if (player.hitEnemyIds.has(enemy.id)) continue;
      if (!overlaps(hitbox, enemy)) continue;

      player.hitEnemyIds.add(enemy.id);
      const crit = Math.random() < CRIT_CHANCE;
      const damage = Math.round(def.damage * (crit ? CRIT_MULTIPLIER : 1));
      const wasDead = enemy.dead;
      enemy.takeDamage(damage, player.facing, crit, enemyCtx);
      if (!wasDead && enemy.dead) onKill(enemy);

      const centerX = enemy.x + enemy.w / 2;
      const centerY = enemy.y + enemy.h / 2;
      fx.texts.add(
        centerX + (Math.random() - 0.5) * 14,
        enemy.y - 4,
        `-${damage}`,
        crit ? COLORS.crimson : COLORS.white,
        crit ? 24 : 18,
        crit,
      );
      if (crit) {
        fx.texts.add(centerX, enemy.y - 26, "CRITICAL!", COLORS.crimson, 13, true);
      }
      fx.shake(crit ? 12 : def.shake);
      fx.hitStop(crit ? 0.115 : def.hitStop);
      fx.particles.ring(centerX, centerY, crit ? 66 : 40, crit ? "rgba(255,49,85,0.9)" : "rgba(0,229,255,0.8)", 0.28, 2.5);
      fx.particles.burst(centerX, centerY, crit ? 18 : 9, {
        speed: 260,
        life: 0.35,
        size: 2,
        color: crit ? COLORS.crimson : COLORS.white,
        kind: "spark",
        drag: 2,
      });
    }
  }

  private resolveEnemyMelee(
    player: Player,
    enemies: Enemy[],
    playerCtx: PlayerContext,
  ): void {
    for (const enemy of enemies) {
      if (enemy.dead) continue;
      const box = enemy.getAttackHitbox();
      if (!box) continue;
      if (!overlaps(box, player)) continue;
      const applied = player.hurt(GUARD_CFG.attackDamage, enemy.x + enemy.w / 2, playerCtx);
      if (applied) {
        enemy.markAttackConnected();
        playerCtx.fx.particles.burst(player.centerX, player.centerY, 10, {
          speed: 200,
          life: 0.4,
          size: 2,
          color: COLORS.crimson,
          kind: "spark",
        });
      }
    }
  }

  private resolveShurikens(
    player: Player,
    enemies: Enemy[],
    projectiles: ProjectileSystem,
    fx: GameFx,
    enemyCtx: EnemyContext,
    onKill: (enemy: Enemy) => void,
  ): void {
    for (const p of projectiles.shurikens) {
      if (!p.active) continue;
      for (const enemy of enemies) {
        if (enemy.dead || enemy.gone) continue;
        if (p.hit.has(enemy.id)) continue;
        if (!projectiles.projectileHitsEnemy(p, enemy)) continue;

        p.hit.add(enemy.id);
        p.active = false;
        const crit = Math.random() < 0.1;
        const damage = Math.round(SHURIKEN_CFG.damage * (crit ? CRIT_MULTIPLIER : 1));
        const wasDead = enemy.dead;
        enemy.takeDamage(damage, Math.sign(p.vx) || 1, crit, enemyCtx);
        if (!wasDead && enemy.dead) onKill(enemy);
        fx.texts.add(enemy.x + enemy.w / 2, enemy.y - 2, `-${damage}`, COLORS.cyan, crit ? 22 : 16, crit);
        if (crit) fx.texts.add(enemy.x + enemy.w / 2, enemy.y - 24, "CRITICAL!", COLORS.crimson, 12, true);
        fx.hitStop(crit ? 0.08 : 0.04);
        fx.shake(crit ? 7 : 3);
        fx.audio.play("shurikenHit");
        fx.particles.burst(p.x, p.y, crit ? 14 : 7, {
          speed: 220,
          life: 0.3,
          size: 1.9,
          color: COLORS.cyan,
          kind: "spark",
        });
        break;
      }
    }
  }

  private resolveBolts(
    player: Player,
    projectiles: ProjectileSystem,
    playerCtx: PlayerContext,
  ): void {
    for (const p of projectiles.bolts) {
      if (!p.active) continue;
      if (!overlaps({ x: p.x - 7, y: p.y - 7, w: 14, h: 14 }, player)) continue;
      p.active = false;
      player.hurt(DRONE_CFG.boltDamage, p.x, playerCtx);
      playerCtx.fx.particles.burst(p.x, p.y, 10, {
        speed: 190,
        life: 0.35,
        size: 2,
        color: COLORS.crimson,
        kind: "spark",
      });
    }
  }

  private resolveHazards(
    player: Player,
    level: Level,
    playerCtx: PlayerContext,
  ): void {
    for (const hazard of level.data.hazards) {
      if (hazard.type === "laser" && !level.isLaserActive(hazard)) continue;
      if (!overlaps(hazard, player)) continue;
      const applied = player.hurt(HAZARD_CFG.damage, hazard.x + hazard.w / 2, playerCtx);
      if (applied) {
        playerCtx.fx.audio.play("hazard");
        playerCtx.fx.particles.burst(player.centerX, player.centerY, 14, {
          speed: 240,
          life: 0.4,
          size: 2.2,
          color: hazard.type === "laser" ? COLORS.crimson : COLORS.cyan,
          kind: "spark",
        });
      }
    }
  }
}
