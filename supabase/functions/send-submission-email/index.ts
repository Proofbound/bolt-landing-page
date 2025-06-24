import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Email service configuration
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'info@proofbound.com';

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Proofbound <noreply@proofbound.com>',
        to: [to],
        subject,
        html,
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

function generateAdminEmailHtml(submission: any) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Book Submission - Proofbound</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #495057; }
        .value { margin-top: 5px; padding: 10px; background: white; border-radius: 4px; border-left: 4px solid #007bff; }
        .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        .status-pending { background: #fff3cd; color: #856404; }
        .footer { margin-top: 20px; padding: 15px; background: #e9ecef; border-radius: 4px; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📚 New Book Submission Received</h1>
          <p>A new customer has submitted a book request on Proofbound</p>
        </div>
        
        <div class="content">
          <div class="field">
            <div class="label">Customer Information</div>
            <div class="value">
              <strong>Name:</strong> ${submission.name}<br>
              <strong>Email:</strong> <a href="mailto:${submission.email}">${submission.email}</a><br>
              <strong>Submitted:</strong> ${new Date(submission.created_at).toLocaleString()}
            </div>
          </div>

          <div class="field">
            <div class="label">Book Topic</div>
            <div class="value">${submission.book_topic}</div>
          </div>

          ${submission.book_style ? `
          <div class="field">
            <div class="label">Book Style</div>
            <div class="value">${submission.book_style.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
          </div>
          ` : ''}

          <div class="field">
            <div class="label">Book Description</div>
            <div class="value">${submission.book_description}</div>
          </div>

          ${submission.additional_notes ? `
          <div class="field">
            <div class="label">Additional Notes</div>
            <div class="value">${submission.additional_notes}</div>
          </div>
          ` : ''}

          <div class="field">
            <div class="label">Status</div>
            <div class="value">
              <span class="status status-pending">${submission.status.toUpperCase()}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <p><strong>Next Steps:</strong></p>
          <ul>
            <li>Review the submission details above</li>
            <li>Contact the customer within 24 hours</li>
            <li>Send them a draft outline for approval</li>
            <li>Update the submission status in your admin dashboard</li>
          </ul>
          
          <p>
            <strong>Quick Actions:</strong><br>
            <a href="mailto:${submission.email}?subject=Your Proofbound Book Project - ${submission.book_topic}&body=Hi ${submission.name},%0D%0A%0D%0AThank you for your book submission about '${submission.book_topic}'. We're excited to work with you!%0D%0A%0D%0AWe'll review your requirements and get back to you within 24 hours with a draft outline and next steps.%0D%0A%0D%0ABest regards,%0D%0AThe Proofbound Team" 
               style="display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; margin-right: 10px;">
              📧 Email Customer
            </a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateCustomerEmailHtml(submission: any) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Thank You for Your Book Submission - Proofbound</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
        .highlight { background: white; padding: 15px; border-radius: 4px; border-left: 4px solid #28a745; margin: 15px 0; }
        .timeline { background: white; padding: 20px; border-radius: 4px; margin: 15px 0; }
        .timeline-item { display: flex; align-items: center; margin-bottom: 15px; }
        .timeline-icon { width: 30px; height: 30px; border-radius: 50%; background: #007bff; color: white; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-weight: bold; }
        .footer { margin-top: 20px; padding: 15px; background: #e9ecef; border-radius: 4px; font-size: 14px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📚 Thank You, ${submission.name}!</h1>
          <p>Your book submission has been received</p>
        </div>
        
        <div class="content">
          <div class="highlight">
            <h3>✅ Submission Confirmed</h3>
            <p>We've received your request for a book about <strong>"${submission.book_topic}"</strong> and our team is excited to work with you!</p>
          </div>

          <div class="timeline">
            <h3>What happens next:</h3>
            
            <div class="timeline-item">
              <div class="timeline-icon">1</div>
              <div>
                <strong>Within 24 hours:</strong> Our team will review your submission and create a draft outline tailored to your expertise and goals.
              </div>
            </div>
            
            <div class="timeline-item">
              <div class="timeline-icon">2</div>
              <div>
                <strong>Outline Review:</strong> We'll send you the draft outline for your approval and any adjustments.
              </div>
            </div>
            
            <div class="timeline-item">
              <div class="timeline-icon">3</div>
              <div>
                <strong>Book Creation:</strong> Once approved, we'll begin writing your 200+ page professional book.
              </div>
            </div>
            
            <div class="timeline-item">
              <div class="timeline-icon">4</div>
              <div>
                <strong>Delivery:</strong> Your 2 professionally-bound books will be delivered within 2 weeks.
              </div>
            </div>
          </div>

          <div class="highlight">
            <h3>📋 Your Submission Summary:</h3>
            <p><strong>Topic:</strong> ${submission.book_topic}</p>
            ${submission.book_style ? `<p><strong>Style:</strong> ${submission.book_style.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>` : ''}
            <p><strong>Submitted:</strong> ${new Date(submission.created_at).toLocaleString()}</p>
          </div>

          <div style="background: white; padding: 20px; border-radius: 4px; margin: 15px 0; text-align: center;">
            <h3>Questions or Need to Make Changes?</h3>
            <p>Feel free to reply to this email or contact us at:</p>
            <p><strong>📧 info@proofbound.com</strong></p>
            <p>We typically respond within a few hours during business days.</p>
          </div>
        </div>

        <div class="footer">
          <p><strong>Proofbound</strong> - Transform Your Expertise Into Professional Books</p>
          <p>Thank you for choosing us to bring your knowledge to life!</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

Deno.serve(async (req) => {
  try {
    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { submission } = await req.json();

    if (!submission) {
      return new Response(JSON.stringify({ error: 'Missing submission data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing email notifications for submission:', submission.id);

    // Send email to admin
    const adminEmailResult = await sendEmail(
      ADMIN_EMAIL,
      `📚 New Book Submission: ${submission.book_topic}`,
      generateAdminEmailHtml(submission)
    );

    // Send confirmation email to customer
    const customerEmailResult = await sendEmail(
      submission.email,
      'Thank You for Your Book Submission - Proofbound',
      generateCustomerEmailHtml(submission)
    );

    const results = {
      adminEmail: adminEmailResult,
      customerEmail: customerEmailResult,
    };

    console.log('Email notification results:', results);

    return new Response(JSON.stringify({ 
      success: true, 
      results,
      message: 'Email notifications processed'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Email notification error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});