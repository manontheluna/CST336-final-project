import 'dotenv/config'
import express from 'express'
import session from 'express-session'
import { db } from './db/db.mjs'
import path from 'path'
import { fileURLToPath } from 'url'

import { loginUser, registerUser } from './public/js/auth-api.mjs'

const PORT = process.env.PORT || 3000

const app = express()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // store user login session for 1 day
    }
}))

// make user available globally
app.use((req, res, next) => {
    res.locals.user = req.session.user
    next()
})

// helper function for keeping track of logged in user
/**
 * TODO: should probably refactor this out, as project/file gets
 * larger these helper/middleware functions should be extracted/imported
 * */
function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/login')
    }
    next()
}

app.get('/', (req, res) => {
    res.render('layout', {
        content: 'index'
    })
})

app.get('/login', (req, res) => {
    res.render('layout', {
        content: 'login'
    })
})

app.get('/logout', (req, res) => {
    req.session.destroy(error => {
        if (error) {
            console.error(error)
            return res.status(500).send('Logout Failed')
        }
        res.redirect('/login')
    })
})

app.get('/register', (req, res) => {
    res.render('layout', {
        content: 'register'
    })
})

app.get('/dashboard', requireLogin, (req, res) => {
    res.render('layout', {
        content: 'dashboard'
    })
})

app.get('/api/users', async (req, res) => {
    const query = `
        SELECT * FROM fp_users
    `
    const [rows] = await db.query(query)
    res.send(rows)
})

app.get('/api/recipes', async (req, res) => {
    const query = `
        SELECT * FROM fp_recipes
    `
    const [rows] = await db.query(query)
    res.send(rows)
})

// get user by id
app.get('/api/users/:id', async (req, res) => {
    const id = req.params.id
    const query = `
        SELECT * FROM fp_users WHERE id = ?
    `
    const [rows] = await db.query(query, [id])
    res.send(rows)
})

app.get('/api/recipes/:id', async (req, res) => {
    const id = req.params.id
    const query = `
        SELECT * FROM fp_recipes WHERE id = ?
    `
    const [rows] = await db.query(query, [id])
    res.send(rows)
})

app.get('/api/categories', async (req, res) => {
    const query = `
        SELECT * FROM fp_categories
    `
    const [rows] = await db.query(query)
    res.send(rows)
})

app.get('/api/ingredients', async (req, res) => {
    const query = `
        SELECT * FROM fp_ingredients
    `
    const [rows] = await db.query(query)
    res.send(rows)
})

app.get('/recipes', (req, res) => {
    res.render('layout', {
        content: 'recipes'
    })
})

app.get('/api/spoonacular-recipes', async (req, res) => {
    const ingredients = req.query.ingredients

    if (!ingredients) {
        return res.status(400).send({
            error: 'Ingredients are required.'
        })
    }

    try {
        const url =
            'https://api.spoonacular.com/recipes/findByIngredients' +
            `?apiKey=${process.env.SPOONACULAR_API_KEY}` +
            `&ingredients=${encodeURIComponent(ingredients)}` +
            '&number=6' +
            '&ranking=1' +
            '&ignorePantry=true'

        const response = await fetch(url)
        const recipes = await response.json()

        if (!response.ok) {
            return res.status(response.status).send(recipes)
        }

        res.send(recipes)
    } catch (error) {
        console.error('Spoonacular request failed:', error)

        res.status(500).send({
            error: 'Recipes could not be loaded.'
        })
    }
})

app.get('/food-search', (req, res) => {
    res.render('layout', {
        content: 'food-search'
    })
})

// post requests
app.post('/register', registerUser)
app.post('/login', loginUser)
app.get('/api/usda-foods', async (req, res) => {
    const query = req.query.query?.trim()

    if (!query) {
        return res.status(400).send({
            error: 'A food name is required.'
        })
    }

    if (!process.env.USDA_API_KEY) {
        return res.status(500).send({
            error: 'USDA API key is not configured.'
        })
    }

    try {
        const url =
            'https://api.nal.usda.gov/fdc/v1/foods/search' +
            `?api_key=${encodeURIComponent(process.env.USDA_API_KEY)}`

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query,
                pageSize: 8
            })
        })

        const foodData = await response.json()

        if (!response.ok) {
            return res.status(response.status).send(foodData)
        }

        const foods = (foodData.foods ?? []).map(food => ({
            fdcId: food.fdcId,
            name: food.description,
            brand: food.brandName || food.brandOwner || '',
            category: food.foodCategory || '',
            servingSize: food.servingSize ?? null,
            servingSizeUnit: food.servingSizeUnit || '',
            nutrients: (food.foodNutrients ?? [])
                .filter(nutrient =>
                    [
                        'Energy',
                        'Protein',
                        'Total lipid (fat)',
                        'Carbohydrate, by difference'
                    ].includes(nutrient.nutrientName)
                )
                .map(nutrient => ({
                    name: nutrient.nutrientName,
                    value: nutrient.value,
                    unit: nutrient.unitName
                }))
        }))

        res.send({
            totalHits: foodData.totalHits,
            foods
        })
    } catch (error) {
        console.error('USDA FoodData request failed:', error)

        res.status(500).send({
            error: 'Food information could not be loaded.'
        })
    }
})

// used for vercel deployment, local development uses port 3000
// otherwise let vercel handle environment
if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`Express server running at port: ${PORT}`)
    })
}

export default app