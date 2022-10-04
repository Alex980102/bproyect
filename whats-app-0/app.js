require('dotenv').config()
const fs = require('fs');
const express = require('express');
const cors = require('cors')
const qrcode = require('qrcode-terminal');
const { Client } = require('whatsapp-web.js');
const mysqlConnection = require('./config/mysql')
const { middlewareClient } = require('./middleware/client')
const { generateImage, cleanNumber, checkEnvFile, createClient, isValidNumber } = require('./controllers/handle')
const { connectionReady, connectionLost } = require('./controllers/connection')
const { saveMedia } = require('./controllers/save')
const { getMessages, responseMessages, bothResponse } = require('./controllers/flows')
const { sendMedia, sendMessage, lastTrigger, sendMessageButton, readChat } = require('./controllers/send');
const { sendMessagePost } = require('./controllers/web');
const { spawnSync, exec, execSync } = require('child_process');
const app = express();
app.use(cors())
app.use(express.json())
const MULTI_DEVICE = process.env.MULTI_DEVICE || 'true';
const server = require('http').Server(app)

const port = process.env.PORT || 3000
const SESSION_FILE_PATH = './session.json';
var client;

var sessionData;
var phonenumber;

app.use('/', require('./routes/web'))

app.get('/send', (req, res) => {
    const message = req.query.message;
    const number = req.query.number;
    sendMessage(client, number, message)
    res.send({ status: 'Enviado!' })
})

app.get('/sendprueba', (req, res) => {
    let tiempoi = []
    tiempoi.push(new Date().getTime())
    const message = req.query.message;
    const number = req.query.number;

    let name = `trimi${Math.floor(Math.random() * (100 - 1000) + 100)}`;
    // spawnSync('ffmpeg -i /home/wwbeot/nodeapps/botes/bot-whatsapp/mediaSend/video.mp4 -to 00:01:07 -y /home/wwbeot/nodeapps/botes/bot-whatsapp/mediaSend/trimi.mp4')
    // console.log(spawnSync('sha1sum /home/wwbeot/nodeapps/botes/bot-whatsapp/mediaSend/trimi.mp4'));
    // ffmpeg -i mediaSend/video.mp4 -i mediaSend/PIXALEX.png -filter_complex "overlay=50:50" mediaSend/trimi666.mp4
    // ffmpeg -i /home/wwbeot/nodeapps/botes/bot-whatsapp/mediaSend/video.mp4 -t 00:01:0${Math.floor(Math.random() * (7-3)+3)} -y /home/wwbeot/nodeapps/botes/bot-whatsapp/mediaSend/${name}.mp4
    execSync(`ffmpeg -i mediaSend/video.mp4 -i mediaSend/PIXALEX.png -filter_complex "overlay=${Math.floor(Math.random() * (500 - 0) + 0)}:${Math.floor(Math.random() * (1024 - 0) + 0)}" mediaSend/${name}.mp4`, (err, stdout, stderr) => {
        if (err) {
            console.log(err);
        }
        console.log(stdout);
    });
    sendMessage(client, number, message)
    sendMedia(client, number, `${name}.mp4`)
    tiempoi.push(new Date().getTime())
    console.log(tiempoi);
    console.log(require('child_process').execSync(
        `sha1sum ${__dirname}/mediaSend/${name}.mp4`,
        // {stdio: 'inherit'}
    ).toString());
    try {
        fs.unlinkSync(`${__dirname}/mediaSend/${name}.mp4`)
        console.log('file removed');
        //file removed
    } catch (err) {
        console.error(err)
    }
    res.send({ status: 'Enviado!' })
})

const sendLocalMessage = (message, number) => {
    sendMessage(client, number, message)
}

/**
 * Escuchamos cuando entre un mensaje
 */
