# LG Microwave Recipe Webapp

A clean, modern webapp displaying 204 **100% Vegetarian** Indian microwave recipes from the LG Microwave Manual.

## Features

- 📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- 🔍 **Real-time Search** - Search by recipe name or menu code (e.g., HP1, Biryani)
- 🏷️ **Category Filtering** - Filter by 14 recipe categories
- 📊 **Detailed Recipe View** - Complete ingredient tables, step-by-step instructions, and notes
- 💻 **Static Site** - No backend required, works on GitHub Pages
- 🎨 **LCD-style Menu Codes** - Authentic microwave display styling

## Recipe Categories

**100% Vegetarian - All non-vegetarian recipes removed (46 recipes containing chicken, fish, eggs, meat, etc.)**

- Child's Favourite (28 recipes)
- Indian Cuisine (22 recipes)
- Health Plus (17 recipes)
- Sweet Corner (17 recipes)
- Continental (16 recipes)
- Soup (16 recipes)
- Chatpat Corner (15 recipes)
- Rice Delight (14 recipes)
- Salad (14 recipes)
- Cooking Aid (13 recipes)
- Steam Cook (13 recipes)
- Tea/Dairy Delight (11 recipes)
- Paneer/Curd (4 recipes)
- Bakery (2 recipes)
- Ghee (1 recipe)
- Tandoor Se (1 recipe)

**Total: 204 vegetarian recipes**

## Local Development

### Prerequisites

- Node.js (v14 or higher)

### Setup

1. Install dependencies:
```bash
cd webapp
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open your browser:
```
http://localhost:3000
```

The server will hot-reload when you make changes to the files.

## Deployment to GitHub Pages

### Option 1: Using `docs` folder (Recommended)

1. **Move files to docs folder:**
```bash
# From project root
mkdir -p docs
cp -r webapp/public/* docs/
```

2. **Commit and push:**
```bash
git add docs
git commit -m "Add recipe webapp for GitHub Pages"
git push origin main
```

3. **Configure GitHub Pages:**
   - Go to your repository on GitHub
   - Settings → Pages
   - Source: **Deploy from a branch**
   - Branch: **main** → **/docs**
   - Click **Save**

4. **Access your site:**
   - Your site will be live at: `https://USERNAME.github.io/REPO-NAME/`
   - Wait 2-3 minutes for deployment

### Option 2: Using `gh-pages` branch

1. **Install gh-pages tool:**
```bash
npm install -g gh-pages
```

2. **Deploy:**
```bash
cd webapp
gh-pages -d public
```

3. **Configure GitHub Pages:**
   - Go to Settings → Pages
   - Source: **Deploy from a branch**
   - Branch: **gh-pages** → **/ (root)**

### Option 3: Manual Deploy

1. **Create gh-pages branch:**
```bash
git checkout --orphan gh-pages
git rm -rf .
```

2. **Copy public files:**
```bash
cp -r webapp/public/* .
git add .
git commit -m "Deploy webapp"
git push origin gh-pages
```

3. **Switch back to main:**
```bash
git checkout main
```

## Project Structure

```
webapp/
├── public/                 # Static files (GitHub Pages ready)
│   ├── index.html         # Main HTML
│   ├── styles.css         # Styling
│   ├── app.js             # Client-side JavaScript
│   └── data/
│       └── recipes.json   # Recipe data (250 recipes)
├── server.js              # Express dev server
├── package.json           # Dependencies
└── README.md             # This file
```

## Technology Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript (no frameworks)
- **Dev Server:** Node.js + Express
- **Deployment:** GitHub Pages (static hosting)
- **Data:** Client-side JSON loading

## Data Source

Recipe data extracted from LG Microwave Manual using MHTML parser located in `/manual_scrape/`.

Source file: `manual_scrape/output/all-recipes.json`

## Features in Detail

### Search
- Real-time filtering as you type
- Search by recipe name (e.g., "Biryani", "Chicken")
- Search by menu code (e.g., "HP1", "Co3")

### Category Filters
- Click any category to filter recipes
- Shows recipe count per category
- "All Recipes" button to clear filters

### Recipe Cards
- LCD-style menu code display
- Recipe name and category badge
- Weight limit information
- Click to view full details

### Recipe Detail View
- Large LCD-style menu code
- Complete ingredient table with multiple weight options
- Numbered step-by-step instructions
- Required utensils list
- Special notes and tips
- Print-friendly layout

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## Updating Recipe Data

To update the recipe data:

1. Update `manual_scrape/output/all-recipes.json`
2. Copy to webapp:
```bash
cp manual_scrape/output/all-recipes.json webapp/public/data/recipes.json
```
3. Redeploy to GitHub Pages

## License

MIT License - Recipe data sourced from LG Microwave Manual

## Contributing

This is a personal project for displaying LG Microwave recipes. Feel free to fork and customize for your own use.
