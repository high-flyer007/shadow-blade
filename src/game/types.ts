import type { Camera } from "./core/Camera";
import type { ParticleSystem } from "./effects/ParticleSystem";
import type { FloatingTextSystem } from "./effects/FloatingText";
import type { AfterimageSystem } from "./effects/AfterimageSystem";
import type { AudioManager } from "./audio/AudioManager";

/** Services the simulation can use without knowing about React or the engine. */
export interface GameFx {
  particles: ParticleSystem;
  texts: FloatingTextSystem;
  afterimages: AfterimageSystem;
  audio: AudioManager;
  camera: Camera;
  time: number;
  shake(strength: number): void;
  hitStop(seconds: number): void;
}
