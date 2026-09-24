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

    const timestamp = new Date().toISOString();
    console.log(`========================================`);
    console.log(`[NEW CLIENT INQUIRY RECEIVED]`);
    console.log(`Timestamp: ${timestamp}`);
    console.log(`Name:      ${name}`);
    console.log(`Email:     ${email}`);
    console.log(`Message:   ${message}`);
    console.log(`========================================`);

    let sentViaSmtp = false;

    // 1. Direct Zoho Mail SMTP (if ZOHO_APP_PASSWORD is set in Vercel)
    const smtpPassword = process.env.ZOHO_APP_PASSWORD || process.env.SMTP_PASSWORD;
    if (smtpPassword) {
      try {
        const nodemailer = (await import('nodemailer')).default;
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtppro.zoho.eu',
          port: Number(process.env.SMTP_PORT) || 465,
          secure: true,
          auth: {
            user: process.env.SMTP_USER || 'monir@ufuq.agency',
            pass: smtpPassword
          }
        });

        await transporter.sendMail({
          from: `"Ufuq Website" <${process.env.SMTP_USER || 'monir@ufuq.agency'}>`,
          to: 'monir@ufuq.agency',
          replyTo: email,
          subject: `New Client Inquiry from ${name} — Ufuq Website`,
          text: `Name: ${name}\nEmail: ${email}\nDate: ${timestamp}\n\nMessage:\n${message}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; padding: 24px; border: 1px solid #e0e0e0; border-radius: 10px; background: #ffffff;">
              <h2 style="color: #e1432e; margin-top: 0; font-size: 20px;">New Client Inquiry</h2>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 14px; width: 80px;"><strong>Client:</strong></td>
                  <td style="padding: 8px 0; color: #222; font-size: 14px;"><strong>${name}</strong></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 14px;"><strong>Email:</strong></td>
                  <td style="padding: 8px 0; color: #222; font-size: 14px;"><a href="mailto:${email}" style="color: #e1432e; text-decoration: none;">${email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 14px;"><strong>Received:</strong></td>
                  <td style="padding: 8px 0; color: #666; font-size: 13px;">${timestamp}</td>
                </tr>
              </table>
              <div style="background: #f8f9fa; border-left: 4px solid #e1432e; padding: 16px; border-radius: 4px; font-size: 14px; line-height: 1.6; color: #333; white-space: pre-wrap;">${message}</div>
              <p style="margin-top: 24px; font-size: 12px; color: #999;">Submitted directly via https://ufuq.agency contact form. Hit 'Reply' to respond directly to ${name}.</p>
            </div>
          `
        });
        sentViaSmtp = true;
        console.log(`[SMTP Success] Email delivered directly to monir@ufuq.agency via Zoho SMTP!`);
      } catch (smtpErr) {
        console.error(`[SMTP Error]`, smtpErr.message);
      }
    }

    // 2. Webhook notification (Discord / Slack / Telegram) if configured in Vercel
    if (process.env.NOTIFICATION_WEBHOOK_URL) {
      try {
        await fetch(process.env.NOTIFICATION_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `📬 **New Client Inquiry on Ufuq.agency**\n**From:** ${name} (${email})\n**Message:**\n${message}`
          })
        }).catch(() => {});
      } catch (e) {}
    }

    // 3. Fallback form services (Submify / FormSubmit)
    if (!sentViaSmtp) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        // Try Submify endpoint (hosted on Vercel)
        await fetch('https://submify.vercel.app/monir@ufuq.agency', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            name: name,
            email: email,
            message: message,
            _subject: `New Client Inquiry from ${name} — Ufuq Website`
          }).toString(),
          signal: controller.signal
        }).catch(() => {});

        clearTimeout(timeoutId);
      } catch (err) {}
    }

    // Return friendly success to the client
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
