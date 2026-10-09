# MiniMusicLibrary — demo website

A static site (HTML, CSS, JS). No build step, no server needed.

## Run it locally
Double-click `index.html`. Everything works straight from the folder.

## Put it on GitHub Pages
1. Create a new repository on GitHub and upload everything in this folder (keep the folder structure).
2. In the repository, go to Settings > Pages.
3. Under "Build and deployment", choose "Deploy from a branch", pick `main` and `/ (root)`, then Save.
4. After a minute the site is live at `https://<your-username>.github.io/<repo-name>/`.

## Files
- `index.html` home: hero, latest records, café intro + menu, visit info
- `records.html` browse and filter (genre, new/used, vinyl condition, format, price, search, sort)
- `record.html?sku=...` one page per record, generated from the data
- `cart.html` cart and demo checkout (no payment is taken)
- `js/data.js` all records + site settings. Edit this to change stock.
- `js/app.js` site logic
- `css/style.css` design
- `images/` logo, store photo and record covers (named by SKU)

## Editing records
Each record in `js/data.js` looks like this:

    { "sku": "VNL-RK-00017", "artist": "Sonic Youth", "title": "Goo", "year": 1990,
      "label": "DGC", "format": "LP", "genre": "Rock", "style": "Noise Rock",
      "type": "Used", "vinyl": "VG+", "sleeve": "NM", "price": 3900, "stock": 1,
      "image": "images/records/VNL-RK-00017.jpg", "description": "...", "added": 26, "verify": false }

- `type`: "New" (sealed) or "Used"
- `vinyl` / `sleeve`: Sealed, M, NM, VG+, VG, G+, G, F/P, or Generic (plain sleeve)
- `stock`: 0 shows the record as sold out
- `added`: higher number = shows first under "Newest on the wall"
- `verify: true`: details still to double-check on Discogs

## Settings (top of js/data.js)
- `reserveEnabled`: set to `true` to show "Reserve on WhatsApp" buttons
- `whatsappNumber`: country code + number, no spaces or plus sign (e.g. 905321234567)
- `instagram`: your handle
- `demo`: set to `false` to hide the demo notes

## Demo data
Record conditions and most prices are placeholders. Prices for Acid Pauli, Cosmjn,
Paranoid London and Nine Years of Love come from the shop stickers in the photos.
The café menu, address and opening hours are placeholders.


## Improvements in this update
- Added a standalone `cafe.html` menu page and navigation link.
- Removed duplicate vinyl listings using artist, title, year and format as the matching key.
- Standardized record artwork into square image frames; cover images are contained rather than cropped.
- Added mobile-first layout refinements for navigation, grids, filters, record details and café menu.
- Checked local JPG/TIFF image EXIF orientation metadata and applied any required rotations (none were flagged in this archive).
