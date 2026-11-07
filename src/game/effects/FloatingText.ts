interface FloatText {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  text: string;
  color: string;
  size: number;
  crit: boolean;
}

export class FloatingTextSystem {
  private texts: FloatText[] = [];

  add(
    x: number,
    y: number,
    text: string,
    color = "#F4F7FF",
    size = 16,
    crit = false,
  ): void {
    if (this.texts.length > 40) this.texts.shift();
    this.texts.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 26,
      vy: crit ? -105 : -84,
      life: crit ? 1.05 : 0.8,
      maxLife: crit ? 1.05 : 0.8,
      text,
      color,
      size,
      crit,
    });
  }

  update(dt: number): void {
    for (let i = this.texts.length - 1; i >= 0; i -= 1) {
      const t = this.texts[i];
      t.life -= dt;
      if (t.life <= 0) {
        this.texts.splice(i, 1);
        continue;
      }
      t.vy += 130 * dt;
      t.x += t.vx * dt;
      t.y += t.vy * dt;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const t of this.texts) {
      const p = t.life / t.maxLife;
      const alpha = Math.min(1, p * 2.4);
      const scale = t.crit ? 1 + (1 - p) * 0.18 : 1;
      ctx.globalAlpha = alpha;
      ctx.font = `800 ${Math.round(t.size * scale)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(4,7,14,0.9)";
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
      if (t.crit) {
        ctx.globalAlpha = alpha * 0.4;
        ctx.fillStyle = "#FF3155";
        ctx.fillText(t.text, t.x + 1, t.y - 1);
      }
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  clear(): void {
    this.texts.length = 0;
  }
}
