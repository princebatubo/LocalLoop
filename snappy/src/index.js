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

// Test screenshot endpoint
app.post('/test-screenshot', async (req, res) => {
  try {
    const testPostData = {
      message: 'This is a test post for Snappy!',
      from: { name: 'Test User' },
      created_time: new Date().toISOString()
    };

    const screenshotBuffer = await require('./screenshot').generateScreenshot(testPostData);

    res.set('Content-Type', 'image/png');
    res.send(screenshotBuffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Facebook webhook verification
app.get('/webhook', handleVerification);

// Facebook webhook events
app.post('/webhook', handleWebhookEvent);

app.listen(PORT, () => {
  console.log(`Snappy listening on port ${PORT}`);
});
