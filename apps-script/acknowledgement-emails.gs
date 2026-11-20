/**
 * WVAS application acknowledgement emails.
 *
 * A small web app that sends the acknowledgement emails for the exhibitor and
 * associate membership application forms (wvas-selection.netlify.app/apply
 * and /join). The website asks it to send each email straight after an
 * application is saved. Emails come from the Google account that deploys it
 * (normally wvasmembersec@gmail.com), the same way the exhibition entry
 * form's confirmations are sent.
 *
 * Set up once: see apps-script/SETUP.md.
 */

// ---- Settings ----
const SENDER_NAME = 'Welland Valley Art Society';
// Optional: also send a copy of every acknowledgement to this address
// (e.g. 'wvasmembersec@gmail.com'). Leave empty for no copies.
const COPY_TO = '';
// Pictures in exhibitor emails are fetched from the website; skip any larger than this.
const MAX_IMAGE_BYTES = 1500000;

/** Run once (from the dropdown above). Creates the shared secret and shows it in the log. */
function setup() {
  const props = PropertiesService.getScriptProperties();
  let secret = props.getProperty('RELAY_SECRET');
  if (!secret) {
    secret = Utilities.getUuid() + Utilities.getUuid();
    props.setProperty('RELAY_SECRET', secret.replace(/-/g, ''));
    secret = props.getProperty('RELAY_SECRET');
  }
  console.log('Copy this into Netlify as EMAIL_RELAY_SECRET (keep it private):\n' + secret);
  console.log('Emails left today: ' + MailApp.getRemainingDailyQuota());
}

/** Optional: sends a short test email to this account, to check sending works. */
function sendTestEmail() {
  const me = Session.getEffectiveUser().getEmail();
  MailApp.sendEmail({ to: me, subject: 'WVAS acknowledgement emails: test', body: 'Sending works.', name: SENDER_NAME });
  console.log('Test email sent to ' + me);
}

/** Called by the website. Expects JSON: { secret, to, subject, text, html, images: [{ cid, url }] }. */
function doPost(e) {
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const secret = PropertiesService.getScriptProperties().getProperty('RELAY_SECRET');
    if (!secret || data.secret !== secret) return reply_({ ok: false, error: 'not allowed' });

    const to = String(data.to || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return reply_({ ok: false, error: 'invalid email address' });
    if (!data.subject || !data.text || !data.html) return reply_({ ok: false, error: 'incomplete message' });
    if (MailApp.getRemainingDailyQuota() < 1) return reply_({ ok: false, error: 'daily email limit reached' });

    // Pictures shown in the email (small thumbnails of the artworks).
    const inlineImages = {};
    (data.images || []).slice(0, 8).forEach(function (img) {
      try {
        const res = UrlFetchApp.fetch(img.url, { muteHttpExceptions: true });
        const blob = res.getBlob();
        if (res.getResponseCode() === 200 && blob.getBytes().length <= MAX_IMAGE_BYTES) {
          inlineImages[img.cid] = blob.setName(img.cid + '.jpg');
        }
      } catch (err) {
        // A missing picture shouldn't stop the email.
      }
    });

    const message = {
      to: to,
      subject: String(data.subject).slice(0, 200),
      body: String(data.text),
      htmlBody: String(data.html),
      name: SENDER_NAME,
      inlineImages: inlineImages,
    };
    if (COPY_TO) message.bcc = COPY_TO;
    MailApp.sendEmail(message);
    return reply_({ ok: true });
  } catch (err) {
    return reply_({ ok: false, error: String(err && err.message ? err.message : err).slice(0, 200) });
  }
}

function reply_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
