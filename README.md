# 📚 Cre8Web Prompts – Prompt Library

## 🇬🇧 English

A lightweight frontend project for browsing a collection of **AI prompts**.  
Supports **categories, subcategories, search, favorites, language (EN/NO)** and tag filtering.

---

### ✨ Features

- 📂 Category → Subcategory navigation
- 🔍 Full-text search on title, prompt, category and tags
- ⭐ Favorites with localStorage support
- 🌐 Bilingual support: English / Norwegian
- 📑 Modal view with copy button
- 🎨 Modern responsive design

---

### 📂 Project Structure

```
.
├─ index.html
├─ assets/
│  ├─ css/style.css
│  ├─ js/app.js
│  ├─ data/prompts.json
│  ├─ data/prompts.sample.json
│  └─ img/icon.svg
```

- **index.html** – main page
- **style.css** – stylesheet
- **app.js** – logic for search, filters, language and rendering
- **prompts.json** – your own collection of prompts
- **prompts.sample.json** – fallback/demo

---

### 🚀 Usage

1. Place your own prompts in `assets/data/prompts.json` (see format below).
2. Open `index.html` directly in a browser, or host on Netlify/GitHub Pages.
3. Use the search field or category navigation to find prompts.
4. Click **View** to display the full prompt, or **Copy** to copy it.

---

### 🗂 Data Structure

```json
{
  "id": "unique-id",
  "title": { "en": "Title in English", "no": "Tittel på norsk" },
  "prompt": { "en": "Prompt in English", "no": "Prompt på norsk" },
  "category": { "en": "Main Category", "no": "Hovedkategori" },
  "subcategory": { "en": "Subcategory", "no": "Underkategori" },
  "catDescription": { "en": "Category description", "no": "Beskrivelse av kategori" },
  "subDescription": { "en": "Subcategory description", "no": "Beskrivelse av underkategori" },
  "tags": ["list", "of", "tags"]
}
```

---

### 🔑 URL Parameters

- `?lang=no|en` – language selection
- `?mode=or|and` – tag match logic
- `?q=keyword` – search
- `?cat=Category` – filter by category
- `?sub=Subcategory` – filter by subcategory
- `?fav=1` – show favorites only

---

### 📖 Sources

The prompts in this collection are sourced and translated from open resources, mainly:

- [Awesome ChatGPT Prompts (GitHub)](https://github.com/f/awesome-chatgpt-prompts)
- Various “Act as …” collections and blog posts on prompt design
- [Neolifehospital.in – 10 Best Google Gemini AI Photo Editing Prompts for Men](https://neolifehospital.in/10-best-google-gemini-ai-photo-editing-prompts-for-men)
- Other open lists and AI resources (e.g. Creative Content, Coding & Development, Language & Learning, Experimental & Fun)

---

### 📜 License

This project can be freely used for personal purposes.

---

---

## 🇳🇴 Norsk

Et komplett frontend-prosjekt for å bla i en samling med **AI-prompter**.  
Støtter **kategorier, underkategorier, søk, favoritter, språk (NO/EN)** og filtrering med tags.

---

### ✨ Funksjoner

- 📂 Hovedkategori → Underkategori-visning
- 🔍 Fulltekstsøk på tittel, prompt, kategori og tags
- ⭐ Favorittmarkering med lokal lagring (localStorage)
- 🌐 Tospråklig støtte: Norsk / Engelsk
- 📑 Modal-visning med kopi-knapp
- 🎨 Moderne design med responsiv layout

---

### 📂 Struktur

```
.
├─ index.html
├─ assets/
│  ├─ css/style.css
│  ├─ js/app.js
│  ├─ data/prompts.json
│  ├─ data/prompts.sample.json
│  └─ img/icon.svg
```

- **index.html** – hovedsiden
- **style.css** – stilark
- **app.js** – logikk for søk, filter, språk og visning
- **prompts.json** – din egen samling med prompts
- **prompts.sample.json** – fallback/demo

---

### 🚀 Bruk

1. Legg dine egne prompts i `assets/data/prompts.json` (se format under).
2. Åpne `index.html` i nettleser, eller host prosjektet på Netlify/GitHub Pages.
3. Bruk søkefeltet eller kategorinavigasjon for å finne prompts.
4. Klikk **View** for å se hele prompten, eller **Copy** for å kopiere.

---

### 🗂 Datastruktur

```json
{
  "id": "unik-id",
  "title": { "en": "Title in English", "no": "Tittel på norsk" },
  "prompt": { "en": "Prompt in English", "no": "Prompt på norsk" },
  "category": { "en": "Main Category", "no": "Hovedkategori" },
  "subcategory": { "en": "Subcategory", "no": "Underkategori" },
  "catDescription": { "en": "Category description", "no": "Beskrivelse av kategori" },
  "subDescription": { "en": "Subcategory description", "no": "Beskrivelse av underkategori" },
  "tags": ["liste", "med", "tagger"]
}
```

---

### 🔑 URL-parametere

- `?lang=no|en` – språkvalg
- `?mode=or|and` – tag-match
- `?q=tekst` – søk
- `?cat=Hovedkategori` – filtrer på kategori
- `?sub=Underkategori` – filtrer på underkategori
- `?fav=1` – vis bare favoritter

---

### 📖 Kilder

Promptene i denne samlingen er hentet og oversatt fra åpne kilder, hovedsakelig:

- [Awesome ChatGPT Prompts (GitHub)](https://github.com/f/awesome-chatgpt-prompts)
- Diverse “Act as …” samlinger og bloggposter om prompt-design
- [Neolifehospital.in – 10 Best Google Gemini AI Photo Editing Prompts for Men](https://neolifehospital.in/10-best-google-gemini-ai-photo-editing-prompts-for-men)
- Andre åpne lister og AI-ressurser (f.eks. Creative Content, Coding & Development, Language & Learning, Experimental & Fun)

---

### 📜 Lisens

Dette prosjektet kan brukes fritt til privat bruk.
