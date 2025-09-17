# Norske Prompts (statisk)

Ferdig, responsivt oppsett som fungerer på både GitHub Pages og Netlify.

## Strukturen
- `index.html` – appens hovedside (beholder ID-er som `app.js` forventer).
- `assets/styles.css` – ny, responsiv stil.
- `assets/app.js` – eksisterende logikk (uendret).
- `assets/prompts.json` – data (uendret).
- `assets/tags-map.json` – mapping/aliaser (uendret).

## Publisering
### Netlify
- Dra og slipp mappen i Netlify app, eller koble til repo.
- Build settings: **Static site** (ingen build-kommando), publish directory: mappens rot.

### GitHub Pages
- Commit/push innholdet til en repo (f.eks. `main`-branch).
- Settings → Pages → Source: `Deploy from a branch` → Branch: `main` → Folder: `/ (root)`.
- Vent til GitHub Pages bygger, åpne URL-en.

## Tips
- Bruk relative stier (`./assets/...`) – fungerer fra både rot og underkataloger.
- Endre `<title>` og header-tekst i `index.html` ved behov.