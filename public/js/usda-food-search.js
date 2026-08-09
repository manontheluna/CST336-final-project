document.addEventListener('DOMContentLoaded', setupFoodSearch)

function setupFoodSearch() {
    const searchForm = document.querySelector('#food-search-form')

    if (!searchForm) {
        return
    }
    searchForm.addEventListener('submit', searchFoods)
}

async function searchFoods(event) {
    event.preventDefault()

    const searchInput = document.querySelector('#food-search-input')
    const resultsContainer = document.querySelector('#food-search-results')
    const statusMessage = document.querySelector('#food-search-status')

    if (!searchInput || !resultsContainer || !statusMessage) {
        return
    }

    const query = searchInput.value.trim()

    resultsContainer.replaceChildren()

    if (!query) {
        statusMessage.textContent = 'Enter a food name.'
        return
    }

    statusMessage.textContent = 'Searching for foods...'

    try {
        const response = await fetch(`/api/usda-foods?query=${encodeURIComponent(query)}`)

        const foodData = await response.json()

        if (!response.ok) {
            throw new Error(foodData.error || 'Food information could not be loaded.')
        }
        displayFoods(foodData.foods, resultsContainer, statusMessage)
    } catch (error) {
        statusMessage.textContent = error.message
    }
}

function displayFoods(foods, resultsContainer, statusMessage) {
    resultsContainer.replaceChildren()

    if (!foods || foods.length === 0) {
        statusMessage.textContent = 'No matching foods were found.'
        return
    }

    statusMessage.textContent = `${foods.length} food results found.`

    foods.forEach((food) => {
        const foodCard = createFoodCard(food)
        resultsContainer.appendChild(foodCard)
    })
}

function createFoodCard(food) {
    const foodCard = document.createElement('article')
    foodCard.classList.add('food-result')

    const name = document.createElement('h3')
    name.textContent = food.name || 'Unnamed food'

    const brand = document.createElement('p')
    brand.textContent = food.brand ? `Brand: ${food.brand}` : 'Brand not available'

    const category = document.createElement('p')
    category.textContent = food.category ? `Category: ${food.category}` : 'Category not available'

    const serving = document.createElement('p')
    serving.textContent = getServingText(food)

    const nutrientList = createNutrientList(food.nutrients)

    const selectButton = document.createElement('button')
    selectButton.type = 'button'
    selectButton.textContent = 'Use this food'

    selectButton.addEventListener('click', () => {
        document.querySelectorAll('.food-result button').forEach(button => {
        button.textContent = 'Use this food'
        })

        document.dispatchEvent(new CustomEvent('usda-food-selected', {
            detail: food
        }))

        selectButton.textContent = 'Selected'
})

    foodCard.append(
        name,
        brand,
        category,
        serving,
        nutrientList,
        selectButton
    )

    return foodCard
}

function getServingText(food) {
    if (!food.servingSize) {
        return 'Serving information not available'
    }

    return `Serving: ${food.servingSize} ${food.servingSizeUnit}`
}

function createNutrientList(nutrients) {
    const nutrientList = document.createElement('ul')
    const safeNutrients = nutrients ?? []

    safeNutrients.forEach((nutrient) => {
        const nutrientItem = document.createElement('li')

        nutrientItem.textContent = `${nutrient.name}: ${nutrient.value} ${nutrient.unit}`

        nutrientList.appendChild(nutrientItem)
    })

    return nutrientList
}