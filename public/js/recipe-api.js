
let recipeForm
let recipeSearch
let recipeMessage
let recipeResults

document.addEventListener('DOMContentLoaded', initializeRecipePage)

function initializeRecipePage() {
    recipeForm = document.querySelector('#recipe-form')
    recipeSearch = document.querySelector('#recipe-search')
    recipeMessage = document.querySelector('#recipe-message')
    recipeResults = document.querySelector('#recipe-results')

    if (!recipeForm) {
        console.error('Recipe form was not found.')
        return
    }

    recipeForm.addEventListener('submit', handleRecipeSearch)
}

async function handleRecipeSearch(event) {
    event.preventDefault()

    const ingredient = recipeSearch.value.trim()

    if (!ingredient) {
        showMessage('Please enter an ingredient.')
        return
    }

    saveLastRecipeSearch(ingredient)
    showMessage('Loading recipes...')
    recipeResults.innerHTML = ''

    try {
        const recipes = await fetchRecipes(ingredient)

        if (!recipes || recipes.length === 0) {
            showMessage('No recipes were found.')
            return
        }

        showMessage('')
        displayRecipes(recipes)

    } catch(error) {
        console.error('Recipe search error:', error) 
        showMessage('Recipes could not be loaded. Please try again.')
    }
}

async function fetchRecipes(ingredients) {
    const encodedIngredients = encodeURIComponent(ingredients)

    const response = await fetch(
        `/api/spoonacular-recipes?ingredients=${encodedIngredients}`
    )

    if (!response.ok) {
        throw new Error('Recipe search failed.')
    }

    const recipes = await response.json()

    return recipes.map(function (recipe) {
        const missingIngredients = recipe.missedIngredients.map(
            function (ingredient) {
                return ingredient.name
            }
        )

        return {
            id: recipe.id,
            name: recipe.title,
            image: recipe.image,
            category:
                `Uses ${recipe.usedIngredientCount} entered ingredient(s)`,
            instructions: missingIngredients.length
                ? `You may also need: ${missingIngredients.join(', ')}`
                : 'No additional ingredients are listed.'
        }
    })
}

function displayRecipes(recipes) {
    recipeResults.innerHTML = ''

    recipes.forEach(function (recipe) {
        const card = document.createElement('article')

        const title = document.createElement('h2')
        title.textContent = recipe.name

        const image = document.createElement('img')
        image.src = recipe.image
        image.alt = recipe.name
        image.width = 250

        const category = document.createElement('p')
        category.textContent = `Category: ${recipe.category}`

        const instructions = document.createElement('p')
        instructions.textContent = recipe.instructions

        card.append(title, image, category, instructions)
        recipeResults.appendChild(card)
    })
}

function showMessage(message) {
    recipeMessage.textContent = message
}