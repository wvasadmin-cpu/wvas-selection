export const GUIDELINES =
  "Composition; Colour/Tone; Technical Ability; Originality; Visual Impact; Consistency; Intentionality.";

export default function Guidelines() {
  return (
    <div className="rounded-box border border-secondary bg-secondary/10 p-4">
      <p className="font-semibold mb-1">Guidelines for selection</p>
      <p className="text-sm">{GUIDELINES}</p>
    </div>
  );
}
