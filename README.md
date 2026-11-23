# Blackrock Depths Field Guide

A visual WoW Forever quest guide for a level 53 Alliance human paladin, with Stormwind hearth and Ironforge, Stormwind, Thorium Point and Morgan's Vigil flight paths. Rick is the guide's personal identifier.

**[Open the public guide](https://b-rabbit32.github.io/brd-field-guide/)** · **[Open the dungeon route](https://b-rabbit32.github.io/brd-field-guide/#dungeon)**

## Included

- A prerequisite-aware pickup route and a nine-quest entry ledger.
- A two-visit dungeon plan: prison, personal key, lower city and bar; outside reports and ingredients; then Windsor's papers, escort and Emperor.
- An original, clickable 25-room dungeon schematic with highlighted corridors, repeated paths, optional secret access and room objectives.
- A shorter first-visit variant for parties that already have a Shadowforge Key.
- Individual objective checks, per-leg progress, notes, and JSON export/import.
- Linked research, optional quests, profession requirements, later-level gates and disputed availability.

The route reduces avoidable repeated travel. It is not a timed speedrun or a guarantee of finishing in two visits. Drops, coffer keys, party readiness and changing live quest availability can require more trips. The map shows room connections, not geographic scale. Research was checked November 23, 2026; the route has not been live-tested on the character.

## Progress and privacy

There is no login, shared database or analytics. Every visitor gets an independent checklist stored in their browser. Sharing the URL does not share notes or completion state. Use **Export progress** and **Import** to move a checklist between devices or website addresses. Earlier version-1 exports are supported. Importing a progress file replaces the current checklist and notes.

## Run locally

No build step or package installation is needed. From the repository root:

```sh
python -m http.server 8765 --bind 127.0.0.1 --directory dist
```

Open `http://127.0.0.1:8765/`. Serving the site gives browser storage a consistent origin.

Validate the route structure and state migration with Node.js:

```sh
node scripts/validate.mjs
node --check dist/app.js
node --check dist/dungeon-data.js
node --check dist/dungeon-map.js
```

## GitHub Pages

The repository's Pages source is **Deploy from a branch**, using `gh-pages` and `/ (root)`. The `main` branch keeps the complete editable source; `gh-pages` contains only the files from `dist/`. No custom Actions workflow or repository secrets are needed.

After editing, run the validation commands above, commit the source, then publish:

```sh
git push origin main
git subtree push --prefix dist origin gh-pages
```

For a fork, publish the `gh-pages` branch and select it in **Settings > Pages**. Update the public links in this README and `dist/app.js` to the fork's URL.

## Host on an existing website

Copy the **contents** of `dist/` into a static directory such as `/brd/` on your website. For example, that can produce `https://petrichorcg.com/brd/` after you upload the files to that site's hosting provider. This repository does not change that domain's DNS or current website.

Keep these six files together: `index.html`, `style.css`, `data.js`, `dungeon-data.js`, `dungeon-map.js`, and `app.js`. Asset URLs are relative, so the guide works under a subdirectory. A move to another hostname creates separate browser storage; export on the old site and import on the new one.

## Source layout

| File | Purpose |
| --- | --- |
| `dist/index.html` | Page shell and illustrated header |
| `dist/style.css` | Responsive layout and map styling |
| `dist/data.js` | Pickup route, ledger and optional quest records |
| `dist/dungeon-data.js` | Dungeon objectives, return errands and keyed overrides |
| `dist/dungeon-map.js` | Original SVG map, room connections and route paths |
| `dist/app.js` | Checklists, local persistence, navigation and export/import |
| `scripts/validate.mjs` | Route connectivity, quest sequencing and migration validation |

Quest sources are linked beside the relevant objectives and in **Research & sources**. World of Warcraft, quest names and world references belong to Blizzard Entertainment. This is an independent fan guide, not an official Blizzard product.
