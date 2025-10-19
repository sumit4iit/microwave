# Microwave Recipe Book Web App

A modern web application that displays microwave recipes from your LG microwave oven manual with multi-language translation support.

## Features

- Browse microwave recipes with beautiful UI
- Search recipes by name, category, or ingredients
- Filter recipes by category
- Translate recipes to 12+ languages
- Print-friendly recipe view
- Responsive design (mobile & desktop)
- Real-time translation using LibreTranslate API

## Tech Stack

### Backend
- Node.js + Express
- Cheerio for web scraping
- Axios for HTTP requests
- LibreTranslate API for translations
- Node-cache for translation caching

### Frontend
- React with Vite
- TailwindCSS for styling
- Modern responsive design

## Project Structure

```
microwave/
├── backend/
│   ├── server.js          # Express API server
│   ├── scraper.js         # Recipe scraper from LG manual
│   ├── recipes.json       # Extracted recipes data
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── RecipeList.jsx       # Recipe grid view
│   │   │   ├── RecipeDetail.jsx     # Detailed recipe view
│   │   │   ├── LanguageSelector.jsx # Language dropdown
│   │   │   └── SearchBar.jsx        # Search functionality
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm

### Installation

1. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start the Backend Server** (Terminal 1)
   ```bash
   cd backend
   npm start
   ```
   Backend will run on `http://localhost:3001`

2. **Start the Frontend Development Server** (Terminal 2)
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend will run on `http://localhost:5173`

3. **Open your browser** and navigate to `http://localhost:5173`

## API Endpoints

- `GET /api/recipes` - Get all recipes
- `GET /api/recipes/:id` - Get recipe by ID
- `GET /api/recipes/category/:category` - Get recipes by category
- `GET /api/categories` - Get all categories
- `GET /api/search?q=query` - Search recipes
- `POST /api/translate` - Translate text
- `POST /api/translate-recipe` - Translate entire recipe

## Scraping Recipes

To scrape recipes from the LG manual:

```bash
cd backend
npm run scrape
```

This will fetch recipes from the LG manual URL and save them to `recipes.json`. If scraping fails, it will use sample microwave recipes as fallback.

## Supported Languages

- English (default)
- Spanish
- French
- German
- Italian
- Portuguese
- Russian
- Japanese
- Chinese
- Korean
- Arabic
- Hindi

## Features in Detail

### Recipe Browsing
- Grid layout with recipe cards
- Shows cooking time, power level, and ingredient count
- Category badges for easy identification

### Search & Filter
- Real-time search across recipe names, categories, and ingredients
- Category filter buttons
- Clear search functionality

### Translation
- Select target language from dropdown
- Automatically translates recipe title, ingredients, steps, and metadata
- Cached translations for faster subsequent loads
- Fallback to original text if translation fails

### Recipe Detail View
- Full ingredients list with checkmarks
- Step-by-step instructions with numbered bullets
- Cooking time and power level display
- Print button for easy printing
- Back button to return to recipe list

## Customization

### Adding More Recipes
Edit `backend/recipes.json` to add your own recipes following the schema:

```json
{
  "id": "recipe_id",
  "title": "Recipe Name",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "steps": ["step 1", "step 2"],
  "powerLevel": "High (100%)",
  "cookingTime": "5 minutes",
  "category": "Category Name"
}
```

### Changing Translation Service
The app uses LibreTranslate (free and open-source). To use Google Translate API or other services:

1. Update `backend/server.js` translation endpoints
2. Add your API key to environment variables
3. Modify the translation request format

## Notes

- The scraper attempts to extract recipes from the LG manual website
- Sample recipes are provided as fallback if scraping fails
- Translation uses the free LibreTranslate API which may have rate limits
- Translations are cached for 1 hour to reduce API calls

## Future Enhancements

- Add user favorites/bookmarks
- Recipe scaling (adjust serving sizes)
- Dark mode
- Recipe ratings and reviews
- Export recipes to PDF
- Offline mode with PWA
- User-submitted recipes

## License

ISC

## Author

Created for LG MC2846BV Microwave Oven
