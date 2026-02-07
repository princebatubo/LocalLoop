const axios = require('axios');
const FormData = require('form-data');

async function replyWithScreenshot(commentId, screenshotBuffer, remaining) {
  const token = process.env.FB_PAGE_ACCESS_TOKEN;

  // Upload the screenshot as a photo
  const form = new FormData();
  form.append('source', screenshotBuffer, {
    filename: 'screenshot.png',
    contentType: 'image/png',
  });
  form.append('access_token', token);
  form.append('published', 'false');

  const uploadRes = await axios.post(
    'https://graph.facebook.com/v19.0/me/photos',
    form,
    { headers: form.getHeaders() }
  );

  const photoId = uploadRes.data.id;

  // Reply to the comment with the uploaded photo
  const message = `Here's your screenshot! (${remaining} free screenshots remaining this month)`;

  await axios.post(
    `https://graph.facebook.com/v19.0/${commentId}/comments`,
    {
      message,
      attachment_id: photoId,
      access_token: token,
    }
  );
}

module.exports = { replyWithScreenshot };
