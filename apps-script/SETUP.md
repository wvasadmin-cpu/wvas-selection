# Acknowledgement emails: one-time setup

When someone submits the exhibitor (`/apply`) or associate (`/join`)
application form, the website saves it to Airtable and then asks a small Apps
Script to email them an acknowledgement with a summary of what they sent. The
emails come from the Google account that sets the script up, so do this
**signed in as wvasmembersec@gmail.com**.

If email isn't set up (or ever fails), applications are still saved; the
reason shows on the admin **Applications** page.

## 1. Create the script

1. Signed in as wvasmembersec@gmail.com, go to **https://script.google.com**
   and click **New project**.
2. Click "Untitled project" at the top and rename it **WVAS acknowledgement
   emails**.
3. Delete the sample code, paste in the whole of `acknowledgement-emails.gs`,
   and click the save icon.

## 2. Create the secret

1. In the function dropdown at the top, choose **`setup`** and click **Run**.
2. Google asks for permission. You'll see "Google hasn't verified this app",
   which is normal for your own script: click **Advanced → Go to (project
   name) → Allow**.
3. The log at the bottom shows a long secret. Copy it (you'll paste it into
   Netlify in step 4). Keep it private.

## 3. Publish it

1. Click **Deploy → New deployment**.
2. Click the cog next to "Select type" and choose **Web app**.
3. Description: `Acknowledgement emails`. **Execute as: Me**. **Who has
   access: Anyone**. (Anyone can reach it, but it does nothing without the
   secret.)
4. Click **Deploy**, then copy the **Web app URL** (it ends in `/exec`).

## 4. Tell the website

In Netlify, on the **wvas-selection** project, **Project configuration →
Environment variables**, add:

| Key | Value | Secret? |
|---|---|---|
| `EMAIL_RELAY_URL` | the Web app URL from step 3 | no |
| `EMAIL_RELAY_SECRET` | the secret from step 2 | yes (tick "Contains secret values"; put it in Production) |

Click **Create variable** for each, then **Deploys → Trigger deploy → Deploy
project**. The admin **Applications** page's Connection check should then
say acknowledgement emails are **set up**.

## Test it

Submit each form with your own email address. The acknowledgement should
arrive within a minute. Then delete the test records in Airtable.

## Good to know

- **Copies to the Membership Secretary**: set `COPY_TO` at the top of the
  script to an email address, save, then **Deploy → Manage deployments →
  edit (pencil) → Version: New version → Deploy** (the URL stays the same).
- **Changing the script** always needs that same "new version" step before
  the change takes effect.
- **Changing the wording** of the emails: that lives in the website code
  (`lib/ack-email.ts`), not in this script.
- **Daily limit**: a normal Gmail account can send about 100 emails a day
  this way, shared with the exhibition entry confirmations.
