const express = require('express');
const md5 = require('md5'); // Importa md5 para encriptar las contraseñas
const router = express.Router();
const pool = require('../models/bd'); // Importa la conexión a la base de datos
const multer = require('multer'); // Importa multer para manejo de archivos
const nodemailer = require('nodemailer'); // Importa Nodemailer

// Ruta para la página de inicio (home)
router.get('/', async (req, res) => {
  try {
    const articulos = await pool.query('SELECT * FROM articulos');
    res.render('index', { articulos }); // Renderiza la vista 'index.hbs'
  } catch (error) {
    console.error('Error al obtener los artículos:', error);
    res.status(500).send('Error al obtener los artículos');
  }
});

// Ruta para manejar la búsqueda
router.get('/buscar', async (req, res) => {
  const query = req.query.q; // Captura la consulta de búsqueda desde la URL
  try {
    const articulos = await pool.query('SELECT * FROM articulos WHERE nombre LIKE ?', [`%${query}%`]);
    res.render('index', { articulos, query }); // Renderiza la vista 'index.hbs' con los resultados de búsqueda
  } catch (error) {
    console.error('Error al buscar artículos:', error);
    res.status(500).send('Error al buscar artículos');
  }
});

// Ruta para manejar el login
router.post('/login', async (req, res) => {
  const { nombre, password } = req.body;
  const hashedPassword = md5(password); // Encriptar la contraseña con md5

  try {
    // Verifica si el usuario existe
    const usuarios = await pool.query('SELECT * FROM usuarios WHERE nombre = ?', [nombre]); 
    console.log(`Usuarios encontrados: ${usuarios.length}`); // Muestra cuántos usuarios se encontraron

    if (usuarios.length > 0) {
      const usuario = usuarios[0];
      console.log(`Hash almacenado: ${usuario.password}`); // Muestra el hash almacenado en la base de datos
      console.log(`Hash ingresado: ${hashedPassword}`); // Muestra el hash de la contraseña ingresada

      if (usuario.password === hashedPassword) {
        console.log('Login exitoso');
        req.session.user = usuario;
        return res.redirect('/articulos'); // Redirigir a la página de artículos después de un login exitoso
      } else {
        console.log('Contraseña incorrecta');
        res.render('login', { error: 'Contraseña incorrecta.' });
      }
    } else {
      console.log('Usuario no encontrado');
      res.render('login', { error: 'Usuario no encontrado.' });
    }
  } catch (error) {
    console.error('Error del servidor:', error);
    res.status(500).send('Error del servidor');
  }
});

// Ruta para mostrar el formulario de login
router.get('/login', (req, res) => {
  res.render('login'); // Renderiza la vista de login
});

// Ruta para finalizar la compra
router.post('/finalizar-compra', async (req, res) => {
  const carrito = req.body;

  try {
    // Iniciar transacción
    await pool.query('START TRANSACTION');

    // Insertar el pedido
    const result = await pool.query('INSERT INTO pedidos (fecha) VALUES (NOW())');
    const pedidoId = result.insertId;

    // Insertar cada artículo en la tabla detalle_pedidos
    for (const item of carrito) {
      await pool.query('INSERT INTO detalle_pedidos (pedido_id, articulo_id, cantidad, precio) VALUES (?, ?, ?, ?)', 
        [pedidoId, item.id, item.cantidad, item.precio]);
    }

    // Confirmar transacción
    await pool.query('COMMIT');
    res.json({ success: true });
  } catch (error) {
    // Revertir transacción en caso de error
    await pool.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ success: false, error: 'Error al finalizar la compra' });
  }
});

// Configuración de multer para subir imágenes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images'); // Carpeta donde se guardarán las imágenes
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // Nombre del archivo
  }
});
const upload = multer({ storage: storage });

// Protege las rutas de artículos con la autenticación
function verificarAutenticacion(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
}

// Ruta protegida de artículos
router.get('/articulos', verificarAutenticacion, async (req, res) => {
  try {
    const articulos = await pool.query('SELECT * FROM articulos');
    res.render('articulos', { articulos });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al obtener los artículos');
  }
});

// Ruta para mostrar el formulario de contacto
router.get('/contacto', (req, res) => {
  res.render('contacto'); // Renderiza la vista de contacto
});

// Ruta para manejar el envío del formulario
router.post('/enviar-email', async (req, res) => {
  const { nombre, apellido, email, telefono, mensaje } = req.body;

  // Configurar Nodemailer
  const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST, // Servidor SMTP
      port: process.env.EMAIL_PORT, // Puerto SMTP
      secure: process.env.EMAIL_SECURE === 'true', // true para 465, false para otros puertos
      auth: {
          user: process.env.EMAIL_USER, // Reemplaza con tu correo electrónico
          pass: process.env.EMAIL_PASS // Reemplaza con tu contraseña o clave de aplicación
      }
  });

  const mailOptions = {
      from: email,
      to: 'cerca@oscarsoft.me', // Tu dirección de correo donde recibirás los mensajes
      subject: 'Nuevo mensaje de contacto',
      text: `Nombre: ${nombre} ${apellido}\nEmail: ${email}\nTeléfono: ${telefono}\nMensaje: ${mensaje}`
  };

  try {
      await transporter.sendMail(mailOptions);
      res.redirect('/contacto?success=true'); // Redirige con un parámetro de éxito
  } catch (error) {
      console.error('Error al enviar el correo:', error);
      res.status(500).send('Error al enviar el correo. Por favor, inténtelo más tarde.');
  }
});

module.exports = router;
