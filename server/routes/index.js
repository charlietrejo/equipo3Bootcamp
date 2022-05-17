const express = require('express');
const app = express.Router();


app.use('/auth', require('./auth/login'))
app.use('/producto', require('./producto/producto'))
app.use('/usuario', require('./usuario/usuario'));
app.use('/empresa', require('./empresa/empresa'));
app.use('/permisos/api', require('./permisos/api'));
app.use('/permisos/rol', require('./permisos/rol'));
app.use('/imagen', require('./imagen/imagen'));



module.exports = app;




