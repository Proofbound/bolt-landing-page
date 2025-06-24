import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface FormSubmissionData {
  name: string;
  email: string;
  bookTopic: string;
  bookStyle: string;
  bookDescription: string;
  additionalNotes: string;
}

export function useFormSubmission() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitForm = async (formData: FormSubmissionData) => {
    try {
      setLoading(true);
      setError(null);

      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('You must be logged in to submit the form');
      }

      // Ensure user record exists in our users table
      const { error: upsertUserError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email || formData.email,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (upsertUserError) {
        console.error('Error ensuring user record exists:', upsertUserError);
        // Continue anyway - the trigger should handle this
      }

      // Insert form submission
      const { data, error: insertError } = await supabase
        .from('form_submissions')
        .insert({
          user_id: user.id,
          name: formData.name,
          email: formData.email,
          book_topic: formData.bookTopic,
          book_style: formData.bookStyle,
          book_description: formData.bookDescription,
          additional_notes: formData.additionalNotes,
          status: 'pending'
        })
        .select()
        .single();

      if (insertError) {
        console.error('Form submission insert error:', insertError);
        throw insertError;
      }

      console.log('Form submission successful:', data);

      // Send email notifications manually (as backup to database trigger)
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-submission-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ submission: data }),
          });
          console.log('Email notification sent successfully');
        }
      } catch (emailError) {
        console.warn('Email notification failed (non-critical):', emailError);
        // Don't fail the submission if email fails
      }

      return { data, error: null };
    } catch (err) {
      console.error('Form submission error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit form';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const getUserSubmissions = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching user submissions for user:', userId);

      // Use a simple, direct query with increased timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // Increased to 30 second timeout

      try {
        // Fetch submissions directly - the RLS policy will handle filtering
        const { data, error: fetchError } = await supabase
          .from('form_submissions')
          .select('*')
          .order('created_at', { ascending: false })
          .abortSignal(controller.signal);

        clearTimeout(timeoutId);

        console.log('Query result:', { data, error: fetchError });

        if (fetchError) {
          console.error('Fetch error details:', fetchError);
          throw fetchError;
        }

        console.log(`Found ${data?.length || 0} submissions`);
        return { data: data || [], error: null };
      } catch (abortError) {
        clearTimeout(timeoutId);
        if (abortError.name === 'AbortError') {
          throw new Error('Query timed out - please try again');
        }
        throw abortError;
      }
    } catch (err) {
      console.error('Error fetching submissions:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch submissions';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    submitForm,
    getUserSubmissions,
    loading,
    error,
  };
}