const fs = require('fs').promises;
const path = require('path');
const cheerio = require('cheerio');

const HTML_FILE = path.join(__dirname, '../output/extracted.html');
const OUTPUT_JSON = path.join(__dirname, '../output/recipes-from-html.json');

/**
 * Extract menu code from LCD spans
 * Example: <span class="lcd">H</span><span class="lcd">P</span><span class="lcd">1</span>
 */
function extractMenuCode($, h3Element) {
  const lcdSpans = $(h3Element).find('span.lcd');
  let code = '';
  lcdSpans.each((i, span) => {
    code += $(span).text();
  });
  return code;
}

/**
 * Extract recipe name from h3
 * Example: HP1: Kala Chana
 */
function extractRecipeName($, h3Element) {
  const fullText = $(h3Element).text();
  // Remove menu code and colon
  const match = fullText.match(/:\s*(.+)$/);
  return match ? match[1].trim() : '';
}

/**
 * Parse ingredient table
 */
function parseIngredientTable($, tableElement) {
  const table = {
    columns: [],
    weightLimits: [],
    rows: []
  };

  // Get header row (first tr with th elements)
  const headerRow = $(tableElement).find('tbody > tr').first();
  headerRow.find('th').each((i, th) => {
    if (i > 0) { // Skip first "List" column (colspan=2)
      table.columns.push($(th).text().trim());
    }
  });

  // Get all data rows (skip header)
  const dataRows = $(tableElement).find('tbody > tr').slice(1);

  // Track if we're in the first row after header (which has rowspan cell)
  let isFirstDataRow = true;

  dataRows.each((rowIndex, tr) => {
    const cells = $(tr).find('td');

    // Determine cell offset based on rowspan
    // First data row has: <td rowspan=N> + <td>ingredient</td> + <td>values...</td>
    // Subsequent rows have: <td>ingredient</td> + <td>values...</td> (no rowspan cell)
    let ingredientCellIndex = isFirstDataRow ? 1 : 0;
    let valueCellsStart = isFirstDataRow ? 2 : 1;

    const ingredientCell = $(cells[ingredientCellIndex]).text().trim();

    // Check if this is the weight limit row
    if (ingredientCell === 'Weight Limit') {
      $(cells).slice(valueCellsStart).each((i, td) => {
        const colspan = $(td).attr('colspan');
        const value = $(td).text().trim();
        if (colspan) {
          // If colspan, repeat the value
          for (let j = 0; j < parseInt(colspan); j++) {
            table.weightLimits.push(value);
          }
        } else {
          table.weightLimits.push(value);
        }
      });
      isFirstDataRow = false; // After first row, no more rowspan
    } else {
      // Regular ingredient row
      const ingredient = ingredientCell;
      const quantities = [];

      $(cells).slice(valueCellsStart).each((i, td) => {
        const colspan = $(td).attr('colspan');
        const value = $(td).text().trim();
        if (colspan) {
          // If colspan, repeat the value
          for (let j = 0; j < parseInt(colspan); j++) {
            quantities.push(value);
          }
        } else {
          quantities.push(value);
        }
      });

      if (ingredient && quantities.length > 0) {
        table.rows.push({
          ingredient: ingredient,
          quantities: quantities
        });
      }

      isFirstDataRow = false; // After first row, no more rowspan
    }
  });

  return table;
}

/**
 * Parse instructions from ordered list
 */
function parseInstructions($, sectionElement) {
  const instructions = [];
  $(sectionElement).find('ol.orderedlist li').each((i, li) => {
    const text = $(li).text().trim();
    if (text) {
      instructions.push(text);
    }
  });
  return instructions;
}

/**
 * Extract all recipes from HTML
 */
