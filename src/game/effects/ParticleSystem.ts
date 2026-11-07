import { MAX_PARTICLES } from "../GameConfig";

export type ParticleKind = "spark" | "glow" | "shard" | "dust" | "smoke";

interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  life: number;
  maxLife: number;
  size: number;
  endSize: number;
  color: string;
  kind: ParticleKind;
  rotation: number;
  spin: number;
  alpha: number;
  drag: number;
}

export interface ParticleOptions {
  vx?: number;
  vy?: number;
  ax?: number;
  ay?: number;
  life?: number;
  size?: number;
  endSize?: number;
  color?: string;
  kind?: ParticleKind;
  rotation?: number;
  spin?: number;
  alpha?: number;
  drag?: number;
  spread?: number;
  speed?: number;
}

export interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  maxLife: number;
  color: string;
  width: number;
}

function createParticle(): Particle {
  return {
    active: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    ax: 0,
    ay: 0,
    life: 0,
    maxLife: 1,
    size: 2,
    endSize: 0,
    color: "#00E5FF",
    kind: "spark",
    rotation: 0,
    spin: 0,
    alpha: 1,
    drag: 0,
  };
}

/** Fixed-size pooled particle simulation (no per-frame allocations). */
export class ParticleSystem {
  private pool: Particle[] = [];
  private rings: Shockwave[] = [];
  private cursor = 0;

  constructor(limit = MAX_PARTICLES) {
    for (let i = 0; i < limit; i += 1) this.pool.push(createParticle());
  }

  spawn(x: number, y: number, options: ParticleOptions = {}): void {
    const particle = this.pool[this.cursor];
    this.cursor = (this.cursor + 1) % this.pool.length;
    const maxLife = options.life ?? 0.5;
    particle.active = true;
    particle.x = x;
    particle.y = y;
    particle.vx = options.vx ?? 0;
    particle.vy = options.vy ?? 0;
    particle.ax = options.ax ?? 0;
    particle.ay = options.ay ?? 0;
    particle.life = maxLife;
    particle.maxLife = maxLife;
    particle.size = options.size ?? 3;
    particle.endSize = options.endSize ?? 0;
    particle.color = options.color ?? "#00E5FF";
    particle.kind = options.kind ?? "spark";
    particle.rotation = options.rotation ?? 0;
    particle.spin = options.spin ?? 0;
    particle.alpha = options.alpha ?? 1;
    particle.drag = options.drag ?? 0;
  }

  burst(
    x: number,
    y: number,
    count: number,
    options: ParticleOptions & { angle?: number; arc?: number } = {},
  ): void {
    const spread = options.spread ?? Math.PI * 2;
    const angle = options.angle ?? 0;
    const speed = options.speed ?? 220;
    for (let i = 0; i < count; i += 1) {
      const theta = angle + (Math.random() - 0.5) * spread;
      const velocity = speed * (0.35 + Math.random() * 0.9);
      this.spawn(x, y, {
        ...options,
        vx: options.vx !== undefined ? options.vx : Math.cos(theta) * velocity,
        vy: options.vy !== undefined ? options.vy : Math.sin(theta) * velocity,
        life: (options.life ?? 0.55) * (0.6 + Math.random() * 0.7),
        size: (options.size ?? 3) * (0.6 + Math.random() * 0.8),
        rotation: Math.random() * Math.PI * 2,
      });
    }
  }

  ring(
    x: number,
    y: number,
    maxRadius: number,
    color: string,
    life = 0.45,
    width = 3,
  ): void {
    if (this.rings.length > 24) this.rings.shift();
    this.rings.push({
      x,
      y,
      radius: 4,
      maxRadius,
      life,
      maxLife: life,
      color,
      width,
    });
  }

  update(dt: number): void {
    for (const p of this.pool) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      p.vx += p.ax * dt;
      p.vy += p.ay * dt;
      if (p.drag > 0) {
        const damping = Math.max(0, 1 - p.drag * dt);
        p.vx *= damping;
        p.vy *= damping;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.spin * dt;
    }

    for (let i = this.rings.length - 1; i >= 0; i -= 1) {
      const ring = this.rings[i];
      ring.life -= dt;
      const t = 1 - ring.life / ring.maxLife;
      ring.radius = 4 + (ring.maxRadius - 4) * (1 - (1 - t) * (1 - t));
      if (ring.life <= 0) this.rings.splice(i, 1);
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const p of this.pool) {
      if (!p.active) continue;
      const t = p.life / p.maxLife;
      const alpha = Math.min(1, p.alpha * t);
      const size = p.endSize + (p.size - p.endSize) * t;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      switch (p.kind) {
        case "spark": {
          ctx.save();
          ctx.translate(p.x, p.y);
          const speed = Math.hypot(p.vx, p.vy);
          ctx.rotate(Math.atan2(p.vy, p.vx));
          ctx.fillRect(-size * 3 - speed * 0.008, -size * 0.35, size * 3 + speed * 0.016, Math.max(1, size * 0.7));
          ctx.restore();
          break;
        }
        case "shard": {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillRect(-size * 0.8, -size * 0.25, size * 1.8, size * 0.5);
          ctx.restore();
          break;
        }
        case "smoke": {
          ctx.globalAlpha = alpha * 0.3;
          ctx.beginPath();
          ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case "dust": {
          ctx.globalAlpha = alpha * 0.6;
          ctx.beginPath();
          ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        default: {
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(0.6, size), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    for (const ring of this.rings) {
      const t = ring.life / ring.maxLife;
      ctx.globalAlpha = Math.max(0, t) * 0.8;
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = ring.width * t + 0.6;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  clear(): void {
    for (const p of this.pool) p.active = false;
    this.rings.length = 0;
  }

  get activeCount(): number {
    let count = 0;
    for (const p of this.pool) if (p.active) count += 1;
    return count + this.rings.length;
  }
}
