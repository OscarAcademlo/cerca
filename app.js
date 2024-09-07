var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const session = require('express-session'); // Importa express-session
require('dotenv').config(); // Cargar variables de entorno
var pool = require('./models/bd'); // Importa la conexión a la base de datos

var indexRouter = require('./routes/index'); // Importa las rutas de index
var usersRouter = require('./routes/users'); // Importa las rutas de usuarios
var contactoRouter = require('./routes/contactoRouter'); // Importa contactoRouter

var app = express();

// Configuración del motor de vistas
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// Importa y configura Handlebars
const hbs = require('hbs'); // Asegúrate de tener esto importado si estás usando Handlebars con hbs
hbs.registerHelper('json', function(context) {
  return JSON.stringify(context);
});

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de la sesión
app.use(
  session({
    secret: 'tu_secreto_seguro', // Cambia esto a una clave secreta segura
    resave: false,
    saveUninitialized: true,
  })
);

// Rutas
app.use('/', indexRouter); // Define la ruta principal
app.use('/users', usersRouter); // Define la ruta de usuarios
app.use('/contacto', contactoRouter); // Define la ruta de contacto

// Pruebas de conexión con la base de datos
pool.query('SELECT * FROM articulos')
  .then(function (resultados) {
    console.log(resultados);
  })
  .catch(err => console.error('Error al conectar con la base de datos:', err));

// Manejo de errores 404 y encaminamiento al manejador de errores
app.use(function (req, res, next) {
  next(createError(404));
});

// Manejador de errores
app.use(function (err, req, res, next) {
  // Configura las variables locales solo proporcionando error en desarrollo
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Renderiza la página de error
  res.status(err.status || 500);
  res.render('error');
});

// Configuración para escuchar en el puerto
const port = process.env.PORT || 3001; // Usa el puerto especificado en el archivo .env o 3001 como predeterminado
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});

module.exports = app;
