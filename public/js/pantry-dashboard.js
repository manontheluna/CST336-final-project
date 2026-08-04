import { validatePantryItem } from './pantry-validation.js'

document.addEventListener('DOMContentLoaded', setupPantryDashboard)

function setupPantryDashboard() {
    const pantryForm = document.querySelector('#ingredientForm')

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