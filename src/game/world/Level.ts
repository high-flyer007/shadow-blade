import { segmentIntersectsBox, type Box } from "../core/Collision";
import { HAZARD_CFG } from "../GameConfig";

export type PlatformKind = "concrete" | "metal" | "neon" | "wall";

export interface PlatformDef extends Box {
  kind: PlatformKind;
}

export interface HazardDef extends Box {
  type: "electric" | "laser";
}

export interface SignDef {
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
}

export interface CableDef {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  sag: number;
}

export interface PipeDef {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface GuardSpawn {
  x: number;
  y: number;
  minX: number;
  maxX: number;
}

export interface DroneSpawn {
  x: number;
  y: number;
  minX: number;
  maxX: number;
}

export interface LevelData {
  id: string;
  name: string;
  subtitle: string;
  width: number;
  height: number;
  spawn: { x: number; y: number };
  platforms: PlatformDef[];
  hazards: HazardDef[];
  guards: GuardSpawn[];
  drones: DroneSpawn[];
  signs: SignDef[];
  cables: CableDef[];
  pipes: PipeDef[];
  exit: Box;
}

/**
 * SECTOR 07 — THE FORGOTTEN DISTRICT
 * A left-to-right rooftop run with a central combat arena, vertical wall
 * routes, electric floors and a laser gate guarding the extraction gate.
 */
export function buildSector07(): LevelData {
  const groundY = 760;
  const platforms: PlatformDef[] = [
    // Rooftop spine
    { x: 40, y: groundY, w: 780, h: 140, kind: "concrete" },
    { x: 1000, y: groundY, w: 520, h: 140, kind: "concrete" },
    { x: 1700, y: groundY, w: 860, h: 140, kind: "concrete" },
    { x: 2740, y: groundY, w: 420, h: 140, kind: "concrete" },
    { x: 3340, y: groundY, w: 560, h: 140, kind: "concrete" },
    { x: 4060, y: 700, w: 500, h: 200, kind: "metal" },

    // Opening traversal
    { x: 180, y: 670, w: 200, h: 20, kind: "metal" },
    { x: 430, y: 590, w: 170, h: 20, kind: "neon" },
    { x: 620, y: 660, w: 180, h: 20, kind: "concrete" },
    { x: 860, y: 640, w: 150, h: 20, kind: "metal" },
    { x: 1050, y: 570, w: 220, h: 20, kind: "concrete" },
    { x: 1330, y: 620, w: 160, h: 20, kind: "neon" },

    // Wall-jump chimney into the arena
    { x: 1500, y: 540, w: 32, h: 220, kind: "wall" },

    // Central arena upper ring
    { x: 1720, y: 620, w: 240, h: 20, kind: "neon" },
    { x: 1980, y: 520, w: 260, h: 20, kind: "concrete" },
    { x: 2060, y: 400, w: 200, h: 20, kind: "metal" },
    { x: 2340, y: 330, w: 260, h: 20, kind: "neon" },
    { x: 2260, y: 600, w: 180, h: 20, kind: "concrete" },

    // Mid-section bridge
    { x: 2600, y: 540, w: 140, h: 20, kind: "metal" },
    { x: 2800, y: 620, w: 180, h: 20, kind: "concrete" },
    { x: 3100, y: 520, w: 32, h: 240, kind: "wall" },

    // Final ascent
    { x: 3220, y: 560, w: 140, h: 20, kind: "neon" },
    { x: 3400, y: 620, w: 200, h: 20, kind: "concrete" },
    { x: 3620, y: 520, w: 180, h: 20, kind: "metal" },
    { x: 3800, y: 420, w: 180, h: 20, kind: "neon" },
    { x: 4040, y: 560, w: 160, h: 20, kind: "metal" },
  ];

  const hazards: HazardDef[] = [
    { x: 1150, y: 744, w: 140, h: 16, type: "electric" },
    { x: 2180, y: 744, w: 150, h: 16, type: "electric" },
    { x: 3500, y: 744, w: 120, h: 16, type: "electric" },
    { x: 3980, y: 500, w: 14, h: 200, type: "laser" },
  ];

  const guards: GuardSpawn[] = [
    { x: 540, y: 698, minX: 240, maxX: 790 },
    { x: 1180, y: 698, minX: 1010, maxX: 1465 },
    { x: 1880, y: 698, minX: 1720, maxX: 2190 },
    { x: 2380, y: 698, minX: 2240, maxX: 2525 },
    { x: 2880, y: 698, minX: 2760, maxX: 3125 },
    { x: 3520, y: 698, minX: 3370, maxX: 3880 },
    { x: 3680, y: 458, minX: 3630, maxX: 3786 },
  ];

  const drones: DroneSpawn[] = [
    { x: 950, y: 470, minX: 860, maxX: 1180 },
    { x: 1530, y: 400, minX: 1380, maxX: 1660 },
    { x: 2140, y: 290, minX: 1950, maxX: 2520 },
    { x: 2950, y: 360, minX: 2830, maxX: 3110 },
    { x: 3740, y: 290, minX: 3600, maxX: 4010 },
  ];

  const signs: SignDef[] = [
    { x: 205, y: 604, text: "影", color: "#00E5FF", size: 34 },
    { x: 455, y: 524, text: "刃", color: "#FF3155", size: 38 },
    { x: 1100, y: 500, text: "電", color: "#8B5CF6", size: 32 },
    { x: 1755, y: 552, text: "忍", color: "#00E5FF", size: 40 },
    { x: 2370, y: 262, text: "夜", color: "#8B5CF6", size: 42 },
    { x: 3440, y: 552, text: "斬", color: "#FF3155", size: 34 },
    { x: 4210, y: 596, text: "出口", color: "#39FF88", size: 30 },
  ];

  const cables: CableDef[] = [
    { x1: 150, y1: 400, x2: 520, y2: 470, sag: 50 },
    { x1: 860, y1: 360, x2: 1230, y2: 300, sag: 70 },
    { x1: 1690, y1: 260, x2: 2050, y2: 340, sag: 60 },
    { x1: 2430, y1: 220, x2: 2860, y2: 300, sag: 80 },
    { x1: 3260, y1: 280, x2: 3630, y2: 240, sag: 55 },
    { x1: 3940, y1: 300, x2: 4360, y2: 380, sag: 70 },
  ];

  const pipes: PipeDef[] = [
    { x: 88, y: 686, w: 120, h: 14 },
    { x: 1240, y: 736, w: 180, h: 12 },
    { x: 2620, y: 700, w: 90, h: 16 },
    { x: 3220, y: 736, w: 100, h: 12 },
    { x: 4100, y: 646, w: 140, h: 16 },
  ];

  return {
    id: "sector-07",
    name: "SECTOR 07",
    subtitle: "THE FORGOTTEN DISTRICT",
    width: 4600,
    height: 900,
    spawn: { x: 90, y: 690 },
    platforms,
    hazards,
    guards,
    drones,
    signs,
    cables,
    pipes,
    exit: { x: 4380, y: 552, w: 110, h: 148 },
  };
}

/** Runtime level wrapper with spatial + line-of-sight queries. */
export class Level {
  readonly data: LevelData;
  readonly solids: PlatformDef[];
  readonly width: number;
  readonly height: number;
  time = 0;

