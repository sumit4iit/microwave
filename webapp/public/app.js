// ===== Global State =====
let allRecipes = [];
let filteredRecipes = [];
let currentCategory = 'all';

// ===== Initialize App =====
document.addEventListener('DOMContentLoaded', () => {
    loadRecipes();
    setupEventListeners();
});

// ===== Load Recipes from JSON =====
async function loadRecipes() {
    try {
        const response = await fetch('data/recipes.json');
        if (!response.ok) throw new Error('Failed to load recipes');

        allRecipes = await response.json();
        filteredRecipes = allRecipes;

        renderCategoryFilters();
        renderRecipes();
        updateResultsCount();

        document.getElementById('loadingState').style.display = 'none';
    } catch (error) {
        console.error('Error loading recipes:', error);
        document.getElementById('loadingState').innerHTML =
            '<p style="color: #e74c3c;">Failed to load recipes. Please refresh the page.</p>';
    }
}

// ===== Setup Event Listeners =====
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', handleSearch);

    // "All Recipes" button
    document.querySelector('[data-category="all"]').addEventListener('click', () => {
        handleCategoryFilter('all');
    });

    // Modal close
    document.getElementById('closeModal').addEventListener('click', closeModal);

    // Close modal on background click
    document.getElementById('recipeModal').addEventListener('click', (e) => {
        if (e.target.id === 'recipeModal') {
            closeModal();
        }
    });

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

// ===== Render Category Filters =====
function renderCategoryFilters() {
    const categories = {};

    // Count recipes per category
    allRecipes.forEach(recipe => {
        const cat = recipe.category || 'Other';
        categories[cat] = (categories[cat] || 0) + 1;
    });

    // Sort categories alphabetically
    const sortedCategories = Object.keys(categories).sort();

    const filterContainer = document.querySelector('.category-filters');

    // Update "All Recipes" count
    document.getElementById('count-all').textContent = allRecipes.length;

    // Add category buttons
    sortedCategories.forEach(category => {
        const button = document.createElement('button');
        button.className = 'category-btn';
        button.dataset.category = category;
        button.innerHTML = `${category} <span class="count">${categories[category]}</span>`;

        button.addEventListener('click', () => handleCategoryFilter(category));
        filterContainer.appendChild(button);
    });
}

// ===== Handle Search =====
function handleSearch(e) {
    const query = e.target.value.toLowerCase().trim();

    if (query === '') {
        filteredRecipes = currentCategory === 'all'
            ? allRecipes
            : allRecipes.filter(r => r.category === currentCategory);
    } else {
        const baseRecipes = currentCategory === 'all'
            ? allRecipes
            : allRecipes.filter(r => r.category === currentCategory);

        filteredRecipes = baseRecipes.filter(recipe => {
            return recipe.name.toLowerCase().includes(query) ||
                   recipe.menuCode.toLowerCase().includes(query);
        });
    }

    renderRecipes();
    updateResultsCount();
}

// ===== Handle Category Filter =====
function handleCategoryFilter(category) {
    currentCategory = category;

    // Update active button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === category) {
            btn.classList.add('active');
        }
    });

    // Filter recipes
    if (category === 'all') {
        filteredRecipes = allRecipes;
    } else {
        filteredRecipes = allRecipes.filter(r => r.category === category);
    }

    // Clear search and re-render
    document.getElementById('searchInput').value = '';
    renderRecipes();
    updateResultsCount();
}

// ===== Render Recipes =====
function renderRecipes() {
    const grid = document.getElementById('recipeGrid');
    const noResults = document.getElementById('noResults');

    if (filteredRecipes.length === 0) {
        grid.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }

    noResults.style.display = 'none';

    grid.innerHTML = filteredRecipes.map(recipe => `
        <div class="recipe-card" onclick="showRecipeDetail('${recipe.menuCode}')">
            <div class="menu-code">${recipe.menuCode}</div>
            <div class="recipe-name">${recipe.name}</div>
            <div class="category-badge">${recipe.category}</div>
            ${recipe.weightLimit ? `<div class="weight-info">Weight: ${recipe.weightLimit}</div>` : ''}
        </div>
    `).join('');
}

// ===== Update Results Count =====
function updateResultsCount() {
    const count = filteredRecipes.length;
    const total = currentCategory === 'all' ? allRecipes.length : allRecipes.filter(r => r.category === currentCategory).length;

    document.getElementById('resultsCount').textContent =
        count === total ? `Showing ${count} recipes` : `Showing ${count} of ${total} recipes`;
}

// ===== Show Recipe Detail =====
function showRecipeDetail(menuCode) {
    const recipe = allRecipes.find(r => r.menuCode === menuCode);
    if (!recipe) return;

    const modal = document.getElementById('recipeModal');
    const detailContainer = modal.querySelector('.recipe-detail');

    detailContainer.innerHTML = `
        <div class="menu-code-large">${recipe.menuCode}</div>
        <h2>${recipe.name}</h2>
        <div class="category-badge">${recipe.category}</div>

        <div class="meta">
            ${recipe.weightLimit ? `
                <div class="meta-item">
                    <strong>Weight Limit</strong>
                    <div>${recipe.weightLimit}</div>
                </div>
            ` : ''}

            ${recipe.utensils && recipe.utensils.length > 0 ? `
                <div class="meta-item">
                    <strong>Required Utensils</strong>
                    <ul class="utensils-list">
                        ${recipe.utensils.map(u => `<li>${u}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>

        ${renderIngredientTable(recipe)}

        ${renderSteps(recipe)}

        ${renderNotes(recipe)}
    `;

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// ===== Render Ingredient Table =====
function renderIngredientTable(recipe) {
    if (!recipe.ingredientTable || !recipe.ingredientTable.rows || recipe.ingredientTable.rows.length === 0) {
        return '';
    }

    const table = recipe.ingredientTable;

    return `
        <div class="ingredient-table-section">
            <h3>Ingredients</h3>
            <div class="ingredient-table">
                <table>
                    <thead>
                        <tr>
                            <th>Ingredient</th>
                            ${table.columns.map(col => `<th>${col}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${table.weightLimits && table.weightLimits.length > 0 ? `
                            <tr class="weight-limit-row">
                                <td><strong>Weight Limit</strong></td>
                                ${table.weightLimits.map(wl => `<td>${wl}</td>`).join('')}
                            </tr>
                        ` : ''}
                        ${table.rows.map(row => `
                            <tr>
                                <td><strong>${row.ingredient}</strong></td>
                                ${row.quantities.map(qty => `<td>${qty}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ===== Render Steps =====
function renderSteps(recipe) {
    if (!recipe.steps || recipe.steps.length === 0) {
        return '';
    }

    return `
        <div class="steps-section">
            <h3>Instructions</h3>
            <ol class="steps-list">
                ${recipe.steps.map(step => `<li>${step}</li>`).join('')}
            </ol>
        </div>
    `;
}

// ===== Render Notes =====
function renderNotes(recipe) {
    if (!recipe.notes || recipe.notes.length === 0) {
        return '';
    }

    return `
        <div class="notes-section">
            <h3>Notes</h3>
            <ul>
                ${recipe.notes.map(note => `<li>${note}</li>`).join('')}
            </ul>
        </div>
    `;
}

// ===== Close Modal =====
function closeModal() {
    document.getElementById('recipeModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}
