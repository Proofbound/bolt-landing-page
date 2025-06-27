/*
  # Cover Generation Edge Function with HAL9 Integration

  1. Purpose
    - Generates book covers using HAL9 AI image generation
    - Processes cover design requests and returns cover URLs
    - Handles POST requests with cover design parameters

  2. Request Format
    - title: string (book title)
    - author: string (author name)
    - book_description: string (book description)
    - style_prompt: string (optional style description)
    - color_scheme: string (color preferences)
    - design_style: string (modern, classic, minimalist, bold)

  3. Response Format
    - cover_url: string (URL to generated cover image)
    - design_description: string (description of the design)
    - color_palette: array of color hex codes
*/

interface CoverRequest {
  title: string;
  author: string;
  book_description: string;
  style_prompt?: string;
  color_scheme?: string;
  design_style?: 'modern' | 'classic' | 'minimalist' | 'bold';
}

interface CoverResponse {
  cover_url: string;
  design_description: string;
  color_palette: string[];
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

    // Check for HAL9 token
    const hal9Token = Deno.env.get('VITE_HAL9_TOKEN');
    if (!hal9Token) {
      return new Response(
        JSON.stringify({ error: "HAL9 token not configured. Please set VITE_HAL9_TOKEN environment variable." }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    const requestData: CoverRequest = await req.json();
    
    // Validate required fields
    if (!requestData.title || !requestData.author || !requestData.book_description) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: title, author, and book_description are required" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Generate cover design
    const coverResponse = await generateBookCoverWithHAL9(requestData, hal9Token);

    return new Response(
      JSON.stringify(coverResponse),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('Cover Generation error:', error);
    
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

async function generateBookCoverWithHAL9(request: CoverRequest, hal9Token: string): Promise<CoverResponse> {
  const { title, author, book_description, style_prompt, color_scheme = 'professional', design_style = 'modern' } = request;
  
  // Create a comprehensive prompt for image generation
  const imagePrompt = createImagePrompt(title, author, book_description, style_prompt, color_scheme, design_style);
  
  try {
    // Call HAL9 /cover endpoint
    const hal9Response = await fetch('https://api.hal9.com/books/bookgeneratorapi/proxy/cover', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hal9Token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: title,
        author: author,
        book_description: book_description,
        style_prompt: style_prompt,
        color_scheme: color_scheme,
        design_style: design_style
      }),
    });

    if (hal9Response.ok) {
      const hal9Data = await hal9Response.json();
      const imageUrl = hal9Data.cover_url || hal9Data.image_url;
      
      if (imageUrl) {
        return {
          cover_url: imageUrl,
          design_description: hal9Data.design_description || `AI-generated ${design_style} book cover for "${title}" by ${author}. The design incorporates ${color_scheme} colors and reflects the book's theme.`,
          color_palette: hal9Data.color_palette || getColorPalette(color_scheme, design_style)
        };
      }
    }
  } catch (error) {
    console.error('HAL9 cover generation failed:', error);
    
    const errorMessage = getErrorMessage(error);
    console.log(`HAL9 cover generation error: ${errorMessage}`);
  }
  
  // Fallback to placeholder generation
  console.log('Falling back to placeholder cover generation');
  const coverResponse: CoverResponse = {
    cover_url: await generatePlaceholderCover(title, author, design_style, color_scheme),
    design_description: `A ${design_style} book cover design featuring "${title}" by ${author}. The design incorporates ${color_scheme} colors and reflects the book's theme of ${book_description.substring(0, 100)}...`,
    color_palette: getColorPalette(color_scheme, design_style)
  };

  return coverResponse;
}

function createImagePrompt(
  title: string, 
  author: string, 
  description: string, 
  stylePrompt?: string, 
  colorScheme?: string, 
  designStyle?: string
): string {
  let prompt = `Professional book cover design for "${title}" by ${author}. `;
  
  // Add book theme
  prompt += `The book is about: ${description.substring(0, 200)}. `;
  
  // Add design style
  switch (designStyle) {
    case 'modern':
      prompt += 'Modern, clean design with contemporary typography and sleek layout. ';
      break;
    case 'classic':
      prompt += 'Classic, elegant design with traditional typography and timeless appeal. ';
      break;
    case 'minimalist':
      prompt += 'Minimalist design with plenty of white space and simple, clean elements. ';
      break;
    case 'bold':
      prompt += 'Bold, eye-catching design with strong visual elements and dynamic composition. ';
      break;
  }
  
  // Add color scheme
  switch (colorScheme) {
    case 'professional':
      prompt += 'Professional color palette with blues, grays, and whites. ';
      break;
    case 'vibrant':
      prompt += 'Vibrant, energetic colors that grab attention. ';
      break;
    case 'monochrome':
      prompt += 'Monochromatic color scheme with varying shades of a single color. ';
      break;
    case 'warm':
      prompt += 'Warm color palette with reds, oranges, and yellows. ';
      break;
    case 'cool':
      prompt += 'Cool color palette with blues, greens, and purples. ';
      break;
  }
  
  // Add custom style prompt if provided
  if (stylePrompt) {
    prompt += `Additional style requirements: ${stylePrompt}. `;
  }
  
  prompt += 'High quality, professional book cover suitable for both print and digital formats. Include title and author name prominently. Book cover aspect ratio 512x768 pixels.';
  
  return prompt;
}

async function generatePlaceholderCover(
  title: string, 
  author: string, 
  designStyle: string, 
  colorScheme: string
): Promise<string> {
  // For demonstration purposes, we'll create a data URL with an SVG placeholder
  // In a real implementation, this would call an AI image generation API
  
  const colors = getColorPalette(colorScheme, designStyle);
  const primaryColor = colors[0];
  const secondaryColor = colors[1];
  const textColor = getContrastColor(primaryColor);
  
  const svg = `
    <svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${primaryColor};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${secondaryColor};stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect width="400" height="600" fill="url(#grad1)"/>
      
      <!-- Decorative elements based on design style -->
      ${getDesignElements(designStyle, colors)}
      
      <!-- Title -->
      <text x="200" y="200" font-family="serif" font-size="28" font-weight="bold" 
            text-anchor="middle" fill="${textColor}" 
            style="text-shadow: 2px 2px 4px rgba(0,0,0,0.3)">
        ${wrapText(title, 20)}
      </text>
      
      <!-- Author -->
      <text x="200" y="500" font-family="sans-serif" font-size="18" 
            text-anchor="middle" fill="${textColor}"
            style="text-shadow: 1px 1px 2px rgba(0,0,0,0.3)">
        by ${author}
      </text>
      
      <!-- Border -->
      <rect x="10" y="10" width="380" height="580" 
            fill="none" stroke="${textColor}" stroke-width="2" opacity="0.5"/>
    </svg>
  `;
  
  // Convert SVG to data URL
  const dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;
  
  return dataUrl;
}

function getDesignElements(designStyle: string, colors: string[]): string {
  switch (designStyle) {
    case 'modern':
      return `
        <rect x="50" y="250" width="300" height="2" fill="${colors[2]}" opacity="0.7"/>
        <circle cx="350" cy="100" r="30" fill="${colors[2]}" opacity="0.3"/>
        <rect x="20" y="350" width="60" height="60" fill="${colors[3]}" opacity="0.4"/>
      `;
    case 'classic':
      return `
        <rect x="30" y="30" width="340" height="540" fill="none" stroke="${colors[2]}" stroke-width="1" opacity="0.6"/>
        <rect x="40" y="40" width="320" height="520" fill="none" stroke="${colors[2]}" stroke-width="1" opacity="0.4"/>
      `;
    case 'minimalist':
      return `
        <line x1="100" y1="250" x2="300" y2="250" stroke="${colors[2]}" stroke-width="1" opacity="0.5"/>
      `;
    case 'bold':
      return `
        <polygon points="0,0 100,0 80,100 0,80" fill="${colors[2]}" opacity="0.6"/>
        <polygon points="400,600 300,600 320,500 400,520" fill="${colors[3]}" opacity="0.6"/>
        <circle cx="350" cy="150" r="40" fill="${colors[4]}" opacity="0.4"/>
      `;
    default:
      return '';
  }
}

function getColorPalette(colorScheme: string, designStyle: string): string[] {
  const palettes = {
    professional: ['#2563eb', '#1e40af', '#3b82f6', '#60a5fa', '#93c5fd'],
    vibrant: ['#dc2626', '#ea580c', '#d97706', '#65a30d', '#059669'],
    monochrome: ['#374151', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db'],
    warm: ['#dc2626', '#ea580c', '#f59e0b', '#eab308', '#84cc16'],
    cool: ['#0891b2', '#0284c7', '#2563eb', '#7c3aed', '#9333ea']
  };
  
  return palettes[colorScheme as keyof typeof palettes] || palettes.professional;
}

function getContrastColor(hexColor: string): string {
  // Simple contrast calculation - in production, use a more sophisticated algorithm
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  return brightness > 128 ? '#000000' : '#ffffff';
}

function wrapText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  for (const word of words) {
    if ((currentLine + word).length <= maxLength) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  
  if (currentLine) lines.push(currentLine);
  
  // For SVG, we'll just return the first line for simplicity
  // In a real implementation, you'd create multiple text elements
  return lines[0] || text.substring(0, maxLength);
}