import bcrypt from 'bcrypt'
import { db } from '../../db/db.mjs'

export async function registerUser(req, res) {
    try {
        const { firstName, lastName, email, password } = req.body
        console.log(firstName, lastName, email)
        // salt rounds for bcrypt
        const rounds = 10
        const hashedPassword = await bcrypt.hash(password, rounds)
        // insert record into database
        const query = `
            INSERT INTO fp_users(firstName, lastName, email, password_hash, isAdmin) VALUES (?, ?, ?, ?, ?)
        `
        const values = [firstName, lastName, email, hashedPassword, 0]
        const [result] = await db.execute(query, values)
        res.redirect('/login')
    } catch (error) {
        console.error(error)
        res.status(500).send('Registration Failed')
    }
}

export async function loginUser(req, res) {
    try {
        const { email, password } = req.body
        const query = `
            SELECT * FROM fp_users WHERE email = ?
        `
        const [rows] = await db.execute(query, [email])
        
        if (rows.length === 0) {
            return res.status(401).send('Invalid email or password')
        }
        const user = rows[0]
        const passwordMatch = await bcrypt.compare(password, user.password_hash)
        if (!passwordMatch) {
            return res.status(401).send('Invalid email or password')
        }
        res.redirect('/dashboard')
    } catch (error) {
        console.error(error)
        res.status(500).send('Login Failed')
    }
}