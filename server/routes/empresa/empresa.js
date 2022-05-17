const express = require('express');
const { verificarAcceso } = require('../../middlewares/permisos');
const { subirArchivo } = require('../../library/cargarArchivos');
const app = express.Router();
const EmpresaModel = require('../../models/empresa/empresa.model');
const empresaModel = require('../../models/empresa/empresa.model');

app.get('/', verificarAcceso, async (req, res) => {
    try {
        const blnEstado = req.query.blnEstado == "false" ? false : true;
        const obtenerEmpresas = await EmpresaModel.find({ blnEstado: blnEstado });

        //funcion con aggregate

        const obtenerEmpresasConAggregate = await EmpresaModel.aggregate([
            { $match: { blnEstado: blnEstado } },
        ]);

        //funcion con aggregate

        if (obtenerEmpresas.length == 0) {
            return res.status(400).json({
                ok: false,
                msg: 'No se encontrarón empresas en la base de datos',
                cont: {
                    obtenerEmpresas,
                }
            })
        }
        return res.status(200).json({
            ok: true,
            msg: 'Se obtuvierón los empresas de manera exitosa',
            count: obtenerEmpresas.length,
            cont: {
                obtenerEmpresasConAggregate
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

app.post('/', verificarAcceso,  async (req, res) => {
    try {
        const body = req.body;
        const empresaBody = new EmpresaModel(body);
        const err = empresaBody.validateSync();
        if (err) {
            return res.status(400).json({
                ok: false,
                msg: 'No se recibio uno o mas campos favor de validar',
                cont: {
                    err
                }
            })
        }
        const encontroEmpresa = await EmpresaModel.findOne({ strNombre: body.strNombre }, { strNombre: 1 });
        if (encontroEmpresa) {
            return res.status(400).json({
                ok: false,
                msg: 'La empresa ya se encuentra registrado en la base de datos',
                cont: {
                    encontroEmpresa
                }
            })
        }

        if (!req.body._idImagen) {
            return res.status(400).json({
                ok: false,
                msg: 'No se recibio un _idImagen, favor de ingresarlo',
                cont: {}
            })
        }
    const imagenRegistrada = await empresaModel.findOne({
        _idImagen: req.body._idImagen
    })
    if (imagenRegistrada) {
        return res.status(400).json({
            ok: false,
            msg: 'La imagen ya se encuentra registrada en otra empresa, favor de validar',
            cont: {
                imagenRegistrada
            }
        })
    }
        const empresaRegistrada = await empresaBody.save();
        return res.status(200).json({
            ok: true,
            msg: 'La empresa se registro de manera exitosa',
            cont: {
                empresaRegistrada
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

app.put('/', verificarAcceso,  async (req, res) => {
    try {
        const _idEmpresa = req.query._idEmpresa;
       
        if (!_idEmpresa || _idEmpresa.length != 24) {
            return res.status(400).json({
                ok: false,
                msg: _idEmpresa ? 'El identificador no es valido se requiere un id de 24 caractéres' : 'No se recibio el identificador',
                cont: {
                    _idEmpresa
                }
            })
        }
        const encontroEmpresa = await EmpresaModel.findOne({ _id: _idEmpresa, blnEstado: true });
        if (!encontroEmpresa) {
            return res.status(400).json({
                ok: false,
                msg: 'La empresa no se encuentra registrado',
                cont: {
                    _idEmpresa
                }
            })
        }
        const encontroNombreEmpresa = await EmpresaModel.findOne({ strNombre: req.body.strNombre, _id: { $ne: _idEmpresa } }, { strNombre: 1 })
        if (encontroNombreEmpresa) {
            return res.status(400).json({
                ok: false,
                msg: 'El nombre dLa empresa ya se encuentra registrado',
                cont: {
                    encontroNombreEmpresa
                }
            })
        }
        
        if (!req.body._idImagen) {
            return res.status(400).json({
                ok: false,
                msg: 'No se recibio un _idImagen, favor de ingresarlo',
                cont: {}
            })
        }
    const imagenRegistrada = await empresaModel.findOne({
        _idImagen: req.body._idImagen
    })
    if (imagenRegistrada) {
        return res.status(400).json({
            ok: false,
            msg: 'La imagen ya se encuentra registrada en otra empresa, favor de validar',
            cont: {
                imagenRegistrada
            }
        })
    }
        // const actualizarEmpresa = await EmpresaModel.updateOne({ _id: _idEmpresa }, { $set: { ...req.body } })
        const actualizarEmpresa = await EmpresaModel.findByIdAndUpdate(_idEmpresa, { $set: { ...req.body } }, { new: true });
        if (!actualizarEmpresa) {
            return res.status(400).json({
                ok: false,
                msg: 'La empresa no se logro actualizar',
                cont: {
                    ...req.body
                }
            })
        }
        return res.status(200).json({
            ok: true,
            msg: 'La empresa se actualizo de manera exitosa',
            cont: {
                empresaAnterior: encontroEmpresa,
                empresaActual: actualizarEmpresa
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

app.delete('/', verificarAcceso, async (req, res) => {
    try {
        const _idEmpresa = req.query._idEmpresa;
        const blnEstado = req.query.blnEstado == "false" ? false : true
        if (!_idEmpresa || _idEmpresa.length != 24) {
            return res.status(400).json({
                ok: false,
                msg: _idEmpresa ? 'El identificador de empresa es invalido' : 'No se recibio un identificador de empresa',
                cont: {
                    _idEmpresa
                }
            })
        }
        const encontrarEmpresa = await EmpresaModel.findOne({ _id: _idEmpresa, blnEstado: true });
        if (!encontrarEmpresa) {
            return res.status(400).json({
                ok: false,
                msg: 'El identificador del empresa no se encuentra en la base de datos',
                cont: {
                    _idEmpresa: _idEmpresa
                }
            })
        }
        // Esta funcion elimina de manera definitiva el empresa
        // const eliminarempresa = await EmpresaModel.findOneAndDelete({ _id: _idEmpresa });
        //Esta funcion solo cambia el estado del empresa
        const desactivarEmpresa = await EmpresaModel.findOneAndUpdate({ _id: _idEmpresa }, { $set: { blnEstado: blnEstado } }, { new: true })
        return res.status(200).json({
            ok: true,
            msg: blnEstado == true ? 'Se activo el empresa de manera exitosa' : 'Se desactivo el empresa de manera exitosa',
            cont: {
                desactivarEmpresa
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