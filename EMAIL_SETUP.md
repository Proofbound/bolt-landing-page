# Email Notification Setup for Proofbound

## Overview
Automatic email notifications are sent when customers submit book requests. Both you (admin) and the customer receive emails.

## Setup Instructions

### 1. Choose an Email Service

**Option A: Resend (Recommended)**
1. Sign up at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Verify your domain (or use their test domain for development)

**Option B: SendGrid**
1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Get your API key
3. Verify your sender email

### 2. Configure Environment Variables

In your Supabase project dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add these variables:

```
RESEND_API_KEY=your_resend_api_key_here
ADMIN_EMAIL=your-email@proofbound.com
```

**For SendGrid instead of Resend:**
```
SENDGRID_API_KEY=your_sendgrid_api_key_here
ADMIN_EMAIL=your-email@proofbound.com
```

### 3. Update the Email Function (if using SendGrid)

If you prefer SendGrid over Resend, update the `sendEmail` function in `supabase/functions/send-submission-email/index.ts`:

```typescript
async function sendEmail(to: string, subject: string, html: string) {
  const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');
  
  if (!SENDGRID_API_KEY) {
    console.error('SENDGRID_API_KEY not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: to }],
          subject: subject,
        }],
        from: { email: 'noreply@proofbound.com', name: 'Proofbound' },
        content: [{
          type: 'text/html',
          value: html,
        }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Email send failed:', error);
      return { success: false, error };
    }

    const result = await response.json();
    console.log('Email sent successfully:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}
```

### 4. Test the Setup

1. Submit a test form on your website
2. Check that you receive an admin notification email
3. Check that the customer receives a confirmation email
4. Monitor the Supabase Edge Function logs for any errors

### 5. Email Templates

The system sends two types of emails:

**Admin Notification Email:**
- Contains all submission details
- Includes quick action buttons
- Shows customer contact information

**Customer Confirmation Email:**
- Thanks the customer for their submission
- Explains the next steps
- Provides contact information for questions

### 6. Troubleshooting

**No emails received:**
1. Check Supabase Edge Function logs
2. Verify environment variables are set correctly
3. Check your email service dashboard for delivery status
4. Ensure your domain is verified with your email service

**Emails going to spam:**
1. Set up SPF, DKIM, and DMARC records for your domain
2. Use a verified domain with your email service
3. Avoid spam trigger words in email content

**Database trigger not working:**
- The system has a backup mechanism that sends emails directly from the frontend
- Check the browser console for any email sending errors

### 7. Customization

You can customize the email templates by editing the `generateAdminEmailHtml` and `generateCustomerEmailHtml` functions in the Edge Function.

### 8. Production Considerations

1. **Domain Verification:** Verify your domain with your email service
2. **Rate Limits:** Be aware of your email service's rate limits
3. **Monitoring:** Set up monitoring for email delivery failures
4. **Backup:** Consider having a secondary email service as backup

## Support

If you need help setting this up, contact your development team or refer to:
- [Resend Documentation](https://resend.com/docs)
- [SendGrid Documentation](https://docs.sendgrid.com)
- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)