/*
  # TOC Generation Edge Function - FRESH VERSION 2025-06-26-14:52
  # UNIQUE IDENTIFIER: HAL9-TOC-FRESH-98765

  1. Purpose
    - Generates table of contents for AI book generator
    - Processes book idea and returns structured TOC data
    - Handles POST requests with book parameters

  2. Request Format
    - title: string (book title)
    - author: string (author name)  
    - book_idea: string (book concept description)
    - num_pages: number (target page count)
    - style: string (book style - practical, academic, etc.)
    - chapter_count: number (desired number of chapters)
    - target_length: string (short, medium, long)

  3. Response Format
    - toc: array of sections with names, ideas, and page estimates
    - total_estimated_pages: string (total page estimate)
    - book_summary: string (generated summary)
*/

interface TOCRequest {
  title: string;
  author: string;
  book_idea: string;
  num_pages: number;
  include_spine_title?: boolean;
  style?: string;
  chapter_count?: number;
  target_length?: string;
}

interface TOCSection {
  section_name: string;
  section_ideas: string[];
  estimated_pages: string;
}

interface TOCResponse {
  toc: TOCSection[];
  total_estimated_pages: string;
  book_summary: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    const requestData: TOCRequest = await req.json();
    
    // Validate required fields
    if (!requestData.title || !requestData.author || !requestData.book_idea) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: title, author, and book_idea are required" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Generate TOC based on the request
    const tocResponse = await generateTOC(requestData);

    return new Response(
      JSON.stringify(tocResponse),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('TOC Generation error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Internal server error" 
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});

async function generateTOC(request: TOCRequest): Promise<TOCResponse> {
  const { title, author, book_idea, num_pages, style = 'practical', chapter_count = 5, target_length = 'medium' } = request;
  
  try {
    // Get HAL9 token from environment
    const hal9Token = Deno.env.get('VITE_HAL9_TOKEN');
    console.log('HAL9 Token check:', hal9Token ? `Token found (length: ${hal9Token.length})` : 'Token not found');
    if (!hal9Token) {
      console.log('VITE_HAL9_TOKEN not found, falling back to local generation');
      return generateLocalTOC(request);
    }

    // Call HAL9 /toc endpoint
    const hal9Response = await fetch('https://api.hal9.com/books/bookgeneratorapi/proxy/toc', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hal9Token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        book_idea: book_idea
      }),
    });

    if (!hal9Response.ok) {
      console.error('HAL9 API error:', hal9Response.status, hal9Response.statusText);
      return generateLocalTOC(request);
    }

    const hal9Data = await hal9Response.json();
    
    if (!Array.isArray(hal9Data)) {
      console.error('Invalid HAL9 TOC response format');
      return generateLocalTOC(request);
    }

    // Convert HAL9 response to our expected format
    const tocSections: TOCSection[] = hal9Data.map((section: any, index: number) => {
      // Calculate pages per chapter
      const pagesPerChapter = Math.floor(num_pages / hal9Data.length);
      const remainderPages = num_pages % hal9Data.length;
      const extraPage = index < remainderPages ? 1 : 0;
      const chapterPages = pagesPerChapter + extraPage;
      
      return {
        section_name: section.section_name || `Chapter ${index + 1}`,
        section_ideas: Array.isArray(section.section_ideas) ? section.section_ideas : [],
        estimated_pages: chapterPages > 0 ? `${chapterPages}-${chapterPages + 2}` : "1-2"
      };
    });

    // Generate a book summary based on the TOC
    const bookSummary = `This ${style} book "${title}" by ${author} covers ${tocSections.length} comprehensive chapters exploring ${book_idea.substring(0, 150)}${book_idea.length > 150 ? '...' : ''}`;

    return {
      toc: tocSections,
      total_estimated_pages: num_pages.toString(),
      book_summary: bookSummary
    };

  } catch (error) {
    console.error('Error calling HAL9 TOC API:', error);
    return generateLocalTOC(request);
  }
}

function generateLocalTOC(request: TOCRequest): TOCResponse {
  const { title, author, book_idea, num_pages } = request;
  
  // Simplified fallback - return a basic TOC structure
  const basicTOC: TOCSection[] = [
    {
      section_name: "Introduction",
      section_ideas: ["Overview", "Background", "Objectives"],
      estimated_pages: "10-12"
    },
    {
      section_name: "Main Content",
      section_ideas: ["Core concepts", "Key principles", "Examples"],
      estimated_pages: "40-50"
    },
    {
      section_name: "Conclusion",
      section_ideas: ["Summary", "Key takeaways", "Next steps"],
      estimated_pages: "10-15"
    }
  ];

  const bookSummary = `This book "${title}" by ${author} explores ${book_idea.substring(0, 100)}...`;

  return {
    toc: basicTOC,
    total_estimated_pages: num_pages.toString(),
    book_summary: bookSummary
  };
}