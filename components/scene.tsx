import type { ReactNode } from "react";

/**
 * The brand's generated visuals: monochrome concrete and space with one orange plane or rim.
 * Shapes are the handoff's reference compositions. Used for the hero and for stories without
 * an image of their own; the same story always gets the same scene.
 */
const SCENES: Record<string, { viewBox: string; label: string; body: ReactNode }> = {
  wall: {
    viewBox: "0 0 800 450",
    label: "concrete planes with a signal-orange wall",
    body: (
      <>
        <rect width="800" height="450" fill="#1B1A18" />
        <polygon points="0,450 0,90 420,0 540,0 330,450" fill="#45423D" />
        <polygon points="0,450 0,250 300,140 250,450" fill="#33312D" />
        <polygon points="330,450 540,0 610,0 480,450" fill="#22211E" />
        <polygon points="560,450 660,120 800,96 800,450" fill="#D97757" />
        <path d="M690 112 L612 450 M730 106 L660 450 M770 100 L712 450" stroke="#1C1B19" strokeWidth="6" />
      </>
    ),
  },
  horizon: {
    viewBox: "0 0 800 450",
    label: "planet horizon with an orange rim",
    body: (
      <>
        <rect width="800" height="450" fill="#1C1B19" />
        <circle cx="560" cy="760" r="620" fill="#1F1E1B" stroke="#2F2D2A" strokeWidth="2" />
        <path d="M560 140 A620 620 0 0 1 1097 450" stroke="#D97757" strokeWidth="6" fill="none" />
        <circle cx="120" cy="80" r="2" fill="#A8A398" />
        <circle cx="260" cy="40" r="1.5" fill="#A8A398" />
        <circle cx="380" cy="110" r="1.5" fill="#A8A398" />
      </>
    ),
  },
  cube: {
    viewBox: "0 0 400 300",
    label: "wireframe cube with an orange plane",
    body: (
      <>
        <rect width="400" height="300" fill="#1D1C1A" />
        <polygon points="200,70 330,46 330,226 200,250" fill="#D97757" />
        <path
          d="M90 96 L220 72 L220 252 L90 276 Z M90 96 L200 70 M220 72 L330 46 M220 252 L330 226 M90 276 L200 250"
          stroke="#45423D"
          strokeWidth="2"
          fill="none"
        />
      </>
    ),
  },
  stairs: {
    viewBox: "0 0 400 300",
    label: "concrete stair planes",
    body: (
      <>
        <rect width="400" height="300" fill="#22211E" />
        <polygon points="0,300 0,180 140,150 140,300" fill="#45423D" />
        <polygon points="140,300 140,120 270,90 270,300" fill="#33312D" />
        <polygon points="270,300 270,60 400,30 400,300" fill="#F4F1EA" />
        <rect x="270" y="210" width="130" height="10" fill="#D97757" />
      </>
    ),
  },
  curve: {
    viewBox: "0 0 400 300",
    label: "curved wall with an orange slit",
    body: (
      <>
        <rect width="400" height="300" fill="#1C1B19" />
        <path d="M0 300 C 120 220 220 120 400 0 L400 300 Z" fill="#33312D" />
        <path d="M0 300 C 160 250 280 170 400 90 L400 300 Z" fill="#A8A398" />
        <path d="M250 300 C 300 260 350 220 400 190" stroke="#D97757" strokeWidth="10" fill="none" />
      </>
    ),
  },
};

export type SceneName = keyof typeof SCENES;
const STORY_SCENES: SceneName[] = ["horizon", "cube", "stairs", "curve", "wall"];

/** A stable scene for a story id. */
export function sceneFor(id: string): SceneName {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return STORY_SCENES[h % STORY_SCENES.length];
}

export function Scene({ name, className = "" }: { name: SceneName; className?: string }) {
  const scene = SCENES[name];
  return (
    <svg
      viewBox={scene.viewBox}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={`Brand visual: ${scene.label}`}
      className={`block h-full w-full ${className}`}
    >
      {scene.body}
    </svg>
  );
}
