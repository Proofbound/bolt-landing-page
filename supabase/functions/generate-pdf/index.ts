/*
  # PDF Generation Edge Function

  1. Purpose
    - Generates PDF files from book content
    - Processes book chapters and creates formatted PDF
    - Handles POST requests with PDF generation parameters

  2. Request Format
    - title: string (book title)
    - author: string (author name)
    - chapters: array of chapter objects with content
    - cover_url: string (optional cover image URL)
    - include_toc: boolean (include table of contents)
    - page_format: string (A4, US Letter, 6x9, 5x8)

  3. Response Format
    - pdf_url: string (URL to generated PDF)
    - total_pages: number
    - word_count: number
    - file_size_mb: number
*/

interface Chapter {
  chapter_number: number;
  chapter_title: string;
  content: string;
}

interface PDFRequest {
  title: string;
  author: string;
  chapters: Chapter[];
  cover_url?: string;
  include_toc?: boolean;
  page_format?: 'A4' | 'US Letter' | '6x9' | '5x8';
}

interface PDFResponse {
  pdf_url: string;
  total_pages: number;
  word_count: number;
  file_size_mb: number;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'An unknown error occurred';
}

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

    const requestData: PDFRequest = await req.json();
    
    // Validate required fields
    if (!requestData.title || !requestData.author || !requestData.chapters || requestData.chapters.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: title, author, and chapters are required" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Generate PDF
    const pdfResponse = await generateBookPDF(requestData);

    return new Response(
      JSON.stringify(pdfResponse),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('PDF Generation error:', error);
    
    const errorMessage = getErrorMessage(error);
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage || "Internal server error" 
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

async function generateBookPDF(request: PDFRequest): Promise<PDFResponse> {
  const { 
    title, 
    author, 
    chapters, 
    cover_url, 
    include_toc = true, 
    page_format = 'A4' 
  } = request;
  
  // Get HAL9 token
  const hal9Token = Deno.env.get('VITE_HAL9_TOKEN');
  if (!hal9Token) {
    throw new Error('VITE_HAL9_TOKEN not configured');
  }

  // Call HAL9 /pdf endpoint
  const hal9Response = await fetch('https://api.hal9.com/books/bookgeneratorapi/proxy/pdf', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${hal9Token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: title,
      author: author,
      chapters: chapters,
      cover_url: cover_url,
      include_toc: include_toc,
      page_format: page_format
    }),
  });

  if (!hal9Response.ok) {
    const errorData = await hal9Response.json().catch(() => ({ error: 'Unknown HAL9 API error' }));
    throw new Error(`HAL9 PDF generation failed: ${errorData.error || hal9Response.statusText}`);
  }

  const hal9Data = await hal9Response.json();
  
  if (!hal9Data.pdf_url) {
    throw new Error('No PDF URL returned from HAL9 API');
  }

  const totalWordCount = chapters.reduce((total, chapter) => {
    return total + chapter.content.split(/\s+/).length;
  }, 0);

  return {
    pdf_url: hal9Data.pdf_url,
    total_pages: hal9Data.total_pages || Math.ceil(totalWordCount / 300),
    word_count: hal9Data.word_count || totalWordCount,
    file_size_mb: hal9Data.file_size_mb || Math.round((totalWordCount / 1000) * 0.1 * 100) / 100
  };
}

