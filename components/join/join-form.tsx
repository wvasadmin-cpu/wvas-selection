"use client";

import { useState, type ReactNode } from "react";
import { submitMembershipAction } from "@/actions/join";
import { paymentReference } from "@/lib/membership";
import { tidyCase } from "@/lib/name-match";
import BankDetails from "./bank-details";

/** The introduction and form; after submitting, only the thank-you message is shown. */
export default function JoinForm({ intro }: { intro: ReactNode }) {
  const [form, setForm] = useState({ firstName: "", surname: "", address: "", phone: "", email: "" });
  const [payment, setPayment] = useState<"" | "paid" | "later">("");
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<{ name: string; payment: string; reference: string } | null>(null);

  const reference = paymentReference(form.firstName, form.surname);

  // An error disappears as soon as that answer is changed.
  const clear = (key: string) =>
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      if (Object.keys(next).length === 0) setMessage("");
      return next;
    });
  const set = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    clear(key);
  };
  const field = (key: string) => ({
    id: key,
    "aria-invalid": !!errors[key] || undefined,
    "aria-describedby": errors[key] ? `${key}-error` : undefined,
  });
  const error = (key: string) =>
    errors[key] ? (
      <p id={`${key}-error`} className="text-error text-sm mt-1">
        {errors[key]}
      </p>
    ) : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setMessage("");
    try {
      const result = await submitMembershipAction({ ...form, payment, website });
      if (result.ok) {
        setSent({ name: tidyCase(form.firstName.trim()), payment, reference });
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setErrors(result.errors);
      setMessage(result.message);
      const first = Object.keys(result.errors)[0];
      requestAnimationFrame(() => document.getElementById(first)?.focus());
    } catch {
      setMessage("Sorry, your application couldn't be sent just now. Please try again in a few minutes.");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div role="status" className="rounded-box border-2 border-success bg-success/10 p-6 space-y-3">
        <p className="font-display text-2xl">Thank you{sent.name ? `, ${sent.name}` : ""}.</p>
        <p>Your application has been received.</p>
        {sent.payment === "later" ? (
          <>
            <p>
              <strong>Please now pay the £10 annual fee</strong> by bank transfer so that your membership can be
              confirmed:
            </p>
            <BankDetails reference={sent.reference} />
            <p>
              Once your payment has arrived, the Membership Secretary will send you a welcome email with your Associate
              membership details.
            </p>
          </>
        ) : (
          <p>
            Once your payment has been confirmed, the Membership Secretary will send you a welcome email with your
            Associate membership details.
          </p>
        )}
        <p className="text-sm text-base-content/70">You can now close this page.</p>
      </div>
    );
  }

  const input = "input input-bordered w-full";
  return (
    <div className="space-y-8">
      {intro}
      <hr className="border-base-300" />
      <form onSubmit={submit} noValidate className="space-y-5">
        {/* Hidden from people; bots tend to fill it in. */}
        <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
          <label htmlFor="website">Website</label>
          <input
            id="website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        <h3 className="font-display text-2xl">Your details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="block font-semibold mb-1">
              First name
            </label>
            <input
              {...field("firstName")}
              autoComplete="given-name"
              className={input}
              value={form.firstName}
              onChange={(e) => set("firstName", e.target.value)}
            />
            {error("firstName")}
          </div>
          <div>
            <label htmlFor="surname" className="block font-semibold mb-1">
              Surname
            </label>
            <input
              {...field("surname")}
              autoComplete="family-name"
              className={input}
              value={form.surname}
              onChange={(e) => set("surname", e.target.value)}
            />
            {error("surname")}
          </div>
        </div>
        <div>
          <label htmlFor="address" className="block font-semibold mb-1">
            Address and postcode
          </label>
          <textarea
            {...field("address")}
            rows={3}
            autoComplete="street-address"
            className="textarea textarea-bordered w-full"
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
          />
          {error("address")}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className="block font-semibold mb-1">
              Mobile or home phone
            </label>
            <input
              {...field("phone")}
              type="tel"
              autoComplete="tel"
              className={input}
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
            {error("phone")}
          </div>
          <div>
            <label htmlFor="email" className="block font-semibold mb-1">
              Email
            </label>
            <input
              {...field("email")}
              type="email"
              autoComplete="email"
              className={input}
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
            {error("email")}
          </div>
        </div>

        <h3 className="font-display text-2xl pt-4">Payment</h3>
        <div className="space-y-3">
          <p>
            Please pay the <strong>£10 annual fee</strong> by bank transfer, using your personal payment reference:
          </p>
          <BankDetails reference={reference || undefined} />
        </div>
        <div className="rounded-box border border-base-300 bg-base-100 p-4 space-y-3">
          <fieldset aria-describedby={errors.payment ? "payment-error" : undefined}>
            <legend id="payment" tabIndex={-1} className="font-semibold mb-2">
              Have you paid the £10 annual fee?
            </legend>
            <div className="space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  className="radio mt-0.5"
                  checked={payment === "paid"}
                  onChange={() => {
                    setPayment("paid");
                    clear("payment");
                  }}
                />
                <span>Yes, I&apos;ve paid by bank transfer{reference ? ` using the reference ${reference}` : ""}</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  className="radio mt-0.5"
                  checked={payment === "later"}
                  onChange={() => {
                    setPayment("later");
                    clear("payment");
                  }}
                />
                <span>Not yet, I&apos;ll pay shortly</span>
              </label>
            </div>
          </fieldset>
          {error("payment")}
        </div>

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
    </div>
  );
}
