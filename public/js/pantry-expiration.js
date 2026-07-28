const EXPIRING_SOON_DAYS = 7

function calculateExpirationStatus(expirationDate) {
    if (!expirationDate) {
        return {
            status: 'unknown',
            label: 'No expiration date',
            daysRemaining: null
        }
    }

    const [year, month, day] = expirationDate.split('-').map(Number)
    const expiration = new Date(year, month - 1, day)

    if (Number.isNaN(expiration.getTime())) {
        return {
            status: 'unknown',
            label: 'Invalid expiration date',
            daysRemaining: null
        }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    expiration.setHours(0, 0, 0, 0)

    const milliSecondsPerDay = 1000 * 60 * 60 * 24
    const daysRemaining = Math.ceil((expiration.getTime() - today.getTime()) / milliSecondsPerDay)

    if (daysRemaining < 0) {
        return {
            status: 'expired',
            label: 'Expired',
            daysRemaining
        }
    }

    if (daysRemaining <= EXPIRING_SOON_DAYS) {
        return {
            status: 'expiring-soon',
            label: 'Expiring soon',
            daysRemaining
        }
    }

    return {
        status: 'fresh',
        label: 'Fresh',
        daysRemaining
    }
}

window.calculateExpirationStatus = calculateExpirationStatus
