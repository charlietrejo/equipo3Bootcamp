const express = require('express');
const { verificarAcceso } = require('../../middlewares/permisos');
const path = require('path');
const fs = require('fs');
const app = express.Router();
const ImagenModel = require('../../models/imagen/imagen.model');
const { subirArchivo } = require('../../library/cargarArchivos');



app.get('/', verificarAcceso, async (req, res) => {
    try {
        const blnEstado = req.query.blnEstado == "false" ? false : true;
        const obtenerImagen = await ImagenModel.find({ blnEstado: blnEstado });

        //funcion con aggregate

        const obtenerImagenConAggregate = await ImagenModel.aggregate([
            { $match: { blnEstado: blnEstado } },
        ]);

        //funcion con aggregate

        if (obtenerImagen.length == 0) {
            return res.status(400).json({
                ok: false,
                msg: 'No se encontrarón imagenes en la base de datos',
                cont: {
                    obtenerImagen,
                }
            })
        }
        return res.status(200).json({
            ok: true,
            msg: 'Se obtuvierón las imagenes de manera exitosa',
            count: obtenerImagen.length,
            cont: {
                obtenerImagenConAggregate
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
        console.log("body", body);
        const imagenBody = new ImagenModel(body);
        const err = imagenBody.validateSync();
        console.log("error",err);
        if (err) {
            return res.status(400).json({
                ok: false,
                msg: 'No se recibio uno o mas campos favor de validar',
                cont: {
                    err
                }
            })
        }
        const encontroImagen = await ImagenModel.findOne({ strNombre: body.strNombre }, { strNombre: 1 });
        if (encontroImagen) {
            return res.status(400).json({
                ok: false,
                msg: 'La imagen ya se encuentra registrada en la base de datos',
                cont: {
                    encontroImagen
                }
            })
        }

        if (req.files) {
            if (!req.files.strImagen) {
                return res.status(400).json({
                    ok: false,
                    msg: 'No se recibio un archivo strImagen, favor de ingresarlo',
                    cont: {}
                })
            }
            
            imagenBody.strImagen = await subirArchivo(req.files.strImagen, 'imagen', ['image/png', 'image/jpg', 'image/jpeg'])
            console.log("despues de grabar", imagenBody.strImagen);
        }

        const imagenRegistrada = await imagenBody.save();
        return res.status(200).json({
            ok: true,
            msg: 'La imagen se registro de manera exitosa',
            cont: {
                imagenRegistrada
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
        const body = req.body;
        console.log("body", body);
        const imagenBody = new ImagenModel(body);
        const err = imagenBody.validateSync();
        console.log("error",err);
        if (err) {
            return res.status(400).json({
                ok: false,
                msg: 'No se recibio uno o mas campos favor de validar',
                cont: {
                    err
                }
            })
        }
        console.log("imagen",_id.length);
        //validamos que no enviemos in id, o que el id no tenga la longitud correcta
        if (!_id || _id.length != 24) {
            
            return res.status(400).json(
                {
                    ok: false,
                    msg: _id ? 'El id no es valido, se requiere un id de almenos 24 caracteres': 'No se recibio una imagen',
                    cont:
                    {
                        _id
                    }
                })
        }
        console.log("paso primer if")
        const encontroImagen = await ImagenModel.findOne({ _id: _id, blnEstado: true });
        console.log("encontroimagen", encontroImagen);
        if (!encontroImagen) {
            return res.status(400).json(
                {
                    ok: false,
                    msg: 'La imagen no se encuentra registrada',
                    cont:
                    {
                        _id
                    }
                })

        }
        const encontrarNombreImagen = await ImagenModel.findOne({ strNombre: req.body.strNombre, _id: { $ne: _id } }, { strNombre: 1})
        console.log("encontrarNombreImagen", encontrarNombreImagen);
        if (encontrarNombreImagen) {
            return res.status(400).json(
                {
                    ok: false,
                    msg: 'El nombre de la imagen ya se encuentra registrado en la base de datos',
                    cont:
                    {
                        encontrarNombreImagen
                    }
                })
        }
        imagenBody.strImagen = await subirArchivo(req.files.strImagen, 'imagen', ['image/png', 'image/jpg', 'image/jpeg'])

        //tambien se puede utilizar
        //findByIdAndUpdate findOneAndUpdate(_idUsuario, { $set:{strNombre: req.body.strNombre, strApellido: req.body.strApellido, strDireccion: req.body.strDireccion}}, {new :true, upsert: true});
        //updateOne({_id:_idUsuario}, { $set:{strNombre: req.body.strNombre, strApellido: req.body.strApellido, strDireccion: req.body.strDireccion}});
        const actualizarImagen = await ImagenModel.findOneAndUpdate({ _id: _id }, {
            
            $set: {
                blnEstado: req.body.blnEstado,
                strNombre: req.body.strNombre,
                strImagen: imagenBody.strImagen,
            }
        }, { new: true, upsert: true });
        console.log("actualizarImagen",actualizarImagen);
        if (!actualizarImagen) {
            return res.status(400).json(
                {
                    ok: false,
                    //utilizamos un operador ternarrio para validar cual de las 2 condiciones es la que se esta cumpliendo
                    msg: 'No se logro actualizar la imagen',
                    cont:
                    {
                        ...req.body
                    }
                })

        }

        return res.status(200).json(
            {
                ok: true,
                msg: 'La imagen se actualizo de manera existosa',
                cont:
                {
                    imagenAnterior: encontroImagen,
                    imagenActual: actualizarImagen
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
                msg: _id ? 'No se ingreso un idImagen' : 'No es un id valido',
                cont: {
                    _id: _id
                }
            })
        }
        const modificarEstadoImagen = await ImagenModel.findOneAndUpdate({ _id: _id }, { $set: { blnEstado: blnEstado } }, { new: true })

        return res.status(200).json({
            ok: true,
            msg: blnEstado == true ? 'Se activo la imagen de manera exitosa' : 'Se desactivo la imagen de manera exitosa',
            cont: {
                modificarEstadoImagen
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
/*app.get('/:ruta/:nameImg', (req, res) => {
    const ruta = req.params.ruta;
    const nameImg = req.params.nameImg;
    const rutaImagen = path.resolve(__dirname, `../../../upload/${ruta}/${nameImg}`)
    const noImage = path.resolve(__dirname, `../../assets/no-image.png`)
    if (fs.existsSync(rutaImagen)) {
        return res.sendFile(rutaImagen)
    } else {
        return res.sendFile(noImage)
    }
})*/

module.exports = app;