const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Katha <onboarding@resend.dev>';

async function sendActivityEmail(to, subject, message) {
  if (!to) {
    const err = new Error('A recipient email address is required to send an activity notification.');
    err.status = 400;
    throw err;
  }
  if (!RESEND_API_KEY) {
    const err = new Error('Resend is not configured. Set RESEND_API_KEY on the backend.');
    err.status = 503;
    throw err;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to,
      subject,
      html: renderEmail(message),
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    const err = new Error(`Resend could not deliver the activity notification: ${detail || response.statusText}`);
    err.status = response.status;
    throw err;
  }

  return response.json();
}

function renderEmail(message) {
  return `
    <div style="font-family: Georgia, serif; background:#f4f2ec; color:#211d17; padding:24px;">
      <div style="max-width:560px; margin:0 auto; background:#fffaf0; border:1px solid #ddd6c3; border-radius:10px; padding:22px;">
        <h1 style="font-size:22px; margin:0 0 12px;">Katha</h1>
        <p style="font-size:15px; line-height:1.6; margin:0;">${escapeHtml(message)}</p>
      </div>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = { sendActivityEmail };
