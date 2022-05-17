const mongoose  = require ('mongoose');

let schemaImagen = new mongoose.Schema({
    blnEstado:{
        type: Boolean,
        default:true
    },

    strNombre:{
        type: String,
        required: [true, 'No se recibio el strNombre, favor de ingresarlo']
    },
    
    strImagen: {
        type: String,
        default: 'default.jpg'
    }


})

module.exports = mongoose.model('imagen', schemaImagen)
