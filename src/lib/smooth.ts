import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { reducedMotion } from "./config";

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);
// Phones resize the viewport when the address bar shows/hides; don't recalculate (and jump) on that.
ScrollTrigger.config({ ignoreMobileResize: true });

let lenis: Lenis | null = null;

export function startSmoothScroll() {
  // "?capture" turns smooth scrolling off so a screen recorder can drive the scroll itself.
  if (
    lenis ||
    reducedMotion() ||
    new URLSearchParams(location.search).has("capture")
  )
    return lenis;
  lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.9 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis?.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

export const getLenis = () => lenis;

export { gsap, ScrollTrigger };
