"use client";

import { useState } from "react";
import { submitApplicationAction } from "@/actions/apply";
import { artworkCount, type WorkType } from "@/lib/application";
import { ACCEPTED_MEDIA } from "./accepted-media";
import PhotoPicker, { type PhotoState } from "./photo-picker";

type Artwork = { title: string; medium: string; photo: PhotoState };

const emptyArtworks = (): Artwork[] => Array.from({ length: 6 }, () => ({ title: "", medium: "", photo: null }));

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block font-semibold mb-1">
        {label}
      </label>
      {hint && <p className="text-sm text-base-content/70 mb-1">{hint}</p>}
      {children}
      {error && (
        <p id={`${id}-error`} className="text-error text-sm mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

export default function ApplicationForm() {
  const [about, setAbout] = useState({ firstName: "", surname: "", address: "", phone: "", email: "" });
  const [background, setBackground] = useState({ experience: "", qualifications: "", otherMembership: "" });
  const [workType, setWorkType] = useState<WorkType | "">("");
  const [artworks, setArtworks] = useState<Artwork[]>(emptyArtworks);
  const [declaration, setDeclaration] = useState(false);
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState("");

  const count = workType ? artworkCount(workType) : 0;

  // An error disappears as soon as that answer is changed.
  const clear = (key: string) =>
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      if (Object.keys(next).length === 0) setMessage("");
      return next;
    });
  const setArtwork = (i: number, change: Partial<Artwork>) =>
    setArtworks((list) => list.map((a, j) => (j === i ? { ...a, ...change } : a)));
  const input = "input input-bordered w-full";
  const area = "textarea textarea-bordered w-full";
  const err = (key: string) => ({
    "aria-invalid": !!errors[key] || undefined,
    "aria-describedby": errors[key] ? `${key}-error` : undefined,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setMessage("");
    try {
      const result = await submitApplicationAction({
        ...about,
        ...background,
        workType,
        artworks: artworks.slice(0, count).map((a) => ({ title: a.title, medium: a.medium, photoId: a.photo?.id ?? "" })),
        declaration,
        website,
      });
      if (result.ok) {
        setSentTo(about.firstName.trim());
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setErrors(result.errors);
      setMessage(result.message);
      // Take them to the first thing that needs attention.
      const first = Object.keys(result.errors)[0];
      requestAnimationFrame(() => document.getElementById(first)?.focus());
    } catch {
      setMessage("Sorry, your application couldn't be sent just now. Please try again in a few minutes.");
    } finally {
      setSending(false);
    }
  };

  if (sentTo) {
    return (
      <div role="status" className="rounded-box border-2 border-success bg-success/10 p-6 space-y-2">
        <p className="font-display text-2xl">Thank you{sentTo ? `, ${sentTo}` : ""}.</p>
        <p>
          Your application has been received. The Membership Secretary will be in touch by email, and we look forward to
          seeing your work on the viewing day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-10">
      {/* Hidden from people; bots tend to fill it in. */}
      <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>

      <fieldset className="space-y-4">
        <legend className="font-display text-2xl mb-2">1. About you</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="firstName" label="First name" error={errors.firstName}>
            <input id="firstName" autoComplete="given-name" className={input} value={about.firstName}
              onChange={(e) => { setAbout({ ...about, firstName: e.target.value }); clear("firstName"); }} {...err("firstName")} />
          </Field>
          <Field id="surname" label="Surname" error={errors.surname}>
            <input id="surname" autoComplete="family-name" className={input} value={about.surname}
              onChange={(e) => { setAbout({ ...about, surname: e.target.value }); clear("surname"); }} {...err("surname")} />
          </Field>
        </div>
        <Field id="address" label="Address and postcode" error={errors.address}>
          <textarea id="address" rows={3} autoComplete="street-address" className={area} value={about.address}
            onChange={(e) => { setAbout({ ...about, address: e.target.value }); clear("address"); }} {...err("address")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="phone" label="Phone number" error={errors.phone}>
            <input id="phone" type="tel" autoComplete="tel" className={input} value={about.phone}
              onChange={(e) => { setAbout({ ...about, phone: e.target.value }); clear("phone"); }} {...err("phone")} />
          </Field>
          <Field id="email" label="Email" error={errors.email}>
            <input id="email" type="email" autoComplete="email" className={input} value={about.email}
              onChange={(e) => { setAbout({ ...about, email: e.target.value }); clear("email"); }} {...err("email")} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-display text-2xl mb-2">2. Your background</legend>
        <p className="text-sm text-base-content/70">All optional, but helpful to the committee.</p>
        <Field id="experience" label="Previous experience and personal statement"
          hint="For example, art school or courses you've attended, and anything you'd like to say about your work.">
          <textarea id="experience" rows={5} className={area} value={background.experience}
            onChange={(e) => setBackground({ ...background, experience: e.target.value })} />
        </Field>
        <Field id="qualifications" label="Qualifications">
          <textarea id="qualifications" rows={2} className={area} value={background.qualifications}
            onChange={(e) => setBackground({ ...background, qualifications: e.target.value })} />
        </Field>
        <Field id="otherMembership" label="Membership of other art organisations">
          <textarea id="otherMembership" rows={2} className={area} value={background.otherMembership}
            onChange={(e) => setBackground({ ...background, otherMembership: e.target.value })} />
        </Field>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-display text-2xl mb-2">3. Your work</legend>
        <div>
          <p id="workType" tabIndex={-1} className="font-semibold mb-2">Is your work 2D, 3D or a mixture?</p>
          <div role="radiogroup" aria-labelledby="workType" className="flex flex-wrap gap-3">
            {([
              ["2d", "2D (six works)"],
              ["3d", "3D (four works)"],
              ["mixed", "A mixture (six works)"],
            ] as const).map(([value, text]) => (
              <label key={value} className={`btn ${workType === value ? "btn-primary" : ""}`}>
                <input type="radio" name="workType" value={value} className="sr-only"
                  checked={workType === value} onChange={() => { setWorkType(value); clear("workType"); }} />
                {text}
              </label>
            ))}
          </div>
          {errors.workType && <p className="text-error text-sm mt-1">{errors.workType}</p>}
        </div>

        <datalist id="media-suggestions">
          {ACCEPTED_MEDIA.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>

        {artworks.slice(0, count).map((a, i) => (
          <div key={i} className="rounded-box border border-base-300 bg-base-100 p-4 space-y-3">
            <p className="font-semibold">Artwork {i + 1}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id={`title${i}`} label="Title" error={errors[`title${i}`]}>
                <input id={`title${i}`} className={input} value={a.title}
                  onChange={(e) => { setArtwork(i, { title: e.target.value }); clear(`title${i}`); }} {...err(`title${i}`)} />
              </Field>
              <Field id={`medium${i}`} label="Medium" error={errors[`medium${i}`]}>
                <input id={`medium${i}`} list="media-suggestions" placeholder="e.g. Oil on canvas" className={input}
                  value={a.medium} onChange={(e) => { setArtwork(i, { medium: e.target.value }); clear(`medium${i}`); }} {...err(`medium${i}`)} />
              </Field>
            </div>
            <PhotoPicker id={`photo${i}`} label="Photo" value={a.photo} error={errors[`photo${i}`]}
              onChange={(photo) => { setArtwork(i, { photo }); clear(`photo${i}`); }} />
          </div>
        ))}
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="font-display text-2xl mb-2">4. Declaration</legend>
        <label className="flex items-start gap-3 cursor-pointer">
          <input id="declaration" type="checkbox" className="checkbox mt-0.5" checked={declaration}
            onChange={(e) => { setDeclaration(e.target.checked); clear("declaration"); }} {...err("declaration")} />
          <span>
            I certify that the works submitted are my own original works and are not directly copied from any other artist,
            photographer or image maker.
          </span>
        </label>
        {errors.declaration && <p id="declaration-error" className="text-error text-sm">{errors.declaration}</p>}
      </fieldset>

      <div className="space-y-3">
        {message && (
          <p role="alert" className="text-error">
            {message}
          </p>
        )}
        <button type="submit" className="btn btn-primary btn-lg" disabled={sending}>
          {sending ? "Sending…" : "Submit application"}
        </button>
      </div>
    </form>
  );
}