const listenMessage = () => client.on('message', async msg => {
    const { from, body, hasMedia } = msg;

    const invalidNumbers = ['5217773274542@c.us', '5217771088227@c.us', '5217772677657@c.us', '5217773699640@c.us']

    if (!isValidNumber(from)) {
        return
    }

    if (from === 'status@broadcast') {
        return
    }
    if (from === '5217773274542@c.us') {
        console.log(`Not apply ${from}`)
        return
    }

    if (from === '5217771088227@c.us') {
        console.log(`Not apply ${from}`)
        return
    }

    if (invalidNumbers.includes(from)) {
        console.log(`Not apply ${from}`)
        return
    }




    message = body.toLowerCase();
    phonenumber = from;
    console.log('BODY', message)
    number = cleanNumber(from)
    await readChat(number, message)

    /**
     * Guardamos el archivo multimedia que envia
     */
    if (process.env.SAVE_MEDIA && hasMedia) {
        const media = await msg.downloadMedia();
        saveMedia(media);
    }

    /**
     * Si estas usando dialogflow solo manejamos una funcion todo es IA
     */

    if (process.env.DATABASE === 'dialogflow') {
        if (!message.length) return;
        const response = await bothResponse(message);
        await sendMessage(client, from, response.replyMessage);
        if (response.media) {
            sendMedia(client, from, response.media);
        }
        return
    }

    /**
    * Ver si viene de un paso anterior
    * Aqui podemos ir agregando más pasos
    * a tu gusto!
    */

    const lastStep = await lastTrigger(from) || null;
    if (lastStep) {
        const response = await responseMessages(lastStep)
        await sendMessage(client, from, response.replyMessage);
    }

    /**
     * Respondemos al primero paso si encuentra palabras clave
     */
    const step = await getMessages(message);

    if (step) {
        const response = await responseMessages(step);

        /**
         * Si quieres enviar botones
         */

        await sendMessage(client, from, response.replyMessage, response.trigger);

        if (response.hasOwnProperty('actions')) {
            const { actions } = response;
            await sendMessageButton(client, from, null, actions);
            return
        }

        if (!response.delay && response.media) {
            sendMedia(client, from, response.media);
        }
        if (response.delay && response.media) {
            setTimeout(() => {
                sendMedia(client, from, response.media);
            }, response.delay)
        }
        return
    }

    //Si quieres tener un mensaje por defecto
    if (process.env.DEFAULT_MESSAGE === 'true') {
        const response = await responseMessages('DEFAULT')
        await sendMessage(client, from, response.replyMessage, response.trigger);

        /**
         * Si quieres enviar botones
         */
        if (response.hasOwnProperty('actions')) {
            const { actions } = response;
            await sendMessageButton(client, from, null, actions);
        }
        return
    }
});

/**
 * Revisamos si tenemos credenciales guardadas para inciar sessio
 * este paso evita volver a escanear el QRCODE
 */
const withSession = () => {
    console.log(`Validando session con Whatsapp...`)
    sessionData = require(SESSION_FILE_PATH);
    client = new Client(createClient(sessionData, true));

    client.on('ready', () => {
        connectionReady()
        listenMessage()
    });

    client.on('auth_failure', () => connectionLost())

    client.initialize();
}

/**
 * Generamos un QRCODE para iniciar sesion
 */
const withOutSession = () => {
    console.log('No tenemos session guardada');
    console.log([
        '🙌 El core de whatsapp se esta actualizando',
        '🙌 para proximamente dar paso al multi-device',
        '🙌 falta poco si quieres estar al pendiente unete',
        '🙌 Si estas usando el modo multi-device se generan 2 QR Code escanealos',
        '🙌 Ten paciencia se esta generando el QR CODE',
        '________________________',
    ].join('\n'));

    // client = new Client(createClient());

    client = new Client({
        puppeteer: {
            executablePath: '/usr/bin/google-chrome',
            args: ['--no-sandbox'],
        }
    });

    client.on('qr', qr => generateImage(qr, () => {
        qrcode.generate(qr, { small: true });
        console.log(`Ver QR http://localhost:${port}/qr`)
        socketEvents.sendQR(qr)
    }))

    client.on('ready', (a) => {
        connectionReady()
        listenMessage()
        // socketEvents.sendStatus(client)
    });

    client.on('auth_failure', (e) => {
        // console.log(e)
        // connectionLost()
    });

    client.on('authenticated', (session) => {
        sessionData = session;
        if (sessionData) {
            fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
                if (err) {
                    console.log(`Ocurrio un error con el archivo: `, err);
                }
            });
        }
    });

    client.initialize();
}

/**
 * Revisamos si existe archivo con credenciales!
 */
(fs.existsSync(SESSION_FILE_PATH) && MULTI_DEVICE === 'false') ? withSession() : withOutSession();

/**
 * Verificamos si tienes un gesto de db
 */

if (process.env.DATABASE === 'mysql') {
    mysqlConnection.connect()
}

server.listen(port, '0.0.0.0', () => {
    console.log(`El server esta listo por el puerto ${port}`);
})
checkEnvFile();

module.exports = { sendLocalMessage, phonenumber }

