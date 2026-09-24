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

    // Forward to FormSubmit in background / with fast timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      await fetch('https://formsubmit.co/ajax/monir@ufuq.agency', {
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
          message: message,
          _subject: `New Client Inquiry from ${name} — Ufuq Website`,
          _template: 'table',
          _captcha: 'false'
        }),
        signal: controller.signal
      }).catch(err => {
        console.log('[Upstream note]', err.name);
      });
      clearTimeout(timeoutId);
    } catch (forwardErr) {
      console.error('[Upstream Forward Warning]', forwardErr.message);
    }

    // Always respond immediately with success
    return res.status(200).json({
      success: true,
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
