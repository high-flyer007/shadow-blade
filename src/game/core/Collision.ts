export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Body extends Box {
  vx: number;
  vy: number;
}

export interface CollisionResult {
  hitWall: -1 | 0 | 1;
  landed: boolean;
  ceiling: boolean;
}

export function overlaps(a: Box, b: Box): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

export function boxCenter(b: Box): { x: number; y: number } {
  return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
}

export function distanceToBox(x: number, y: number, b: Box): number {
  const cx = Math.max(b.x, Math.min(x, b.x + b.w));
  const cy = Math.max(b.y, Math.min(y, b.y + b.h));
  return Math.hypot(x - cx, y - cy);
}

/**
 * Liang-Barsky segment/AABB test. Used for vision line-of-sight.
 */
export function segmentIntersectsBox(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  b: Box,
): boolean {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let t0 = 0;
  let t1 = 1;

  const clip = (p: number, q: number): boolean => {
    if (Math.abs(p) < 1e-8) return q >= 0;
    const r = q / p;
    if (p < 0) {
      if (r > t1) return false;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return false;
      if (r < t1) t1 = r;
    }
    return true;
  };

  if (!clip(-dx, x1 - b.x)) return false;
  if (!clip(dx, b.x + b.w - x1)) return false;
  if (!clip(-dy, y1 - b.y)) return false;
  if (!clip(dy, b.y + b.h - y1)) return false;
  return t0 < t1;
}

/** Move a body along one axis and resolve solid overlaps. */
export function moveAndCollide(
  body: Body,
  solids: Box[],
  dt: number,
): CollisionResult {
  const result: CollisionResult = { hitWall: 0, landed: false, ceiling: false };
  const dx = body.vx * dt;
  const dy = body.vy * dt;

  if (dx !== 0) {
    body.x += dx;
    for (const solid of solids) {
      if (!overlaps(body, solid)) continue;
      if (dx > 0) {
        body.x = solid.x - body.w;
        result.hitWall = 1;
      } else {
        body.x = solid.x + solid.w;
        result.hitWall = -1;
      }
      body.vx = 0;
      break;
    }
  }

  if (dy !== 0) {
    body.y += dy;
    for (const solid of solids) {
      if (!overlaps(body, solid)) continue;
      if (dy > 0) {
        body.y = solid.y - body.h;
        result.landed = true;
      } else {
        body.y = solid.y + solid.h;
        result.ceiling = true;
      }
      body.vy = 0;
      break;
    }
  }

  // Guard against deeply nested geometry after teleports.
  for (const solid of solids) {
    if (!overlaps(body, solid)) continue;
    const centerX = body.x + body.w / 2;
    const solidCenterX = solid.x + solid.w / 2;
    const overlapLeft = body.x + body.w - solid.x;
    const overlapRight = solid.x + solid.w - body.x;
    if (Math.min(overlapLeft, overlapRight) < 12) {
      if (centerX < solidCenterX) body.x = solid.x - body.w;
      else body.x = solid.x + solid.w;
    }
  }

  return result;
}
