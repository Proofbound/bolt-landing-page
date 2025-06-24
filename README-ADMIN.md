# Proofbound Admin Dashboard

## Quick Setup

1. **Update admin.html with your Supabase credentials:**
   - Open `admin.html`
   - Replace `YOUR_SUPABASE_URL` with your actual Supabase URL
   - Replace `YOUR_SUPABASE_ANON_KEY` with your actual Supabase anon key

2. **Open the admin dashboard:**
   - Open `admin.html` in your web browser
   - You'll see all customer submissions with their details

## Features

- View all customer book submissions
- See submission status (pending, in progress, completed, cancelled)
- Update submission status with one click
- Email customers directly from the dashboard
- Real-time updates when status changes

## Viewing Submissions

The admin dashboard shows:
- Customer name and email
- Submission date
- Book topic and style
- Full book description
- Additional notes
- Current status

## Database Access

You can also view submissions directly in Supabase:

1. Go to your Supabase dashboard
2. Click on "Table Editor" in the left sidebar
3. Select the `form_submissions` table
4. You'll see all submissions with full details

## Security Note

The admin.html file uses the public anon key, which is fine for viewing data with RLS policies. For production, you might want to create a more secure admin interface with proper authentication.