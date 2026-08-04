// general logic to add even listener to all edit buttons of ingredient
// elements. TODO: refactor this out to its own module for scalability,
// dependent on behavior or editing user flow

const form = document.querySelector('#ingredientForm')
const method = form?.querySelector('[name="_method"]')

document.querySelectorAll('.edit-pantry').forEach(button => {
    button.addEventListener('click', () => {
        const ingredient = JSON.parse(button.dataset.ingredient)

        document.querySelector('[name="ingredientName"]').value = ingredient.name ?? ''
        document.querySelector('[name="description"]').value = ingredient.description ?? ''
        document.querySelector('[name="quantity"]').value = ingredient.quantity ?? ''
        document.querySelector('[name="unit"]').value = ingredient.unit ?? ''
        document.querySelector('[name="expiration"]').value = ingredient.expirationDate?.split('T')[0] ?? ''
        // override method for update
        form.action = `/ingredients/edit/${ingredient.id}`
        method.value = 'PUT'
    })
})

const completedCheckBox = document.querySelectorAll('.completed')
console.log(completedCheckBox)

completedCheckBox.forEach(input => {
    input.addEventListener('change', async e => {
        const id = e.target.name
        const isCompleted = e.target.checked
        const response = await fetch(`/api/groceries/completed/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                isCompleted
            })
        })
        const result = await response.json()
    })
})