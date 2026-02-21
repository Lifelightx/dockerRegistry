const pool = require('../config/db');
const nodemailer = require('nodemailer');

// Helper to get raw configuration
const getEmailConfig = async () => {
    const result = await pool.query("SELECT config FROM notification_settings ORDER BY id DESC LIMIT 1");
    if (result.rows.length === 0) return null;
    return result.rows[0].config;
};

// Handle incoming Docker Registry webhooks
exports.handleWebhook = async (req, res) => {
    // Acknowledge the webhook immediately so the registry doesn't retry
    res.status(200).send('OK');

    try {
        const events = req.body.events;
        if (!events || events.length === 0) return;

        // Fetch settings once per batch of events
        const config = await getEmailConfig();
        if (!config || !config.enabled || !config.smtpHost || !config.emailTo) {
            return; // Emails disabled or not fully configured
        }

        // Setup Nodemailer transport
        const transporter = nodemailer.createTransport({
            host: config.smtpHost,
            port: config.smtpPort || 587,
            secure: config.smtpPort === 465, // true for 465, false for other ports
            auth: {
                user: config.smtpUser,
                pass: config.smtpPass
            }
        });

        for (const event of events) {
            // We only care about push events
            if (event.action === 'push') {
                const repository = event.target?.repository;
                const tag = event.target?.tag;
                const actor = event.actor?.name || 'Unknown User';

                if (!repository || !tag) continue;

                // Compose email
                const mailOptions = {
                    from: config.emailFrom || '"Registry Notification" <no-reply@registry.local>',
                    to: config.emailTo,
                    subject: `[Registry] New Push: ${repository}:${tag}`,
                    text: `A new image was pushed to the registry.\n\nRepository: ${repository}\nTag: ${tag}\nPushed by: ${actor}\nTimestamp: ${event.timestamp}\n\nURL: ${event.request?.host || ''}/v2/${repository}/manifests/${tag}`,
                    html: `
                        <h2>New Image Pushed</h2>
                        <p><strong>Repository:</strong> ${repository}</p>
                        <p><strong>Tag:</strong> ${tag}</p>
                        <p><strong>Pushed By:</strong> ${actor}</p>
                        <hr />
                        <p><small>Timestamp: ${event.timestamp}</small></p>
                    `
                };

                // Send email
                await transporter.sendMail(mailOptions);
                console.log(`Notification email sent for push event: ${repository}:${tag}`);
            }
        }

    } catch (error) {
        console.error("Failed to process webhook or send email:", error);
    }
};

// Dedicated endpoint to test email configuration from the UI
exports.testEmailConfig = async (req, res) => {
    try {
        const config = req.body;
        if (!config.smtpHost || !config.emailTo) {
            return res.status(400).json({ error: "Missing required SMTP host or recipient address" });
        }

        const transporter = nodemailer.createTransport({
            host: config.smtpHost,
            port: config.smtpPort || 587,
            secure: config.smtpPort === 465,
            auth: {
                user: config.smtpUser,
                pass: config.smtpPass
            }
        });

        await transporter.verify(); // Test connection and auth

        await transporter.sendMail({
            from: config.emailFrom || '"Registry Notification" <no-reply@registry.local>',
            to: config.emailTo,
            subject: `[Registry] Test Notification Email`,
            text: `This is a test email to verify your registry notification settings.`,
        });

        res.json({ message: "Test email sent successfully" });
    } catch (error) {
        console.error("Failed to send test email:", error);
        res.status(500).json({ error: error.message || "Failed to send test email" });
    }
};
