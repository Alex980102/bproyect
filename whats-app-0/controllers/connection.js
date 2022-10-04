const connectionReady = (cb = () =>{}) => {
    console.log('El cliente esta listo');
    cb()
}

const connectionLost = (cb = () =>{}) => {
    console.log('** Error de autentificacion vuelve a generar el QRCODE (Borrar el archivo session.json) **');
    cb()
}


module.exports = {connectionReady, connectionLost}