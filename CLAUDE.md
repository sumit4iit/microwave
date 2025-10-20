# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a microwave recipe book web application that displays recipes from an LG microwave oven manual. It consists of three main components:
1. **Manual Scraper**: MHTML parser that extracts 250 recipes from downloaded LG manual pages
2. **Web Application**: Static site serving recipe data with search and filtering
3. **Data Pipeline**: Converts MHTML files into structured JSON recipe data

## Project Architecture

### Component Flow
```
MHTML Files (manual_scrape/source/)
  → Parser Scripts (manual_scrape/parser/)
  → JSON Output (manual_scrape/output/)
  → Web App Data (webapp/public/data/recipes.json)
  → Static Web Server (webapp/server.js)
  → Frontend UI (webapp/public/)
```

### Directory Structure

- **`manual_scrape/`**: Recipe extraction pipeline
  - `source/`: Downloaded MHTML files from LG manual website (16 category pages)
  - `parser/`: Node.js scripts to extract and structure recipe data
  - `output/`: Generated JSON files with parsed recipes

- **`webapp/`**: Production web application
  - `public/`: Static files served to users
    - `data/recipes.json`: 250 recipes in structured JSON format
    - `app.js`: Vanilla JavaScript frontend (search, filter, modal)
    - `index.html`: Main app entry point
    - `styles.css`: Application styling
    - `blog/`: Generated blog posts from recipes
  - `server.js`: Express server for static file serving

- **`manual.pdf`**: Source LG microwave manual PDF

## Common Commands

### Running the Web Application

```bash
# Start the web server (runs on port 3000)
cd webapp
npm start

# Development mode (same as start)
npm run dev
```

Access at: http://localhost:3000

### Recipe Extraction Pipeline

```bash
# Extract recipes from all MHTML files (recommended)
cd manual_scrape
node parser/process-all-categories.js

# Process single MHTML file
node parser/parse-mhtml.js          # Extract HTML from MHTML
node parser/parse-html-recipes.js   # Parse recipes from HTML
```

**Important**: Manual paths must be updated in individual parser scripts before running single-file extraction.

### Installing Dependencies

```bash
# Webapp only requires Express
cd webapp
npm install
```

No build step required - the app uses vanilla JavaScript.

## Recipe Data Structure

The application uses a structured JSON format for recipes:

```json
{
  "menuCode": "HP1",              // Unique identifier (e.g., HP1, so1, Co1)
  "name": "Kala Chana",           // Recipe name
  "category": "Health Plus",      // Auto-categorized by menuCode prefix
  "weightLimit": "0.1 ~ 0.5 kg", // Optional weight range
  "utensils": ["Microwave safe bowl"],
  "ingredientTable": {
    "columns": ["Weight-1", "Weight-2", ...],
    "weightLimits": ["0.1 kg", "0.2 kg", ...],
    "rows": [
      {
        "ingredient": "Soaked Kala Chana",
        "quantities": ["100 g", "200 g", ...]
      }
    ]
  },
  "steps": [
    "Soak chana overnight...",
    "Add oil and onion..."
  ],
  "notes": []
}
```

### Category Mapping

Recipes are categorized by menuCode prefix:
- `HP` → Health Plus (26 recipes)
- `so` → Soup (20 recipes)
- `Co` → Continental (24 recipes)
- `SA` → Salad (13 recipes)
- `CF` → Child's Favourite (30 recipes)
- `st`, `sC` → Steam Cook (31 recipes)
- `IC` → Indian Cuisine (27 recipes)
- `sw` → Sweet Corner (17 recipes)
- `rd` → Rice Delight (20 recipes)
- `CC` → Chatpat Corner (15 recipes)
- `bA` → Bakery (10 recipes)
- `dd` → Tea/Dairy Delight (11 recipes)
- `ts` → Tandoor Se (4 recipes)
- `PA`, `CU` → Paneer/Curd (4 recipes)
- `UC` → Cooking Aid (13 recipes)
- `ηh` → Ghee (1 recipe)

**Total: 250 recipes across 16 categories**

## Key Technical Details

### Frontend Architecture
- **Pure vanilla JavaScript** - no framework dependencies
- **Client-side filtering** - all 250 recipes loaded at once for fast search
- **Modal-based detail view** - clicking recipe opens overlay with full details
- **Category-based navigation** - dynamic filter buttons with recipe counts
- **State management**: Global variables (`allRecipes`, `filteredRecipes`, `currentCategory`)

### Search Implementation
Search matches against `recipe.name` and `recipe.menuCode` fields, respecting active category filter.

### Parser Implementation
The MHTML parser (`process-all-categories.js`) uses:
1. **Base64 decoding** to extract HTML from MHTML files
2. **Cheerio** for HTML parsing and DOM traversal
3. **Table extraction** to parse ingredient tables with variable columns
4. **Pattern matching** on menuCode to auto-assign categories
5. **LCD font handling** - The category mapper includes both `ts` and `t5` for Tandoor Se since the LCD display font makes 'S' look like '5' in some MHTML files

### Known Limitations
- No backend database - all data is static JSON
- No translation support (originally planned but not in current README)
- Category assignment depends on menuCode prefix patterns
- Some recipes may have empty `notes` or `utensils` arrays

## Updating Recipes

To add/modify recipes from the manual:

1. Download MHTML file from LG manual website (File → Save As → Web Archive)
2. Place in `manual_scrape/source/` with descriptive name
3. Run `node manual_scrape/parser/process-all-categories.js`
4. Copy `manual_scrape/output/all-recipes.json` to `webapp/public/data/recipes.json`
5. Restart webapp server

## Development Notes

- The webapp is a **static site** - no build process, bundler, or transpilation
- Express server simply serves files from `public/` directory
- All recipe logic runs client-side in the browser
- Modal uses inline `onclick` handlers for simplicity
- No test suite currently exists
- Original README mentioned LibreTranslate integration, but it's not implemented in current codebase

## Port Configuration

Default port is 3000, configurable via `PORT` environment variable:
```bash
PORT=8080 npm start
```

## Deployment

### GitHub Pages Deployment

The app is configured to automatically deploy to GitHub Pages on every push to the `main` branch.

**Setup Steps:**

1. **Enable GitHub Pages in repository settings:**
   - Go to repository Settings → Pages
   - Under "Source", select "GitHub Actions"

2. **Push to main branch:**
   ```bash
   git push origin main
   ```

3. **Monitor deployment:**
   - Check the "Actions" tab in GitHub to see deployment progress
   - Once complete, the app will be available at: `https://<username>.github.io/<repository-name>/`

**How it works:**
- The `.github/workflows/deploy.yml` workflow automatically deploys `webapp/public/` to GitHub Pages
- The `.nojekyll` file prevents Jekyll processing of static assets
- All paths are relative, so the app works in any subdirectory

**Local Testing:**
You can test the static site locally without the Express server by using any static file server:
```bash
cd webapp/public
python3 -m http.server 8000
# Or using Node.js
npx http-server -p 8000
```
