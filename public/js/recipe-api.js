
let recipeForm
let recipeSearch
let recipeMessage
let recipeResults
let savedRecipeTitles = new Set()

document.addEventListener('DOMContentLoaded', initializeRecipePage)

async function initializeRecipePage() {
    recipeForm = document.querySelector('#recipe-form')
    recipeSearch = document.querySelector('#recipe-search')
    recipeMessage = document.querySelector('#recipe-message')
    recipeResults = document.querySelector('#recipe-results')

    if (!recipeForm) {
        console.error('Recipe form was not found.')
        return
    }
    await loadSavedRecipes()
    recipeForm.addEventListener('submit', handleRecipeSearch)
}

async function loadSavedRecipes() {

    try {

        const response = await fetch('/api/saved-recipes')

        // User may not be logged in
        if (!response.ok || response.redirected) {
            return
        }

        const savedRecipes = await response.json()

        savedRecipeTitles = new Set(
            savedRecipes.map(function (recipe) {
                return recipe.title
            })
        )

    } catch (error) {

        console.error('Saved recipes could not be checked:', error)
    }
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

    } catch (error) {
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

        // Button used to save recipe
        const saveButton = document.createElement('button')
        saveButton.classList.add('save-recipe-button')

        // Check if this recipe has already been saved
        if (savedRecipeTitles.has(recipe.name)) {

            saveButton.textContent = 'Saved'
            saveButton.disabled = true

        } else {

            saveButton.textContent = 'Save Recipe'

            saveButton.addEventListener('click', function () {
                saveRecipe(recipe.id, recipe.name, saveButton)
            })
        }

        card.append(title, image, category, instructions, saveButton)
        recipeResults.appendChild(card)
    })
}

async function saveRecipe(recipeId, recipeName, button) {
    button.disabled = true
    button.textContent = 'Saving...'

    try {

        const response = await fetch(
            `/api/saved-recipes/${recipeId}`,
            {
                method: 'POST'
            }
        )

        const data = await response.json()

        if (!response.ok) {
            button.textContent = 'Could Not Save'
            button.disabled = false
            return
        }

        button.textContent = 'Saved'
        button.disabled = true

        savedRecipeTitles.add(recipeName)

    } catch (error) {

        console.error('Save recipe error:', error)

        button.textContent = 'Could Not Save'
        button.disabled = false
    }
}

function showMessage(message) {
    recipeMessage.textContent = message
}