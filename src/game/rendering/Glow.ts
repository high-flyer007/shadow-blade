const cache = new Map<string, HTMLCanvasElement>();

function hexToRgba(hex: string, alpha: number): string {
  if (hex.startsWith("rgb")) return hex;
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Cached additive glow sprite so we never build gradients per particle/frame. */
export function getGlowSprite(color: string): HTMLCanvasElement {
  let sprite = cache.get(color);
  if (sprite) return sprite;
  const size = 128;
  sprite = document.createElement("canvas");
  sprite.width = size;
  sprite.height = size;
  const ctx = sprite.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, hexToRgba(color, 1));
    gradient.addColorStop(0.28, hexToRgba(color, 0.55));
    gradient.addColorStop(1, hexToRgba(color, 0));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  cache.set(color, sprite);
  return sprite;
}

export function drawGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  alpha = 1,
): void {
  if (radius <= 0 || alpha <= 0) return;
  const sprite = getGlowSprite(color);
  ctx.globalAlpha = alpha;
  ctx.drawImage(sprite, x - radius, y - radius, radius * 2, radius * 2);
  ctx.globalAlpha = 1;
}
