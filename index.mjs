import 'dotenv/config'
import express from 'express'
import session from 'express-session'
import methodOverride from 'method-override'
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
app.use(methodOverride((req) => {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        return req.body._method
    }
}))
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

app.use((req, res, next) => {
    console.log('METHOD:', req.method)
    console.log('BODY:', req.body)
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

app.get('/dashboard', requireLogin, async (req, res) => {
    const userId = req.session.user.id
    const pantryItems = `
        SELECT pi.id, i.name, pi.quantity, pi.unit, pi.expirationDate
        FROM fp_pantry_items pi
        JOIN fp_ingredients i
            ON pi.ingredientId = i.id
        WHERE pi.userId = ?
    `
    const gLists = `
        SELECT gl.id, gl.name as listName, gi.itemName, gi.quantity
        FROM fp_grocery_items gi
        JOIN fp_grocery_lists gl
            ON gi.groceryListId = gl.id
        WHERE gl.userId = ?
    `
    const [groceryLists] = await db.query(gLists, [userId])

    let lists = []

    for (const list of groceryLists) {
        let existingList = lists.find(item => item.name === list.listName)
        if (!existingList) {
            existingList = {
                id: list.id,
                name: list.listName,
                items: []
            }

            lists.push(existingList)
        }
        existingList.items.push({
            name: list.itemName,
            quantity: list.quantity
        })
    }

    const [items] = await db.query(pantryItems, [userId])
    res.render('layout', {
        content: 'dashboard',
        pantryItems: items,
        groceries: lists
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

// NOTE: this function does two things, it inserts ingredients in ingredient table
// and pantry item in pantry table, the ingredients table is a general table
// that holds all ingredients and the pantry table is the pantry per user
// the dashboard shows ingredients that belong to a user in their "pantry"
// so in order to adhere to the db architecture two inserts are necessary
app.post('/ingredients/add', requireLogin, async (req, res) => {
    try {
        const userId = req.session.user.id
        const { ingredientName, description, quantity, unit, expiration } = req.body
        // Check if ingredient already exists
        const [existing] = await db.execute(
            `SELECT id
            FROM fp_ingredients
            WHERE name = ?`,
            [ingredientName]
        )

        let ingredientId

        if (existing.length > 0) {
            ingredientId = existing[0].id
        } else {
            const ingredientsInsert = `
                INSERT INTO fp_ingredients (name, description)
                VALUES (?, ?)
            `
            const [result] = await db.execute(ingredientsInsert, [ingredientName, description])
            ingredientId = result.insertId
        }

        // Check if this ingredient is already in the user's pantry
        const [pantryItem] = await db.execute(
            `SELECT id FROM fp_pantry_items
            WHERE userId = ? AND ingredientId = ?`,
            [userId, ingredientId]
        )
        console.log('user id: ', userId)
        console.log('ingredient id: ', ingredientId)
        console.log('existing pantry: ', pantryItem)
        if (pantryItem.length > 0) {
            // Update existing pantry item
            await db.execute(
                `UPDATE fp_pantry_items
                SET quantity = ?, unit = ?, expirationDate = ? WHERE id = ?`,
                [quantity, unit, expiration, pantryItem[0].id]
            )
        } else {
            // Insert new pantry item
            await db.execute(
                `INSERT INTO fp_pantry_items
                 (userId, ingredientId, quantity, unit, expirationDate)
                 VALUES (?, ?, ?, ?, ?)`,
                [userId, ingredientId, quantity, unit, expiration]
            )
        }
        res.redirect('/dashboard')
    } catch (error) {
        console.error(error)
        res.status(500).send('Invalid')
    }
})

app.post('/ingredients/delete/:id', requireLogin, async (req, res) => {
    const userId = req.session.user.id
    const id = req.params.id
    await db.execute(`
        DELETE FROM fp_pantry_items
        WHERE id = ? AND userId = ?
    `, [id, userId])
    res.redirect('/dashboard')
})

app.post('/groceries/delete/:id', requireLogin, async (req, res) => {
    const userId = req.session.user.id
    const id = req.params.id
    await db.execute(`
        DELETE FROM fp_grocery_lists
        WHERE id = ? AND userId = ?
    `, [id, userId])
    res.redirect('/dashboard')
})

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

// PUT REQUESTS
app.put('/ingredients/edit/:id', requireLogin, async (req, res) => {
    try {
        const userId = req.session.user.id
        const pantryItemId = req.params.id

        const { ingredientName, description, quantity, unit, expiration } = req.body

        // Check if ingredient already exists
        const [existing] = await db.execute(
            `SELECT id
             FROM fp_ingredients
             WHERE name = ?`,
            [ingredientName]
        )

        let ingredientId

        if (existing.length > 0) {
            ingredientId = existing[0].id

            // Update the description in case it changed
            await db.execute(
                `UPDATE fp_ingredients
                 SET description = ?
                 WHERE id = ?`,
                [description, ingredientId]
            )
        } else {
            const [result] = await db.execute(
                `INSERT INTO fp_ingredients (name, description)
                 VALUES (?, ?)`,
                [ingredientName, description]
            )

            ingredientId = result.insertId
        }

        // Update the pantry item
        await db.execute(
            `UPDATE fp_pantry_items
             SET ingredientId = ?,
                 quantity = ?,
                 unit = ?,
                 expirationDate = ?
             WHERE id = ? AND userId = ?`,
            [
                ingredientId,
                quantity,
                unit,
                expiration,
                pantryItemId,
                userId
            ]
        )

        res.redirect('/dashboard')
    } catch (error) {
        console.error(error)
        res.status(500).send('Invalid')
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