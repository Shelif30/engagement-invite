import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, getLenis } from "../lib/smooth";
import { EVENT, FRAME_COUNT } from "../lib/config";
import { frames, nearestFrame, onFrameProgress } from "../lib/frames";

/** Seconds the film takes when it plays by itself. */
const AUTOPLAY_SECONDS = 6;
/** After the guest stops scrolling, wait this long before the film carries on by itself. */
const RESUME_AFTER_MS = 2500;

type Mode = "playing" | "paused" | "waiting" | "done" | "idle";

/**
 * Where the couple stand across the film (0 = first frame, 1 = last), as a fraction of the
 * frame width. On tall phone screens only a slice of each wide frame fits, so the crop
 * follows this path to keep them centred: they enter on the right, walk to the middle,
 * and the closing close-ups sit left of centre.
 */
const COUPLE_PATH: [number, number][] = [
  [0, 0.6],
  [0.13, 0.76],
  [0.21, 0.68],
  [0.3, 0.58],
  [0.38, 0.53],
  [0.47, 0.52],
  [0.55, 0.48],
  [0.72, 0.48],
  [0.8, 0.52],
  [0.89, 0.43],
  [1, 0.37],
];
function coupleX(t: number) {
  for (let i = 1; i < COUPLE_PATH.length; i++) {
    const [t1, x1] = COUPLE_PATH[i];
    if (t <= t1) {
      const [t0, x0] = COUPLE_PATH[i - 1];
      const k = (t - t0) / (t1 - t0 || 1);
      const e = k * k * (3 - 2 * k);
      return x0 + (x1 - x0) * e;
    }
  }
  return COUPLE_PATH[COUPLE_PATH.length - 1][1];
}

/**
 * Scroll-scrubbed film: the ZIP frames are drawn to a canvas as the reader scrolls,
 * with story lines fading in over the top. Once the invitation is opened the film
 * plays by itself (it scrolls the page), and any wheel, touch, key or scrollbar use
 * takes over instantly; it carries on from wherever the guest leaves it.
 */
