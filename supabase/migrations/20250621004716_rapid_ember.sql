/*
  # Email Notifications Setup

  1. Database Function
    - Creates a function to trigger email notifications when new form submissions are created
    - Uses Supabase Edge Functions to send emails

  2. Trigger
    - Automatically calls the email notification function when a new submission is inserted
*/

-- Create function to trigger email notifications
CREATE OR REPLACE FUNCTION notify_new_submission()
RETURNS trigger AS $$
DECLARE
  submission_data jsonb;
BEGIN
  -- Prepare submission data for the email function
  submission_data := to_jsonb(NEW);
  
  -- Call the edge function asynchronously (fire and forget)
  -- This uses pg_net extension if available, otherwise we'll handle it in the application
  PERFORM net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/send-submission-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
    ),
    body := jsonb_build_object('submission', submission_data)
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the submission
    RAISE WARNING 'Failed to send email notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for email notifications
DROP TRIGGER IF EXISTS trigger_email_notification ON form_submissions;
CREATE TRIGGER trigger_email_notification
  AFTER INSERT ON form_submissions
  FOR EACH ROW EXECUTE FUNCTION notify_new_submission();