// The acknowledgement emails sent after someone submits an application form.
// Pure: builds the message; lib/mailer.ts sends it. The postal address is left
// out on purpose, in case the email address was mistyped.

import type { CleanApplication } from "./application";
import { longDate } from "./intake";
import type { CleanMembership } from "./membership";
import { paymentReference } from "./membership";
import { ASSOCIATE_FEE, BANK } from "./society";

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
  /** Pictures shown in the email: the html refers to each as cid:<cid>. */
  images: { cid: string; url: string }[];
};

const SIGN_OFF = "WVAS Membership Secretary";
const OUTRO = "If anything above is wrong, just reply to this email.";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** "07700 900123" -> "ending 123": enough to recognise, not enough to misuse. */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 3 ? `ending ${digits.slice(-3)}` : "";
}

type Row = [string, string];
type Section = { heading: string; rows: Row[] };

const COLOUR = { heading: "#3d5268", label: "#6b7c8d", text: "#26323e", box: "#edf1f5", border: "#9db2c7" };

function sectionsHtml(sections: Section[]): string {
  return sections
    .map(
      (s) =>
        `<tr><td colspan="2" style="padding:14px 0 4px;font-weight:bold;color:${COLOUR.heading};border-bottom:2px solid ${COLOUR.heading};">${esc(s.heading)}</td></tr>` +
        s.rows
          .map(
            ([label, value]) =>
              `<tr><td style="padding:5px 12px 5px 0;color:${COLOUR.label};width:130px;vertical-align:top;">${esc(label)}</td>` +
              `<td style="padding:5px 0;white-space:pre-line;">${esc(value)}</td></tr>`,
          )
          .join(""),
    )
    .join("");
}

function sectionsText(sections: Section[]): string {
  return sections.map((s) => `${s.heading.toUpperCase()}\n${s.rows.map(([l, v]) => `  ${l}: ${v.replace(/\n/g, "\n    ")}`).join("\n")}`).join("\n\n");
}

function wrapHtml(firstName: string, body: string): string {
  return (
    `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:${COLOUR.text};max-width:600px;">` +
    `<p>Dear ${esc(firstName)},</p>${body}` +
    `<p style="margin-top:20px;">${esc(OUTRO)}</p>` +
    `<p>Best wishes,<br>${SIGN_OFF}</p></div>`
  );
}

function bankLine(reference: string): string {
  return `${BANK.accountName}, ${BANK.bank}, account ${BANK.accountNumber}, sort code ${BANK.sortCode}, reference ${reference}.`;
}

/** Written as a short personal letter: a table-style "receipt" gets flagged as spam. */
export function associateAck(app: CleanMembership): EmailMessage {
  const reference = paymentReference(app.firstName, app.surname);
  const paras =
    app.payment === "paid"
      ? [
          `Thank you for applying to become an Associate Member of the Welland Valley Art Society. Your application has reached us safely.`,
          `You mentioned that you've paid the ${ASSOCIATE_FEE} annual fee by bank transfer, using the reference ${reference}. Once your payment has been confirmed, the Membership Secretary will send you a welcome email with your Associate membership details.`,
        ]
      : [
          `Thank you for applying to become an Associate Member of the Welland Valley Art Society. Your application has reached us safely.`,
          `If you haven't yet paid the ${ASSOCIATE_FEE} annual fee, please pay by bank transfer so that your membership can be confirmed: ${bankLine(reference)}`,
          `Once your payment has arrived, the Membership Secretary will send you a welcome email with your Associate membership details.`,
        ];
  paras.push("If any of your details need correcting, or you have any questions, just reply to this email.");

  const text = [`Dear ${app.firstName},`, "", ...paras.flatMap((p) => [p, ""]), "Best wishes,", SIGN_OFF].join("\n");
  const html =
    `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;">` +
    `<p>Dear ${esc(app.firstName)},</p>` +
    paras.map((p) => `<p>${esc(p)}</p>`).join("") +
    `<p>Best wishes,<br>${SIGN_OFF}</p></div>`;

  return { to: app.email, subject: "Your WVAS Associate Membership application", text, html, images: [] };
}

