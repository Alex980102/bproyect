const dialogflow = require('@google-cloud/dialogflow');
const fs = require('fs')
const nanoid = require('nanoid')
const axios = require('axios');
const { sendLocalMessage } = require('../app');
const { cleanNumber } = require('../controllers/handle');
/**
 * Debes de tener tu archivo con el nombre "chatbot-account.json" en la raíz del proyecto
 */

const KEEP_DIALOG_FLOW = (process.env.KEEP_DIALOG_FLOW === 'true')
let PROJECID;
let CONFIGURATION;
let sessionClient;


const sendAxios = async (mensaje, numero) => {
    axios
      .get(
        `http://localhost:3000/send?message=${mensaje}&number=521${numero}@c.us`
      )
      .then(function (response) {
        console.log(response);
      });
  };

const checkFileCredentials = () => {
    if(!fs.existsSync(`${__dirname}/../chatbot-account.json`)){
        return false
    }

    const parseCredentials = JSON.parse(fs.readFileSync(`${__dirname}/../chatbot-account.json`));
    PROJECID = parseCredentials.project_id;
    CONFIGURATION = {
        credentials: {
            private_key: parseCredentials['private_key'],
            client_email: parseCredentials['client_email']
        }
    }
    sessionClient = new dialogflow.SessionsClient(CONFIGURATION);
}

// Create a new session


// Detect intent method
const detectIntent = async (queryText, numberfrom=undefined) => {
    let media = null;
    const sessionId = KEEP_DIALOG_FLOW ? 1 : nanoid();
    const sessionPath = sessionClient.projectAgentSessionPath(PROJECID, sessionId);
    const languageCode = process.env.LANGUAGE
    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: queryText,
                languageCode: languageCode,
            },
        },
    };

    const responses = await sessionClient.detectIntent(request);
    console.log(responses[0]);
    const [singleResponse] = responses;
    const { queryResult } = singleResponse
    const { intent } = queryResult || { intent: {} }
    const parseIntent = intent['displayName'] || null
    const parsePayload = queryResult['fulfillmentMessages'].find((a) => a.message === 'payload');
    // console.log(singleResponse)
    if (parsePayload && parsePayload.payload) {
        const { fields } = parsePayload.payload
        media = fields.media.stringValue || null
        //replyMessage = fields.replyMessage.stringValue || null
        try {
            replyMessage = fields.replyMessage.stringValue
            
        } catch (error) {
            console.log(error)
            replyMessage = queryResult.fulfillmentText
        }
    } else {
        replyMessage = queryResult.fulfillmentText
    }
    
    if (responses[0]['queryResult']['action'] == 'input.welcome') {
        replyMessage = greetByHour(replyMessage)
    }

    if (responses[0]['queryResult']['action'] == 'input.unknown') {
        try {
            sendLocalMessage('Tenemos un problema', '5217771365050@c.us')
        } catch (error) {
            sendAxios('Problema Con un cliente parece que andy no entiende', 7771365050)
            sendAxios(`Teléfono de cliente: ${cleanNumber(number)}`, 7771365050)
            sendAxios(`Mensaje del cliente: ${message}`, 7771365050)
        }
    }

    if (responses[0]['queryResult']['action'] == 'order.id') {
        replyMessage = 'Estamos buscando tu número de pedido espere un momento'
    }
    console.log(parsePayload)
    //const customPayload = parsePayload['payload']
    try {
        const customPayload = parsePayload['payload']
        console.log(customPayload)
    } catch (error) {
        console.log(error);
    }

    //TODO: Insertar la respuesta query responde si la mandan mediante el payload personalizado
    const parseData = {
        replyMessage,
        media,
        trigger: null
    }
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
    // await delay(4000)
    console.log(parseData)
    return parseData
}

const getDataIa = (message = '', cb = () => { }) => {
    detectIntent(message).then((res) => {
        cb(res)
    })
}


// Empiezan las funciones de saludar por día
const insert = (arr, index, newItem) => [
    // part of the array before the specified index
    ...arr.slice(0, index),
    // inserted item
    newItem,
    // part of the array after the specified index
    ...arr.slice(index)
  ]

const greetByHour = (greet) => {
    var phrase = greet.split(' ')
    
    const time = new Date().toTimeString().split(' ')[0].split(':');
    if (time[0] < 12) {
        greet = 'Buenos días';
    } else if (time[0] >= 12 && time[0] < 20 ) {
        greet = 'Buenas tardes';
    } else {
        greet = 'Buenas noches';
    }
   
    phrase = insert(phrase, 1, greet).join(" ");
    return phrase
}
// Terminan las funciones de saludar por día

checkFileCredentials();

module.exports = { getDataIa }
