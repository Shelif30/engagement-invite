import { FRAME_COUNT, frameUrl } from "./config";

/** Shared frame cache: the splash preloads, the scroll scene draws. */
export const frames: (HTMLImageElement | null)[] = new Array(FRAME_COUNT).fill(null);

let started = false;
const listeners = new Set<(loaded: number) => void>();
let loadedCount = 0;

export function onFrameProgress(fn: (loaded: number) => void) {
  listeners.add(fn);
  fn(loadedCount);
  return () => listeners.delete(fn);
}

/** Loads frames in a coarse-to-fine order so scrubbing works early, then fills the gaps. */
export function preloadFrames() {
  if (started) return;
  started = true;
  const order: number[] = [];
  const seen = new Set<number>();
  for (const step of [16, 8, 4, 2, 1]) {
    for (let i = 0; i < FRAME_COUNT; i += step) {
      if (!seen.has(i)) {
        seen.add(i);
        order.push(i);
      }
    }
  }
  let next = 0;
  const worker = () => {
    if (next >= order.length) return;
    const i = order[next++];
    const img = new Image();
    img.decoding = "async";
    img.onload = img.onerror = () => {
      if (img.naturalWidth) frames[i] = img;
      loadedCount++;
      listeners.forEach((l) => l(loadedCount));
      worker();
    };
    img.src = frameUrl(i);
  };
  for (let k = 0; k < 6; k++) worker();
}

/** Nearest loaded frame to index i, so the canvas never goes blank while loading. */
export function nearestFrame(i: number): HTMLImageElement | null {
  if (frames[i]) return frames[i];
  for (let d = 1; d < FRAME_COUNT; d++) {
    if (frames[i - d]) return frames[i - d];
    if (frames[i + d]) return frames[i + d];
  }
  return null;
}
