// general logic to add even listener to all edit buttons of ingredient
// elements. TODO: refactor this out to its own module for scalability,
// dependent on behavior or editing user flow

const editPantry = document.querySelector('.edit-pantry')

document.querySelectorAll('.edit-pantry').forEach(button => {
    button.addEventListener('click', () => {
        const ingredient = JSON.parse(button.dataset.ingredient)
        console.log('ingredient: ', ingredient)
        document.querySelector('[name="ingredientName"]').value = ingredient.name ?? ''
        document.querySelector('[name="description"]').value = ingredient.description ?? ''
        document.querySelector('[name="quantity"]').value = ingredient.quantity ?? ''
        document.querySelector('[name="unit"]').value = ingredient.unit ?? ''
        document.querySelector('[name="expiration"]').value = ingredient.expirationDate?.split('T')[0] || ''
    })
})