const crypto = require('crypto');
const { checkRateLimit, recordUsage } = require('./rateLimit');
const { takeScreenshot } = require('./screenshot');
const { replyWithScreenshot } = require('./reply');

function verifySignature(req) {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature) return false;

  const expected = 'sha256=' + crypto
    .createHmac('sha256', process.env.FB_APP_SECRET)
    .update(req.rawBody)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

function handleVerification(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.FB_VERIFY_TOKEN) {
    console.log('Webhook verified');
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
}

async function handleWebhookEvent(req, res) {
  console.log('Received webhook:', JSON.stringify(req.body, null, 2));

  if (!verifySignature(req)) {
    console.warn('Invalid webhook signature');
    return res.sendStatus(401);
  }

  // Respond immediately to avoid Facebook timeout
  res.sendStatus(200);

  const body = req.body;
  if (body.object !== 'page') return;

  for (const entry of body.entry) {
    for (const change of entry.changes || []) {
      if (change.field !== 'feed') continue;

      const value = change.value;
      if (value.item !== 'comment' || value.verb !== 'add') continue;

      await processComment(value);
    }
  }
}

async function processComment(comment) {
  const message = (comment.message || '').toLowerCase();

  // Check if Snappy Ai was tagged with a screenshot request
  if (!message.includes('@snappy ai') || !message.includes('screenshot this')) return;

  const userId = comment.from?.id;
  const commentId = comment.comment_id;
  const postId = comment.post_id;

  if (!userId || !commentId || !postId) return;

  console.log(`Screenshot request from user ${userId} on post ${postId}`);

  // Check rate limit
  const { allowed, remaining } = checkRateLimit(userId);
  if (!allowed) {
    console.log(`User ${userId} hit rate limit`);
    return;
  }

  try {
    const screenshotBuffer = await takeScreenshot(postId);
    await replyWithScreenshot(commentId, screenshotBuffer, remaining);
    recordUsage(userId, postId);
    console.log(`Screenshot delivered for post ${postId} (${remaining} remaining for user)`);
  } catch (err) {
    console.error(`Failed to process screenshot for post ${postId}:`, err.message);
  }
}

module.exports = { handleVerification, handleWebhookEvent };
