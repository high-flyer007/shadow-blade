import { useSyncExternalStore } from "react";
import type { GameSettings } from "./GameConfig";

const STORAGE_KEY = "shadowblade.settings.v1";

const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 0.8,
  sfxVolume: 0.9,
  showFps: false,
  screenShake: true,
  muted: false,
};

let current: GameSettings = load();
const listeners = new Set<() => void>();

function load(): GameSettings {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<GameSettings>;
    return {
      masterVolume: clamp01(parsed.masterVolume ?? DEFAULT_SETTINGS.masterVolume),
      sfxVolume: clamp01(parsed.sfxVolume ?? DEFAULT_SETTINGS.sfxVolume),
      showFps: Boolean(parsed.showFps),
      screenShake: parsed.screenShake !== false,
      muted: Boolean(parsed.muted),
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function getSettings(): GameSettings {
  return current;
}

export function updateSettings(partial: Partial<GameSettings>): void {
  current = { ...current, ...partial };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Storage may be unavailable; settings still apply for this session.
  }
  listeners.forEach((listener) => listener());
}

export function resetSettings(): void {
  updateSettings({ ...DEFAULT_SETTINGS });
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useGameSettings(): GameSettings {
  return useSyncExternalStore(subscribe, getSettings, () => DEFAULT_SETTINGS);
}

export { DEFAULT_SETTINGS };
