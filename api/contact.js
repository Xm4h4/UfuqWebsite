export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }

    const name = (body.name || '').trim();
    const email = (body.email || '').trim();
    const message = (body.message || '').trim();

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    console.log(`[New Inquiry] From: ${name} <${email}>: ${message.substring(0, 80)}`);

    // Forward to FormSubmit with adequate timeout
    let forwardSuccess = false;
    let forwardDetails = '';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8500);

      const upstreamRes = await fetch('https://formsubmit.co/ajax/monir@ufuq.agency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': 'https://ufuq.agency',
          'Referer': 'https://ufuq.agency/'
        },
        body: JSON.stringify({
          name: name,
          email: email,
          _replyto: email,
          message: message,
          _subject: `New Client Inquiry from ${name} — Ufuq Website`,
          _template: 'table',
          _captcha: 'false'
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const upstreamText = await upstreamRes.text();
      console.log(`[FormSubmit Upstream Response ${upstreamRes.status}]:`, upstreamText);
      forwardSuccess = upstreamRes.ok;
      forwardDetails = upstreamText;
    } catch (forwardErr) {
      console.error('[Upstream Forward Warning]:', forwardErr.message);
      forwardDetails = forwardErr.message;
    }

    // Optional webhook forwarder (e.g. Discord, Slack, Telegram) if configured in Vercel env
    if (process.env.NOTIFICATION_WEBHOOK_URL) {
      try {
        await fetch(process.env.NOTIFICATION_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `**New Inquiry on Ufuq.agency**\n**From:** ${name} (${email})\n**Message:** ${message}`
          })
        }).catch(() => {});
      } catch (e) {}
    }

    // Always respond with success to the user so client UX remains fast and positive
    return res.status(200).json({
      success: true,
      delivered: forwardSuccess,
      message: 'Thank you! Your message has been received. We will get back to you shortly.'
    });
  } catch (error) {
    console.error('[Contact Handler Error]', error);
    return res.status(200).json({
      success: true,
      message: 'Thank you! Your message has been received. We will get back to you shortly.'
    });
  }
}
