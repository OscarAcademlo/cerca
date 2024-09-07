const express = require('express');
const nodemailer = require('nodemailer'); // Importa Nodemailer
const router = express.Router(); // Define el router

// Ruta para mostrar el formulario de contacto
router.get('/', (req, res) => {
    res.render('contacto'); // Renderiza la vista de contacto
});

// Ruta para manejar el envío del formulario
router.post('/enviar-email', async (req, res) => {
    const { nombre, apellido, email, telefono, mensaje } = req.body;

    // Configurar Nodemailer usando variables de entorno
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST, // Servidor SMTP
        port: process.env.EMAIL_PORT, // Puerto SMTP
        secure: process.env.EMAIL_SECURE === 'true', // true para 465, false para otros puertos
        auth: {
            user: process.env.EMAIL_USER, // Usuario de SMTP
            pass: process.env.EMAIL_PASS  // Contraseña de SMTP
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER, // Dirección de correo de envío
        to: 'cerca@oscarsoft.me', // Dirección de correo donde recibirás los mensajes
        subject: 'Nuevo mensaje de contacto',
        text: `Nombre: ${nombre} ${apellido}\nEmail: ${email}\nTeléfono: ${telefono}\nMensaje: ${mensaje}`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Correo enviado correctamente');
        res.render('success'); // Renderiza una vista de éxito
    } catch (error) {
        console.error('Error al enviar el correo:', error);
        res.status(500).send('Error al enviar el correo. Por favor, inténtelo más tarde.');
    }
});

module.exports = router; // Exporta el router
