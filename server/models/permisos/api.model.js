const mongoose = require('mongoose');

let schemaApi = new mongoose.Schema({
    blnEstado: {
        type: Boolean,
        default: true
    },
    strRuta: {
        type: String,
        required: [true, 'No se recibio el strRuta, favor de ingresarlo']
    },
    strMetodo: {
        type: String,
        required: [true, 'No se recibio el strMetodo, favor de ingresarlo']
    },
    strDescripcion: {
        type: String,
        required: [true, 'No se recibio el strDescripcion, favor de ingresarlo']
    },
    blnEsApi: {
        type: Boolean,
        default: true
    },
    blnEsMenu: {
        type: Boolean,
        default: false,
    }
})

module.exports = mongoose.model('api', schemaApi);