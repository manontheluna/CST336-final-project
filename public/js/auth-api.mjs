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
