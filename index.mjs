import 'dotenv/config'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

const PORT = process.env.PORT || 3000

const app = express()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, 'public')))

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

// used for vercel deployment, local development uses port 3000
// otherwise let vercel handle environment
if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`Express server running at port: ${PORT}`)
    })
}

export default app