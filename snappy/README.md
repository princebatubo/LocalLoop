# Snappy

Facebook bot that screenshots posts when users tag it in comments.

## How it works

1. A user comments on a Facebook post tagging @Snappy with "screenshot this"
2. Snappy fetches the post data via the Graph API
3. Generates a branded screenshot using Puppeteer
4. Replies to the comment with the screenshot image
5. Each user gets 5 free screenshots per month

## Setup

```bash
npm install
cp .env.example .env
# Fill in your Facebook credentials in .env
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `FB_PAGE_ACCESS_TOKEN` | Facebook Page access token |
| `FB_APP_SECRET` | Facebook App secret for webhook signature verification |
| `FB_VERIFY_TOKEN` | Token for webhook verification handshake |
| `PORT` | Server port (default: 3000) |

## Run

```bash
npm start
```

## Facebook App Configuration

1. Create a Facebook App at [developers.facebook.com](https://developers.facebook.com)
2. Add the Webhooks product and subscribe to the `feed` field on your Page
3. Set the webhook URL to `https://your-domain.com/webhook`
4. Generate a Page Access Token with `pages_read_engagement` and `pages_manage_engagement` permissions

## Deploy to Railway

1. Install the Railway CLI and login:
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. Create a new project and link it:
   ```bash
   railway init
   railway link
   ```

3. Set the required environment variables:
   ```bash
   railway variables set FB_PAGE_ACCESS_TOKEN=your_token
   railway variables set FB_APP_SECRET=your_secret
   railway variables set FB_VERIFY_TOKEN=your_verify_token
   ```

4. Deploy:
   ```bash
   railway up
   ```

5. Get your public URL:
   ```bash
   railway domain
   ```

6. Set the webhook URL in your Facebook App to:
   ```
   https://your-app.up.railway.app/webhook
   ```

## Project Structure

```
snappy/
├── src/
│   ├── index.js           # Express server
│   ├── webhook.js         # Webhook event handling
│   ├── screenshot.js      # Puppeteer screenshot generation
│   ├── reply.js           # Comment reply with image
│   ├── rateLimit.js       # SQLite usage tracking (5/month)
│   └── templates/
│       └── post.html      # Branded screenshot template
├── database/
│   └── snappy.db          # SQLite database (auto-created)
├── .env.example
└── package.json
```
