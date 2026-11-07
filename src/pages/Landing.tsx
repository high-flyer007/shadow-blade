import { useState } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  Crosshair,
  Eye,
  Settings as SettingsIcon,
  ShieldAlert,
  Swords,
  Wind,
  Zap,
} from "lucide-react";
import { MenuBackdrop } from "@/components/game/MenuBackdrop";
import { HowToPlayDialog } from "@/components/game/HowToPlayDialog";
import { SettingsDialog } from "@/components/game/SettingsDialog";

const CAPABILITIES = [
  {
    icon: Zap,
    title: "Shadow Dash",
    body: "A 200ms phase-step with full invincibility. Leave crimson afterimages, break attack windows and cross gaps no human should clear.",
    tag: "1.2s cooldown",
  },
  {
    icon: Swords,
    title: "Kenjutsu Triad",
    body: "Rising Cut, Ascending Fang, Crimson Tempest. Chain directional hitboxes inside a 0.5s window for critical damage and hit-stop.",
    tag: "3-hit combo",
  },
  {
    icon: Eye,
    title: "Vision AI",
    body: "Guards sweep real sight cones with line-of-sight occlusion. Break contact and they hunt your last known position before returning to patrol.",
    tag: "12 hostiles",
  },
  {
    icon: Wind,
    title: "Verticality",
    body: "Double jump, coyote time, wall slides and directional wall kicks. Every rooftop is a route if you commit to the movement.",
    tag: "Skill ceiling",
  },
];

const CONTROL_ROWS = [
  { keys: ["A", "D", "←", "→"], label: "Move" },
  { keys: ["SPACE"], label: "Jump / Double jump" },
  { keys: ["SHIFT"], label: "Shadow Dash" },
  { keys: ["J"], label: "Katana combo" },
  { keys: ["I"], label: "Throw shuriken" },
  { keys: ["ESC"], label: "Pause / resume" },
];

