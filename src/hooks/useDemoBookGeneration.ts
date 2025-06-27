import { useState } from 'react';

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

const API_BASE_URL = 'https://api.hal9.com/books/bookgeneratorapi/proxy';

export function useDemoBookGeneration() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateContent = async (request: GenerateContentRequest): Promise<GenerateContentResponse | null> => {
    try {
      setLoading(true);
      setError(null);

      const chapterIndex = (request.chapter_number || 1) - 1;
      const chapterData = request.toc[chapterIndex];
      
      // Try different payload structures based on the API error
      const requestPayload = {
        title: request.title,
        author: request.author,
        book_idea: request.book_idea,
        chapter_number: request.chapter_number || 1,
        chapter_title: chapterData?.section_name || 'Chapter Title',
        section_ideas: chapterData?.section_ideas || [],
        content_depth: request.content_depth || 'draft',
        
        // API expects chapter_outline as an object, not string
        chapter_outline: {
          section_name: chapterData?.section_name || 'Chapter Title',
          section_ideas: chapterData?.section_ideas || [],
          estimated_pages: chapterData?.estimated_pages || '10-15',
          chapter_number: request.chapter_number || 1,
          content_depth: request.content_depth || 'draft'
        },
        
        // Alternative structures to try
        outline: chapterData?.section_ideas || [],
        toc: request.toc,
        
        // Additional fields the API might need
        generation_mode: request.generation_mode || 'draft',
        context: {
          book_title: request.title,
          book_idea: request.book_idea,
          author: request.author,
          total_chapters: request.toc.length
        }
      };

      console.log('🚀 Making chapter generation request to:', `${API_BASE_URL}/mock/generate-chapter`);
      console.log('📦 Chapter request payload:', requestPayload);
      
      const response = await fetch(`${API_BASE_URL}/mock/generate-chapter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      console.log('📡 Chapter response status:', response.status, response.statusText);
      console.log('📡 Chapter response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Chapter API error response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
          console.error('❌ Parsed chapter error:', errorData);
        } catch {
          errorData = { error: errorText };
        }

        const userError = `Chapter API Error (${response.status}): ${errorData.error || errorData.msg || errorData.detail || response.statusText}`;
        throw new Error(userError);
      }

      const data = await response.json();
      console.log('✅ Chapter API Response:', data);
      console.log('✅ Response type:', typeof data);
      console.log('✅ Response keys:', data ? Object.keys(data) : 'null/undefined');
      
      // Validate the response has expected structure
      if (!data) {
        console.error('❌ API returned null/undefined data');
        throw new Error('API returned no data');
      }
      
      // Check if the response has the expected fields for a chapter
      if (typeof data === 'object') {
        // If it's a mock response, it might have different structure
        // Try to normalize the response
        const normalizedResponse = {
          chapter_number: data.chapter_number || request.chapter_number || 1,
          chapter_title: data.chapter_title || data.title || chapterData?.section_name || 'Generated Chapter',
          content: data.content || data.text || data.chapter_content || 'Mock chapter content generated successfully.',
          word_count: data.word_count || data.words || (data.content?.length || 500),
          estimated_pages: data.estimated_pages || data.pages || Math.ceil((data.content?.length || 500) / 250)
        };
        
        console.log('✅ Normalized chapter response:', normalizedResponse);
        return normalizedResponse;
      }
      
      return data;
    } catch (err) {
      console.error('❌ Demo content generation error:', err);
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

      console.log('Making demo cover request to:', `${API_BASE_URL}/mock/cover`);

      const response = await fetch(`${API_BASE_URL}/mock/cover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Mock API error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // For demo, return mock data since /mock/cover returns a PDF file
      return {
        cover_url: 'https://via.placeholder.com/400x600/6366f1/white?text=' + encodeURIComponent(request.title),
        design_description: `Modern ${request.design_style} cover with ${request.color_scheme} color scheme`,
        color_palette: ['#6366f1', '#8b5cf6', '#06b6d4']
      };
    } catch (err) {
      console.error('Demo cover generation error:', err);
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

      console.log('Making demo PDF request to:', `${API_BASE_URL}/mock/pdf`);

      const response = await fetch(`${API_BASE_URL}/mock/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Mock API error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // For demo, return mock data since /mock/pdf returns a PDF file
      const totalWords = request.chapters.reduce((sum, chapter) => sum + (chapter.content?.length || 0) / 5, 0);
      const totalPages = Math.ceil(totalWords / 300);

      return {
        pdf_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        total_pages: totalPages,
        word_count: Math.floor(totalWords),
        file_size_mb: 2.5
      };
    } catch (err) {
      console.error('Demo PDF generation error:', err);
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