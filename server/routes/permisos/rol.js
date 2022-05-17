const express = require('express');
const { verificarAcceso } = require('../../middlewares/permisos');
const app = express.Router();
const RolModel = require('../../models/permisos/rol.model')

app.get('/', verificarAcceso, async (req, res) => {
    try {
        const blnEstado = req.query.blnEstado == "false" ? false : true;
        let n = { strNombre: '' }
        const obtenerRol = await RolModel.aggregate([
            {
                $match: { blnEstado: blnEstado }
            },
            {
                $lookup: {
                    from: 'apis',
                    let: { arrObjIdApis: '$arrObjIdApis' },
                    pipeline: [
                        // { $match: { blnEstado: true } }
                        { $match: { $expr: { $in: ['$_id', '$$arrObjIdApis'] } } },
                        // {
                        //     $project: {
                        //         strRuta: 1,
                        //         strMetodo: 1
                        //     }
                        // }
                    ],
                    as: 'apis'
                }
            }
        ]);

        return res.status(200).json({
            ok: true,
            msg: 'Se obtuvierón los roles exitosamente',
            cont: {
                obtenerRol
            }
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

})

app.post('/', verificarAcceso, async (req, res) => {
    try {
        const body = req.body;
        const bodyRol = new RolModel(body);
        const err = bodyRol.validateSync();
        if (err) {
            return res.status(400).json({
                ok: false,
                msg: 'Uno o mas campos no se registrarón favor de ingresarlos',
                cont: { err }
            })
        }
        if (!body.arrObjIdApis) {
            return res.status(400).json({
                ok: false,
                msg: 'Uno o mas campos no se registrarón favor de ingresarlos',
                cont: { arrObjIdApis: null }
            })
        }
        const encontroRol = await RolModel.findOne({ strNombre: bodyRol.strNombre }, { strNombre: 1 })
        if (encontroRol) {
            return res.status(400).json({
                ok: false,
                msg: 'El rol ya se encuentra registrado',
                cont: { encontroRol }
            })
        }
        const registroRol = await bodyRol.save();
        return res.status(200).json({
            ok: true,
            msg: 'El rol se registro de manera exitosa',
            cont: {
                registroRol
            }
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
})

app.put('/', verificarAcceso, async (req, res) => {

    try {
        const _id = req.query._id;

        //validamos que no enviemos in id, o que el id no tenga la longitud correcta
        if (!_id || _id.length != 24) {
            return res.status(400).json(
                {
                    ok: false,
                    msg: _id ? 'El id no es valido, se requiere un id de almenos 24 caracteres' : 'No se recibio un rol',
                    cont:
                    {
                        _id
                    }
                })
        }

        const encontroRol = await RolModel.findOne({ _id: _id, blnEstado: true });

        if (!encontroRol) {
            return res.status(400).json(
                {
                    ok: false,
                    msg: 'No se encuentra registrado el rol',
                    cont:
                    {
                        _id
                    }
                })

        }
        const encontrarNombreRol = await RolModel.findOne({ strNombre: req.body.strNombre, _id: { $ne: _id } }, { strNombre: 1 })

        if (encontrarNombreRol) {
            return res.status(400).json(
                {
                    ok: false,
                    msg: 'El rol ya se encuentra registrado en la base de datos',
                    cont:
                    {
                        encontrarNombreUsuario
                    }
                })
        }

        //tambien se puede utilizar
        //findByIdAndUpdate findOneAndUpdate(_idUsuario, { $set:{strNombre: req.body.strNombre, strApellido: req.body.strApellido, strDireccion: req.body.strDireccion}}, {new :true, upsert: true});
        //updateOne({_id:_idUsuario}, { $set:{strNombre: req.body.strNombre, strApellido: req.body.strApellido, strDireccion: req.body.strDireccion}});
        const actualizarRol = await RolModel.findOneAndUpdate({ _id: _id }, {
            $set: {
                strNombre: req.body.strNombre, 
                strDescripcion: req.body.strDescripcion,
                blnRolDefault: req.body.blnRolDefault,
                arrObjIdApis: req.body.arrObjIdApis
            }
        }, { new: true, upsert: true });

        if (!actualizarRol) {
            return res.status(400).json(
                {
                    ok: false,
                    msg: 'No se logro actualizar el rol',
                    cont:
                    {
                        ...req.body
                    }
                })

        }

        return res.status(200).json(
            {
                ok: true,
                msg: 'El rol se actualizo de manera existosa',
                cont:
                {
                    rolAnterior: encontroRol,
                    rolActual: actualizarRol
                }
            })


    }
    catch (error) {
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
})

app.delete('/', verificarAcceso, async (req, res) => {
    try {
        const _id = req.query._id
        const blnEstado = req.body.blnEstado == "false" ? false : true
        if (!_id || _id.length != 24) {
            return res.status(400).json({
                ok: false,
                msg: _id ? 'No es un id valido' : 'No se ingreso un idRol',
                cont: {
                    _id: _id
                }
            })
        }
        const modificarEstadoRol = await RolModel.findOneAndUpdate({ _id: _id }, { $set: { blnEstado: blnEstado } }, { new: true })

        return res.status(200).json({
            ok: true,
            msg: blnEstado == true ? 'Se activo el rol de manera exitosa' : 'Se desactivo el rol de manera exitosa',
            cont: {
                modificarEstadoRol
            }
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
})



module.exports = app;