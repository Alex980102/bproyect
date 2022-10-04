const express = require('express')
const router = express.Router();
const { sendMessagePost } = require('../controllers/web')

router.post('/send', sendMessagePost)

app.get('/send', (req, res) => {
    res.send('hello world')
  })
module.exports = router