export default function FrameScroll({ active }: { active: boolean }) {
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const state = useRef({ frame: 0, drawn: -1 });
  const [mode, setMode] = useState<Mode>("playing");
  const userPaused = useRef(false);

  const draw = (force = false) => {
    const c = canvas.current;
    if (!c) return;
    const i = Math.round(state.current.frame);
    if (!force && i === state.current.drawn && frames[i]) return;
    const img = nearestFrame(i);
    if (!img) return;
    const ctx = c.getContext("2d")!;
    const cw = c.width,
      ch = c.height;
    // cover-fit; on tall phone screens keep the couple (slightly right of centre) in view
    const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * s,
      h = img.naturalHeight * s;
    // centre the couple, without ever showing past the frame's edges
    const centre = coupleX(state.current.frame / (FRAME_COUNT - 1));
    const x = Math.min(0, Math.max(cw - w, cw / 2 - centre * w));
    const y = (ch - h) * 0.5;
    ctx.drawImage(img, x, y, w, h);
    state.current.drawn = frames[i] ? i : -1;
  };

  useEffect(() => {
    const c = canvas.current!;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = Math.round(c.clientWidth * dpr);
      c.height = Math.round(c.clientHeight * dpr);
      draw(true);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(c);
    // redraw as frames arrive, so the nearest-frame stand-in gets replaced
    const off = onFrameProgress(() => draw());
    return () => {
      ro.disconnect();
      off();
    };
  }, []);

  // ---- autoplay ----
  useEffect(() => {
    if (!active) return;
    const sec = section.current!;
    // Phones/tablets: only real touches count as the guest taking over. (iOS Safari moves the
    // page by itself when its address bar collapses, so "unexpected movement" can't be trusted.)
    const touchScreen =
      window.matchMedia("(pointer: coarse)").matches ||
      "ontouchstart" in window;
    const endY = () => sec.offsetTop + sec.offsetHeight - window.innerHeight;
    const write = (y: number) => {
      const l = getLenis();
      // Touch screens: scroll natively (Lenis does not drive touch scrolling and Safari is
      // happiest with plain window.scrollTo). Desktop: go through Lenis so it stays in sync.
      if (l && !touchScreen) l.scrollTo(y, { immediate: true, force: true });
      else window.scrollTo(0, y);
    };

    let lastInput = -Infinity;
    let touching = false;
    let done = false;
    let pos = window.scrollY; // exact film position, kept as a float so rounding never stalls it
    let lastWritten = pos;
    let shown: Mode = "playing";
    const show = (m: Mode) => {
      if (m !== shown) {
        shown = m;
        setMode(m);
      }
    };

    const onInput = () => {
      lastInput = performance.now();
    };
    const onTouchStart = () => {
      touching = true;
      onInput();
    };
    const onTouchEnd = () => {
      touching = false;
      onInput();
    };
    const onKey = (e: KeyboardEvent) => {
      if (
        [
          "ArrowDown",
          "ArrowUp",
          "PageDown",
          "PageUp",
          "Home",
          "End",
          " ",
        ].includes(e.key)
      )
        onInput();
    };
    window.addEventListener("wheel", onInput, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onInput, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKey);

    const startAt = performance.now() + 1700; // let the cover finish parting first
    const tick = (_time: number, deltaMs: number) => {
      const now = performance.now();
      const y = window.scrollY;
      // after the film: show the "Scroll down" cue only while the guest is actually at the end
      if (done) {
        show(y >= endY() - window.innerHeight * 0.12 ? "done" : "idle");
        return;
      }
      // Desktop only: a scrollbar drag shows up as a big jump we didn't make.
      if (!touchScreen && Math.abs(y - lastWritten) > 30) lastInput = now;
      if (y >= endY() - 2) {
        done = true;
        show("done");
        return;
      }

      const holding =
        now < startAt ||
        userPaused.current ||
        touching ||
        now - lastInput < RESUME_AFTER_MS;
      if (holding) {
        pos = y;
        lastWritten = y;
        if (now >= startAt) show(userPaused.current ? "paused" : "waiting");
        return;
      }
      show("playing");
      const speed = (sec.offsetHeight - window.innerHeight) / AUTOPLAY_SECONDS;
      pos = Math.min(endY(), pos + (speed * Math.min(deltaMs, 50)) / 1000);
      write(pos);
      lastWritten = pos;
      if (pos >= endY() - 0.5) {
        done = true;
        show("done");
      }
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener("wheel", onInput);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onInput);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("keydown", onKey);
    };
  }, [active]);

  const scrollOn = () => {
    const next = section.current?.nextElementSibling as HTMLElement | null;
    if (!next) return;
    const l = getLenis();
    if (l) l.scrollTo(next, { duration: 1.6, offset: -40 });
    else next.scrollIntoView({ behavior: "smooth" });
  };

  const toggle = () => {
    userPaused.current = !userPaused.current;
    setMode(userPaused.current ? "paused" : "playing");
  };

  useGSAP(
    () => {
      const q = gsap.utils.selector(section);
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.8,
        },
      });
      tl.to(
        state.current,
        { frame: FRAME_COUNT - 1, duration: 10, onUpdate: () => draw() },
        0,
      );

      // story beats (positions are on the same 0–10 scale as the frames)
      const beat = (sel: string, at: number, len: number) => {
        tl.fromTo(
          q(sel),
          { opacity: 0, y: 40, filter: "blur(10px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.8,
            ease: "power2.out",
          },
          at,
        ).to(
          q(sel),
          {
            opacity: 0,
            y: -30,
            filter: "blur(8px)",
            duration: 0.7,
            ease: "power2.in",
          },
          at + len,
        );
      };
      beat(".beat-1", 0.3, 1.6);
      beat(".beat-2", 2.9, 1.7);
      beat(".beat-3", 5.4, 1.6);
      tl.fromTo(
        q(".beat-4"),
        { opacity: 0, scale: 0.9, filter: "blur(12px)" },
        {
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          duration: 1.0,
          ease: "power2.out",
        },
        7.8,
      );
      tl.fromTo(
        q(".beat-4 .b4-sub"),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6 },
        8.6,
      );
      tl.fromTo(
        q(".scroll-hint"),
        { opacity: 1 },
        { opacity: 0, duration: 0.4 },
        0,
      );
      tl.fromTo(
        q(".film-shade"),
        { opacity: 0.55 },
        { opacity: 0.85, duration: 2 },
        7.6,
      );
      tl.to(q(".film-progress i"), { scaleX: 1, duration: 10 }, 0);

      ScrollTrigger.refresh();
    },
    { scope: section },
  );

  return (
    <section className="film" ref={section} aria-label="Our story">
      <div className={`film-sticky${mode === "done" ? " is-done" : ""}`}>
        <canvas ref={canvas} className="film-canvas" aria-hidden="true" />
        <div className="film-shade" />
        <div className="film-copy">
          <p className="beat beat-1">
            <span className="script-lg">In a garden of grace</span>
            <span className="caps">our story began</span>
          </p>
          <p className="beat beat-2">
            <span className="script-lg">Two hearts, one path</span>
            <span className="caps">hand in hand, by His design</span>
          </p>
          <p className="beat beat-3">
            <span className="script-lg">A promise blooms</span>
            <span className="caps">with the blessing of our families</span>
          </p>
          <div className="beat beat-4">
            <h2 className="film-names">
              {EVENT.groom}
              <span className="amp">&amp;</span>
              {EVENT.bride}
            </h2>
            <p className="b4-sub caps">
              are getting engaged &middot; {EVENT.dateParts[1]}{" "}
              {EVENT.dateParts[2]} {EVENT.dateParts[3]}
            </p>
          </div>
        </div>
        <div className="scroll-hint" aria-hidden="true">
          <span>
            {mode === "playing" ? "Playing \u00b7 scroll any time" : "Scroll"}
          </span>
          <i />
        </div>
        {mode === "done" && (
          <button
            className="scroll-more"
            onClick={scrollOn}
            aria-label="Scroll down to the invitation"
          >
            <span className="sm-mouse" aria-hidden="true">
              <i />
            </span>
            <span className="sm-label">Scroll down</span>
            <span className="sm-chevrons" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M5 8l7 7 7-7" />
              </svg>
              <svg viewBox="0 0 24 24">
                <path d="M5 8l7 7 7-7" />
              </svg>
            </span>
          </button>
        )}
        {mode !== "done" && mode !== "idle" && (
          <button
            className="film-play"
            onClick={toggle}
            aria-label={mode === "paused" ? "Play the film" : "Pause the film"}
          >
            {mode === "paused" ? (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 5.5v13l10.5-6.5z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />
              </svg>
            )}
            <span>
              {mode === "paused"
                ? "Play"
                : mode === "waiting"
                  ? "Resuming\u2026"
                  : "Pause"}
            </span>
          </button>
        )}
        <div className="film-progress" aria-hidden="true">
          <i />
        </div>
      </div>
    </section>
  );
}
