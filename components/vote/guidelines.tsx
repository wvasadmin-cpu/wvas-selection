// The selection criteria, as published on the exhibitor application form.
const CRITERIA = [
  { letter: "A", name: "Cohesion", detail: "A consistent, high-quality body of work" },
  { letter: "B", name: "Technical skill", detail: "Effective use of materials and processes" },
  { letter: "C", name: "Individuality", detail: "Evidence of originality, creativity, or emotional engagement" },
  { letter: "D", name: "Presentation", detail: "Professional, exhibition-ready standard" },
];

export default function Guidelines() {
  return (
    <div className="rounded-box border border-secondary bg-secondary/10 p-4">
      <p className="font-semibold mb-1">Guidelines for selection</p>
      <p className="text-sm mb-2">
        Works are judged on artistic merit in relation to the standard of the Society&apos;s Annual Exhibitions, and on
        presentation (framing, mounting), against these criteria:
      </p>
      <ul className="text-sm space-y-1">
        {CRITERIA.map((c) => (
          <li key={c.letter}>
            <strong>
              {c.letter}: {c.name}.
            </strong>{" "}
            {c.detail}
          </li>
        ))}
      </ul>
    </div>
  );
}
