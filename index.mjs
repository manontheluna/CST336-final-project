import 'dotenv/config'
import express from 'express'
import mysql from 'mysql2/promise'
import path from 'path'
import { fileURLToPath } from 'url'

const PORT = process.env.PORT || 3000

const app = express()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, 'public')))

const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 10,
    waitForConnections: true
})

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

app.get('/api/users', async(req, res) => {
    const query = `
        SELECT * FROM fp_users
    `
    const [rows] = await db.query(query)
    res.send(rows)
})

app.get('/api/recipes', async(req, res) => {
    const query = `
        SELECT * FROM fp_recipes
    `
    const [rows] = await db.query(query)
    res.send(rows)
})

// used for vercel deployment, local development uses port 3000
// otherwise let vercel handle environment
if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`Express server running at port: ${PORT}`)
    })
}

export default app