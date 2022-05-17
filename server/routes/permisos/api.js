const express = require('express');
const { verificarAcceso } = require('../../middlewares/permisos');
const app = express.Router();
const ApiModel = require('../../models/permisos/api.model');

app.get('/', verificarAcceso, async (req, res) => {
    try {
        const blnEstado = req.query.blnEstado == "false" ? false : true;
        const obtenerApis = await ApiModel.find({blnEstado: blnEstado});

        if (obtenerApis.length < 1) {
            return res.status(400).json({
                ok: false,
                msg: 'No se encontrarón Apis en la base de datos',
                cont: {
                    obtenerApis
                }
            })
        }
        return res.status(200).json({
            ok: true,
            msg: 'Se obtuvierón las Apis de manera correcta',
            count: obtenerApis.length,
            cont: {
                obtenerApis
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
        const bodyApi = new ApiModel(body)
        const err = bodyApi.validateSync();
        if (err) {
            return res.status(400).json({
                ok: false,
                msg: 'Uno o mas campos no se registrarón favor de ingresarlos',
                cont: { err }
            })
        }
        if (!(bodyApi.strMetodo == 'GET' || bodyApi.strMetodo == 'POST' || bodyApi.strMetodo == 'PUT' || bodyApi.strMetodo == 'DELETE')) {
            return res.status(400).json({
                ok: false,
                msg: 'El strMetodo no es valido',
                cont: { metodosPermitidos: ['GET', 'POST', 'PUT', 'DELETE'] }
            })
        }
        const encontroApi = await ApiModel.findOne({ strRuta: bodyApi.strRuta, strMetodo: bodyApi.strMetodo }, { strRuta: 1, strDescripcion: 1, strMetodo:1, blnEstado:1 });
        if (encontroApi) {
            return res.status(400).json({
                ok: false,
                msg: 'La api ya se encuentra registrada activada o desactivada',
                cont: { encontroApi }
            })
        }
        const registroApi = await bodyApi.save();
        return res.status(200).json({
            ok: true,
            msg: 'La Api se registro de manera exitosa',
            cont: {
                registroApi
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
        const _idApi = req.query._id;
        const bodyApi = req.body;
        const blnEstado = bodyApi.blnEstado == "false" ? false : true; 

        //validamos que no enviemos in id, o que el id no tenga la longitud correcta
        if (!_idApi || _idApi.length != 24) {
            return res.status(400).json(
                {
                    ok: false,
                    msg: _idApi ? 'El id no es valido, se requiere un id de almenos 24 caracteres' : 'No se recibio un idAPi',
                    cont:
                    {
                        _idApi
                    }
                })
        }

        if (!(bodyApi.strMetodo == 'GET' || bodyApi.strMetodo == 'POST' || bodyApi.strMetodo == 'PUT' || bodyApi.strMetodo == 'DELETE')) {
            return res.status(400).json({
                ok: false,
                msg: 'El strMetodo no es valido',
                cont: { metodosPermitidos: ['GET', 'POST', 'PUT', 'DELETE'] }
            })
        }

        const encontroApi = await ApiModel.findOne({ _id: _idApi });

        if (!encontroApi) {
            return res.status(400).json(
                {
                    ok: false,
                    msg: 'No se encuentra registrado el Api Id o se encunetra desactivado ',
                    cont:
                    {
                        _idApi
                    }
                })

        }
        const encontrarNombreApi = await ApiModel.findOne({ _id: { $ne: _idApi } , strRuta: req.body.strRuta, strMetodo: req.body.strMetodo }, { strRuta: 1, strMetodo: 1, strDescripcion:1, blnEsApi:1, blnEsMenu:1 })

        if (encontrarNombreApi) {
            return res.status(400).json(
                {
                    ok: false,
                    msg: 'El método de la api ya se encuentra registrado en la base de datos',
                    cont:
                    {
                        encontrarNombreApi
                    }
                })
        }

        //tambien se puede utilizar
        //findByIdAndUpdate findOneAndUpdate(_idUsuario, { $set:{strNombre: req.body.strNombre, strApellido: req.body.strApellido, strDireccion: req.body.strDireccion}}, {new :true, upsert: true});
        //updateOne({_id:_idUsuario}, { $set:{strNombre: req.body.strNombre, strApellido: req.body.strApellido, strDireccion: req.body.strDireccion}});
        const actualizarApi = await ApiModel.findOneAndUpdate({ _id: _idApi }, {
            $set: {
                strMetodo: req.body.strMetodo, 
                strDescripcion: req.body.strDescripcion,
                strRuta: req.body.strRuta,
                blnEsApi: req.body.blnEsApi,
                blnEsMenu: req.body.blnEsMenu,
                blnEstado: blnEstado
            }
        }, { new: true, upsert: true });

        if (!actualizarApi) {
            return res.status(400).json(
                {
                    ok: false,
                    //utilizamos un operador ternarrio para validar cual de las 2 condiciones es la que se esta cumpliendo
                    msg: 'No se logro actualizar al Api',
                    cont:
                    {
                        ...req.body
                    }
                })

        }

        return res.status(200).json(
            {
                ok: true,
                msg: 'El Api se actualizo de manera existosa',
                cont:
                {
                    apiAnterior: encontroApi,
                    apiActual: actualizarApi
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
        const _idApi = req.query._id;
        const blnEstado = req.body.blnEstado == "false" ? false : true
        if (!_idApi || _idApi.length != 24) {
            return res.status(400).json({
                ok: false,
                msg: _idApi ? 'El identificador del Api es invalido' : 'No se recibio un identificador de Api',
                cont: {
                    _idApi
                }
            })
        }
        const encontrarApi = await ApiModel.findOne({ _id: _idApi, blnEstado: true });
        if (!encontrarApi) {
            return res.status(400).json({
                ok: false,
                msg: 'El identificador del api no se encuentra en la base de datos o el api ya está desactivado',
                cont: {
                    _idApi: _idApi
                }
            })
        }
        // Esta funcion elimina de manera definitiva el producto
        // const eliminarProducto = await ProductoModel.findOneAndDelete({ _id: _idProducto });
        //Esta funcion solo cambia el estado del producto
        const desactivarApi = await ApiModel.findOneAndUpdate({ _id: _idApi }, { $set: { blnEstado: blnEstado } }, { new: true })
        // if (!desactivarProducto) {
        //     return res.status(400).json({
        //         ok: false,
        //         msg: blnEstado == true ? 'El producto no se logro activar' : 'El producto no se logro desactivar', 
        //         cont: {
        //             desactivarProducto
        //         }
        //     })
        // }
        return res.status(200).json({
            ok: true,
            msg: blnEstado == true ? 'Se activo el Api de manera exitosa' : 'Se desactivo el Api de manera exitosa',
            cont: {
                desactivarApi
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