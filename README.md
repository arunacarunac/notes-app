# 📝 Notes App

A secure, client-side notes application hosted on GitHub Pages with passphrase-based authentication.

## Features

- 🔒 **Passphrase authentication** — only people with the shared passphrase can access notes
- 📝 **Create, edit, delete** notes with a clean interface
- 🔍 **Search** notes by title or content
- 💾 **Local storage** — notes persist in the browser
- 📱 **Responsive** — works on desktop and mobile
- ⏱️ **Auto-lock** — session expires after 30 minutes of inactivity

## Setup

### 1. Enable GitHub Pages

1. Go to **Settings → Pages** in this repository
2. Under **Source**, select **Deploy from a branch**
3. Select **main** branch and **/ (root)** folder
4. Click **Save**

Your site will be live at `https://arunacarunac.github.io/notes-app/`

### 2. Set Your Passphrase

The default passphrase hash is a placeholder. To set your own passphrase:

1. Open your browser's developer console (F12 → Console)
2. Run this command (replace `YOUR_PASSPHRASE` with your desired passphrase):

   ```js
   crypto.subtle.digest('SHA-256', new TextEncoder().encode('YOUR_PASSPHRASE'))
     .then(b => console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')));
   ```

3. Copy the resulting hash
4. Edit `app.js` and replace the `PASSPHRASE_HASH` value with your new hash
5. Commit and push the change

### 3. Share Access

Share the passphrase with your select group of people. They can access the site URL and enter the passphrase to unlock.

## Important Notes

- **Notes are stored in each user's browser** (localStorage). Notes are NOT synced between devices or users.
- **The passphrase hash is visible** in the source code. This is a lightweight access gate, not enterprise-grade security.
- For stronger security, consider adding a backend or using a service like Firebase.

## Tech Stack

- Vanilla HTML, CSS, JavaScript
- No build tools or dependencies
- GitHub Pages hosting
