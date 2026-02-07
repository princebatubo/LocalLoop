require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { handleVerification, handleWebhookEvent } = require('./webhook');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({ verify: (req, _res, buf) => { req.rawBody = buf; } }));

// Health check
app.get('/', (_req, res) => {
  res.send('Snappy is running!');
});

// Facebook webhook verification
app.get('/webhook', handleVerification);

// Facebook webhook events
app.post('/webhook', handleWebhookEvent);

app.listen(PORT, () => {
  console.log(`Snappy listening on port ${PORT}`);
});
