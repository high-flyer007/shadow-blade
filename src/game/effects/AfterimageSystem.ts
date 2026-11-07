export interface GhostPose {
  x: number;
  y: number;
  facing: number;
  state: string;
  attackStep: number;
  attackTime: number;
  wallDir: number;
}

interface Ghost extends GhostPose {
  life: number;
  maxLife: number;
  color: string;
}

/** Short-lived dash afterimages rendered as ninja silhouettes. */
export class AfterimageSystem {
  private ghosts: Ghost[] = [];

  push(pose: GhostPose, color = "#00E5FF", life = 0.34): void {
    if (this.ghosts.length > 26) this.ghosts.shift();
    this.ghosts.push({ ...pose, color, life, maxLife: life });
  }

  update(dt: number): void {
    for (let i = this.ghosts.length - 1; i >= 0; i -= 1) {
      this.ghosts[i].life -= dt;
      if (this.ghosts[i].life <= 0) this.ghosts.splice(i, 1);
    }
  }

  render(ctx: CanvasRenderingContext2D, drawGhost: (ctx: CanvasRenderingContext2D, pose: GhostPose, alpha: number, color: string) => void): void {
    for (const ghost of this.ghosts) {
      const alpha = Math.max(0, ghost.life / ghost.maxLife) * 0.55;
      drawGhost(ctx, ghost, alpha, ghost.color);
    }
  }

  clear(): void {
    this.ghosts.length = 0;
  }
}
