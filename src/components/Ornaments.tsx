/** Hand-drawn style sprig divider; paths draw in via strokeDashoffset (pathLength=1). */
export function Sprig({ flip = false }: { flip?: boolean }) {
  return (
    <svg className={`sprig${flip ? " flip" : ""}`} viewBox="0 0 260 40" aria-hidden="true">
      <path pathLength={1} d="M10 20 C 60 20, 90 20, 130 20 S 200 20, 250 20" />
      <path pathLength={1} d="M40 20 C 46 10, 56 8, 62 10 C 58 18, 48 21, 40 20 Z" />
      <path pathLength={1} d="M70 20 C 76 30, 86 32, 92 30 C 88 22, 78 19, 70 20 Z" />
      <path pathLength={1} d="M220 20 C 214 10, 204 8, 198 10 C 202 18, 212 21, 220 20 Z" />
      <path pathLength={1} d="M190 20 C 184 30, 174 32, 168 30 C 172 22, 182 19, 190 20 Z" />
      <path pathLength={1} className="sprig-heart" d="M130 27 C 120 19, 121 11, 127 11 C 129 11, 130 13, 130 14 C 130 13, 131 11, 133 11 C 139 11, 140 19, 130 27 Z" />
    </svg>
  );
}
