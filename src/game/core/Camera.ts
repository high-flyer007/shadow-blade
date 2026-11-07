import { clamp, damp, lerp, VIEW_HEIGHT, VIEW_WIDTH } from "../GameConfig";

interface CameraTarget {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/**
 * Follow camera with dead zone, velocity look-ahead, interpolation and
 * decaying trauma-based shake.
 */
export class Camera {
  x = 0;
  y = 0;
  prevX = 0;
  prevY = 0;
  private lookAhead = 0;
  private trauma = 0;
  private shakeTime = 0;
  private offsetX = 0;
  private offsetY = 0;
  maxX = 0;
  maxY = 0;
  shakeEnabled = true;

  constructor(levelWidth: number, levelHeight: number) {
    this.maxX = Math.max(0, levelWidth - VIEW_WIDTH);
    this.maxY = Math.max(0, levelHeight - VIEW_HEIGHT);
  }

  snapTo(target: CameraTarget): void {
    this.x = clamp(target.x - VIEW_WIDTH / 2, 0, this.maxX);
    this.y = clamp(target.y - VIEW_HEIGHT / 2 - 30, 0, this.maxY);
    this.prevX = this.x;
    this.prevY = this.y;
    this.lookAhead = 0;
    this.trauma = 0;
  }

  addShake(intensity: number): void {
    if (!this.shakeEnabled) return;
    this.trauma = clamp(this.trauma + intensity / 22, 0, 1);
  }

  update(dt: number, target: CameraTarget): void {
    this.prevX = this.x;
    this.prevY = this.y;

    this.lookAhead = damp(this.lookAhead, clamp(target.vx * 0.22, -130, 130), 3.2, dt);

    const desiredX = target.x - VIEW_WIDTH / 2 + this.lookAhead;
    const desiredY = target.y - VIEW_HEIGHT / 2 - 20;

    // Dead-zone on X keeps small movements from sloshing the camera.
    const screenX = target.x - this.x;
    let goalX = this.x;
    if (screenX > VIEW_WIDTH * 0.62) goalX = desiredX + 40;
    else if (screenX < VIEW_WIDTH * 0.38) goalX = desiredX - 40;
    else goalX = desiredX;

    const goalY = desiredY;
    this.x = damp(this.x, clamp(goalX, 0, this.maxX), 5.2, dt);
    this.y = damp(this.y, clamp(goalY, 0, this.maxY), 3.4, dt);

    this.trauma = Math.max(0, this.trauma - dt * 1.7);
    this.shakeTime += dt * 46;
    const magnitude = this.trauma * this.trauma * 16;
    this.offsetX = Math.sin(this.shakeTime * 1.7) * magnitude;
    this.offsetY = Math.cos(this.shakeTime * 2.3) * magnitude;
  }

  get renderX(): number {
    return this.x + this.offsetX;
  }

  get renderY(): number {
    return this.y + this.offsetY;
  }

  cinematics(target: CameraTarget, dt: number, zoomFocus = 0): void {
    this.prevX = this.x;
    this.prevY = this.y;
    const goalX = clamp(target.x - VIEW_WIDTH / 2, 0, this.maxX);
    const goalY = clamp(target.y - VIEW_HEIGHT / 2 - zoomFocus, 0, this.maxY);
    this.x = damp(this.x, goalX, 1.8, dt);
    this.y = damp(this.y, goalY, 1.8, dt);
    this.trauma = Math.max(0, this.trauma - dt * 1.2);
  }

  interpolatedX(alpha: number): number {
    return lerp(this.prevX, this.x, alpha) + this.offsetX;
  }

  interpolatedY(alpha: number): number {
    return lerp(this.prevY, this.y, alpha) + this.offsetY;
  }
}
