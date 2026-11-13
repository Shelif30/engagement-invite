/** Pieces shared by the splash and the film's closing frame: growing vines and butterflies. */
const SVGNS = "http://www.w3.org/2000/svg";
const LEAF_D = "M0 0 C 6 -7, 17 -7, 24 0 C 17 7, 6 7, 0 0 Z";
const LEAF_FILLS = ["#4f8a36", "#6aa244", "#86b84f", "#3f7a31", "#9cc65a"];

/** Grow leaves (and optional bougainvillea clusters) along an SVG path; returns the created nodes. */
export function sproutAlong(path: SVGPathElement, holder: SVGGElement, spacing: number, scale: number, flowerAt: number[]) {
  const L = path.getTotalLength();
  const leaves: { el: SVGElement; at: number }[] = [];
  let side = 1;
  for (let d = spacing * 0.6; d < L - 4; d += spacing) {
    const p = path.getPointAtLength(d);
    const q = path.getPointAtLength(Math.min(L, d + 1));
    const ang = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
    const g = document.createElementNS(SVGNS, "g");
    g.setAttribute("transform", `translate(${p.x} ${p.y}) rotate(${ang + side * 52}) scale(${scale * (0.75 + Math.random() * 0.45)})`);
    const leaf = document.createElementNS(SVGNS, "path");
    leaf.setAttribute("d", LEAF_D);
    leaf.setAttribute("fill", LEAF_FILLS[(Math.random() * LEAF_FILLS.length) | 0]);
    const vein = document.createElementNS(SVGNS, "path");
    vein.setAttribute("d", "M1 0 L22 0");
    vein.setAttribute("stroke", "rgba(30,60,20,.35)");
    vein.setAttribute("stroke-width", "0.8");
    const inner = document.createElementNS(SVGNS, "g");
    inner.setAttribute("class", "sprout");
    inner.append(leaf, vein);
    g.append(inner);
    holder.append(g);
    leaves.push({ el: inner, at: d / L });
    side *= -1;
  }
  for (const f of flowerAt) {
    const p = path.getPointAtLength(L * f);
    const g = document.createElementNS(SVGNS, "g");
    g.setAttribute("transform", `translate(${p.x} ${p.y}) scale(${scale * 1.15})`);
    const inner = document.createElementNS(SVGNS, "g");
    inner.setAttribute("class", "sprout bloom");
    for (let k = 0; k < 3; k++) {
      const pet = document.createElementNS(SVGNS, "path");
      pet.setAttribute("d", "M0 0 C 9 -4, 12 -15, 0 -19 C -12 -15, -9 -4, 0 0 Z");
      pet.setAttribute("fill", k === 1 ? "#e43d86" : "#d0236b");
      pet.setAttribute("transform", `rotate(${k * 120 + Math.random() * 20})`);
      inner.append(pet);
    }
    const c = document.createElementNS(SVGNS, "circle");
    c.setAttribute("r", "2.6");
    c.setAttribute("fill", "#fff3c4");
    inner.append(c);
    g.append(inner);
    holder.append(g);
    leaves.push({ el: inner, at: f });
  }
  return { L, leaves };
}

export function Butterfly({ hue, className }: { hue: string; className: string }) {
  return (
    <svg className={`butterfly ${className}`} viewBox="-30 -24 60 48" aria-hidden="true">
      <g className="wing wing-l">
        <path d="M0 0 C -10 -22, -30 -22, -27 -6 C -25 4, -10 4, 0 0 Z" fill={hue} />
        <path d="M0 2 C -8 6, -22 12, -16 20 C -10 24, -3 12, 0 2 Z" fill={hue} opacity=".85" />
        <circle cx="-17" cy="-9" r="3.2" fill="#fff6dc" opacity=".8" />
      </g>
      <g className="wing wing-r">
        <path d="M0 0 C 10 -22, 30 -22, 27 -6 C 25 4, 10 4, 0 0 Z" fill={hue} />
        <path d="M0 2 C 8 6, 22 12, 16 20 C 10 24, 3 12, 0 2 Z" fill={hue} opacity=".85" />
        <circle cx="17" cy="-9" r="3.2" fill="#fff6dc" opacity=".8" />
      </g>
      <ellipse cx="0" cy="3" rx="1.6" ry="9" fill="#3b2a1d" />
      <path d="M0 -5 C -2 -12, -5 -15, -7 -16 M0 -5 C 2 -12, 5 -15, 7 -16" stroke="#3b2a1d" strokeWidth=".8" fill="none" />
    </svg>
  );
}