function DossierCard() {
  return (
    <div className="relative">
      <div className="absolute -inset-px bg-gradient-to-br from-neon-cyan/25 via-transparent to-neon-crimson/20 opacity-70 blur-[1px]" />
      <div className="sb-panel sb-cut relative overflow-hidden p-5 md:p-7">
        <div className="absolute top-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-neon-cyan/60 to-transparent" />
        <div className="flex items-start justify-between">
          <div>
            <div className="sb-label text-neon-cyan/70">MISSION DOSSIER</div>
            <div className="mt-1 font-display text-xl tracking-wide text-white uppercase">
              Sector <span className="text-neon-cyan">07</span>
            </div>
            <div className="text-[10px] tracking-[0.22em] text-white/35 uppercase">
              The Forgotten District
            </div>
          </div>
          <div className="rotate-3 border border-neon-crimson/50 px-2 py-1 text-[8px] font-bold tracking-[0.22em] text-neon-crimson/90 uppercase">
            Classified
          </div>
        </div>

        <div className="sb-hairline my-5" />

        <div className="grid grid-cols-3 gap-3">
          <div>
            <div className="sb-label text-[8px]">THREAT</div>
            <div className="mt-1 text-[13px] font-bold text-neon-crimson">SEVERE</div>
            <div className="mt-1.5 flex gap-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <span
                  key={level}
                  className={`h-1 flex-1 ${level <= 4 ? "bg-neon-crimson/80" : "bg-white/10"}`}
                />
              ))}
            </div>
          </div>
          <div>
            <div className="sb-label text-[8px]">HOSTILES</div>
            <div className="sb-num mt-1 text-[13px] font-bold text-white">12</div>
            <div className="mt-1.5 text-[8px] tracking-[0.14em] text-white/30 uppercase">
              7 guards · 5 drones
            </div>
          </div>
          <div>
            <div className="sb-label text-[8px]">EXFIL</div>
            <div className="mt-1 text-[13px] font-bold text-neon-purple">LOCKED</div>
            <div className="mt-1.5 text-[8px] tracking-[0.14em] text-white/30 uppercase">
              Clear all targets
            </div>
          </div>
        </div>

        <div className="sb-panel-crimson sb-cut-sm relative mt-5 border border-white/5 p-3">
          <svg viewBox="0 0 340 96" className="w-full" role="img" aria-label="Sector 07 route map">
            <defs>
              <linearGradient id="route" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.15" />
                <stop offset="55%" stopColor="#00E5FF" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#39FF88" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            <g stroke="rgba(120,160,210,0.1)" strokeWidth="1">
              {[20, 40, 60, 80].map((y) => (
                <line key={y} x1="0" y1={y} x2="340" y2={y} />
              ))}
              {[40, 90, 140, 190, 240, 290].map((x) => (
                <line key={x} x1={x} y1="0" x2={x} y2="96" />
              ))}
            </g>
            <path
              d="M8 78 L52 78 L52 54 L96 54 L96 68 L142 68 L142 40 L188 40 L188 56 L232 56 L232 30 L282 30 L282 18 L332 18"
              fill="none"
              stroke="url(#route)"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <circle cx="8" cy="78" r="4" fill="#00E5FF" />
            <circle cx="332" cy="18" r="4" fill="#39FF88" />
            <g fill="#FF3155">
              <circle cx="96" cy="68" r="2.5" />
              <circle cx="188" cy="40" r="2.5" />
              <circle cx="232" cy="56" r="2.5" />
              <circle cx="282" cy="30" r="2.5" />
            </g>
            <text x="8" y="92" fill="rgba(0,229,255,0.55)" fontSize="6" fontFamily="monospace" letterSpacing="1.6">
              INFIL
            </text>
            <text x="296" y="10" fill="rgba(57,255,136,0.6)" fontSize="6" fontFamily="monospace" letterSpacing="1.6">
              EXFIL
            </text>
          </svg>
        </div>

        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[9px] tracking-[0.2em] text-white/35 uppercase">
            <Crosshair className="size-3 text-neon-crimson/70" />
            Operative: Shadow-07
          </div>
          <Link
            to="/play"
            className="group inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-neon-cyan uppercase transition hover:text-white"
          >
            Deploy now
            <ArrowRight className="size-3 transition group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const [howToOpen, setHowToOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#04070d] text-white">
      <div className="fixed inset-0 z-0">
        <MenuBackdrop />
        <div className="absolute inset-0 bg-[radial-gradient(125%_100%_at_18%_8%,rgba(4,7,13,0.18),rgba(4,7,13,0.9))]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#04070d]/30 via-transparent to-[#04070d]" />
        <div className="sb-grid absolute inset-0 opacity-30" />
        <div className="sb-scanlines absolute inset-0 opacity-60" />
      </div>

      <header className="relative z-20 border-b border-white/[0.06] bg-[#04070d]/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 md:px-10">
          <div className="flex items-center gap-3">
            <div className="sb-cut-sm relative grid size-9 place-items-center border border-neon-cyan/40 bg-neon-cyan/[0.06]">
              <span className="font-display text-sm leading-none text-neon-cyan">影</span>
              <span className="absolute -right-1 -bottom-1 size-1.5 bg-neon-crimson" />
            </div>
            <div>
              <div className="font-display text-[13px] font-bold tracking-[0.22em] text-white uppercase md:text-sm">
                Shadow Blade
              </div>
              <div className="text-[8px] tracking-[0.32em] text-white/30 uppercase">
                Sector 07 // 2091
              </div>
            </div>
          </div>

          <nav className="hidden items-center gap-8 text-[10px] font-semibold tracking-[0.22em] text-white/40 uppercase md:flex">
            <a href="#capabilities" className="transition hover:text-neon-cyan">
              Systems
            </a>
            <a href="#dossier" className="transition hover:text-neon-cyan">
              District
            </a>
            <a href="#controls" className="transition hover:text-neon-cyan">
              Controls
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-1.5 text-[9px] tracking-[0.2em] text-neon-green/70 uppercase sm:flex">
              <span className="sb-dot-pulse size-1.5 rounded-full bg-neon-green shadow-[0_0_8px_#39FF88]" />
              Engine online
            </div>
            <Link
              to="/play"
              className="sb-cut-sm group flex items-center gap-2 bg-neon-cyan px-4 py-2 text-[10px] font-bold tracking-[0.2em] text-[#04121a] uppercase transition hover:bg-[#69f2ff]"
            >
              New game
              <ArrowRight className="size-3 transition group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto flex min-h-[calc(100svh-73px)] max-w-[1440px] items-center px-5 pt-10 pb-14 md:px-10 md:pt-14">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] xl:gap-20">
          <div className="sb-rise">
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-neon-crimson" />
              <span className="text-[9px] font-semibold tracking-[0.32em] text-neon-crimson/90 uppercase">
                Rooftop infiltration // one blade
              </span>
            </div>

            <h1 className="sb-title sb-title-flicker mt-5 text-[21vw] leading-[0.78] text-white sm:text-[15vw] lg:text-[10.2rem]">
              <span className="block">Shadow</span>
              <span className="relative inline-block text-neon-cyan sb-glow-cyan">
                Blade
                <span className="absolute top-[46%] -left-[6%] h-[3px] w-[112%] -rotate-[7deg] bg-neon-crimson/70 shadow-[0_0_24px_rgba(255,49,85,0.7)]" />
              </span>
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
              <span className="font-display text-lg tracking-[0.3em] text-white/20">影刃</span>
              <span className="h-8 w-px bg-white/10" />
              <p className="max-w-md text-[11px] leading-relaxed tracking-[0.18em] text-white/45 uppercase">
                The city forgot your name.
                <br />
                <span className="text-white/75">The shadows remember.</span>
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-stretch gap-3">
              <Link
                to="/play"
                className="group relative flex items-center gap-3 overflow-hidden bg-neon-cyan px-7 py-4 text-[11px] font-bold tracking-[0.26em] text-[#03101a] uppercase transition hover:bg-[#6df4ff]"
              >
                <span className="absolute inset-y-0 -left-10 w-8 -skew-x-12 bg-white/60 opacity-0 blur-md transition-all duration-500 group-hover:left-[110%] group-hover:opacity-100" />
                New game
                <ArrowRight className="size-4 transition group-hover:translate-x-1" />
              </Link>
              <button
                type="button"
                onClick={() => setHowToOpen(true)}
                className="sb-cut-sm border border-white/15 bg-white/[0.03] px-6 py-4 text-[11px] font-semibold tracking-[0.24em] text-white/70 uppercase transition hover:border-neon-cyan/50 hover:text-white"
              >
                How to play
              </button>
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                aria-label="Open settings"
                className="group flex items-center gap-2 border border-white/10 bg-white/[0.02] px-4 py-4 text-[10px] font-semibold tracking-[0.2em] text-white/40 uppercase transition hover:border-white/30 hover:text-white"
              >
                <SettingsIcon className="size-3.5 transition group-hover:rotate-45" />
                <span className="hidden sm:inline">Settings</span>
              </button>
            </div>

            <div className="mt-8 grid max-w-lg grid-cols-3 divide-x divide-white/10 border-y border-white/[0.08] py-3">
              {[
                { value: "12", label: "Hostiles" },
                { value: "3×", label: "Combo chain" },
                { value: "60", label: "FPS target" },
              ].map((stat) => (
                <div key={stat.label} className="px-4 first:pl-0">
                  <div className="sb-num font-display text-xl font-bold text-white">{stat.value}</div>
                  <div className="mt-0.5 text-[8px] tracking-[0.22em] text-white/30 uppercase">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-4 text-[9px] tracking-[0.2em] text-white/25 uppercase">
              <span className="flex items-center gap-1.5">
                <span className="size-1 rounded-full bg-neon-cyan/70" />
                Keyboard recommended
              </span>
              <span className="hidden sm:inline">ESC to pause</span>
              <span className="hidden md:inline">Full audio on first input</span>
            </div>
          </div>

          <div className="sb-rise hidden sm:block" style={{ animationDelay: "140ms" }}>
            <DossierCard />
          </div>
        </div>
      </section>

      <section
        id="capabilities"
        className="relative z-10 border-t border-white/[0.07] bg-[#04070d]/[0.94] py-20 md:py-28"
      >
        <div className="mx-auto max-w-[1440px] px-5 md:px-10">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-neon-cyan/60" />
                <span className="sb-label text-neon-cyan/70">Combat systems</span>
              </div>
              <h2 className="sb-title mt-4 max-w-2xl text-4xl text-white md:text-6xl">
                Built to move.
                <br />
                <span className="text-white/35">Born to cut.</span>
              </h2>
            </div>
            <p className="max-w-xs text-xs leading-relaxed text-white/35">
              A fixed-timestep simulation with real hitboxes, vision occlusion and hit-stop. Every
              effect is drawn procedurally — no sprite sheets, no shortcuts.
            </p>
          </div>

          <div className="mt-12 grid gap-px border border-white/[0.08] bg-white/[0.06] sm:grid-cols-2 xl:grid-cols-4">
            {CAPABILITIES.map((capability, index) => {
              const Icon = capability.icon;
              return (
                <div
                  key={capability.title}
                  className="group relative bg-[#050a13] p-6 transition duration-300 hover:bg-[#07101c] md:p-7"
                >
                  <div className="flex items-start justify-between">
                    <div className="grid size-10 place-items-center border border-neon-cyan/20 bg-neon-cyan/[0.05] text-neon-cyan transition group-hover:border-neon-cyan/60 group-hover:shadow-[0_0_24px_rgba(0,229,255,0.16)]">
                      <Icon className="size-4" strokeWidth={2} />
                    </div>
                    <span className="sb-num text-[10px] text-white/15">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-7 font-display text-lg font-bold tracking-wide text-white uppercase">
                    {capability.title}
                  </h3>
                  <p className="mt-2.5 text-[11px] leading-relaxed text-white/40">
                    {capability.body}
                  </p>
                  <div className="mt-6 h-px w-full bg-gradient-to-r from-neon-cyan/30 to-transparent" />
                  <div className="mt-3 text-[8px] font-semibold tracking-[0.24em] text-neon-cyan/45 uppercase">
                    {capability.tag}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="dossier"
        className="relative z-10 border-t border-white/[0.07] bg-[#05080f]/[0.96] py-20 md:py-28"
      >
        <div className="mx-auto grid max-w-[1440px] gap-12 px-5 md:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-neon-crimson/70" />
              <span className="sb-label text-neon-crimson/80">Site intelligence</span>
            </div>
            <h2 className="sb-title mt-4 text-4xl text-white md:text-6xl">
              A city that forgot
              <br />
              <span className="text-neon-cyan sb-glow-cyan">its own name.</span>
            </h2>
            <p className="mt-6 max-w-xl text-sm leading-relaxed text-white/45">
              Sector 07 is a vertical graveyard of neon and rain. Rooftop patrols sweep the lower
              spine while surveillance drones hold the air routes. Cross the electric floors, time
              the laser gate, and cut a path to the extraction torii.
            </p>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/35">
              You are Shadow-07: no backup, no comms, one katana and five shuriken. The district does
              not negotiate.
            </p>

            <div className="mt-8 grid gap-2 sm:grid-cols-2">
              {[
                { icon: ShieldAlert, label: "Electric floors", note: "20 dmg · jump the strips" },
                { icon: Crosshair, label: "Laser gate", note: "Timed 2.6s cycle" },
                { icon: Eye, label: "Vision cones", note: "Break line of sight" },
                { icon: Zap, label: "Guard telegraphs", note: "Punish the wind-up" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 border border-white/[0.07] bg-white/[0.015] px-3.5 py-3"
                  >
                    <Icon className="size-3.5 text-neon-crimson/70" />
                    <div>
                      <div className="text-[10px] font-semibold tracking-[0.14em] text-white/75 uppercase">
                        {item.label}
                      </div>
                      <div className="text-[9px] text-white/30">{item.note}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 border-l-2 border-neon-cyan/40 bg-neon-cyan/[0.03] px-5 py-4">
              <p className="font-display text-sm tracking-[0.18em] text-white/60 uppercase">
                “The extraction gate opens only when the district is silent.”
              </p>
              <div className="mt-2 text-[9px] tracking-[0.24em] text-white/25 uppercase">
                — Handler, final transmission
              </div>
            </div>
          </div>

          <div id="controls" className="lg:pt-6">
            <div className="sb-panel sb-cut relative p-6 md:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <div className="sb-label text-neon-cyan/70">Operator interface</div>
                  <div className="mt-1 font-display text-2xl tracking-wide text-white uppercase">
                    Controls
                  </div>
                </div>
                <div className="font-display text-3xl text-white/10">影</div>
              </div>

              <div className="mt-6 space-y-2.5">
                {CONTROL_ROWS.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-4 border-b border-white/[0.07] pb-2.5 last:border-b-0"
                  >
                    <div className="flex flex-wrap gap-1">
                      {row.keys.map((key) => (
                        <kbd
                          key={key}
                          className="inline-flex min-w-7 items-center justify-center border border-white/15 bg-white/[0.05] px-1.5 py-1 text-[10px] font-semibold text-[#d7e6ff]"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                    <span className="text-[10px] font-semibold tracking-[0.18em] text-white/50 uppercase">
                      {row.label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center gap-3 border border-white/[0.08] bg-white/[0.02] px-3 py-2.5">
                <span className="size-1.5 rounded-full bg-neon-green shadow-[0_0_8px_#39FF88]" />
                <p className="text-[9px] leading-relaxed tracking-[0.1em] text-white/35 uppercase">
                  Touch overlay on mobile · gamepad-ready input abstraction
                </p>
              </div>

              <Link
                to="/play"
                className="group mt-5 flex items-center justify-between border border-neon-cyan/40 bg-neon-cyan/[0.07] px-5 py-3.5 transition hover:bg-neon-cyan/[0.16]"
              >
                <span className="text-[11px] font-bold tracking-[0.24em] text-neon-cyan uppercase">
                  Begin infiltration
                </span>
                <ArrowRight className="size-4 text-neon-cyan transition group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 overflow-hidden border-t border-white/[0.07] bg-[#04070d]/[0.97] py-24 md:py-32">
        <div className="pointer-events-none absolute inset-x-0 top-1/2 -z-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/25 to-transparent" />
        <div className="relative mx-auto max-w-[1440px] px-5 text-center md:px-10">
          <div className="sb-label text-white/25">Sector 07 awaits</div>
          <h2 className="sb-title mx-auto mt-5 max-w-4xl text-[11vw] leading-[0.9] md:text-7xl">
            <span className="text-white">The city forgot your name.</span>
            <br />
            <span className="text-neon-crimson sb-glow-crimson">The shadows remember.</span>
          </h2>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/play"
              className="group flex items-center gap-3 bg-neon-cyan px-8 py-4 text-[11px] font-bold tracking-[0.26em] text-[#03101a] uppercase transition hover:bg-[#6df4ff]"
            >
              New game
              <ArrowRight className="size-4 transition group-hover:translate-x-1" />
            </Link>
            <button
              type="button"
              onClick={() => setHowToOpen(true)}
              className="border border-white/15 px-8 py-4 text-[11px] font-semibold tracking-[0.24em] text-white/60 uppercase transition hover:border-white/35 hover:text-white"
            >
              Read the manual
            </button>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/[0.07] bg-[#03060c] px-5 py-8 md:px-10">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
          <div className="flex items-center gap-3">
            <span className="grid size-7 place-items-center border border-white/10 font-display text-[10px] text-white/40">
              影
            </span>
            <div>
              <div className="text-[10px] font-bold tracking-[0.24em] text-white/55 uppercase">
                Shadow Blade
              </div>
              <div className="text-[8px] tracking-[0.2em] text-white/20 uppercase">
                Procedural action platformer · Sector 07
              </div>
            </div>
          </div>
          <div className="text-[8px] tracking-[0.22em] text-white/20 uppercase">
            Canvas 2D · React · TypeScript · No external art assets
          </div>
          <div className="text-[8px] tracking-[0.22em] text-white/20 uppercase">
            © 2091 Forgotten District
          </div>
        </div>
      </footer>

      <HowToPlayDialog open={howToOpen} onOpenChange={setHowToOpen} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </main>
  );
}
