const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const port = 3000;

const configPath = path.join(__dirname, 'config.json');
const clientId = 'YOUR_TWITCH_CLIENT_ID';
const clientSecret = 'YOUR_TWITCH_CLIENT_SECRET';
const redirectUri = 'http://localhost:3000/auth/twitch/callback';

app.use(express.static('public'));
app.use(bodyParser.json());

// Load config
app.get('/config', (req, res) => {
  const config = fs.existsSync(configPath)
    ? JSON.parse(fs.readFileSync(configPath))
    : {};
  res.json(config);
});

// Save config
app.post('/config', (req, res) => {
  const newConfig = req.body;
  fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
  res.json({ message: 'Config saved' });
});

// Twitch OAuth login
app.get('/auth/twitch', (req, res) => {
  const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=chat:read+chat:edit`;
  res.redirect(authUrl);
});

// Twitch OAuth callback
app.get('/auth/twitch/callback', async (req, res) => {
  const code = req.query.code;

  try {
    const tokenRes = await axios.post('https://id.twitch.tv/oauth2/token', null, {
      params: {
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      }
    });

    const accessToken = tokenRes.data.access_token;
    const twitchToken = `oauth:${accessToken}`;

    let config = fs.existsSync(configPath)
      ? JSON.parse(fs.readFileSync(configPath))
      : {};

    config.twitch_oauth = twitchToken;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    res.send(`
      <h2>✅ Twitch Login Successful</h2>
      <p>Your token has been saved to config.json</p>
      <a href="/configure">Return to Config</a>
    `);
  } catch (err) {
    console.error('Twitch OAuth failed:', err.message);
    res.status(500).send(`<h2>❌ OAuth Error</h2><pre>${err.message}</pre>`);
  }
});

// Start server
app.listen(port, () => {
  console.log(`✅ Config server running at http://localhost:${port}/configure`);
});