async function extractRecipes() {
  console.log('Reading extracted HTML...');
  const html = await fs.readFile(HTML_FILE, 'utf-8');

  console.log('Parsing HTML with cheerio...');
  const $ = cheerio.load(html);

  const recipes = [];

  // Find all recipe sections (div.simplesect with h3 containing LCD spans)
  $('div.simplesect').each((index, section) => {
    const h3 = $(section).find('h3').first();

    if (h3.length === 0) return;

    // Extract menu code and name
    const menuCode = extractMenuCode($, h3);
    const recipeName = extractRecipeName($, h3);

    if (!menuCode || !recipeName) return;

    console.log(`Found: ${menuCode} - ${recipeName}`);

    const recipe = {
      menuCode: menuCode,
      name: recipeName,
      weightLimit: '',
      utensils: [],
      ingredientTable: null,
      steps: [],
      notes: []
    };

    // Extract weight limit and utensil from itemizedlist
    $(section).find('ul.itemizedlist li').each((i, li) => {
      const text = $(li).text();

      if (text.includes('Weight Limit')) {
        const match = text.match(/Weight Limit[:\s]+(.+)/);
        if (match) {
          recipe.weightLimit = match[1].trim();
        }
      }

      if (text.includes('Utensil')) {
        const match = text.match(/Utensil[:\s]+(.+)/);
        if (match) {
          recipe.utensils = match[1].split(',').map(u => u.trim());
        }
      }
    });

    // Find and parse ingredient table
    const table = $(section).find('table.table-border-all').first();
    if (table.length > 0) {
      recipe.ingredientTable = parseIngredientTable($, table);
    }

    // Parse instructions
    recipe.steps = parseInstructions($, section);

    // Extract notes
    $(section).find('div.note ul.itemizedlist li').each((i, li) => {
      const note = $(li).text().trim();
      if (note) {
        recipe.notes.push(note);
      }
    });

    recipes.push(recipe);
  });

  return recipes;
}

/**
 * Determine category from recipe code prefix
 */
function categorizeRecipes(recipes) {
  const categoryMap = {
    'HP': 'Health Plus',
    'so': 'Soup',
    'Co': 'Continental',
    'SA': 'Salad',
    'ts': 'Tandoor Se',
    'CF': "Child's Favourite",
    'st': 'Steam Cook',
    'sC': 'Steam Cook',
    'IC': 'Indian Cuisine',
    'sw': 'Sweet Corner',
    'rd': 'Rice Delight',
    'CC': 'Chatpat Corner',
    'ηh': 'Ghee',
    'bA': 'Bakery',
    'dd': 'Tea/Dairy Delight',
    'PA': 'Paneer/Curd',
    'CU': 'Paneer/Curd',
    'UC': 'Cooking Aid',
    'sL': 'Steam Clean'
  };

  return recipes.map(recipe => {
    // Try to match the first 2 characters
    const prefix = recipe.menuCode.substring(0, 2);
    const category = categoryMap[prefix] || 'Other';

    return {
      ...recipe,
      category: category
    };
  });
}

/**
 * Main function
 */
async function main() {
  console.log('='.repeat(60));
  console.log('HTML Recipe Parser - Extracting from rendered HTML');
  console.log('='.repeat(60));
  console.log('');

  try {
    const recipes = await extractRecipes();

    console.log('');
    console.log(`Total recipes found: ${recipes.length}`);
    console.log('');

    // Categorize recipes
    const categorizedRecipes = categorizeRecipes(recipes);

    // Count by category
    const byCategory = {};
    categorizedRecipes.forEach(r => {
      byCategory[r.category] = (byCategory[r.category] || 0) + 1;
    });

    console.log('Recipes by category:');
    Object.keys(byCategory).sort().forEach(cat => {
      console.log(`  ${cat.padEnd(25)} ${byCategory[cat]}`);
    });

    // Save to JSON
    await fs.writeFile(OUTPUT_JSON, JSON.stringify(categorizedRecipes, null, 2), 'utf-8');

    console.log('');
    console.log('='.repeat(60));
    console.log(`Saved ${categorizedRecipes.length} recipes to: recipes-from-html.json`);
    console.log('='.repeat(60));

    // Show sample recipe
    if (categorizedRecipes.length > 0) {
      console.log('');
      console.log('Sample recipe (HP1):');
      const hp1 = categorizedRecipes.find(r => r.menuCode === 'HP1');
      if (hp1) {
        console.log(`  Menu Code: ${hp1.menuCode}`);
        console.log(`  Name: ${hp1.name}`);
        console.log(`  Category: ${hp1.category}`);
        console.log(`  Weight Limit: ${hp1.weightLimit}`);
        console.log(`  Utensils: ${hp1.utensils.join(', ')}`);
        if (hp1.ingredientTable) {
          console.log(`  Ingredient columns: ${hp1.ingredientTable.columns.length}`);
          console.log(`  Ingredient rows: ${hp1.ingredientTable.rows.length}`);
        }
        console.log(`  Steps: ${hp1.steps.length}`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { extractRecipes, categorizeRecipes };