/** Draw every ".vine-path" inside `scope`, sprouting leaves and blooms along it, into timeline `tl`. */
export function growVines(scope: (sel: string) => Element[], tl: gsap.core.Timeline, start = 0.25, dur = 2.6) {
  scope(".vine-leaves").forEach((h) => (h as SVGGElement).replaceChildren());
  (scope(".vine-path") as SVGPathElement[]).forEach((path, i) => {
    const holder = path.parentNode!.querySelector<SVGGElement>(".vine-leaves")!;
    const flowers = (path.dataset.flowers ?? "").split(",").filter(Boolean).map(Number);
    const { L, leaves } = sproutAlong(path, holder, Number(path.dataset.spacing ?? 26), Number(path.dataset.scale ?? 1), flowers);
    const s = start + i * 0.12;
    tl.fromTo(path, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: dur, ease: "power2.inOut" }, s);
    leaves.forEach(({ el: leaf, at }) => {
      const bloom = leaf.classList.contains("bloom");
      tl.fromTo(leaf, { scale: 0, rotate: bloom ? -90 : -25, transformOrigin: "0px 0px" },
        { scale: 1, rotate: 0, duration: bloom ? 0.9 : 0.6, ease: bloom ? "back.out(2.2)" : "back.out(1.8)" },
        s + at * dur * 0.92 + (bloom ? 0.15 : 0));
    });
  });
}

/** The four corner vines used on the splash and the closing frame. */
export function CornerVines() {
  return (
    <>
      <svg className="vine vine-tl" viewBox="0 0 320 320" aria-hidden="true">
        <path className="vine-path" data-spacing="24" data-scale="1" data-flowers="0.35,0.72,0.98"
          d="M-6 18 C 60 30, 120 10, 170 40 S 250 120, 300 110" />
        <path className="vine-path" data-spacing="26" data-scale=".9" data-flowers="0.6,0.97"
          d="M14 -6 C 30 60, 10 120, 40 170 S 110 240, 96 300" />
        <g className="vine-leaves" />
      </svg>
      <svg className="vine vine-br" viewBox="0 0 320 320" aria-hidden="true">
        <path className="vine-path" data-spacing="24" data-scale="1" data-flowers="0.4,0.75,0.98"
          d="M326 300 C 260 290, 200 312, 150 280 S 70 200, 20 210" />
        <path className="vine-path" data-spacing="26" data-scale=".9" data-flowers="0.55,0.97"
          d="M306 326 C 290 260, 312 200, 280 150 S 210 80, 224 20" />
        <g className="vine-leaves" />
      </svg>
      <svg className="vine vine-tr" viewBox="0 0 320 320" aria-hidden="true">
        <path className="vine-path" data-spacing="25" data-scale=".85" data-flowers="0.5,0.96"
          d="M326 26 C 260 40, 230 20, 190 60 S 150 130, 110 120" />
        <g className="vine-leaves" />
      </svg>
      <svg className="vine vine-bl" viewBox="0 0 320 320" aria-hidden="true">
        <path className="vine-path" data-spacing="25" data-scale=".85" data-flowers="0.5,0.96"
          d="M-6 294 C 60 280, 90 300, 130 260 S 170 190, 210 200" />
        <g className="vine-leaves" />
      </svg>
    </>
  );
}
