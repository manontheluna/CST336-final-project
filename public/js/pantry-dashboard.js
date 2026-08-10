import { validatePantryItem } from './pantry-validation.js'
import { calculateExpirationStatus } from './pantry-expiration.mjs'
import {
        filterPantryItems,
        filterByExpirationStatus,
        sortPantryItems
    } from './pantry-list-utils.js'

document.addEventListener('DOMContentLoaded', setupPantryDashboard)
document.addEventListener('usda-food-selected', handleUsdaFoodSelected)

function setupPantryDashboard() {
    const pantryForm = document.querySelector('#ingredientForm')

    showExpirationStatuses()
    loadSelectedUsdaFood()
    setupPantryControls()

    if (!pantryForm) {
        return
    }

    pantryForm.addEventListener('submit', handlePantryFormSubmit)
    pantryForm.addEventListener('input', clearFormErrors)
}

function handlePantryFormSubmit(event) {
    const form = event.currentTarget
    const formData = new FormData(form)

    const pantryItem = {
        ingredientName: formData.get('ingredientName'),
        quantity: formData.get('quantity'),
        unit: formData.get('unit'),
        expiration: formData.get('expiration')
    }

    const validation = validatePantryItem(pantryItem)

    clearValidationErrors(form)

    if (!validation.isValid) {
        event.preventDefault()
        showValidationErrors(form, validation.errors)
    }
}

function clearValidationErrors(form) {
    const errorContainer = form.querySelector('#pantry-validation-errors')

    if (errorContainer) {
        errorContainer.remove()
    }

    form.querySelectorAll('[aria-invalid="true"]').forEach(field => {
        field.removeAttribute('aria-invalid')
    })
}

function showValidationErrors(form, errors) {
    const container = document.createElement('div')
    const errorList = document.createElement('ul')

    container.id = 'pantry-validation-errors'
    container.setAttribute('role', 'alert')

    if (errors.name) {
        markFieldInvalid(form, 'ingredientName')
        addErrorMessage(errorList, errors.name)
    }

    if (errors.quantity) {
        markFieldInvalid(form, 'quantity')
        addErrorMessage(errorList, errors.quantity)
    }

    if (errors.category) {
        markFieldInvalid(form, 'category')
        addErrorMessage(errorList, errors.category)
    }

    if (errors.expirationDate) {
        markFieldInvalid(form, 'expiration')
        addErrorMessage(errorList, errors.expirationDate)
    }

    container.appendChild(errorList)
    form.prepend(container)
}

function markFieldInvalid(form, fieldName) {
    const field = form.querySelector(`[name="${fieldName}"]`)

    if (field) {
        field.setAttribute('aria-invalid', 'true')
    }
}

function addErrorMessage(errorList, message) {
    const errorItem = document.createElement('li')
    errorItem.textContent = message
    errorList.appendChild(errorItem)
}

function clearFormErrors(event) {
    const form = event.currentTarget
    clearValidationErrors(form)
}

function handleUsdaFoodSelected(event) {
    const food = event.detail
    const nameField = document.querySelector('[name="ingredientName"]')

    if (nameField) {
        nameField.value = food.name
    }
}

function showExpirationStatuses() {
    document.querySelectorAll('.pantry > ul > li').forEach(item => {
        const expirationText = item.querySelector('.expiration-date')

        if (!expirationText) {
            return
        }

        const result = calculateExpirationStatus(
            expirationText.dataset.expiration
        )
        const status = typeof result === 'string' ? result : result.status

        const badge = document.createElement('span')
        if (status === 'expiring-soon') {
            badge.textContent = 'Expiring Soon'
        } else if (status === 'fresh') {
            badge.textContent = 'Fresh'
        } else if (status === 'expired') {
            badge.textContent = 'Expired'
        }
        
        badge.classList.add('expiration-status', status)

        item.appendChild(badge)
    })
}

function loadSelectedUsdaFood() {
    const savedFood = localStorage.getItem('selectedUsdaFood')

    if (!savedFood) {
        return
    }

    const food = JSON.parse(savedFood)
    const nameField = document.querySelector('[name="ingredientName"]')

    if (nameField) {
        nameField.value = food.name
        localStorage.removeItem('selectedUsdaFood')
    }
}

function setupPantryControls() {
    const searchInput = document.querySelector('#pantry-search')
    const statusFilter = document.querySelector('#pantry-status-filter')
    const sortSelect = document.querySelector('#pantry-sort')

    if (searchInput) {
        searchInput.addEventListener('input', updatePantryList)
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', updatePantryList)
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', updatePantryList)
    }
}

function updatePantryList() {
    const pantryList = document.querySelector('.pantry > ul')

    if (!pantryList) {
        return
    }

    const searchInput = document.querySelector('#pantry-search')
    const statusFilter = document.querySelector('#pantry-status-filter')
    const sortSelect = document.querySelector('#pantry-sort')

    const pantryItems = []

    pantryList.querySelectorAll('li').forEach(element => {
        const editButton = element.querySelector('.edit-pantry')

        if (!editButton) {
            return
        }

        const item = JSON.parse(editButton.dataset.ingredient)
        item.element = element
        pantryItems.push(item)
    })

    let results = filterPantryItems(
        pantryItems,
        searchInput ? searchInput.value : ''
    )

    results = filterByExpirationStatus(
        results,
        statusFilter ? statusFilter.value : 'all'
    )

    results = sortPantryItems(
        results,
        sortSelect ? sortSelect.value : ''
    )

    pantryItems.forEach(item => {
        item.element.hidden = true
    })

    results.forEach(item => {
        item.element.hidden = false
        pantryList.appendChild(item.element)
    })
}