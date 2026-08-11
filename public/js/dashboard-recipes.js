document.addEventListener('DOMContentLoaded', loadDashboardRecipes)

async function loadDashboardRecipes() {
    const recipeData = document.querySelector('#dashboard-recipe-data')
    const results = document.querySelector('#dashboard-recipe-results')
    const status = document.querySelector('#dashboard-recipe-status')

    if (!recipeData || !results || !status) {
        return
    }

    const ingredients = recipeData.dataset.ingredients

    if (!ingredients) {
        status.textContent = 'Add pantry items to get recipe suggestions.'
        return
    }

    try {
        const response = await fetch(
            `/api/spoonacular-recipes?ingredients=${encodeURIComponent(ingredients)}`
        )

        const recipes = await response.json()

        if (!response.ok) {
            status.textContent = 'Recipe suggestions could not be loaded.'
            return
        }

        status.textContent = ''

        recipes.slice(0, 3).forEach(recipe => {
            const card = document.createElement('div')
            card.classList.add('dashboard-recipe-card')

            const image = document.createElement('img')
            image.src = recipe.image
            image.alt = recipe.title

            const title = document.createElement('strong')
            title.textContent = recipe.title

            const details = document.createElement('span')
            details.textContent =
                `Uses ${recipe.usedIngredientCount} pantry ingredient(s)`

            card.append(image, title, details)
            results.appendChild(card)
        })
    } catch (error) {
        status.textContent = 'Recipe suggestions could not be loaded.'
    }
}