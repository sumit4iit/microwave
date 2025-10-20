const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const SOURCE_DIR = path.join(__dirname, '../source');
const OUTPUT_DIR = path.join(__dirname, '../output');

/**
 * Decode MHTML quoted-printable encoding
 */
function decodeQuotedPrintable(text) {
  return text
    .replace(/=\r?\n/g, '') // Remove soft line breaks
    .replace(/=([0-9A-F]{2})/g, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });
}

/**
 * Extract HTML from MHTML file
 */
function extractHTMLFromMHTML(mhtmlContent) {
  const htmlMatch = mhtmlContent.match(/Content-Type: text\/html\r?\nContent-ID:.*?\r?\nContent-Transfer-Encoding: quoted-printable\r?\nContent-Location:.*?\r?\n\r?\n([\s\S]*?)(?=\r?\n------MultipartBoundary)/);

  if (htmlMatch) {
    const encodedHtml = htmlMatch[1];
    return decodeQuotedPrintable(encodedHtml);
  }
  return null;
}

/**
 * Extract menu code from LCD spans
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
 */
function extractRecipeName($, h3Element) {
  const fullText = $(h3Element).text();
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

  const headerRow = $(tableElement).find('tbody > tr').first();
  headerRow.find('th').each((i, th) => {
    if (i > 0) {
      table.columns.push($(th).text().trim());
    }
  });

  const dataRows = $(tableElement).find('tbody > tr').slice(1);
  let isFirstDataRow = true;

  dataRows.each((rowIndex, tr) => {
    const cells = $(tr).find('td');
    let ingredientCellIndex = isFirstDataRow ? 1 : 0;
    let valueCellsStart = isFirstDataRow ? 2 : 1;
    const ingredientCell = $(cells[ingredientCellIndex]).text().trim();

    if (ingredientCell === 'Weight Limit') {
      $(cells).slice(valueCellsStart).each((i, td) => {
        const colspan = $(td).attr('colspan');
        const value = $(td).text().trim();
        if (colspan) {
          for (let j = 0; j < parseInt(colspan); j++) {
            table.weightLimits.push(value);
          }
        } else {
          table.weightLimits.push(value);
        }
      });
      isFirstDataRow = false;
    } else {
      const ingredient = ingredientCell;
      const quantities = [];

      $(cells).slice(valueCellsStart).each((i, td) => {
        const colspan = $(td).attr('colspan');
        const value = $(td).text().trim();
        if (colspan) {
          for (let j = 0; j < parseInt(colspan); j++) {
            quantities.push(value);
          }
        } else {
          quantities.push(value);
        }
      });

      if (ingredient && quantities.length > 0) {
        table.rows.push({
          ingredient: ingredient.replace(/\s+/g, ' '), // Clean up whitespace
          quantities: quantities
        });
      }

      isFirstDataRow = false;
    }
  });

  return table;
}

/**
 * Parse instructions
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
 * Extract recipes from HTML
 */
function extractRecipes(html) {
  const $ = cheerio.load(html);
  const recipes = [];

  $('div.simplesect').each((index, section) => {
    const h3 = $(section).find('h3').first();
    if (h3.length === 0) return;

    const menuCode = extractMenuCode($, h3);
    const recipeName = extractRecipeName($, h3);
    if (!menuCode || !recipeName) return;

    const recipe = {
      menuCode: menuCode,
      name: recipeName,
      weightLimit: '',
      utensils: [],
      ingredientTable: null,
      steps: [],
      notes: []
    };

    $(section).find('ul.itemizedlist li').each((i, li) => {
      const text = $(li).text();
      if (text.includes('Weight Limit')) {
        const match = text.match(/Weight Limit[:\s]+(.+)/);
        if (match) recipe.weightLimit = match[1].trim();
      }
      if (text.includes('Utensil')) {
        const match = text.match(/Utensil[:\s]+(.+)/);
        if (match) recipe.utensils = match[1].split(',').map(u => u.trim());
      }
    });

    const table = $(section).find('table.table-border-all').first();
    if (table.length > 0) {
      recipe.ingredientTable = parseIngredientTable($, table);
    }

    recipe.steps = parseInstructions($, section);

    $(section).find('div.note ul.itemizedlist li').each((i, li) => {
      const note = $(li).text().trim();
      if (note) recipe.notes.push(note);
    });

    recipes.push(recipe);
  });

  return recipes;
}

/**
 * Categorize recipes
 */
function categorizeRecipes(recipes) {
  const categoryMap = {
    'HP': 'Health Plus',
    'so': 'Soup',
    'Co': 'Continental',
    'SA': 'Salad',
    'ts': 'Tandoor Se',
    't5': 'Tandoor Se',  // LCD font makes 'S' look like '5'
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
    const prefix = recipe.menuCode.substring(0, 2);
    const category = categoryMap[prefix] || 'Other';
    return { ...recipe, category };
  });
}

/**
 * Process a single MHTML file
 */
async function processMHTMLFile(filename) {
  console.log(`\nProcessing: ${filename}`);
  console.log('='.repeat(60));

  const mhtmlPath = path.join(SOURCE_DIR, filename);
  const mhtmlContent = await fs.readFile(mhtmlPath, 'utf-8');

  console.log('  Extracting HTML from MHTML...');
  const html = extractHTMLFromMHTML(mhtmlContent);

  if (!html) {
    console.log('  ❌ Could not extract HTML');
    return [];
  }

  console.log('  Parsing recipes...');
  const recipes = extractRecipes(html);
  const categorizedRecipes = categorizeRecipes(recipes);

  console.log(`  ✓ Found ${categorizedRecipes.length} recipes`);

  return categorizedRecipes;
}

/**
 * Main function
 */
async function main() {
  console.log('='.repeat(60));
  console.log('BATCH MHTML RECIPE PROCESSOR');
  console.log('='.repeat(60));

  // Get all MHTML files
  const files = await fs.readdir(SOURCE_DIR);
  const mhtmlFiles = files.filter(f => f.endsWith('.mhtml'));

  console.log(`\nFound ${mhtmlFiles.length} MHTML files to process\n`);

  const allRecipes = [];

  for (const file of mhtmlFiles) {
    try {
      const recipes = await processMHTMLFile(file);
      allRecipes.push(...recipes);
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total recipes extracted: ${allRecipes.length}`);

  // Count by category
  const byCategory = {};
  allRecipes.forEach(r => {
    byCategory[r.category] = (byCategory[r.category] || 0) + 1;
  });

  console.log('\nRecipes by category:');
  Object.keys(byCategory).sort().forEach(cat => {
    console.log(`  ${cat.padEnd(25)} ${byCategory[cat]}`);
  });

  // Save combined output
  const outputPath = path.join(OUTPUT_DIR, 'all-recipes.json');
  await fs.writeFile(outputPath, JSON.stringify(allRecipes, null, 2), 'utf-8');

  console.log('\n' + '='.repeat(60));
  console.log(`✓ Saved ${allRecipes.length} recipes to: ${path.basename(outputPath)}`);
  console.log('='.repeat(60));
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { processMHTMLFile, categorizeRecipes };
