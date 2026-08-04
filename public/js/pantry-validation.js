export function validatePantryItem(item) {
    const errors = {}
    const name = (item.ingredientName ?? item.name)?.trim()
    const quantity = Number(item.quantity)
    const expirationDate = item.expiration ?? item.expirationDate

    if (!name) {
        errors.name = 'Item name is required.'
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
        errors.quantity = 'Quantity must be greater than zero.'
    }

    if ('category' in item && !item.category) {
        errors.category = 'Category is required.'
    }

    if (!expirationDate) {
        errors.expirationDate = 'Expiration date is required.'
    } else if (!isValidDate(expirationDate)) {
        errors.expirationDate = 'Enter a valid expiration date.'
    }

    if (
        item.purchaseDate &&
        expirationDate &&
        item.purchaseDate > expirationDate
    ) {
        errors.expirationDate =
            'Expiration date cannot be before the purchase date.'
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    }
}

function isValidDate(dateValue) {
    const date = new Date(`${dateValue}T00:00:00`)

    return !Number.isNaN(date.getTime())
}