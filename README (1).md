# Ahmad Alshehri — Personal Resume Website

A single-file, zero-dependency static site. No build step, no npm install. Open `index.html` in any browser to preview it.

## Publish it

Any of these work in a few minutes, all free:

| Host | How |
|---|---|
| **Netlify Drop** | Go to `app.netlify.com/drop` and drag the folder in. Live instantly. |
| **GitHub Pages** | Create a repo, upload `index.html`, then Settings → Pages → deploy from `main` / root. |
| **Cloudflare Pages** | New project → Direct Upload → drag the folder. |

For a custom domain (e.g. `ahmadalshehri.com`), buy the domain and point it at your host — each of the three has a one-page guide.

## Update the content

Everything lives in `index.html`. Search for these markers:

- **`CV_LINK`** — appears 3 times (nav, hero, contact). All three point at the CV in your Google Drive. If you replace the CV in Drive, the file gets a **new ID**, so update all three links, or host the PDF locally instead (see below).
- **`PROFILE PHOTO`** — in the hero `<aside>`. Currently a navy monogram card. Replace that block with the `<img>` tag shown in the comment. Use a square photo, 600×600px or larger.
- **`LINKEDIN`** — in the contact list. Commented out because no LinkedIn URL exists in your CV. Uncomment and paste your real profile URL.
- **`DEFAULT`** — near the bottom of the file, in the script. Set to `'en'`. Change it to `'ar'` to make the page open in Arabic, and also change `lang="en" dir="ltr"` to `lang="ar" dir="rtl"` on the very first `<html>` line.
- **`https://example.com/`** — appears in the canonical link and the Open Graph tags. Replace with your real domain once published.

### Hosting the CV locally instead of Drive

1. Create an `assets/` folder next to `index.html`.
2. Save your CV there as `Ahmad_Alshehri_CV.pdf`.
3. Replace all three `CV_LINK` hrefs with `assets/Ahmad_Alshehri_CV.pdf`.

This is more reliable long-term — the link never breaks when you update the file.

## Bilingual

The page is Arabic and English in one file. The button in the header switches between them — it swaps the `lang` and `dir` attributes on `<html>`, and CSS shows or hides the matching text.

Every piece of text exists twice, as `<span class="en">` and `<span class="ar">`. **If you edit one, edit the other**, or the two versions will drift apart. Both languages sit in the HTML rather than being loaded by script, so search engines can read them both.

Arabic uses IBM Plex Sans Arabic and flips the whole layout right-to-left. Email and phone stay left-to-right via `class="ltr"`.

## Design system

| Token | Value | Used for |
|---|---|---|
| Background | `#FBFAF8` | Page |
| Ink | `#16202E` | Headings, primary buttons |
| Ink soft | `#565E6D` | Body copy |
| Navy | `#101927` | Highlights band, contact band |
| Gold | `#9F7526` | Accent — used sparingly |
| Line | `#E5E2DC` | Hairline rules |

Type: **Manrope** (display, headings, figures) + **IBM Plex Sans** (body, labels). Both loaded from Google Fonts with system fallbacks.

## Built in

- Semantic HTML5 with proper heading hierarchy (one `h1`, sections at `h2`)
- `Person` structured data (JSON-LD) for Google
- Open Graph + Twitter card metadata
- Skip-to-content link, visible keyboard focus, ARIA labels on the scope meters
- `prefers-reduced-motion` respected — all animation disabled
- Responsive from 320px up; nav collapses below 960px
- No frameworks, no trackers, no external JS. Only network request is the font file.
