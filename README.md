# NYX — WhatsApp Bot

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/blazetech-glitch/NYX)

Quick deploy: click the button above to deploy the repository template to Heroku.

Minimal required config vars (set these in Heroku dashboard -> Deploy -> Deploy using Heroku Button -> Configure app):

- `SESSION_ID` — required (your session identifier)
- `OWNER_NUMBER` — 255627417402
- `OWNER_NUMBER2` — 255754206718
- `BOT_NAME` — NYX MD
- `MENU_IMAGE_URL` — https://files.catbox.moe/rw0yfd.png
- `NEWSLETTER_JID` — 120363424512102809@newsletter

Optional vars you may want to configure: `PREFIX`, `DESCRIPTION`, `ALIVE_IMG`, `MENU_AUDIO_URL`, etc.

Run locally:

```bash
git clone https://github.com/blazetech-glitch/NYX
cd NYX
npm install
node index.js
```

Notes:
- This repo is configured to use `index.js` as the process entrypoint (see `Procfile`).
- I did not change any tokens or secrets. Keep those private.

If you want, I can also create a small Heroku deploy checklist or automate a Heroku pipeline for this repo.
