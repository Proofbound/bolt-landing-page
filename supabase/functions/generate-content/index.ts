/*
  # Content Generation Edge Function with HAL9 Integration

  1. Purpose
    - Generates chapter content using HAL9 AI service
    - Processes book data and returns structured chapter content
    - Handles POST requests with content generation parameters

  2. Request Format
    - title: string (book title)
    - author: string (author name)
    - book_idea: string (book concept description)
    - toc: array of table of contents sections
    - chapter_number: number (specific chapter to generate)
    - content_depth: string (outline, draft, polished)
    - generation_mode: string (sequential, parallel, selective)

  3. Response Format
    - chapter_number: number
    - chapter_title: string
    - content: string (generated chapter content)
    - word_count: number
    - estimated_pages: number
*/

interface ContentRequest {
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

interface ContentResponse {
  chapter_number: number;
  chapter_title: string;
  content: string;
  word_count: number;
  estimated_pages: number;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey, x-requested-with",
  "Access-Control-Max-Age": "86400",
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
  // Handle CORS preflight request FIRST
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
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
      console.log('HAL9 token not found, falling back to local generation');
    }

    const requestData: ContentRequest = await req.json();
    
    // Validate required fields
    if (!requestData.title || !requestData.author || !requestData.book_idea || !requestData.toc) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: title, author, book_idea, and toc are required" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Default to chapter 1 if not specified
    const chapterNumber = requestData.chapter_number || 1;
    