function generateHTMLContent(
  title: string,
  author: string,
  chapters: Chapter[],
  coverUrl?: string,
  includeToc: boolean = true,
  pageFormat: string = 'A4'
): string {
  const pageStyles = getPageStyles(pageFormat);
  
  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        ${pageStyles}
        
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
        }
        
        .page {
            page-break-after: always;
            padding: 1in;
            min-height: calc(100vh - 2in);
        }
        
        .cover-page {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            height: 100vh;
            padding: 2in;
        }
        
        .cover-title {
            font-size: 2.5em;
            font-weight: bold;
            margin-bottom: 0.5em;
            color: #2c3e50;
        }
        
        .cover-author {
            font-size: 1.5em;
            color: #7f8c8d;
            margin-top: 2em;
        }
        
        .cover-image {
            max-width: 300px;
            max-height: 400px;
            margin: 2em 0;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .toc {
            page-break-before: always;
        }
        
        .toc h1 {
            text-align: center;
            font-size: 2em;
            margin-bottom: 1em;
            color: #2c3e50;
        }
        
        .toc-entry {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5em;
            padding-bottom: 0.25em;
            border-bottom: 1px dotted #bdc3c7;
        }
        
        .chapter {
            page-break-before: always;
        }
        
        .chapter h1 {
            font-size: 2em;
            color: #2c3e50;
            margin-bottom: 1em;
            padding-bottom: 0.5em;
            border-bottom: 2px solid #3498db;
        }
        
        .chapter h2 {
            font-size: 1.5em;
            color: #34495e;
            margin-top: 1.5em;
            margin-bottom: 0.75em;
        }
        
        .chapter h3 {
            font-size: 1.25em;
            color: #34495e;
            margin-top: 1.25em;
            margin-bottom: 0.5em;
        }
        
        .chapter p {
            margin-bottom: 1em;
            text-align: justify;
        }
        
        .chapter ul, .chapter ol {
            margin-bottom: 1em;
            padding-left: 2em;
        }
        
        .chapter li {
            margin-bottom: 0.5em;
        }
        
        .page-number {
            position: fixed;
            bottom: 0.5in;
            right: 0.5in;
            font-size: 0.9em;
            color: #7f8c8d;
        }
        
        @media print {
            .page-number {
                position: fixed;
                bottom: 0.5in;
                right: 0.5in;
            }
        }
    </style>
</head>
<body>
`;

  // Add cover page
  html += `
    <div class="page cover-page">
        ${coverUrl ? `<img src="${coverUrl}" alt="Book Cover" class="cover-image">` : ''}
        <h1 class="cover-title">${title}</h1>
        <p class="cover-author">by ${author}</p>
    </div>
  `;

  // Add table of contents
  if (includeToc) {
    html += `
    <div class="page toc">
        <h1>Table of Contents</h1>
        ${chapters.map((chapter, index) => `
            <div class="toc-entry">
                <span>Chapter ${chapter.chapter_number}: ${chapter.chapter_title}</span>
                <span>${index * 5 + 3}</span>
            </div>
        `).join('')}
    </div>
    `;
  }

  // Add chapters
  chapters.forEach((chapter, index) => {
    const pageNumber = (includeToc ? 3 : 2) + (index * 5);
    html += `
    <div class="page chapter">
        <h1>Chapter ${chapter.chapter_number}: ${chapter.chapter_title}</h1>
        ${formatChapterContent(chapter.content)}
        <div class="page-number">${pageNumber}</div>
    </div>
    `;
  });

  html += `
</body>
</html>
  `;

  return html;
}

function getPageStyles(pageFormat: string): string {
  const formats = {
    'A4': '@page { size: A4; margin: 1in; }',
    'US Letter': '@page { size: letter; margin: 1in; }',
    '6x9': '@page { size: 6in 9in; margin: 0.75in; }',
    '5x8': '@page { size: 5in 8in; margin: 0.5in; }'
  };
  
  return formats[pageFormat as keyof typeof formats] || formats['A4'];
}

function formatChapterContent(content: string): string {
  // Convert markdown-like content to HTML
  let html = content;
  
  // Convert headers
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
  
  // Convert bold text
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Convert italic text
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Convert bullet points
  html = html.replace(/^- (.*$)/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  
  // Convert numbered lists
  html = html.replace(/^\d+\. (.*$)/gm, '<li>$1</li>');
  
  // Convert paragraphs
  html = html.replace(/\n\n/g, '</p><p>');
  html = '<p>' + html + '</p>';
  
  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p>\s*<h/g, '<h');
  html = html.replace(/<\/h([1-6])>\s*<\/p>/g, '</h$1>');
  
  return html;
}

async function createPlaceholderPDF(htmlContent: string, title: string): Promise<string> {
  // In a real implementation, you would:
  // 1. Use Puppeteer to convert HTML to PDF
  // 2. Upload the PDF to cloud storage (Supabase Storage, AWS S3, etc.)
  // 3. Return the public URL
  
  // For now, we'll create a data URL with the HTML content
  // This is just for demonstration - in production, you'd generate an actual PDF
  
  const encodedHtml = btoa(unescape(encodeURIComponent(htmlContent)));
  const dataUrl = `data:text/html;base64,${encodedHtml}`;
  
  // In production, replace this with actual PDF generation and storage
  console.log(`Generated PDF for "${title}" with ${htmlContent.length} characters`);
  
  return dataUrl;
}

// Example of how you might integrate with Puppeteer (commented out for now)
/*
async function generatePDFWithPuppeteer(htmlContent: string, title: string): Promise<string> {
  // This would require adding Puppeteer to your dependencies
  // and configuring it to work in the Deno environment
  
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setContent(htmlContent);
  
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '1in',
      right: '1in',
      bottom: '1in',
      left: '1in'
    }
  });
  
  await browser.close();
  
  // Upload to Supabase Storage
  const fileName = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
  const { data, error } = await supabase.storage
    .from('generated-books')
    .upload(fileName, pdfBuffer, {
      contentType: 'application/pdf'
    });
  
  if (error) throw error;
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('generated-books')
    .getPublicUrl(fileName);
  
  return publicUrl;
}
*/