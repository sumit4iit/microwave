const fs = require('fs');
const path = require('path');

const RECIPES_FILE = path.join(__dirname, '../../webapp/public/data/recipes.json');
const OUTPUT_DIR = path.join(__dirname, 'blog');
const MAIN_BLOG_FILE = path.join(__dirname, 'recipes-blog.md');
const INDEX_FILE = path.join(__dirname, 'recipes-index.md');

// Load recipes
const recipes = JSON.parse(fs.readFileSync(RECIPES_FILE, 'utf-8'));

// Group by category
const recipesByCategory = {};
recipes.forEach(recipe => {
  const cat = recipe.category || 'Other';
  if (!recipesByCategory[cat]) {
    recipesByCategory[cat] = [];
  }
  recipesByCategory[cat].push(recipe);
});

// Sort categories by recipe count
const sortedCategories = Object.keys(recipesByCategory).sort((a, b) => {
  return recipesByCategory[b].length - recipesByCategory[a].length;
});

// Helper function to create category slug
function createSlug(text) {
  return text.toLowerCase().replace(/['\s]+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// Helper function to format ingredient table
function formatIngredientTable(recipe) {
  if (!recipe.ingredientTable || !recipe.ingredientTable.rows || recipe.ingredientTable.rows.length === 0) {
    return '';
  }

  const table = recipe.ingredientTable;
  let md = '\n#### Ingredients\n\n';

  // Table header
  md += '| Ingredient |';
  table.columns.forEach(col => {
    md += ` ${col} |`;
  });
  md += '\n|';

  // Table separator
  md += '------------|';
  table.columns.forEach(() => {
    md += '----------|';
  });
  md += '\n';

  // Weight limits row
  if (table.weightLimits && table.weightLimits.length > 0) {
    md += '| **Weight Limit** |';
    table.weightLimits.forEach(wl => {
      md += ` ${wl} |`;
    });
    md += '\n';
  }

  // Ingredient rows
  table.rows.forEach(row => {
    md += `| ${row.ingredient} |`;
    row.quantities.forEach(qty => {
      md += ` ${qty} |`;
    });
    md += '\n';
  });

  return md;
}

// Helper function to format recipe
function formatRecipe(recipe) {
  let md = `\n### ${recipe.menuCode}: ${recipe.name}\n\n`;

  // Metadata
  md += `**Menu Code**: ${recipe.menuCode}  \n`;
  if (recipe.weightLimit) {
    md += `**Weight Limit**: ${recipe.weightLimit}  \n`;
  }
  if (recipe.utensils && recipe.utensils.length > 0) {
    md += `**Utensils**: ${recipe.utensils.join(', ')}  \n`;
  }

  // Ingredient table
  md += formatIngredientTable(recipe);

  // Instructions
  if (recipe.steps && recipe.steps.length > 0) {
    md += '\n#### Instructions\n\n';
    recipe.steps.forEach((step, i) => {
      md += `${i + 1}. ${step}\n`;
    });
  }

  // Notes
  if (recipe.notes && recipe.notes.length > 0) {
    md += '\n#### Notes\n\n';
    recipe.notes.forEach(note => {
      md += `- ${note}\n`;
    });
  }

  md += '\n---\n';
  return md;
}

// Generate main blog file
console.log('Generating main blog file...');
let mainBlog = `# LG Microwave Recipes - 204 Vegetarian Indian Recipes\n\n`;
mainBlog += `> A comprehensive collection of vegetarian Indian recipes for LG Microwave\n\n`;
mainBlog += `**Total Recipes**: 204  \n`;
mainBlog += `**Categories**: 16  \n`;
mainBlog += `**100% Vegetarian** - No meat, fish, eggs, or animal products\n\n`;

// Table of Contents
mainBlog += `## Table of Contents\n\n`;
sortedCategories.forEach(cat => {
  const slug = createSlug(cat);
  const count = recipesByCategory[cat].length;
  mainBlog += `- [${cat}](#${slug}) (${count} recipes)\n`;
});
mainBlog += `\n---\n`;

// Add all recipes by category
sortedCategories.forEach(cat => {
  const slug = createSlug(cat);
  const categoryRecipes = recipesByCategory[cat];

  mainBlog += `\n## ${cat}\n\n`;
  mainBlog += `*${categoryRecipes.length} recipes*\n\n`;

  // Sort recipes by menu code
  categoryRecipes.sort((a, b) => a.menuCode.localeCompare(b.menuCode));

  categoryRecipes.forEach(recipe => {
    mainBlog += formatRecipe(recipe);
  });
});

fs.writeFileSync(MAIN_BLOG_FILE, mainBlog, 'utf-8');
console.log(`✓ Generated: ${path.basename(MAIN_BLOG_FILE)} (${Math.round(mainBlog.length / 1024)} KB)`);

// Generate category-wise files
console.log('\nGenerating category files...');
sortedCategories.forEach(cat => {
  const slug = createSlug(cat);
  const categoryRecipes = recipesByCategory[cat];

  let catMd = `# ${cat} Recipes\n\n`;
  catMd += `*${categoryRecipes.length} vegetarian recipes*\n\n`;
  catMd += `[← Back to All Recipes](../recipes-blog.md)\n\n`;
  catMd += `---\n`;

  categoryRecipes.sort((a, b) => a.menuCode.localeCompare(b.menuCode));

  categoryRecipes.forEach(recipe => {
    catMd += formatRecipe(recipe);
  });

  const catFile = path.join(OUTPUT_DIR, `${slug}.md`);
  fs.writeFileSync(catFile, catMd, 'utf-8');
  console.log(`  ✓ ${cat}: ${path.basename(catFile)}`);
});

// Generate index file
console.log('\nGenerating index file...');
let index = `# LG Microwave Recipe Index\n\n`;
index += `## Quick Navigation\n\n`;
index += `- [📖 Complete Recipe Blog](recipes-blog.md) - All 204 recipes in one file\n`;
index += `- [🌐 Web App](../webapp/README.md) - Interactive recipe browser\n\n`;
index += `## Recipes by Category\n\n`;

sortedCategories.forEach(cat => {
  const slug = createSlug(cat);
  const count = recipesByCategory[cat].length;
  index += `### ${cat} (${count} recipes)\n\n`;
  index += `[📄 View ${cat} recipes](blog/${slug}.md)\n\n`;

  const categoryRecipes = recipesByCategory[cat];
  categoryRecipes.sort((a, b) => a.menuCode.localeCompare(b.menuCode));

  categoryRecipes.forEach(recipe => {
    index += `- **${recipe.menuCode}**: ${recipe.name}\n`;
  });
  index += `\n`;
});

index += `\n---\n\n`;
index += `**Total**: 204 Vegetarian Recipes  \n`;
index += `**Source**: LG Microwave Manual  \n`;
index += `**Format**: Markdown (.md)  \n`;

fs.writeFileSync(INDEX_FILE, index, 'utf-8');
console.log(`✓ Generated: ${path.basename(INDEX_FILE)}`);

// Summary
console.log('\n' + '='.repeat(60));
console.log('Blog Generation Complete!');
console.log('='.repeat(60));
console.log(`Main blog: ${path.basename(MAIN_BLOG_FILE)}`);
console.log(`Index file: ${path.basename(INDEX_FILE)}`);
console.log(`Category files: ${sortedCategories.length} files in blog/`);
console.log(`Total recipes: ${recipes.length}`);
console.log('='.repeat(60));
