// Everything about the event lives here, so details can be changed in one place.
export const EVENT = {
  groom: "Shelif",
  bride: "Greena",
  // Countdown runs to the ceremony time in India (IST).
  countdownTo: "2026-12-06T10:00:00+05:30",
  dateLong: "Sunday, 6 December 2026",
  time: "10:00 AM",
  dateParts: ["Sunday", "06", "December", "2026"] as const,
  venue: "Jubilee Hall",
  venueArea: "Carmel Nagar, Nagercoil",
  mapsUrl: "https://maps.app.goo.gl/mxGNMNPjv7VdpNnN6",
};

export const VERSES = {
  main: {
    text: "Two are better than one; because they have a good reward for their labour. And a threefold cord is not quickly broken.",
    ref: "Ecclesiastes 4:9, 12",
  },
  closing: {
    text: "Many waters cannot quench love, neither can the floods drown it.",
    ref: "Song of Solomon 8:7",
  },
};

const base = import.meta.env.BASE_URL;
export const FRAME_COUNT = 238;
export const frameUrl = (i: number) =>
  `${base}frames/f${String(i).padStart(3, "0")}.webp`;
export const asset = (p: string) => `${base}${p}`;

export const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
