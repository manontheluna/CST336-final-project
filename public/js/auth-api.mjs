import bcrypt from 'bcrypt'

export async function registerUser(req, res) {
    const { firstName, lastName, email, password } = req.body
    console.log(firstName, lastName, email)
    // salt rounds for bcrypt
    const rounds = 10
    const hashedPassword = await bcrypt.hash(password, rounds)

    res.redirect('/login')
}