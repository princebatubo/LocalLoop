const axios = require('axios');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const TEMPLATE_PATH = path.join(__dirname, 'templates', 'post.html');

async function fetchPostData(postId) {
  const url = `https://graph.facebook.com/v19.0/${postId}`;
  const { data } = await axios.get(url, {
    params: {
      fields: 'message,from{name,picture},created_time,attachments{media}',
      access_token: process.env.FB_PAGE_ACCESS_TOKEN,
    },
  });
  return data;
}

function buildHTML(post) {
  let template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');

  const authorName = post.from?.name || 'Facebook User';
  const authorAvatar = post.from?.picture?.data?.url || '';
  const message = post.message || '';
  const timestamp = new Date(post.created_time).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const imageUrl = post.attachments?.data?.[0]?.media?.image?.src || '';

  template = template
    .replace('{{AUTHOR_NAME}}', authorName)
    .replace('{{AUTHOR_AVATAR}}', authorAvatar)
    .replace('{{MESSAGE}}', message)
    .replace('{{TIMESTAMP}}', timestamp)
    .replace('{{IMAGE_URL}}', imageUrl)
    .replace('{{HAS_IMAGE}}', imageUrl ? 'block' : 'none');

  return template;
}

async function renderScreenshot(html) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 600, height: 800 });
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const screenshotBuffer = await page.screenshot({
      type: 'png',
      fullPage: true,
    });

    return screenshotBuffer;
  } finally {
    await browser.close();
  }
}

async function takeScreenshot(postId) {
  const post = await fetchPostData(postId);
  return renderScreenshot(buildHTML(post));
}

async function generateScreenshot(postData) {
  return renderScreenshot(buildHTML(postData));
}

module.exports = { takeScreenshot, generateScreenshot };
