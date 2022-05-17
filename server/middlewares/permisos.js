const jwt = require('jsonwebtoken');
require('../config/config');
const UsuarioModel = require('../models/usuario/usuario.model');
const RolModel = require('../models/permisos/rol.model')
const ApiModel = require('../models/permisos/api.model')
const ObjectId = require('mongoose').Types.ObjectId;
require('colors');
const verificarAcceso = async (req, res, next) => {
    try {
        const url = req.originalUrl.split('?');
        const originalUrl = url[0] ? url[0] : url;
        const originalMethod = req.method;
        const token = req.get('token')
        if (!token) {
            return res.status(400).json({
                ok: false,
                msg: 'No se recibio un token',
                cont: {
                    token
                }
            })
        }
        jwt.verify(token, process.env.SEED, async (err, decoded) => {
            if (err) {
                if (err.name == 'JsonWebTokenError') {
                    return res.status(400).json({
                        ok: false,
                        msg: 'No se recibio un token valido',
                        cont: {
                            err: err.name
                        }
                    })
                } else {
                    return res.status(400).json({
                        ok: false,
                        msg: 'El token exipro, favor de actualizar token',
                        cont: {
                            err: err.name
                        }
                    })
                }
            }
            if (!decoded.usuario._id) {
                return res.status(500).json({
                    ok: false,
                    msg: 'No se recibio el identificador del usuario',
                    cont: {
                        usuario: decoded.usuario
                    }
                })
            }
            const [obtenerUsuarios] = await UsuarioModel.aggregate(
                [
                    {
                        $match: { blnEstado: true }
                    },
                    {
                        $match: { _id: ObjectId(decoded.usuario._id) }
                    },
                    {
                        $lookup: {
                            from: RolModel.collection.name,
                            let: { idObjRol: '$_idObjRol' },
                            pipeline: [
                                // { $match: { blnEstado: true } }
                                { $match: { $expr: { $eq: ['$$idObjRol', '$_id'] } } },
                                {
                                    $lookup: {
                                        from: ApiModel.collection.name,
                                        let: { arrApis: '$arrObjIdApis' },
                                        pipeline: [
                                            { $match: { $expr: { $in: ['$_id', '$$arrApis'] } } },
                                        ],
                                        as: 'apis'
                                    }
                                },
                                {
                                    $project: {
                                        strNombre: 1,
                                        strDescripcion: 1,
                                        blnRolDefault: 1,
                                        blnEstado: 1,
                                        apis: 1
                                    }
                                }
                            ],
                            as: 'rol'
                        }
                    },
                    {
                        $project: {
                            blnEstado: 1,
                            strNombre: 1,
                            strApellido: 1,
                            strEmail: 1,
                            strNombreUsuario: 1,
                            strDireccion: '$strDireccion',
                            _idObjRol: 1,
                            rol: {
                                $arrayElemAt: ['$rol', 0]
                            },
                        }
                    }
                ]
            );
            if (!obtenerUsuarios) {
                return res.status(400).json({
                    ok: false,
                    msg: 'El usuario no cuenta con acceso ya que no se encuentra registrado o activo en la base de datos',
                    cont: {
                        token: decoded.usuario,
                    }
                })
            }
            if (!obtenerUsuarios.rol) {
                return res.status(400).json({
                    ok: false,
                    msg: 'El usuario no cuenta con un rol valido, favor de verificar',
                    cont: {
                        usuario: obtenerUsuarios,
                    }
                })
            }
            if (obtenerUsuarios.rol.apis) {
                if (obtenerUsuarios.rol.apis.length < 1) {
                    return res.status(400).json({
                        ok: false,
                        msg: 'El usuario no cuenta con apis asignadas, favor de verificar',
                        cont: {
                            usuario: obtenerUsuarios,
                        }
                    })
                }
            } else {
                return res.status(400).json({
                    ok: false,
                    msg: 'El usuario no cuenta con campo api, favor de verificar',
                    cont: {
                        usuario: obtenerUsuarios,
                    }
                })
            }
            const encontroRuta = obtenerUsuarios.rol.apis.find(api => '/api' + api.strRuta === originalUrl && api.strMetodo === originalMethod);
            if (!encontroRuta) {
                return res.status(400).json({
                    ok: false,
                    msg: `El usuario no cuenta con el acceso a la ruta ${originalUrl} en el método ${originalMethod}`,
                    cont: {
                        usuario: obtenerUsuarios,
                    }
                })
            }
            console.log(`Se accedio a la ruta  ${originalUrl} `.green, `en el método ${originalMethod}`.yellow);
            next();
        })

    } catch (error) {
        const err = Error(error);
        return res.status(500).json(
            {
                ok: false,
                msg: 'Error en el servidor',
                cont:
                {
                    err: err.message ? err.message : err.name ? err.name : err
                }
            })
    }
}

module.exports = { verificarAcceso }