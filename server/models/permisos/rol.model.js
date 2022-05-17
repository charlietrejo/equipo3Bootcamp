const mongoose = require('mongoose');

let schemaRol = new mongoose.Schema({
    blnEstado: {
        type: Boolean,
        default: true
    },
    strNombre: {
        type: String,
        required: [true, 'No se recibio el strNombre, favor de ingresarlo']
    },
    strDescripcion: {
        type: String,
        required: [true, 'No se recibio el strDescripcion, favor de ingresarlo']
    },
    blnRolDefault: {
        type: Boolean,
        default: false
    },
    arrObjIdApis: [mongoose.Types.ObjectId]
})

module.exports = mongoose.model('rol', schemaRol);