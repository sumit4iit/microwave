# MHTML Recipe Parser

This parser extracts recipes from MHTML files downloaded from the LG microwave manual website.

## Why MHTML Parser?

The MHTML approach provides much better data quality compared to parsing indexer.js directly:
- Fully rendered HTML with proper table structures
- Clean ingredient names and quantities
- Accurate weight limits
- Complete recipe steps

## Current Status

Successfully extracted **250 recipes** from all 16 category pages with complete structured data.

## Directory Structure

```
manual_scrape/
├── source/          # Downloaded MHTML files
├── parser/          # Parser scripts
│   ├── parse-mhtml.js            # Single MHTML processor
│   ├── parse-html-recipes.js     # Single HTML processor
│   ├── process-all-categories.js # Batch processor (recommended)
│   └── README-MHTML-PARSER.md    # This file
└── output/          # Extracted data
    ├── all-recipes.json          # Combined recipes from all categories
    ├── extracted.html            # Temporary HTML files
    └── recipes-from-html.json    # Individual category outputs
```

## Quick Start (Recommended)

### Process All MHTML Files at Once

The easiest way to extract recipes from all MHTML files:

```bash
cd /Users/sumit.agrawal/workspace/microwave/manual_scrape
node parser/process-all-categories.js
```

This will:
1. Find all .mhtml files in the `source/` directory
2. Extract HTML from each MHTML file
3. Parse recipes from each HTML file
4. Combine all recipes into `output/all-recipes.json`
5. Display a summary by category

**Output**: `output/all-recipes.json` with all 250 recipes

## Manual Processing (Individual Files)

If you need to process a single file:

### Step 1: Download MHTML Files

For each recipe category page on the LG manual website:
1. Open the page in your browser (e.g., Soup, Continental, Salad, etc.)
2. Save as MHTML: File → Save Page As → Format: "Web Archive, single file (.mhtml)"
3. Save to `source/` folder with a descriptive name (e.g., `LG HTML Manual_soup.mhtml`)

### Step 2: Update File Paths

In `parser/parse-mhtml.js`, update the input/output paths:

```javascript
const MHTML_FILE = path.join(__dirname, '../source/YOUR_FILE.mhtml');
const OUTPUT_HTML = path.join(__dirname, '../output/extracted-YOUR_CATEGORY.html');
```

### Step 3: Extract HTML from MHTML

```bash
cd parser
node parse-mhtml.js
```

### Step 4: Update HTML Parser Paths

In `parser/parse-html-recipes.js`, update the input/output paths:

```javascript
const HTML_FILE = path.join(__dirname, '../output/extracted-YOUR_CATEGORY.html');
const OUTPUT_JSON = path.join(__dirname, '../output/recipes-YOUR_CATEGORY.json');
```

### Step 5: Extract Recipes

```bash
node parse-html-recipes.js
```

## Recipe Data Structure

Each recipe includes:

```json
{
  "menuCode": "HP1",
  "name": "Kala Chana",
  "category": "Health Plus",
  "weightLimit": "0.1 ~ 0.5 kg",
  "utensils": ["Microwave safe bowl"],
  "ingredientTable": {
    "columns": ["Weight-1", "Weight-2", "Weight-3", "Weight-4", "Weight-5"],
    "weightLimits": ["0.1 kg", "0.2 kg", "0.3 kg", "0.4 kg", "0.5 kg"],
    "rows": [
      {
        "ingredient": "Soaked Kala Chana",
        "quantities": ["100 g", "200 g", "300 g", "400 g", "500 g"]
      }
    ]
  },
  "steps": [
    "Soak chana overnight, in Microwave safe bowl...",
    "Add oil and onion. Select category and weight...",
    "Add rest of the ingredients and mix well..."
  ],
  "notes": []
}
```

## Extracted Categories

The following 16 category pages have been processed:

- **Health Plus** (26 recipes) - `LG HTML Manual.mhtml`
- **Bakery** (10 recipes) - `LG HTML Manual_bakery.mhtml`
- **Chatpat Corner** (15 recipes) - `LG HTML Manual_chatpata.mhtml`
- **Child's Favourite** (30 recipes) - `LG HTML Manual_child_fav.mhtml`
- **Continental** (24 recipes) - `LG HTML Manual_continental.mhtml`
- **Cooking Aid** (13 recipes) - `LG HTML Manual_cooking_aid.mhtml`
- **Ghee** (1 recipe) - `LG HTML Manual_ghee.mhtml`
- **Indian Cuisine** (27 recipes) - `LG HTML Manual_indian_cuisine.mhtml`
- **Paneer/Curd** (4 recipes) - `LG HTML Manual_paneer_curd.mhtml`
- **Rice Delight** (20 recipes) - `LG HTML Manual_rice_delight.mhtml`
- **Salad** (13 recipes) - `LG HTML Manual_salad.mhtml`
- **Soup** (20 recipes) - `LG HTML Manual_soup.mhtml`
- **Steam Cook** (31 recipes) - `LG HTML Manual_steam_cook.mhtml`
- **Sweet Corner** (17 recipes) - `LG HTML Manual_sweet_corner.mhtml`
- **Tandoor Se** (4 recipes) - `LG HTML Manual_tandoor.mhtml`
- **Tea/Dairy Delight** (11 recipes) - `LG HTML Manual_tea_dairy.mhtml`
- **Other** (16 recipes) - Recipes with unrecognized prefixes

**Total: 250 recipes**

## Category Mapping

The parser automatically categorizes recipes based on menu code prefix:

- `HP` → Health Plus
- `so` → Soup
- `Co` → Continental
- `SA` → Salad
- `ts` → Tandoor Se
- `CF` → Child's Favourite
- `st`, `sC` → Steam Cook
- `IC` → Indian Cuisine
- `sw` → Sweet Corner
- `rd` → Rice Delight
- `CC` → Chatpat Corner
- `ηh` → Ghee
- `bA` → Bakery
- `dd` → Tea/Dairy Delight
- `PA`, `CU` → Paneer/Curd
- `UC` → Cooking Aid
- `sL` → Steam Clean

## Verification

To verify extracted data:

```bash
cd output
node -e "const fs = require('fs'); const recipes = JSON.parse(fs.readFileSync('all-recipes.json', 'utf-8')); console.log('Total recipes:', recipes.length); console.log('Sample:', recipes[0].menuCode, '-', recipes[0].name);"
```

## Next Steps

1. ✅ Downloaded all 16 category MHTML files
2. ✅ Extracted all 250 recipes with complete data
3. ⏳ Integrate `output/all-recipes.json` with the frontend application
4. ⏳ Create search and filter functionality
5. ⏳ Display recipe details with ingredient tables and instructions
