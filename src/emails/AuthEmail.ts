import { transporter } from "../config/nodemailer"

interface IEmail {
    email:  string
    name:   string
    token:  string
}

export class AuthEmail {
    static sendConfirmationEmail = async (user : IEmail) => {
         // Enviar email
         const info = await transporter.sendMail({
            from: "Uptask <admin@task.com>",
            to: user.email,
            subject: "Uptask - Confirmación de cuenta",
            text: "Uptask - Confirmación de cuenta",
            html: `<p>Hola, ${user.name}. Has creado tu cuenta en Uptask. Ya casi está todo listo, sólo debes confirmar tu cuenta</p>
            <p>Visita el siguiente enlace:</p>
            <a href="${process.env.FRONTEND_URL}/auth/confirm-account">Confirmar cuenta</a>
            <p>E ingresa el código: <b>${user.token}</b></p>
            <p>Este token expira en 10 minutos</p>
            `
        })
    }

    static sendPasswordResetToken = async (user : IEmail) => {
        // Enviar email
        const info = await transporter.sendMail({
           from: "Uptask <admin@task.com>",
           to: user.email,
           subject: "Uptask - Reestablece tu password",
           text: "Uptask - Reestablece tu password",
           html: `<p>Hola, ${user.name}. Has solicitado reestablecer tu password:</p>
           <a href="${process.env.FRONTEND_URL}/auth/new-password">Reestablecer password</a>
           <p>E ingresa el código: <b>${user.token}</b></p>
           <p>Este token expira en 10 minutos</p>
           `
       })
   }
}