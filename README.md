
# Cre8Web Prompts – Ny struktur

Denne pakken inneholder en komplett frontend for å vise en promptsamling med **Hovedkategori → Underkategori**, søk, favoritter, språk (NO/EN) og AND/OR‑filter for tags.

## Struktur
```
.
├─ index.html
├─ assets/
│  ├─ css/style.css
│  ├─ js/utils.js
│  ├─ js/app.js
│  ├─ data/prompts.json           ← legg din endelige fil her
│  ├─ data/prompts.sample.json    ← fallback-demo
│  └─ img/icon.svg
```

## Datastruktur (prompts.json)
Hver prompt bør ha følgende felter:
```json
{
  "id": "unik-id",
  "act_no": "Tittel på norsk",
  "act_en": "Title in English",
  "prompt_no": "Selve prompten på norsk",
  "prompt_en": "Prompt text in English",
  "category": "Hovedkategori",
  "subcategory": "Underkategori",
  "tags": ["liste","med","tagger"]
}
```

Feltene `category`/`subcategory` kan også hete `Hovedkategori`/`Underkategori` (bakoverkompatibelt), og `tags` kan alternativt hentes fra `tags/0`, `tags/1` ... hvis array ikke finnes.

## URL‑parametere
- `?lang=no|en`
- `?mode=or|and` (tag‑match)
- `?q=tekst` (søk)
- `?cat=Hovedkategori`
- `?sub=Underkategori`
- `?fav=1` (kun favoritter)

## Tips
- Legg din komplette `prompts.json` i `assets/data/`.
- Standardvalg lagres i `localStorage`.
- Hurtigtast `/` fokuserer søkefeltet.
