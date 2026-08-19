# Ahmad Alshehri — Career Hub

A data-driven career site with an admin panel that writes back to GitHub. No build step, no server, no framework. Runs on GitHub Pages as-is.

```
index.html          public site (renders from /data)
cv.html             print / PDF view — English, Arabic, or both
admin/              admin panel (noindex)
assets/site.css     all styling
assets/app.js       renderer
data/*.json         ALL your content lives here
sitemap.xml         SEO
.nojekyll           tells GitHub Pages to serve files as-is
```

---

## 1. Install

Upload every file and folder to your repository, replacing the old `index.html`. Keep the folder structure exactly as it is — `data/`, `assets/`, and `admin/` must stay as folders.

Using the GitHub web uploader: open your repo → **Add file → Upload files** → drag the whole unzipped folder in. GitHub preserves subfolders. Commit.

Your site stays at `https://hamodft.github.io/ahmadalshehri/`. Every path is relative, so the `/ahmadalshehri/` base path works without configuration.

---

## 2. One-time admin setup

The admin panel writes to your repository using a GitHub token. **The token is never stored in the repository** — it lives only in your browser.

1. Go to **https://github.com/settings/personal-access-tokens/new**
2. **Token name**: anything, e.g. `career-hub`
3. **Expiration**: 1 year (you'll repeat this step when it expires)
4. **Repository access** → *Only select repositories* → choose **hamodft/ahmadalshehri**
5. **Permissions** → *Repository permissions* → **Contents** → set to **Read and write**
6. Generate, copy the token (starts with `github_pat_`)
7. Open `https://hamodft.github.io/ahmadalshehri/admin/`, paste it, sign in

That's it. The panel remembers you on that device until you sign out.

### Optional verified-email login

`admin/auth-config.js` contains the owner email and the Supabase connection switch. After a Supabase project is linked, set `enabled` to `true` and add only the project URL and publishable key. Never place a service-role key, GitHub token, or password in that file. The owner can then sign in with a verified email, change the username, change the password, and request password recovery from **Account & security**.

**Why a token and not Decap CMS?** Decap's GitHub backend needs an OAuth server, which GitHub Pages cannot host — you'd have to run a separate service on Netlify or Cloudflare just to log in. A fine-grained token does the same job with nothing extra to maintain, and it can be revoked instantly from GitHub settings.

---

## 3. Daily use

Open `/admin/`. Left sidebar lists every collection.

| Action | How |
|---|---|
| Add | **+ Add** at the top of any list |
| Edit | **Edit** on a row |
| Delete | **Delete** on a row |
| Duplicate | **Duplicate** — copies an entry as a starting point |
| Reorder | Drag the **⠿** handle. List order = site order |
| Show / hide | **Hide** keeps the entry but removes it from the public site |
| Preview | **Live preview** opens the real site with your unsaved changes |
| Publish | **Publish** commits to GitHub. Live in about a minute |
| Upload media | **Media library** uploads images or PDFs up to 8 MB and copies their repository path |
| Account | **Account & security** shows authentication status and manages owner credentials when verified-email login is active |

A gold dot marks unpublished changes. Nothing reaches the public site until you press **Publish**.

**Arabic and English sit side by side** in every field, so the two versions can't drift apart.

---

## 4. Numbers calculate themselves

Leave *Calculate numbers automatically* on (Career status → settings) and these stay correct without you touching them:

- Years of experience — from your career start year
- Number of roles, companies
- Number of certificates, **total training hours** — summed from the certificate list
- Number of projects and training programmes

Add a certificate with 20 hours and the homepage figure moves from 298 to 318 by itself. To pin a number manually, set that achievement's *Calculate automatically from* to **Do not calculate**.

The 89% figure is manual, because it can't be derived from anything.

---

## 5. Backup

**Export backup** downloads every collection as one JSON file. Keep one after any big change.

**Import backup** restores it. Import loads the data into the panel but does *not* publish — review it, then press Publish.

---

## 6. Sections that appear on their own

**Projects** and **Training** are empty right now, so both sections and their nav links are hidden. Add your first entry in the admin panel and they appear automatically. Nothing to switch on.

Project entries use a case-study structure — Challenge, Objective, Actions, Result, Measurable impact — which is what a hiring manager reads for evidence. Each opens in a side drawer so the homepage stays scannable.

---

## 7. Things to know

- **`/admin/` is not secret.** Anyone can open it, but without a valid token they can't load or change anything. It carries `noindex`, so search engines skip it.
- **`robots.txt` has limited effect here.** Crawlers only read it at the domain root (`hamodft.github.io/robots.txt`), which you don't control on a project page. The `noindex` tag in the admin page is what actually keeps it out of search results.
- **Set your token to expire.** If a device is lost, revoke the token in GitHub settings and it's dead immediately.
- **Photo**: put a square image in `assets/`, then set *Photo URL or path* to `assets/your-photo.jpg`. Empty shows the monogram.
- **LinkedIn**: still blank because no URL exists in your CV. Fill it in Profile → contact and the row appears in the contact section, the CV, and the structured data.

---

## 8. Print CV

`cv.html` builds an A4 CV from the same data — pick English, Arabic, or bilingual, then **Print / Save as PDF**. You never maintain CV content separately; it's generated from what's in the admin panel.