    if (chapterNumber < 1 || chapterNumber > requestData.toc.length) {
      return new Response(
        JSON.stringify({ error: `Invalid chapter number. Must be between 1 and ${requestData.toc.length}` }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Generate content for the specified chapter
    let contentResponse: ContentResponse;
    
    if (hal9Token) {
      try {
        contentResponse = await generateChapterContentWithHAL9(requestData, chapterNumber, hal9Token);
      } catch (error) {
        console.error('HAL9 generation failed, falling back to local generation:', error);
        contentResponse = generateChapterContentFallback(requestData, chapterNumber);
      }
    } else {
      contentResponse = generateChapterContentFallback(requestData, chapterNumber);
    }

    return new Response(
      JSON.stringify(contentResponse),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('Content Generation error:', error);
    
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

async function generateChapterContentWithHAL9(
  request: ContentRequest, 
  chapterNumber: number, 
  hal9Token: string
): Promise<ContentResponse> {
  const { title, author, book_idea, toc, content_depth = 'draft' } = request;
  
  const chapter = toc[chapterNumber - 1];
  if (!chapter) {
    throw new Error(`Chapter ${chapterNumber} not found in table of contents`);
  }

  try {
    // Call HAL9 /generate-book-chapters endpoint
    const hal9Response = await fetch('https://api.hal9.com/books/bookgeneratorapi/proxy/generate-book-chapters', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hal9Token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        book_idea: book_idea,
        chapters: [chapterNumber], // Generate only the requested chapter
        title: title,
        author: author
      }),
    });

    if (!hal9Response.ok) {
      const errorData = await hal9Response.json().catch(() => ({ error: 'Unknown HAL9 API error' }));
      throw new Error(`HAL9 API error: ${errorData.error || hal9Response.statusText}`);
    }

    const hal9Data = await hal9Response.json();
    
    // The HAL9 API returns generated chapters in the response
    if (!hal9Data.generated_chapters || !Array.isArray(hal9Data.generated_chapters) || hal9Data.generated_chapters.length === 0) {
      throw new Error('No chapters generated by HAL9 API');
    }

    const generatedChapter = hal9Data.generated_chapters[0]; // First (and only) chapter we requested
    const generatedContent = generatedChapter.content || generatedChapter.chapter_content;

    if (!generatedContent) {
      throw new Error('No content in generated chapter from HAL9 API');
    }

    // Calculate word count and estimated pages
    const wordCount = generatedContent.split(/\s+/).length;
    const estimatedPages = Math.ceil(wordCount / 300); // Assuming ~300 words per page

    return {
      chapter_number: chapterNumber,
      chapter_title: generatedChapter.title || chapter.section_name,
      content: generatedContent,
      word_count: wordCount,
      estimated_pages: estimatedPages
    };

  } catch (error) {
    console.error('HAL9 API error:', error);
    throw error;
  }
}

function createHAL9Prompt(
  title: string,
  author: string,
  bookIdea: string,
  chapter: { section_name: string; section_ideas: string[]; estimated_pages: string },
  contentDepth: string,
  chapterNumber: number,
  totalChapters: number
): string {
  const depthInstructions = {
    outline: 'Create a detailed outline with main points, subpoints, and brief explanations.',
    draft: 'Write a complete chapter with full paragraphs, examples, and detailed explanations.',
    polished: 'Write a polished, publication-ready chapter with engaging prose, smooth transitions, and professional formatting.'
  };

  return `
Write ${depthInstructions[contentDepth as keyof typeof depthInstructions]} for Chapter ${chapterNumber} of ${totalChapters} of the book "${title}" by ${author}.

Book Context:
${bookIdea}

Chapter Title: ${chapter.section_name}

Chapter Topics to Cover:
${chapter.section_ideas.map(idea => `- ${idea}`).join('\n')}

Target Length: ${chapter.estimated_pages} pages (approximately ${parseInt(chapter.estimated_pages.split('-')[0]) * 300} words)

Requirements:
1. Start with a compelling introduction that connects to the overall book theme
2. Cover all the specified topics in a logical order
3. Include practical examples and actionable insights where appropriate
4. Use clear headings and subheadings for organization
5. End with a conclusion that summarizes key points and transitions to the next chapter
6. Write in a professional yet engaging tone appropriate for the target audience
7. Ensure the content is original, informative, and valuable to readers

Please generate the complete chapter content now:
`;
}

function generateChapterContentFallback(request: ContentRequest, chapterNumber: number): ContentResponse {
  const { title, author, book_idea, toc, content_depth = 'draft' } = request;
  
  const chapter = toc[chapterNumber - 1];
  if (!chapter) {
    throw new Error(`Chapter ${chapterNumber} not found in table of contents`);
  }

  // Generate content based on depth
  const content = generateContentByDepth(chapter, content_depth, book_idea, title);
  
  // Calculate word count and estimated pages
  const wordCount = content.split(/\s+/).length;
  const estimatedPages = Math.ceil(wordCount / 300); // Assuming ~300 words per page

  return {
    chapter_number: chapterNumber,
    chapter_title: chapter.section_name,
    content,
    word_count: wordCount,
    estimated_pages: estimatedPages
  };
}

function generateContentByDepth(
  chapter: { section_name: string; section_ideas: string[]; estimated_pages: string },
  depth: 'outline' | 'draft' | 'polished',
  bookIdea: string,
  title: string
): string {
  const { section_name, section_ideas } = chapter;
  
  switch (depth) {
    case 'outline':
      return generateOutline(section_name, section_ideas);
    case 'draft':
      return generateDraft(section_name, section_ideas, bookIdea, title);
    case 'polished':
      return generatePolishedContent(section_name, section_ideas, bookIdea, title);
    default:
      return generateDraft(section_name, section_ideas, bookIdea, title);
  }
}

function generateOutline(chapterTitle: string, ideas: string[]): string {
  return `# ${chapterTitle}

## Chapter Outline

${ideas.map((idea, index) => `${index + 1}. **${idea}**
   - Key points to cover
   - Supporting examples
   - Practical applications`).join('\n\n')}

## Key Takeaways
- Main concept summary
- Actionable insights
- Connection to next chapter

## Discussion Questions
- How does this relate to your experience?
- What are the practical implications?
- What questions remain to be explored?
`;
}

function generateDraft(chapterTitle: string, ideas: string[], bookIdea: string, title: string): string {
  const introduction = generateIntroduction(chapterTitle, bookIdea);
  const mainContent = ideas.map((idea, index) => generateSectionContent(idea, index + 1)).join('\n\n');
  const conclusion = generateConclusion(chapterTitle, ideas);

  return `# ${chapterTitle}

${introduction}

${mainContent}

${conclusion}

---

*This chapter provides foundational knowledge that will be built upon in subsequent sections of "${title}". The concepts presented here are essential for understanding the broader framework we'll explore throughout this book.*
`;
}

function generatePolishedContent(chapterTitle: string, ideas: string[], bookIdea: string, title: string): string {
  const draft = generateDraft(chapterTitle, ideas, bookIdea, title);
  
  // Add more sophisticated elements for polished content
  const enhancedContent = draft + `

## Chapter Summary

This chapter has explored the fundamental aspects of ${chapterTitle.toLowerCase()}, providing you with:

${ideas.map(idea => `- **${idea}**: Comprehensive understanding and practical applications`).join('\n')}

## Practical Exercises

1. **Reflection Exercise**: Consider how the concepts in this chapter apply to your current situation.

2. **Implementation Challenge**: Choose one key concept and create an action plan for implementation.

3. **Knowledge Check**: Review the main points and identify areas for further exploration.

## Further Reading

- Additional resources for deeper understanding
- Related research and case studies
- Expert perspectives and alternative viewpoints

## Next Steps

In the following chapter, we'll build upon these foundations to explore [preview of next chapter content]. The journey continues as we delve deeper into the practical applications of these concepts.
`;

  return enhancedContent;
}

function generateIntroduction(chapterTitle: string, bookIdea: string): string {
  return `Welcome to this exploration of ${chapterTitle.toLowerCase()}. In this chapter, we'll dive deep into the core concepts that form the foundation of our understanding.

Building on the themes established in "${bookIdea.substring(0, 100)}...", this chapter serves as a crucial stepping stone in your learning journey. We'll examine not just the theoretical framework, but also the practical applications that make these concepts valuable in real-world scenarios.

By the end of this chapter, you'll have gained:
- A comprehensive understanding of the key principles
- Practical tools for implementation
- Insights into common challenges and solutions
- A foundation for the advanced topics we'll explore later

Let's begin this important phase of our exploration.`;
}

function generateSectionContent(idea: string, sectionNumber: number): string {
  return `## ${sectionNumber}. ${idea}

This section focuses on ${idea.toLowerCase()}, which represents a fundamental aspect of our overall framework. Understanding this concept is essential for building a comprehensive knowledge base.

### Core Principles

The foundation of ${idea.toLowerCase()} rests on several key principles that guide both theoretical understanding and practical application. These principles have been developed through extensive research and real-world testing.

### Practical Applications

In practice, ${idea.toLowerCase()} manifests in various ways depending on the context and specific requirements. Here are some common scenarios where these concepts prove particularly valuable:

- **Scenario 1**: Direct application in standard situations
- **Scenario 2**: Adaptation for complex environments
- **Scenario 3**: Integration with existing systems and processes

### Common Challenges

While implementing ${idea.toLowerCase()}, practitioners often encounter several recurring challenges. Understanding these potential obstacles helps in developing effective strategies for success:

1. **Challenge 1**: Resource allocation and prioritization
2. **Challenge 2**: Stakeholder alignment and communication
3. **Challenge 3**: Measurement and evaluation of outcomes

### Best Practices

Based on extensive experience and research, several best practices have emerged for effectively working with ${idea.toLowerCase()}:

- Start with clear objectives and success criteria
- Maintain regular communication with all stakeholders
- Document processes and decisions for future reference
- Continuously evaluate and adjust approaches based on results

### Case Study Example

Consider a real-world example where ${idea.toLowerCase()} played a crucial role in achieving success. This case demonstrates the practical value of the concepts we've discussed and provides concrete evidence of their effectiveness.

The implementation process involved careful planning, stakeholder engagement, and iterative refinement. The results exceeded expectations and provided valuable insights for future applications.`;
}

function generateConclusion(chapterTitle: string, ideas: string[]): string {
  return `## Chapter Conclusion

As we conclude our exploration of ${chapterTitle.toLowerCase()}, it's important to reflect on the key insights we've gained and how they contribute to our overall understanding.

### Key Insights

Throughout this chapter, we've examined ${ideas.length} major areas:

${ideas.map((idea, index) => `${index + 1}. **${idea}**: We explored the fundamental principles and practical applications`).join('\n')}

### Integration and Synthesis

These concepts don't exist in isolation—they work together to create a comprehensive framework for understanding and action. The interconnections between these ideas form the foundation for the more advanced topics we'll explore in subsequent chapters.

### Moving Forward

The knowledge gained in this chapter prepares us for the next phase of our journey. In the following chapter, we'll build upon these foundations to explore more complex applications and advanced strategies.

Take time to reflect on the concepts presented here and consider how they might apply to your specific situation. The practical exercises at the end of this chapter will help reinforce your understanding and prepare you for what's ahead.`;
}