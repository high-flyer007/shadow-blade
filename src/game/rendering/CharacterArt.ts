import { ATTACKS, COLORS } from "../GameConfig";
import type { GhostPose } from "../effects/AfterimageSystem";
import type { Drone } from "../entities/Drone";
import type { Guard } from "../entities/Guard";
import type { Player, SlashFx } from "../entities/Player";
import { drawGlow } from "./Glow";

function shadow(ctx: CanvasRenderingContext2D, x: number, y: number, width: number): void {
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = "#04060C";
  ctx.beginPath();
  ctx.ellipse(x, y, width, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function limb(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number,
  color: string,
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

/** Procedural ninja with articulated limbs, scarf and katana. */
export function drawNinja(
  ctx: CanvasRenderingContext2D,
  player: Player,
  alpha = 1,
): void {
  const cx = player.x + player.w / 2;
  const baseY = player.y + player.h;
  shadow(ctx, cx, baseY + 2, 15);

  // Cool rim light keeps the dark silhouette readable on dark rooftops.
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  drawGlow(ctx, cx, player.y + 26, 34, "#246BFD", 0.16);
  ctx.restore();

  // Scarf is drawn in world space so it can trail behind the flipped body.
  if (player.scarf.length > 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = "#FF3155";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(player.scarf[0].x, player.scarf[0].y);
    for (let i = 1; i < player.scarf.length - 1; i += 1) {
      const current = player.scarf[i];
      const next = player.scarf[i + 1];
      ctx.quadraticCurveTo(current.x, current.y, (current.x + next.x) / 2, (current.y + next.y) / 2);
    }
    ctx.stroke();
    ctx.globalAlpha = alpha * 0.55;
    ctx.strokeStyle = "#FF8AA0";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.globalAlpha = alpha;

  if (player.state === "DASHING" || player.invuln > 0.55) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    drawGlow(ctx, cx, player.y + 24, 44, COLORS.cyan, 0.35);
    ctx.restore();
  }

  ctx.save();
  ctx.translate(cx, player.y);
  ctx.scale(player.facing, 1);

  const t = player.stateTime;
  const run = player.runTime;
  const state = player.state;
  const hurt = player.hurtFlash;
  const bodyColor = hurt > 0.35 ? "#F4F7FF" : "#0A0F1E";
  const trimColor = hurt > 0.35 ? "#FFFFFF" : "#1B2A4A";
  const clothColor = hurt > 0.35 ? "#F4F7FF" : "#101A30";

  let legSwing = 0;
  let crouch = 0;
  if (state === "RUNNING") {
    legSwing = Math.sin(run * 16) * 8;
  } else if (state === "FALLING") {
    legSwing = -3;
    crouch = 1;
  } else if (state === "JUMPING" || state === "DOUBLE_JUMPING" || state === "WALL_JUMPING") {
    legSwing = 6;
    crouch = 2;
  } else if (state === "WALL_SLIDING") {
    legSwing = 4;
    crouch = 3;
  } else if (state === "DASHING") {
    legSwing = -7;
    crouch = 2;
  } else if (state === "ATTACKING") {
    legSwing = 5;
    crouch = 2;
  }

  const hipY = 32 + crouch;
  const footY = 50;

  // Back leg
  limb(ctx, -2, hipY, -6 - legSwing * 0.6, footY, 5, "#070B16");
  ctx.fillStyle = "#070B16";
  ctx.fillRect(-12 - legSwing * 0.6, footY - 3, 13, 4);
  // Front leg
  limb(ctx, 2, hipY, 7 + legSwing * 0.7, footY, 5, "#0D1526");
  ctx.fillStyle = "#0D1526";
  ctx.fillRect(4 + legSwing * 0.7, footY - 3, 14, 4);

  // Torso / gi
  ctx.fillStyle = clothColor;
  ctx.beginPath();
  ctx.moveTo(-9, 17);
  ctx.quadraticCurveTo(0, 13, 9, 17);
  ctx.lineTo(10, 31);
  ctx.quadraticCurveTo(0, 37, -10, 31);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(0,229,255,0.22)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Chest plate + cyan seams
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.moveTo(-7, 18);
  ctx.lineTo(7, 18);
  ctx.lineTo(8, 27);
  ctx.lineTo(-8, 27);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = COLORS.cyan;
  ctx.globalAlpha = alpha * 0.85;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-5, 21);
  ctx.lineTo(4, 21);
  ctx.moveTo(-4, 24);
  ctx.lineTo(1, 24);
  ctx.stroke();
  ctx.globalAlpha = alpha;

  // Belt / sash
  ctx.fillStyle = "#FF3155";
  ctx.fillRect(-10, 28.5, 20, 3.4);

  // Head / hood
  ctx.fillStyle = clothColor;
  ctx.beginPath();
  ctx.ellipse(1, 10, 8.2, 8.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.moveTo(-6, 6);
  ctx.quadraticCurveTo(7, 1, 9, 9);
  ctx.quadraticCurveTo(2, 7, -6, 6);
  ctx.fill();

  // Face mask
  ctx.fillStyle = "#05080F";
  ctx.beginPath();
  ctx.ellipse(3.5, 12, 5.4, 4.4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Glowing eyes
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  drawGlow(ctx, 5.5, 10.6, 7.5, COLORS.cyan, 0.75);
  ctx.restore();
  ctx.fillStyle = COLORS.cyan;
  ctx.fillRect(3.2, 10, 3.2, 1.6);
  ctx.fillStyle = "#E8FCFF";
  ctx.fillRect(4.6, 10.2, 1.3, 1.2);

  // Katana on back when not swinging
  const attacking = state === "ATTACKING" && player.attackStep >= 0;
  if (!attacking) {
    ctx.save();
    ctx.translate(-3, 24);
    ctx.rotate(-0.9);
    ctx.strokeStyle = "#2B3A5A";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -26);
    ctx.stroke();
    ctx.strokeStyle = COLORS.cyan;
    ctx.globalAlpha = alpha * 0.65;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(1.4, 0);
    ctx.lineTo(1.4, -25);
    ctx.stroke();
    ctx.restore();
    ctx.globalAlpha = alpha;

    // Sword arm trailing
    const armSwing = state === "RUNNING" ? Math.sin(run * 16 + Math.PI) * 5 : -2;
    limb(ctx, 6, 21, 11 + armSwing * 0.4, 31, 4, "#0E1728");
  }

  if (attacking) {
    const def = ATTACKS[player.attackStep];
    const p = Math.min(1, player.attackTime / def.duration);
    const eased = 1 - Math.pow(1 - p, 2);
    let angle: number;
    if (player.attackStep === 0) {
      angle = -1.9 + eased * 2.7;
    } else if (player.attackStep === 1) {
      angle = 1.7 - eased * 2.9;
    } else {
      angle = -Math.PI + eased * Math.PI * 2.1;
    }
    const pivotX = 5;
    const pivotY = 23;
    const handX = pivotX + Math.cos(angle) * 12;
    const handY = pivotY + Math.sin(angle) * 12;
    limb(ctx, pivotX, pivotY, handX, handY, 4, "#16233C");
    ctx.save();
    ctx.translate(handX, handY);
    ctx.rotate(angle);
    ctx.strokeStyle = "#3A4E75";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(30, 0);
    ctx.stroke();
    ctx.strokeStyle = COLORS.cyan;
    ctx.globalAlpha = alpha * 0.9;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(2, -1);
    ctx.lineTo(32, -1);
    ctx.stroke();
    ctx.restore();
    ctx.globalAlpha = alpha;
  }

  ctx.restore();

  // Invulnerability shimmer
  if (player.invuln > 0 && player.state !== "RESPAWNING") {
    ctx.save();
    ctx.globalAlpha = alpha * (0.18 + Math.sin(player.stateTime * 34) * 0.12);
    ctx.strokeStyle = COLORS.cyan;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(cx, player.y + 27, 17, 30, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
  ctx.globalAlpha = 1;
}

export function drawNinjaGhost(
  ctx: CanvasRenderingContext2D,
  pose: GhostPose,
  alpha: number,
  color: string,
): void {
  const cx = pose.x + 13;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = "lighter";
  ctx.translate(cx, pose.y);
  ctx.scale(pose.facing, 1);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-9, 17);
  ctx.quadraticCurveTo(0, 12, 9, 17);
  ctx.lineTo(9, 31);
  ctx.quadraticCurveTo(0, 36, -9, 31);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(1, 9, 8, 8.5, 0, 0, Math.PI * 2);
  ctx.fill();
  limb(ctx, -2, 31, -7, 50, 5, color);
  limb(ctx, 2, 31, 8, 50, 5, color);

  ctx.globalAlpha = alpha * 0.9;
  ctx.strokeStyle = "#F4F7FF";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(2, 10, 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  ctx.globalAlpha = 1;
}

/** Curved katana arc + energy trail for the current swing. */
export function drawSlash(ctx: CanvasRenderingContext2D, slash: SlashFx): void {
  const p = 1 - slash.life / slash.maxLife;
  const alpha = Math.max(0, 1 - p) * 0.95;
  const def = ATTACKS[slash.step];
  const radius = slash.step === 2 ? 74 : 62;
  const baseAngle =
    slash.step === 0
      ? -1.5 + p * 2.4
      : slash.step === 1
        ? 1.5 - p * 2.6
        : -Math.PI + p * Math.PI * 2.2;

  ctx.save();
  ctx.translate(slash.x, slash.y);
  ctx.scale(slash.facing, 1);
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = alpha;

  const gradient = ctx.createLinearGradient(0, -radius, 0, radius);
  gradient.addColorStop(0, "rgba(0,229,255,0)");
  gradient.addColorStop(0.5, "rgba(0,229,255,0.9)");
  gradient.addColorStop(1, "rgba(255,49,85,0)");

  ctx.strokeStyle = slash.step === 2 ? COLORS.crimson : COLORS.cyan;
  ctx.lineWidth = 5 * (1 - p) + 1;
  ctx.beginPath();
  ctx.arc(6, 0, radius, baseAngle - def.arcSweep / 2, baseAngle + def.arcSweep / 2);
  ctx.stroke();

  ctx.globalAlpha = alpha * 0.5;
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 12 * (1 - p) + 2;
  ctx.beginPath();
  ctx.arc(6, 0, radius + 5, baseAngle - def.arcSweep / 2, baseAngle + def.arcSweep / 2);
  ctx.stroke();

  // Bright leading edge
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#F4F7FF";
  const tipX = Math.cos(baseAngle) * radius;
  const tipY = Math.sin(baseAngle) * radius;
  ctx.beginPath();
  ctx.arc(tipX, tipY, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha = 1;
}

/** Armoured patrol guard with a red visor and a rifle. */
export function drawGuard(ctx: CanvasRenderingContext2D, guard: Guard, alpha = 1): void {
  const cx = guard.x + guard.w / 2;
  const baseY = guard.y + guard.h;
  shadow(ctx, cx, baseY + 2, 19);

  const moving = guard.state === "PATROL" || guard.state === "CHASE";
  const walk = guard.stateTime * (guard.state === "CHASE" ? 13 : 8);
  const swing = moving ? Math.sin(walk) * 6 : 0;
  const hurt = guard.hitFlash > 0.45;
  const armor = hurt ? "#F4F7FF" : "#1A2238";
  const plate = hurt ? "#FFFFFF" : "#2A3552";
  const telegraph =
    guard.state === "ATTACK" && guard.attackTimer < 0.34;

  ctx.save();
  ctx.globalAlpha = alpha;
  if (guard.dead) {
    ctx.globalAlpha = alpha * Math.max(0, 1 - guard.deathTimer / 1.1);
  }
  ctx.translate(cx, guard.y);
  ctx.scale(guard.facing, 1);

  // Legs
  limb(ctx, -5, 42, -8 - swing * 0.6, 60, 8, "#111827");
  limb(ctx, 5, 42, 8 + swing * 0.6, 60, 8, "#1B2436");
  ctx.fillStyle = "#0B1220";
  ctx.fillRect(-15 - swing * 0.6, 57, 14, 5);
  ctx.fillRect(3 + swing * 0.6, 57, 15, 5);

  // Torso armour
  ctx.fillStyle = armor;
  ctx.beginPath();
  ctx.moveTo(-13, 18);
  ctx.lineTo(13, 18);
  ctx.lineTo(15, 44);
  ctx.lineTo(-15, 44);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = plate;
  ctx.fillRect(-10, 24, 20, 10);
  ctx.fillStyle = "#0C1322";
  ctx.fillRect(-2, 22, 4, 16);

  // Shoulder pads
  ctx.fillStyle = plate;
  ctx.beginPath();
  ctx.ellipse(-13, 22, 6, 8, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(13, 22, 6, 8, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Helmet
  ctx.fillStyle = "#0E1626";
  ctx.beginPath();
  ctx.arc(2, 11, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1E2A44";
  ctx.fillRect(-8, 5, 18, 5);

  // Red visor
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  drawGlow(ctx, 5, 11, telegraph ? 18 : 11, "#FF3155", telegraph ? 0.9 : 0.55);
  ctx.restore();
  ctx.fillStyle = telegraph ? "#FF7B8E" : "#FF3155";
  ctx.fillRect(1, 9, 11, 3);

  // Rifle
  const recoil = guard.state === "ATTACK" && guard.attackTimer > 0.34 ? 3 : 0;
  ctx.strokeStyle = "#3B4A6B";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-2, 32);
  ctx.lineTo(22 - recoil, 32);
  ctx.stroke();
  ctx.fillStyle = "#141D30";
  ctx.fillRect(6, 29, 18 - recoil, 6);
  ctx.fillRect(10, 35, 5, 8);

  // Arms
  limb(ctx, 8, 24, 16, 33, 5, "#1B2438");

  if (telegraph) {
    ctx.globalAlpha = alpha * 0.5;
    ctx.strokeStyle = "#FF3155";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(10, 30, 24 + Math.sin(guard.attackTimer * 30) * 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = alpha;
  }

  ctx.restore();
  ctx.globalAlpha = 1;
}

/** Hovering surveillance drone with glowing red eye and thrusters. */
export function drawDrone(ctx: CanvasRenderingContext2D, drone: Drone, time: number): void {
  const cx = drone.x + drone.w / 2;
  const cy = drone.y + drone.h / 2;
  const fade = drone.dead ? Math.max(0, 1 - drone.deathTimer) : 1;
  const hurt = drone.hitFlash > 0.45;

  ctx.save();
  ctx.globalAlpha = fade;

  // Thruster glow
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  drawGlow(ctx, cx, cy + 17, 26, COLORS.blue, 0.5);
  drawGlow(
    ctx,
    cx,
    cy + 4,
    18,
    drone.charge > 0 ? COLORS.crimson : "#FF3155",
    0.35 + (drone.charge / 0.42) * 0.4,
  );
  ctx.restore();

  // Body
  ctx.fillStyle = hurt ? "#F4F7FF" : "#111A2B";
  ctx.beginPath();
  ctx.moveTo(cx - 23, cy);
  ctx.lineTo(cx - 12, cy - 13);
  ctx.lineTo(cx + 12, cy - 13);
  ctx.lineTo(cx + 23, cy);
  ctx.lineTo(cx + 10, cy + 12);
  ctx.lineTo(cx - 10, cy + 12);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = hurt ? "#FFFFFF" : "#1B2A44";
  ctx.beginPath();
  ctx.moveTo(cx - 14, cy - 6);
  ctx.lineTo(cx + 14, cy - 6);
  ctx.lineTo(cx + 9, cy + 2);
  ctx.lineTo(cx - 9, cy + 2);
  ctx.closePath();
  ctx.fill();

  // Rotor arms
  ctx.strokeStyle = "#2E3E60";
  ctx.lineWidth = 2.5;
  const rotor = Math.sin(time * 30) * 5;
  ctx.beginPath();
  ctx.moveTo(cx - 18, cy - 9);
  ctx.lineTo(cx - 28, cy - 15);
  ctx.moveTo(cx + 18, cy - 9);
  ctx.lineTo(cx + 28, cy - 15);
  ctx.stroke();
  ctx.globalAlpha = fade * 0.5;
  ctx.strokeStyle = "#8BB6FF";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(cx - 29, cy - 16, 8, 2 + Math.abs(rotor) * 0.3, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + 29, cy - 16, 8, 2 + Math.abs(rotor) * 0.3, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = fade;

  // Eye
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  drawGlow(ctx, cx, cy - 1, 10 + drone.charge * 18, COLORS.crimson, 0.85);
  ctx.restore();
  ctx.fillStyle = drone.charge > 0 ? "#FF8A9B" : "#FF3155";
  ctx.beginPath();
  ctx.arc(cx, cy - 1, 4.6, 0, Math.PI * 2);
  ctx.fill();

  // Charge indicator ring
  if (drone.charge > 0) {
    const p = Math.min(1, drone.charge / 0.42);
    ctx.strokeStyle = "#FF3155";
    ctx.lineWidth = 2;
    ctx.globalAlpha = fade * 0.85;
    ctx.beginPath();
    ctx.arc(cx, cy - 1, 16, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p);
    ctx.stroke();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

export function drawShuriken(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rotation: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  drawGlow(ctx, 0, 0, 18, COLORS.cyan, 0.65);
  ctx.restore();
  ctx.fillStyle = "#C9D6EE";
  ctx.beginPath();
  for (let i = 0; i < 4; i += 1) {
    const angle = (i / 4) * Math.PI * 2;
    const nextAngle = ((i + 1) / 4) * Math.PI * 2;
    const outer = 9;
    const inner = 2.2;
    ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
    ctx.lineTo(
      Math.cos(angle + (nextAngle - angle) / 2) * inner,
      Math.sin(angle + (nextAngle - angle) / 2) * inner,
    );
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = COLORS.cyan;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "#0A1120";
  ctx.beginPath();
  ctx.arc(0, 0, 2.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawBolt(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalCompositeOperation = "lighter";
  drawGlow(ctx, 0, 0, 20, COLORS.crimson, 0.9);
  ctx.fillStyle = "#FFE6EA";
  ctx.beginPath();
  ctx.moveTo(-9, 0);
  ctx.lineTo(0, -3.4);
  ctx.lineTo(9, 0);
  ctx.lineTo(0, 3.4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#FF3155";
  ctx.fillRect(-18, -1.2, 10, 2.4);
  ctx.restore();
  ctx.globalAlpha = 1;
}
