/**
 * Line drawing of a round corrugated steel tank with its PVC liner, so buyers
 * can see the liner is made for round tanks. Drawn in code, not a photo.
 */
export function PvcLinerDiagram({
  diameterLabel = "Tank diameter",
  heightLabel = "Tank height",
  caption = "Each liner is round, made for a round corrugated steel tank or pond: a circular floor, the wall, and a 300 mm fold-over that clips over the rim.",
}: {
  diameterLabel?: string;
  heightLabel?: string;
  caption?: string;
}) {
  const ribs = [104, 124, 144, 164, 184];
  return (
    <figure className="pvc-diagram">
      <svg
        viewBox="0 0 440 290"
        role="img"
        aria-label={`Sketch of a round steel tank with a PVC liner covering the floor and wall and folding over the rim. ${diameterLabel} is measured across the top, ${heightLabel.toLowerCase()} up the wall.`}
        className="pvc-diagram__svg"
      >
        {/* tank wall */}
        <path d="M50 84 V204 A150 36 0 0 0 350 204 V84" className="pvc-diagram__steel" />
        {ribs.map((y) => (
          <path key={y} d={`M50 ${y} A150 36 0 0 0 350 ${y}`} className="pvc-diagram__rib" />
        ))}
        {/* liner: fold-over band, inside wall and floor */}
        <path d="M50 84 A150 36 0 0 0 350 84 V96 A150 36 0 0 1 50 96 Z" className="pvc-diagram__fold" />
        <ellipse cx="200" cy="84" rx="150" ry="36" className="pvc-diagram__liner" />
        <ellipse cx="200" cy="96" rx="132" ry="27" className="pvc-diagram__floor" />
        {/* diameter */}
        <path d="M50 30 H350 M50 22 V46 M350 22 V46" className="pvc-diagram__dim" />
        <path d="M58 25 L50 30 L58 35 M342 25 L350 30 L342 35" className="pvc-diagram__dim" />
        <text x="200" y="20" textAnchor="middle" className="pvc-diagram__label">
          {diameterLabel}
        </text>
        {/* height */}
        <path d="M384 84 V204 M376 84 H392 M376 204 H392" className="pvc-diagram__dim" />
        <path d="M379 92 L384 84 L389 92 M379 196 L384 204 L389 196" className="pvc-diagram__dim" />
        <text x="398" y="148" className="pvc-diagram__label" transform="rotate(90 398 148)" textAnchor="middle">
          {heightLabel}
        </text>
        {/* callouts */}
        <path d="M118 112 L96 262" className="pvc-diagram__lead" />
        <text x="60" y="280" className="pvc-diagram__label">
          Liner floor and wall
        </text>
        <path d="M300 104 L300 262" className="pvc-diagram__lead" />
        <text x="236" y="280" className="pvc-diagram__label">
          300 mm fold-over
        </text>
      </svg>
      <figcaption className="pvc-diagram__caption">{caption}</figcaption>
    </figure>
  );
}
