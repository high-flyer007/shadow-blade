/** Reusable 2D vector used by the simulation. */
export class Vector2 {
  x: number;
  y: number;

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  set(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  copy(v: Vector2): this {
    this.x = v.x;
    this.y = v.y;
    return this;
  }

  clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }

  add(v: Vector2): this {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  addScaled(v: Vector2, scale: number): this {
    this.x += v.x * scale;
    this.y += v.y * scale;
    return this;
  }

  subtract(v: Vector2): this {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  multiply(scalar: number): this {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  divide(scalar: number): this {
    if (scalar !== 0) {
      this.x /= scalar;
      this.y /= scalar;
    }
    return this;
  }

  magnitude(): number {
    return Math.hypot(this.x, this.y);
  }

  magnitudeSq(): number {
    return this.x * this.x + this.y * this.y;
  }

  normalize(): this {
    const mag = this.magnitude();
    if (mag > 0.0001) {
      this.x /= mag;
      this.y /= mag;
    }
    return this;
  }

  distance(v: Vector2): number {
    return Math.hypot(this.x - v.x, this.y - v.y);
  }

  dot(v: Vector2): number {
    return this.x * v.x + this.y * v.y;
  }

  lerp(v: Vector2, t: number): this {
    this.x += (v.x - this.x) * t;
    this.y += (v.y - this.y) * t;
    return this;
  }

  clampMagnitude(max: number): this {
    const mag = this.magnitude();
    if (mag > max && mag > 0.0001) {
      this.x = (this.x / mag) * max;
      this.y = (this.y / mag) * max;
    }
    return this;
  }

  static zero(): Vector2 {
    return new Vector2(0, 0);
  }

  static distance(a: Vector2, b: Vector2): number {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
}
