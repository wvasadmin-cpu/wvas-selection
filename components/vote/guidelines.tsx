// The selection criteria, as published on the exhibitor application form.
const CRITERIA = [
  { name: "Cohesion", detail: "A consistent, quality body of work" },
  { name: "Technical skill", detail: "Effective use of medium, materials and processes" },
  { name: "Originality", detail: "Evidence of individuality, creativity and engagement" },
  { name: "Presentation", detail: "Professional, exhibition-ready standard" },
];

export default function Guidelines() {
  return (
    <div className="rounded-box border border-secondary bg-secondary/10 p-4">
      <p className="font-semibold mb-1">Guidelines for selection</p>
      <p className="text-sm mb-2">
        Works are judged on artistic merit in relation to these criteria:
      </p>
      <ul className="text-sm space-y-1">
        {CRITERIA.map((c) => (
          <li key={c.name}>
            <strong>{c.name}:</strong> {c.detail}
          </li>
        ))}
      </ul>
    </div>
  );
}
