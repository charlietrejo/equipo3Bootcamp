const express = require('express');
const { verificarAcceso } = require('../../middlewares/permisos');
const app = express.Router();
const { subirArchivo } = require('../../library/cargarArchivos');
const ProductoModel = require('../../models/producto/producto.model');

app.get('/', verificarAcceso, async (req, res) => {
    try {
        const blnEstado = req.query.blnEstado == "false" ? false : true;
        const obtenerProductos = await ProductoModel.find({ blnEstado: blnEstado });

        //funcion con aggregate

        const obtenerProductosConAggregate = await ProductoModel.aggregate([
            { $match: { blnEstado: blnEstado } },
        ]);

        //funcion con aggregate

        if (obtenerProductos.length == 0) {
            return res.status(400).json({
                ok: false,
                msg: 'No se encontrarón productos en la base de datos',
                cont: {
                    obtenerProductos,
                }
            })
        }
        return res.status(200).json({
            ok: true,
            msg: 'Se obtuvierón los productos de manera exitosa',
            count: obtenerProductos.length,
            cont: {
                obtenerProductosConAggregate
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
        const productoBody = new ProductoModel(body);
        const err = productoBody.validateSync();
        if (err) {
            return res.status(400).json({
                ok: false,
                msg: 'No se recibio uno o mas campos favor de validar',
                cont: {
                    err
                }
            })
        }
        const encontroProducto = await ProductoModel.findOne({ strNombre: body.strNombre }, { strNombre: 1 });
        if (encontroProducto) {
            return res.status(400).json({
                ok: false,
                msg: 'El producto ya se encuentra registrado en la base de datos',
                cont: {
                    encontroProducto
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
        const imagenRegistrada = await ProductoModel.findOne({
            _idImagen: req.body._idImagen
        })
        if (imagenRegistrada) {
            return res.status(400).json({
                ok: false,
                msg: 'La imagen ya se encuentra registrada en otro producto, favor de validar',
                cont: {
                    imagenRegistrada
                }
            })
        }
           // productoBody.strImagen = await subirArchivo(req.files.strImagen, 'imagen', ['image/png', 'image/jpg', 'image/jpeg'])
        
        
        const productoRegistrado = await productoBody.save();
        return res.status(200).json({
            ok: true,
            msg: 'El producto se registro de manera exitosa',
            cont: {
                productoRegistrado
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
        const body = req.body;
        const productoBody = new ProductoModel(body);
        const _idProducto = req.query._idProducto;
        if (!_idProducto || _idProducto.length != 24) {
            return res.status(400).json({
                ok: false,
                msg: _idProducto ? 'El identificador no es valido se requiere un id de 24 caractéres' : 'No se recibio el identificador',
                cont: {
                    _idProducto
                }
            })
        }
        const encontroProducto = await ProductoModel.findOne({ _id: _idProducto, blnEstado: true });
        if (!encontroProducto) {
            return res.status(400).json({
                ok: false,
                msg: 'El producto no se encuentra registrado',
                cont: {
                    _idProducto
                }
            })
        }
        const encontroNombreProducto = await ProductoModel.findOne({ strNombre: req.body.strNombre, _id: { $ne: _idProducto } }, { strNombre: 1 })
        if (encontroNombreProducto) {
            return res.status(400).json({
                ok: false,
                msg: 'El nombre del producto ya se encuentra registrado',
                cont: {
                    encontroNombreProducto
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
            const imagenRegistrada = await ProductoModel.findOne({
                _idImagen: req.body._idImagen
            })
            if (imagenRegistrada) {
                return res.status(400).json({
                    ok: false,
                    msg: 'La imagen ya se encuentra registrada en otro producto, favor de validar',
                    cont: {
                        imagenRegistrada
                    }
                })
            }
           
        
        // const actualizarProducto = await ProductoModel.updateOne({ _id: _idProducto }, { $set: { ...req.body } })
        const actualizarProducto = await ProductoModel.findByIdAndUpdate(_idProducto, { $set: { ...req.body } }, { new: true });
        if (!actualizarProducto) {
            return res.status(400).json({
                ok: false,
                msg: 'El producto no se logro actualizar',
                cont: {
                    ...req.body
                }
            })
        }
        return res.status(200).json({
            ok: true,
            msg: 'El producto se actualizo de manera exitosa',
            cont: {
                productoAnterior: encontroProducto,
                productoActual: actualizarProducto
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
        const _idProducto = req.query._idProducto;
        const blnEstado = req.query.blnEstado == "false" ? false : true
        if (!_idProducto || _idProducto.length != 24) {
            return res.status(400).json({
                ok: false,
                msg: _idProducto ? 'El identificador de producto es invalido' : 'No se recibio un identificador de producto',
                cont: {
                    _idProducto
                }
            })
        }
        const encontrarProducto = await ProductoModel.findOne({ _id: _idProducto, blnEstado: true });
        if (!encontrarProducto) {
            return res.status(400).json({
                ok: false,
                msg: 'El identificador del producto no se encuentra en la base de datos',
                cont: {
                    _idProducto: _idProducto
                }
            })
        }
        // Esta funcion elimina de manera definitiva el producto
        // const eliminarProducto = await ProductoModel.findOneAndDelete({ _id: _idProducto });
        //Esta funcion solo cambia el estado del producto
        const desactivarProducto = await ProductoModel.findOneAndUpdate({ _id: _idProducto }, { $set: { blnEstado: blnEstado } }, { new: true })
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
            msg: blnEstado == true ? 'Se activo el producto de manera exitosa' : 'Se desactivo el producto de manera exitosa',
            cont: {
                desactivarProducto
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
//La agregación en MongoDB sigue una estructura tipo "pipeline":
// diferentes etapas, donde cada una toma la salida de la anterior.
// Los elementos de la "tubería" se incluyen en un array y se ejecutarán por orden.
// Cada elemento puede repetirse y el orden puede variar.


module.exports = app;