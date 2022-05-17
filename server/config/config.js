process.env.PORT = process.env.PORT || 3000;

let urlDB;
//mongodb+srv://admin:admin@cluster0.dyboa.mongodb.net/josemariaSigma?retryWrites=true&w=majority
//mongodb://localhost:27017/InventarioHandcloud
if (process.env.NODE_ENV === 'dev') {
    urlDB = "mongodb+srv://BootCamp:Eskimos03$@cluster0.v7v8p.mongodb.net/bootcamDb?retryWrites=true&w=majority"
} else {
    urlDB = "mongodb+srv://BootCamp:Eskimos03$@cluster0.v7v8p.mongodb.net/bootcamDb?retryWrites=true&w=majority"
}

process.env.URLDB = urlDB;

process.env.SEED = process.env.SEED || 'Firma-Secreta';

process.env.CADUCIDAD_TOKEN = process.env.CADUCIDAD_TOKEN || '8h';
