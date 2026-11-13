import { asset } from "./config";

/**
 * Background music for the whole site.
 * - Tries to start as soon as the page loads. Browsers (iPhone Safari above all) block sound
 *   until the visitor taps something, so if that is refused it starts on the first tap,
 *   which is normally "Open the invitation".
 * - Loops for as long as the page is open; closing the page stops it.
 * - Pauses while the guest is in another tab/app, and carries on when they come back.
 * - Once the guest turns it off, it stays off.
 */
const VOLUME = 0.6;

type Listener = (playing: boolean) => void;
const listeners = new Set<Listener>();
let audio: HTMLAudioElement | null = null;
let userStopped = false;
let pausedForHidden = false;
let fadeTimer = 0;

function el() {
  if (!audio) {
    audio = new Audio(asset("audio/love-theme.mp3"));
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = VOLUME;
    audio.addEventListener("play", () => listeners.forEach((l) => l(true)));
    audio.addEventListener("pause", () => listeners.forEach((l) => l(false)));
  }
  return audio;
}

function fadeIn() {
  const a = el();
  window.clearInterval(fadeTimer);
  try { a.volume = 0; } catch { /* iOS: volume is fixed by the device */ }
  let v = 0;
  fadeTimer = window.setInterval(() => {
    v = Math.min(VOLUME, v + VOLUME / 25);
    try { a.volume = v; } catch { /* ignore */ }
    if (v >= VOLUME) window.clearInterval(fadeTimer);
  }, 60);
}

/** Start the music (safe to call often). Resolves true if it is playing. */
export async function playMusic(): Promise<boolean> {
  if (userStopped) return false;
  const a = el();
  if (!a.paused) return true;
  try {
    await a.play();
    fadeIn();
    return true;
  } catch {
    return false; // blocked until the visitor interacts
  }
}

export function stopMusic() {
  userStopped = true;
  el().pause();
}

export function toggleMusic() {
  const a = el();
  if (a.paused) {
    userStopped = false;
    void playMusic();
  } else {
    stopMusic();
  }
}

export function onMusicChange(fn: Listener) {
  listeners.add(fn);
  fn(!!audio && !audio.paused);
  return () => listeners.delete(fn);
}

let installed = false;
/** Call once at start-up. */
export function installMusic() {
  if (installed) return;
  installed = true;
  el();

  // 1) try straight away
  void playMusic().then((ok) => {
    if (ok) return;
    // 2) otherwise start on the first tap / key press anywhere
    const kick = (e: Event) => {
      // the music button handles its own taps
      if ((e.target as Element | null)?.closest?.(".music-toggle")) return;
      void playMusic().then((started) => {
        if (started || userStopped) {
          ["pointerdown", "touchend", "keydown", "click"].forEach((e) => window.removeEventListener(e, kick, true));
        }
      });
    };
    ["pointerdown", "touchend", "keydown", "click"].forEach((e) => window.addEventListener(e, kick, true));
  });

  // 3) pause in the background, resume on return (unless the guest switched it off)
  document.addEventListener("visibilitychange", () => {
    const a = el();
    if (document.hidden) {
      if (!a.paused) { pausedForHidden = true; a.pause(); }
    } else if (pausedForHidden && !userStopped) {
      pausedForHidden = false;
      void playMusic();
    }
  });
  // closing / leaving the page
  window.addEventListener("pagehide", () => el().pause());
}