  constructor(data: LevelData) {
    this.data = data;
    this.solids = data.platforms;
    this.width = data.width;
    this.height = data.height;
  }

  reset(): void {
    this.time = 0;
  }

  update(dt: number): void {
    this.time += dt;
  }

  isLaserActive(hazard: HazardDef): boolean {
    const cycle = HAZARD_CFG.laserCycle;
    const phase = this.time % cycle;
    return phase < HAZARD_CFG.laserOnTime;
  }

  activeHazardSolids(): Box[] {
    return this.data.hazards.filter(
      (hazard) => hazard.type !== "laser" || this.isLaserActive(hazard),
    );
  }

  lineOfSight(x1: number, y1: number, x2: number, y2: number): boolean {
    for (const solid of this.solids) {
      if (segmentIntersectsBox(x1, y1, x2, y2, solid)) return false;
    }
    return true;
  }

  groundBelow(x: number, y: number, maxDepth = 120): number {
    let best = Infinity;
    for (const solid of this.solids) {
      if (x < solid.x || x > solid.x + solid.w) continue;
      if (solid.y >= y && solid.y - y < maxDepth) best = Math.min(best, solid.y);
    }
    return best;
  }

  overlapsSolid(box: Box): boolean {
    for (const solid of this.solids) {
      if (
        box.x < solid.x + solid.w &&
        box.x + box.w > solid.x &&
        box.y < solid.y + solid.h &&
        box.y + box.h > solid.y
      ) {
        return true;
      }
    }
    return false;
  }
}
