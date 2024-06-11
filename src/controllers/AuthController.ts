import { Request, Response } from "express"
import User from "../models/User"
import { checkPassword, hashPassword } from "../utils/auth"
import Token from "../models/Token"
import { gen6DigitToken } from "../utils/token"
import { AuthEmail } from "../emails/AuthEmail"
import { generateJWT } from "../utils/jwt"


export class AuthController {
    static createAccount = async (req: Request, res: Response) => {
        try {
            const { password, email } = req.body

            // Prevenir duplicados
            const userExists = await User.findOne({email})
            if(userExists) {
                const error = new Error("Usuario ya está registrado")
                return res.status(409).json({error: error.message})
            }
            
            // Crear nuevo usuario
            const user = new User(req.body)

            // Hash password
            user.password = await hashPassword(password)

            // Generar Token
            const token = new Token()
            token.token = gen6DigitToken()
            token.user = user.id

            // Enviar email
            await AuthEmail.sendConfirmationEmail({
                email: user.email,
                name: user.name,
                token: token.token
            })

            await Promise.allSettled([user.save(), token.save()])
            res.send("Cuenta creada con éxito. Revisa tu email para confirmarla")

        } catch (error) {
            res.status(500).json({error: "Hubo un error"})
        }
    }

    static confirmAccount = async (req: Request, res: Response) => {
        try {
            const { token } = req.body

            const tokenExists = await Token.findOne({token})
            if(!tokenExists) {
                const error = new Error("Token no válido")
                return res.status(404).json({error: error.message})
            }
            const user = await User.findById(tokenExists.user)
            user.confirmed = true

            await Promise.allSettled([tokenExists.deleteOne(), user.save()])
            res.send("Cuenta confirmada con éxito")
        } catch (error) {
            res.status(500).json({error: "Hubo un error"})
        }
    }

    static login = async (req: Request, res: Response) => {
        try {

            const { email, password } = req.body
            const user = await User.findOne({email})
            if(!user) {
                const error = new Error("Usuario no encontrado")
                return res.status(404).json({error: error.message})
            }

            if(!user.confirmed) {
                const token = new Token()
                token.user = user.id
                token.token = gen6DigitToken()
                await token.save()

                // Enviar email
                await AuthEmail.sendConfirmationEmail({
                email: user.email,
                name: user.name,
                token: token.token
            })

                const error = new Error("La cuenta no ha sido confirmada. Hemos enviado un email de confirmación")
                return res.status(401).json({error: error.message})
            }

            // Revisar password
            const isPasswordCorrect = await checkPassword(password, user.password)
            if(!isPasswordCorrect) {
                const error = new Error("Password incorrecto")
                return res.status(401).json({error: error.message})
            }
            const token = generateJWT({id: user._id})
            res.send(token)

        } catch (error) {
            res.status(500).json({error: "Hubo un error"})
        }
    }

    static requestConfirmationCode = async (req: Request, res: Response) => {
        try {
            const { email } = req.body

            // Usuario existe
            const user = await User.findOne({email})
            if(!user) {
                const error = new Error("Usuario no está registrado")
                return res.status(404).json({error: error.message})
            }

            if(user.confirmed) {
                const error = new Error("El usuario ya está confirmado")
                return res.status(403).json({error: error.message})
            }
            
            // Generar Token
            const token = new Token()
            token.token = gen6DigitToken()
            token.user = user.id

            // Enviar email
            await AuthEmail.sendConfirmationEmail({
                email: user.email,
                name: user.name,
                token: token.token
            })

            await Promise.allSettled([user.save(), token.save()])
            res.send("Se ha enviado un nuevo token a tu email")

        } catch (error) {
            res.status(500).json({error: "Hubo un error"})
        }
    }

    static forgotPassword = async (req: Request, res: Response) => {
        try {
            const { email } = req.body

            // Usuario existe
            const user = await User.findOne({email})
            if(!user) {
                const error = new Error("Usuario no está registrado")
                return res.status(404).json({error: error.message})
            }
            
            // Generar Token
            const token = new Token()
            token.token = gen6DigitToken()
            token.user = user.id
            await token.save()

            // Enviar email
            await AuthEmail.sendPasswordResetToken({
                email: user.email,
                name: user.name,
                token: token.token
            })

            res.send("Revisa tu email para instrucciones")

        } catch (error) {
            res.status(500).json({error: "Hubo un error"})
        }
    }

    static validateToken = async (req: Request, res: Response) => {
        try {
            const { token } = req.body
            console.log(token)

            const tokenExists = await Token.findOne({token})
            if(!tokenExists) {
                const error = new Error("Token no válido")
                return res.status(404).json({error: error.message})
            }
            res.send("Token válido. Define tu nuevo password")
        } catch (error) {
            res.status(500).json({error: "Hubo un error"})
        }
    }

    static updatePasswordWithToken = async (req: Request, res: Response) => {
        try {
            const { password } = req.body
            const { token } = req.params

            const tokenExists = await Token.findOne({token})
            if(!tokenExists) {
                const error = new Error("Token no válido")
                return res.status(404).json({error: error.message})
            }
            const user = await User.findById(tokenExists.user)
            user.password = await hashPassword(password)
            await Promise.allSettled([tokenExists.deleteOne(), user.save()])
            res.send("Password actualizado con éxito")
        } catch (error) {
            res.status(500).json({error: "Hubo un error"})
        }
    }
    
    static user = async (req: Request, res: Response) => {
        return res.json(req.user)
    }

    static updateProfile = async (req: Request, res: Response) => {
        const { name, email } = req.body
        const userExists = await User.findOne({email})
        if (userExists && userExists.id.toString() !== req.user.id.toString()) {
            const error = new Error("Ese email ya está registrado")
            return res.status(409).json({error: error.message})
        }
        req.user.name = name
        req.user.email = email
        try {
            await req.user.save()
            res.send("Perfil actualizado con éxito")
        } catch (error) {
            res.status(500).json({error: "Hubo un error"})
        }
    }

    static updateCurrentUserPassword = async (req: Request, res: Response) => {
        const { password, current_password } = req.body
        const user = await User.findById(req.user.id)
        const isCurrentPasswordValid = await checkPassword(current_password, user.password)

        if(!isCurrentPasswordValid) {
            const error = new Error("El password actual no es correcto")
            return res.status(401).json({error: error.message})
        }
        req.user.password = await hashPassword(password)
        try {
            await user.save()
            res.send("Password actualizado con éxito")
        } catch (error) {
            res.status(500).json({error: "Hubo un error"})
        }
    }

    static checkCurrentUserPassword = async (req: Request, res: Response) => {
        const { password } = req.body
        const user = await User.findById(req.user.id)
        const isCurrentPasswordValid = await checkPassword(password, user.password)

        if(!isCurrentPasswordValid) {
            const error = new Error("El password no es correcto")
            return res.status(401).json({error: error.message})
        }
        res.send("Password Correcto")
    }
}