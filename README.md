# Shelif & Greena — Engagement Invitation

React + TypeScript + Vite, animated with GSAP (ScrollTrigger, MotionPath) and Lenis smooth scrolling.

## Run locally
    npm install
    npm run dev

## Build for hosting
    npm run build

Upload the `dist/` folder to any static host (Netlify, Vercel, GitHub Pages, Firebase Hosting).
Paths are relative, so it also works from a sub-folder.

## Change details
All names, date, venue, map link and Bible verses are in `src/lib/config.ts`.
The countdown runs to `countdownTo` (currently the start of 6 Dec 2026, India time). Set it to the
ceremony time, e.g. `"2026-12-06T10:30:00+05:30"`, to count down to the hour.

## Structure
- `src/components/Splash.tsx` — nature cover: growing vines, blooming bougainvillea, butterflies, sun rays, curtain-parting opening
- `src/components/FrameScroll.tsx` — scroll-played film from `public/frames` (the 238 ZIP frames)
- `src/components/Verse.tsx`, `Rings.tsx`, `Countdown.tsx`, `Venue.tsx`, `Closing.tsx` — the sections
- `src/components/FallingNature.tsx` — falling leaves, petals and fireflies (canvas)
- Fonts (Pinyon Script, Great Vibes, Cormorant Garamond, Cinzel; SIL Open Font License) are bundled in `src/fonts`.
