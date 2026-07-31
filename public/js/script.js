const editPantry = document.querySelector('.edit-pantry')

// ingredient/pantry form
editPantry?.addEventListener('click', () => {
    console.log(editPantry.dataset.ingredient)
    const ingredient = JSON.parse(editPantry.dataset.ingredient)
    console.log('ingredient: ', ingredient)
    document.querySelector('[name="ingredientName"]').value = ingredient.name ?? ''
    document.querySelector('[name="description"]').value = ingredient.description ?? ''
    document.querySelector('[name="quantity"]').value = ingredient.quantity ?? ''
    document.querySelector('[name="unit"]').value = ingredient.unit ?? ''
    document.querySelector('[name="expiration"]').value = ingredient.expirationDate?.split('T')[0] || ''
})