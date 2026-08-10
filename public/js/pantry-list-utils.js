import { calculateExpirationStatus } from './pantry-expiration.mjs'

export function filterPantryItems(items, searchText) {
    const query = String(searchText ?? '').trim().toLowerCase()

    if (!query) {
        return [...items]
    }

    return items.filter(item => {
        const name = (item.name ?? item.ingredientName ?? '').toLowerCase()

        return name.includes(query)
    })
}

export function filterByExpirationStatus(items, status) {
    const selectedStatus = normalizeStatus(status)

    if (!selectedStatus || selectedStatus === 'all') {
        return [...items]
    }

    return items.filter(item => {
        const expirationDate = item.expirationDate ?? item.expiration
        const date = String(expirationDate).split('T')[0]
        const result = calculateExpirationStatus(date)
        const itemStatus = typeof result === 'string' ? result : result.status

        return normalizeStatus(itemStatus) === selectedStatus
    })
}

function normalizeStatus(status) {
    return String(status ?? '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
}

export function sortPantryItems(items, sortOption) {
    const sortedItems = [...items]

    if (sortOption === 'name-asc') {
        return sortedItems.sort((a, b) => {
            const firstName = a.name ?? a.ingredientName ?? ''
            const secondName = b.name ?? b.ingredientName ?? ''

            return firstName.localeCompare(secondName)
        })
    }

    if (sortOption === 'expiration-asc') {
        return sortedItems.sort((a, b) => {
            const firstDate = a.expirationDate ?? a.expiration
            const secondDate = b.expirationDate ?? b.expiration

            return new Date(firstDate) - new Date(secondDate)
        })
    }

    return sortedItems
}
