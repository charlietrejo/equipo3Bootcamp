const express = require('express');
const app = express.Router();
const UsuarioModel = require('../../models/usuario/usuario.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('../../config/config')

//Metodo post
app.post('/login', async (req, res) => {
    try {
        const strEmail = req.body.strEmail;
        const strContrasena = req.body.strContrasena;
        if (!strEmail || !strContrasena) {
            return res.status(400).json({
                ok: false,
                msg: !strEmail && !strContrasena ? 'No se recibio un strEmail y strContrasena, favor de ingresarlos' :
                    (!strEmail ? 'No se recibio el strEmail, favor de ingresarlo' : 'No se recibio el strContrasena, favor de ingresarlo'),
                cont: {
                    strEmail,
                    strContrasena
                }
            })
        }
        const encontroEmail = await UsuarioModel.findOne({ strEmail: strEmail });

        if (!encontroEmail) {
            return res.status(400).json({
                ok: false,
                msg: 'El correo* ó la contraseña son incorrectas favor de verificarlo',
                cont: {
                    strEmail,
                    strContrasena
                }
            })
        }

        const compararContrasena = bcrypt.compareSync(strContrasena, encontroEmail.strContrasena);
        if (!compararContrasena) {
            return res.status(400).json({
                ok: false,
                msg: 'El correo ó la contraseña* son incorrectas favor de verificarlo',
                cont: {
                    strEmail,
                    strContrasena
                }
            })
        }
        const token = jwt.sign({ usuario: encontroEmail }, process.env.SEED, { expiresIn: process.env.CADUCIDAD_TOKEN })
        return res.status(200).json({
            ok: true,
            msg: 'Se logueo el usuario de manera exitosa',
            cont: {
                usuario: encontroEmail,
                token
            }
        })

    } catch (error) {
        return res.status(500).json(
            {
                ok: false,
                msg: 'Error en el servidor',
                cont:
                {
                    error
                }
            })
    }
})


module.exports = app;