import { useEffect, useRef } from "react";

function rng(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

interface Baked {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

function bakeSkyline(
  seed: number,
  options: {
    baseY: number;
    minH: number;
    maxH: number;
    minW: number;
    maxW: number;
    color: string;
    windowColors: string[];
    signColors: string[];
    density: number;
  },
): Baked {
  const width = 1800;
  const height = 760;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { canvas, width, height };
  const random = rng(seed);
  let x = -40;
  const glyphs = ["影", "刃", "夜", "忍", "電", "斬", "零"];

  while (x < width) {
    const w = options.minW + random() * (options.maxW - options.minW);
    const h = options.minH + random() * (options.maxH - options.minH);
    const top = options.baseY - h;
    ctx.fillStyle = options.color;
    ctx.fillRect(x, top, w, h);
    if (random() < 0.35) {
      ctx.fillRect(x + w * 0.6, top - 20 - random() * 40, 2, 60);
    }
    const cols = Math.max(1, Math.floor((w - 12) / 18));
    const rows = Math.max(1, Math.floor((h - 24) / 30));
    for (let cx = 0; cx < cols; cx += 1) {
      for (let cy = 0; cy < rows; cy += 1) {
        if (random() > options.density) continue;
        ctx.globalAlpha = 0.35 + random() * 0.5;
        ctx.fillStyle = options.windowColors[Math.floor(random() * options.windowColors.length)];
        ctx.fillRect(x + 8 + cx * 18, top + 16 + cy * 30, 3 + random() * 5, 5);
      }
    }
    ctx.globalAlpha = 1;

    if (random() < 0.4) {
      const signColor = options.signColors[Math.floor(random() * options.signColors.length)];
      const sw = 16 + random() * 10;
      const sh = 50 + random() * 70;
      const sx = x + 8 + random() * Math.max(1, w - sw - 16);
      const sy = top + 20 + random() * Math.max(1, h * 0.3);
      ctx.fillStyle = "rgba(3,7,14,0.9)";
      ctx.fillRect(sx, sy, sw, sh);
      ctx.strokeStyle = signColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(sx + 0.5, sy + 0.5, sw - 1, sh - 1);
      ctx.fillStyle = signColor;
      ctx.font = `600 ${Math.round(sw * 0.7)}px "Hiragino Kaku Gothic ProN", "Yu Gothic", serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (let i = 0; i < Math.floor(sh / (sw * 0.95)); i += 1) {
        ctx.fillText(glyphs[Math.floor(random() * glyphs.length)], sx + sw / 2, sy + 12 + i * sw * 0.95);
      }
    }

    x += w + 8 + random() * 20;
  }
  return { canvas, width, height };
}

/**
 * Cinematic menu backdrop: procedural neon skyline, rain and a rooftop ninja
 * silhouette. Runs independently of the game engine and pauses when hidden.
 */
export function MenuBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const far = bakeSkyline(5, {
      baseY: 600,
      minH: 140,
      maxH: 280,
      minW: 42,
      maxW: 110,
      color: "#0A1121",
      windowColors: ["#21527F", "#2C6A9B", "#3B8AA8"],
      signColors: ["#00E5FF", "#246BFD"],
      density: 0.2,
    });
    const mid = bakeSkyline(17, {
      baseY: 690,
      minH: 200,
      maxH: 400,
      minW: 54,
      maxW: 140,
      color: "#08101F",
      windowColors: ["#2A5C8B", "#7B4FD8", "#1186A0"],
      signColors: ["#8B5CF6", "#FF3155", "#00E5FF"],
      density: 0.24,
    });

    const rain = Array.from({ length: 130 }, () => ({
      x: Math.random() * 1400,
      y: Math.random() * 760,
      len: 8 + Math.random() * 18,
      speed: 480 + Math.random() * 520,
      alpha: 0.06 + Math.random() * 0.18,
    }));

    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let last = performance.now();
    let time = 0;
    let running = true;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const drawNinja = (x: number, y: number, scale: number, t: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);

      // Scarf
      ctx.strokeStyle = "#FF3155";
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(4, -56);
      for (let i = 1; i <= 5; i += 1) {
        const px = 4 - i * 13;
        const py = -56 + Math.sin(t * 2.2 + i * 0.6) * (i * 1.6) + i * 2;
        ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = "#FF8FA4";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Body silhouette
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#04070E";
      ctx.strokeStyle = "rgba(0,229,255,0.35)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-8, -52);
      ctx.quadraticCurveTo(0, -58, 9, -52);
      ctx.lineTo(11, -26);
      ctx.lineTo(6, -8);
      ctx.lineTo(-7, -8);
      ctx.lineTo(-11, -26);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Head
      ctx.beginPath();
      ctx.ellipse(2, -64, 8, 8.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Legs
      ctx.lineCap = "round";
      ctx.strokeStyle = "#04070E";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(-3, -10);
      ctx.lineTo(-9, 10);
      ctx.moveTo(4, -10);
      ctx.lineTo(10, 10);
      ctx.stroke();

      // Katana
      ctx.strokeStyle = "rgba(0,229,255,0.45)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-9, -40);
      ctx.lineTo(-24, -70);
      ctx.stroke();

      // Eye
      const glow = ctx.createRadialGradient(6, -65, 0, 6, -65, 9);
      glow.addColorStop(0, "rgba(0,229,255,0.9)");
      glow.addColorStop(1, "rgba(0,229,255,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(-4, -75, 20, 20);
      ctx.fillStyle = "#BFFBFF";
      ctx.fillRect(5, -66, 3, 1.6);

      ctx.restore();
    };

    const render = (now: number) => {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      time += dt;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const scale = Math.max(width / 1280, height / 720);
      const offsetX = (width - 1280 * scale) / 2;
      const offsetY = (height - 720 * scale) / 2;

      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);
      ctx.beginPath();
      ctx.rect(0, 0, 1280, 720);
      ctx.clip();

      // Sky
      const sky = ctx.createLinearGradient(0, 0, 0, 720);
      sky.addColorStop(0, "#03050C");
      sky.addColorStop(0.45, "#080F20");
      sky.addColorStop(0.78, "#101A32");
      sky.addColorStop(1, "#1B2440");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, 1280, 720);

      // Moon glow
      const moon = ctx.createRadialGradient(1010, 130, 0, 1010, 130, 220);
      moon.addColorStop(0, "rgba(122,154,214,0.35)");
      moon.addColorStop(0.5, "rgba(84,116,180,0.12)");
      moon.addColorStop(1, "rgba(84,116,180,0)");
      ctx.fillStyle = moon;
      ctx.fillRect(760, 0, 500, 420);
      ctx.fillStyle = "#D3E0FF";
      ctx.beginPath();
      ctx.arc(1010, 130, 44, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(170,190,230,0.35)";
      ctx.beginPath();
      ctx.arc(996, 118, 9, 0, Math.PI * 2);
      ctx.arc(1022, 142, 12, 0, Math.PI * 2);
      ctx.fill();

      // Parallax skylines
      const drift = (time * 6) % 380;
      ctx.globalAlpha = 0.9;
      ctx.drawImage(far.canvas, -drift - 120, -20, far.width, far.height);
      ctx.drawImage(mid.canvas, -drift * 1.7 - 80, 8, mid.width, mid.height);
      ctx.globalAlpha = 1;

      // Neon horizon haze
      const haze = ctx.createLinearGradient(0, 430, 0, 690);
      haze.addColorStop(0, "rgba(0,229,255,0)");
      haze.addColorStop(0.55, "rgba(36,107,253,0.08)");
      haze.addColorStop(1, "rgba(255,49,85,0.06)");
      ctx.fillStyle = haze;
      ctx.fillRect(0, 430, 1280, 260);

      // Foreground rooftop
      ctx.fillStyle = "#050912";
      ctx.beginPath();
      ctx.moveTo(0, 640);
      ctx.lineTo(360, 640);
      ctx.lineTo(360, 600);
      ctx.lineTo(780, 600);
      ctx.lineTo(780, 640);
      ctx.lineTo(1280, 640);
      ctx.lineTo(1280, 720);
      ctx.lineTo(0, 720);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(0,229,255,0.28)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, 640);
      ctx.lineTo(360, 640);
      ctx.lineTo(360, 600);
      ctx.lineTo(780, 600);
      ctx.lineTo(780, 640);
      ctx.lineTo(1280, 640);
      ctx.stroke();

      // Distant neon signage on the roof
      ctx.fillStyle = "rgba(255,49,85,0.75)";
      ctx.fillRect(820, 598, 54, 2);
      ctx.fillStyle = "rgba(0,229,255,0.55)";
      ctx.fillRect(88, 638, 40, 2);

      drawNinja(730, 600, 1.3, time);

      // Rain
      for (const drop of rain) {
        drop.y += drop.speed * dt;
        drop.x -= drop.speed * 0.06 * dt;
        if (drop.y > 730) {
          drop.y = -20;
          drop.x = Math.random() * 1400;
        }
        ctx.globalAlpha = drop.alpha;
        ctx.strokeStyle = "#9CC9F0";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - 1, drop.y - drop.len);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Fog at the base
      const fog = ctx.createLinearGradient(0, 560, 0, 720);
      fog.addColorStop(0, "rgba(20,32,56,0)");
      fog.addColorStop(1, "rgba(20,32,56,0.55)");
      ctx.fillStyle = fog;
      ctx.fillRect(0, 560, 1280, 160);

      ctx.restore();

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(render);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />;
}
