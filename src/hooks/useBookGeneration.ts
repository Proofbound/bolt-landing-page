import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface GenerateContentRequest {
  title: string;
  author: string;
  book_idea: string;
  toc: Array<{
    section_name: string;
    section_ideas: string[];
    estimated_pages: string;
  }>;
  chapter_number?: number;
  content_depth?: 'outline' | 'draft' | 'polished';
  generation_mode?: 'sequential' | 'parallel' | 'selective';
}

interface GenerateContentResponse {
  chapter_number: number;
  chapter_title: string;
  content: string;
  word_count: number;
  estimated_pages: number;
}

interface GenerateCoverRequest {
  title: string;
  author: string;
  book_description: string;
  style_prompt?: string;
  color_scheme?: string;
  design_style?: 'modern' | 'classic' | 'minimalist' | 'bold';
}

interface GenerateCoverResponse {
  cover_url: string;
  design_description: string;
  color_palette: string[];
}

interface GeneratePDFRequest {
  title: string;
  author: string;
  chapters: Array<{
    chapter_number: number;
    chapter_title: string;
    content: string;
  }>;
  cover_url?: string;
  include_toc?: boolean;
  page_format?: 'A4' | 'US Letter' | '6x9' | '5x8';
}

interface GeneratePDFResponse {
  pdf_url: string;
  total_pages: number;
  word_count: number;
  file_size_mb: number;
}

export function useBookGeneration() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateContent = async (request: GenerateContentRequest): Promise<GenerateContentResponse | null> => {
    try {
      setLoading(true);
      setError(null);

      // Check for HAL9 token in environment
      const hal9Token = import.meta.env.VITE_HAL9_TOKEN;
      if (!hal9Token) {
        throw new Error('HAL9 token not configured. Please set VITE_HAL9_TOKEN in your environment variables.');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }

      // Ensure we have the Supabase URL
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('VITE_SUPABASE_URL environment variable is not set');
      }

      console.log('Making request to:', `${supabaseUrl}/functions/v1/generate-content`);
      
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Edge function error response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || 'Unknown error' };
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Content generation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate content';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const generateCover = async (request: GenerateCoverRequest): Promise<GenerateCoverResponse | null> => {
    try {
      setLoading(true);
      setError(null);

      // Check for HAL9 token in environment
      const hal9Token = import.meta.env.VITE_HAL9_TOKEN;
      if (!hal9Token) {
        throw new Error('HAL9 token not configured. Please set VITE_HAL9_TOKEN in your environment variables.');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('VITE_SUPABASE_URL environment variable is not set');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-cover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Edge function error response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || 'Unknown error' };
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Cover generation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate cover';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async (request: GeneratePDFRequest): Promise<GeneratePDFResponse | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('VITE_SUPABASE_URL environment variable is not set');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Edge function error response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || 'Unknown error' };
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('PDF generation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate PDF';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    generateContent,
    generateCover,
    generatePDF,
    loading,
    error,
  };
}