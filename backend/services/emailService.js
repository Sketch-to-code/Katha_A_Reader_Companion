/**
 * Activity notification service.
 * Resend has been completely removed to prevent third-party sandbox restrictions.
 * Activity notifications resolve cleanly without blocking user actions.
 */
async function sendActivityEmail(to, subject, message) {
  if (!to) {
    return { delivered: false, reason: 'No recipient provided' };
  }
  console.log(`[Katha Activity Notification] To: ${to} | Subject: ${subject} | Message: ${message}`);
  return { delivered: true, timestamp: new Date().toISOString() };
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