export function exhibitorAck(
  app: CleanApplication,
  options: { roundName: string; closesOn: string; viewing: string; today: string; thumbUrl: (photoId: string) => string },
): EmailMessage {
  const intro = `Thank you for applying to become an Exhibitor Member of the Welland Valley Art Society. We've received your application for the ${options.roundName} round; the details we have are below.`;
  const datesText = [
    `  Applications close: ${longDate(options.closesOn)}`,
    ...(options.viewing ? [`  Viewing and Voting Day: ${options.viewing}`] : []),
  ];
  const bring =
    "Please bring the works listed below to the Viewing and Voting Day. If any of them change, please submit a new form before the closing date.";
  const workType = { "2d": "2D", "3d": "3D", mixed: "A mixture of 2D and 3D" }[app.workType];

  const aboutRows: Row[] = [
    ["Name", `${app.firstName} ${app.surname}`],
    ["Email", app.email],
    ["Phone", maskPhone(app.phone)],
  ];
  const backgroundRows: Row[] = [
    ...(app.experience ? ([["Experience", app.experience]] as Row[]) : []),
    ...(app.qualifications ? ([["Qualifications", app.qualifications]] as Row[]) : []),
    ...(app.otherMembership ? ([["Other memberships", app.otherMembership]] as Row[]) : []),
  ];
  const sections: Section[] = [
    { heading: "About you", rows: aboutRows },
    ...(backgroundRows.length ? [{ heading: "Your background", rows: backgroundRows }] : []),
  ];

  const images = app.artworks.map((a, i) => ({ cid: `artwork${i + 1}`, url: options.thumbUrl(a.photoId) }));
  const worksText = app.artworks.map((a, i) => `  ${i + 1}. ${a.title} (${a.medium})`).join("\n");
  const worksHtml =
    `<tr><td colspan="2" style="padding:14px 0 4px;font-weight:bold;color:${COLOUR.heading};border-bottom:2px solid ${COLOUR.heading};">Your work: ${esc(workType)}</td></tr>` +
    app.artworks
      .map(
        (a, i) =>
          `<tr><td style="padding:8px 12px 8px 0;width:130px;vertical-align:top;"><img src="cid:artwork${i + 1}" alt="" width="120" style="display:block;width:120px;max-height:120px;object-fit:contain;border:1px solid #d9e1e9;"></td>` +
          `<td style="padding:8px 0;vertical-align:top;"><strong>${i + 1}. ${esc(a.title)}</strong><br><span style="color:${COLOUR.label};">${esc(a.medium)}</span></td></tr>`,
      )
      .join("");
  const declaration = `Confirmed on ${longDate(options.today)}: the works are your own original works.`;

  const text = [
    `Dear ${app.firstName},`,
    "",
    intro,
    "",
    "KEY DATES",
    ...datesText,
    "",
    bring,
    "",
    sectionsText(sections),
    "",
    `YOUR WORK: ${workType.toUpperCase()}`,
    worksText,
    "",
    "DECLARATION",
    `  ${declaration}`,
    "",
    OUTRO,
    "",
    "Best wishes,",
    SIGN_OFF,
  ].join("\n");

  const datesHtml =
    `<p><strong>Applications close:</strong> ${esc(longDate(options.closesOn))}` +
    (options.viewing ? `<br><strong>Viewing and Voting Day:</strong> ${esc(options.viewing)}` : "") +
    `</p>`;
  const html = wrapHtml(
    app.firstName,
    `<p>${esc(intro)}</p>${datesHtml}<p>${esc(bring)}</p>` +
      `<table style="border-collapse:collapse;width:100%;font-size:14px;">${sectionsHtml(sections)}${worksHtml}` +
      `<tr><td colspan="2" style="padding:14px 0 4px;font-weight:bold;color:${COLOUR.heading};border-bottom:2px solid ${COLOUR.heading};">Declaration</td></tr>` +
      `<tr><td colspan="2" style="padding:5px 0;">${esc(declaration)}</td></tr></table>`,
  );

  return { to: app.email, subject: `Application received: WVAS Exhibitor Membership (${options.roundName})`, text, html, images };
}
