import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Wand2, Download, Eye, Sparkles, Clock, CheckCircle, AlertCircle, RefreshCw, FileText, Edit, Upload, Save, Bold, Italic, List, ListOrdered, Hash, Lightbulb, Megaphone, Plus, ArrowUp, ArrowDown, Trash2, RotateCcw, Package, Loader2 } from 'lucide-react';
import ProofboundLogo from './Logo';
import { useBookGeneration } from '../hooks/useBookGeneration';

interface BookRequest {
  title: string;
  author: string;
  book_idea: string;
  num_pages: number;
  include_spine_title: boolean;
  additional_context?: File[];
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

interface GenerationStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress?: number;
}

interface GeneratedChapter {
  chapter_number: number;
  chapter_title: string;
  content: string;
  word_count: number;
  estimated_pages: number;
}

interface GeneratedContent {
  toc: TOCSection[];
  chapters: { [key: number]: GeneratedChapter };
  markdown?: string;
  pdfUrl?: string;
  coverUrl?: string;
  stats: {
    totalPages: number;
    wordCount: number;
    readingTime: string;
  };
}

const AIBookGenerator = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [bookRequest, setBookRequest] = useState<BookRequest>({
    title: '',
    author: '',
    book_idea: '',
    num_pages: 100,
    include_spine_title: true
  });
  
  const [tocSettings, setTocSettings] = useState({
    chapterCount: 5,
    bookStyle: 'practical',
    bookLength: 'medium'
  });

  const [contentSettings, setContentSettings] = useState({
    generationMode: 'parallel' as 'sequential' | 'parallel' | 'selective',
    contentDepth: 'draft' as 'outline' | 'draft' | 'polished'
  });

  const [coverSettings, setCoverSettings] = useState({
    stylePrompt: '',
    colorScheme: 'professional',
    designStyle: 'modern' as 'modern' | 'classic' | 'minimalist' | 'bold'
  });

  const [activeChapter, setActiveChapter] = useState(1);
  
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([
    {
      id: 'toc',
      title: 'Creating Table of Contents',
      description: 'Analyzing your book idea and creating a detailed outline',
      status: 'pending'
    }
  ]);

  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [tocData, setTocData] = useState<TOCResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingChapters, setGeneratingChapters] = useState<Set<number>>(new Set());

  const { generateContent, generateCover, generatePDF, loading: apiLoading, error: apiError } = useBookGeneration();

  const totalSteps = 5;
  const stepTitles = ['Idea', 'Structure', 'Content', 'Export', 'Cover'];

  const handleInputChange = (field: keyof BookRequest, value: string | number | boolean) => {
    setBookRequest(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const generateTOC = async () => {
    if (!bookRequest.title || !bookRequest.author || !bookRequest.book_idea) {
      setError('Please fill in all required fields');
      return;
    }

    setIsGenerating(true);
    setError(null);
    
    setGenerationSteps(prev => prev.map(step => 
      step.id === 'toc' ? { ...step, status: 'processing' } : step
    ));

    try {
      console.log('Generating TOC with request:', bookRequest);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const apiUrl = `${supabaseUrl}/functions/v1/generate-toc`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          title: bookRequest.title,
          author: bookRequest.author,
          book_idea: bookRequest.book_idea,
          num_pages: bookRequest.num_pages,
          include_spine_title: bookRequest.include_spine_title,
          style: tocSettings.bookStyle,
          chapter_count: tocSettings.chapterCount,
          target_length: tocSettings.bookLength
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data: TOCResponse = await response.json();
      console.log('TOC API Response:', data);

      setTocData(data);
      
      setGenerationSteps(prev => prev.map(step => 
        step.id === 'toc' ? { ...step, status: 'completed' } : step
      ));

      setGeneratedContent({
        toc: data.toc,
        chapters: {},
        stats: {
          totalPages: parseInt(data.total_estimated_pages) || 100,
          wordCount: (parseInt(data.total_estimated_pages) || 100) * 300,
          readingTime: `${Math.ceil((parseInt(data.total_estimated_pages) || 100) / 2)} minutes`
        }
      });

      nextStep();
    } catch (err) {
      console.error('TOC Generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate table of contents');
      
      setGenerationSteps(prev => prev.map(step => 
        step.id === 'toc' ? { ...step, status: 'error' } : step
      ));
    } finally {
      setIsGenerating(false);
    }
  };

  const generateChapterContent = async (chapterNumber: number) => {
    if (!tocData || !generatedContent) return;

    setGeneratingChapters(prev => new Set(prev).add(chapterNumber));

    try {
      const chapterData = tocData.toc[chapterNumber - 1];
      if (!chapterData) {
        throw new Error('Chapter data not found');
      }

      const result = await generateContent({
        title: bookRequest.title,
        author: bookRequest.author,
        book_idea: bookRequest.book_idea,
        toc: tocData.toc,
        chapter_number: chapterNumber,
        content_depth: contentSettings.contentDepth,
        generation_mode: contentSettings.generationMode
      });

      if (result) {
        setGeneratedContent(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            chapters: {
              ...prev.chapters,
              [chapterNumber]: result
            }
          };
        });
      }
    } catch (err) {
      console.error('Chapter generation error:', err);
      setError(`Failed to generate chapter ${chapterNumber}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setGeneratingChapters(prev => {
        const newSet = new Set(prev);
        newSet.delete(chapterNumber);
        return newSet;
      });
    }
  };

  const generateAllContent = async () => {
    if (!tocData) return;

    const chapterPromises = tocData.toc.map((_, index) => 
      generateChapterContent(index + 1)
    );

    await Promise.all(chapterPromises);
  };

  const generateBookCover = async () => {
    if (!bookRequest.title || !bookRequest.author) return;

    try {
      const result = await generateCover({
        title: bookRequest.title,
        author: bookRequest.author,
        book_description: bookRequest.book_idea,
        style_prompt: coverSettings.stylePrompt,
        color_scheme: coverSettings.colorScheme,
        design_style: coverSettings.designStyle
      });

      if (result) {
        setGeneratedContent(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            coverUrl: result.cover_url
          };
        });
      }
    } catch (err) {
      console.error('Cover generation error:', err);
      setError(`Failed to generate cover: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const generateBookPDF = async () => {
    if (!generatedContent || !tocData) return;

    try {
      const chapters = Object.values(generatedContent.chapters).map(chapter => ({
        chapter_number: chapter.chapter_number,
        chapter_title: chapter.chapter_title,
        content: chapter.content
      }));

      if (chapters.length === 0) {
        throw new Error('No chapters generated yet. Please generate content first.');
      }

      const result = await generatePDF({
        title: bookRequest.title,
        author: bookRequest.author,
        chapters,
        cover_url: generatedContent.coverUrl,
        include_toc: true,
        page_format: 'A4'
      });

      if (result) {
        setGeneratedContent(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            pdfUrl: result.pdf_url,
            stats: {
              ...prev.stats,
              totalPages: result.total_pages,
              wordCount: result.word_count
            }
          };
        });
      }
    } catch (err) {
      console.error('PDF generation error:', err);
      setError(`Failed to generate PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const regenerateTOC = async () => {
    await generateTOC();
  };

  const calculateTotalPages = () => {
    if (!tocData?.toc) return { min: 0, max: 0 };
    
    let minTotal = 0;
    let maxTotal = 0;
    
    tocData.toc.forEach(section => {
      const pages = section.estimated_pages;
      const match = pages.match(/(\d+)-(\d+)/);
      if (match) {
        minTotal += parseInt(match[1]);
        maxTotal += parseInt(match[2]);
      } else {
        const singlePage = parseInt(pages);
        if (!isNaN(singlePage)) {
          minTotal += singlePage;
          maxTotal += singlePage;
        }
      }
    });
    
    return { min: minTotal, max: maxTotal };
  };

  const calculateWordCount = () => {
    const { min, max } = calculateTotalPages();
    return {
      min: min * 250,
      max: max * 350
    };
  };

  const renderProgressBar = () => (
    <div className="bg-gray-50 px-8 py-6 border-b border-gray-200">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2 z-10"></div>
          <div 
            className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-purple-600 to-blue-600 -translate-y-1/2 z-20 transition-all duration-300"
            style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          ></div>
          
          {Array.from({ length: totalSteps }, (_, i) => {
            const stepNum = i + 1;
            const isActive = stepNum === currentStep;
            const isCompleted = stepNum < currentStep;
            
            return (
              <div key={stepNum} className="relative z-30">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white' 
                    : isActive 
                    ? 'bg-white border-2 border-purple-600 text-purple-600 transform scale-110' 
                    : 'bg-white border-2 border-gray-300 text-gray-400'
                }`}>
                  {isCompleted ? <CheckCircle className="w-6 h-6" /> : stepNum}
                </div>
                <div className={`mt-3 text-sm font-medium text-center ${
                  isActive ? 'text-purple-600' : 'text-gray-500'
                }`}>
                  {stepTitles[i]}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
            <Wand2 className="w-10 h-10 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Tell us about your book idea</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto font-sans">
          Provide the basic information about your book concept and we'll help you create a comprehensive outline.
        </p>
      </div>

      <div className="glass-card p-8">
        {(error || apiError) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
            <span className="text-red-700 font-sans">{error || apiError}</span>
          </div>
        )}

        {isGenerating && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent mr-3"></div>
              <span className="text-blue-700 font-sans">Generating your book structure...</span>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 font-sans">
              Book Title *
            </label>
            <input
              type="text"
              value={bookRequest.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none"
              placeholder="An Academic History of Neillsville Wisconsin"
              disabled={isGenerating}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 font-sans">
              Author Name *
            </label>
            <input
              type="text"
              value={bookRequest.author}
              onChange={(e) => handleInputChange('author', e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none"
              placeholder="Richard Sprague"
              disabled={isGenerating}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 font-sans">
              Describe your book idea *
            </label>
            <textarea
              value={bookRequest.book_idea}
              onChange={(e) => handleInputChange('book_idea', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none"
              placeholder="You're an academic historian from the University of Wisconsin, Madison. Write a history of Neillsville Wisconsin."
              disabled={isGenerating}
            />
            <p className="mt-2 text-sm text-gray-500 font-sans">
              What is your book about? What key topics should it cover? Who is your target audience?
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 font-sans">
              Target Length
            </label>
            <select
              value={bookRequest.num_pages}
              onChange={(e) => handleInputChange('num_pages', parseInt(e.target.value))}
              className="w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none"
              disabled={isGenerating}
            >
              <option value={50}>Short (50 pages)</option>
              <option value={100}>Medium (100 pages)</option>
              <option value={200}>Long (200 pages)</option>
              <option value={300}>Extended (300+ pages)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 font-sans">
              Additional Context (Optional)
            </label>
            <div className="glass-card p-6 border border-gray-200">
              <div className="text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-3 font-sans">📄 Upload PDFs, text files, emails, documents</p>
                <button 
                  className="button-secondary"
                  onClick={() => alert('File upload functionality coming soon...')}
                  disabled={isGenerating}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Files
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => {
    const totalPages = calculateTotalPages();
    const wordCount = calculateWordCount();

    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Review and customize your book structure</h1>
          <p className="text-xl text-gray-600 font-sans">
            Fine-tune your table of contents and chapter organization
          </p>
          {tocData?.book_summary && (
            <div className="mt-6 glass-card p-4 bg-blue-50 border border-blue-200 max-w-3xl mx-auto">
              <p className="text-blue-800 font-sans">{tocData.book_summary}</p>
            </div>
          )}
        </div>

        <div className="glass-card p-6 mb-8 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-sans">
                Number of Chapters:
              </label>
              <select 
                value={tocSettings.chapterCount}
                onChange={(e) => setTocSettings(prev => ({ ...prev, chapterCount: parseInt(e.target.value) }))}
                className="w-full px-4 py-2 rounded-lg border-2 transition-colors focus:outline-none"
              >
                <option value={3}>3 Chapters</option>
                <option value={5}>5 Chapters</option>
                <option value={7}>7 Chapters</option>
                <option value={10}>10 Chapters</option>
                <option value={12}>12 Chapters</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-sans">
                Book Style:
              </label>
              <select 
                value={tocSettings.bookStyle}
                onChange={(e) => setTocSettings(prev => ({ ...prev, bookStyle: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border-2 transition-colors focus:outline-none"
              >
                <option value="practical">Practical Guide</option>
                <option value="academic">Academic</option>
                <option value="narrative">Narrative</option>
                <option value="reference">Reference Manual</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-sans">
                Target Length:
              </label>
              <select 
                value={tocSettings.bookLength}
                onChange={(e) => setTocSettings(prev => ({ ...prev, bookLength: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border-2 transition-colors focus:outline-none"
              >
                <option value="short">Short (50-100 pages)</option>
                <option value="medium">Medium (100-200 pages)</option>
                <option value="long">Long (200+ pages)</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button 
              className="button-secondary flex items-center space-x-2"
              onClick={regenerateTOC}
              disabled={isGenerating}
            >
              <RotateCcw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Regenerating...' : 'Regenerate All'}</span>
            </button>
            <button 
              className="button-secondary flex items-center space-x-2"
              onClick={() => alert('Adding new chapter...')}
            >
              <Plus className="w-4 h-4" />
              <span>Add Chapter</span>
            </button>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          {tocData?.toc ? (
            tocData.toc.map((section, index) => (
              <div key={index} className="glass-card p-6 border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    Chapter {index + 1}: {section.section_name}
                  </h3>
                  <div className="flex space-x-2">
                    <button 
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                      onClick={() => alert('Regenerating chapter...')}
                      title="Regenerate this chapter"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button 
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                      onClick={() => alert('Moving chapter up...')}
                      title="Move up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button 
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                      onClick={() => alert('Moving chapter down...')}
                      title="Move down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button 
                      className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded transition-colors"
                      onClick={() => alert('Removing chapter...')}
                      title="Remove chapter"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-gray-700 font-sans">
                    {section.section_ideas.join(' • ')}
                  </p>
                </div>
                <div className="text-sm text-gray-500 font-sans">
                  Estimated length: {section.estimated_pages} pages
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600 font-sans">Loading table of contents...</p>
            </div>
          )}
        </div>

        {tocData?.toc && (
          <div className="glass-card p-6 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200">
            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-gray-900">{tocData.toc.length}</div>
                <div className="text-sm text-gray-600 font-medium uppercase tracking-wide">Chapters</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  {totalPages.min === totalPages.max ? totalPages.min : `${totalPages.min}-${totalPages.max}`}
                </div>
                <div className="text-sm text-gray-600 font-medium uppercase tracking-wide">Pages</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  {wordCount.min === wordCount.max 
                    ? wordCount.min.toLocaleString() 
                    : `${wordCount.min.toLocaleString()}-${wordCount.max.toLocaleString()}`}
                </div>
                <div className="text-sm text-gray-600 font-medium uppercase tracking-wide">Words</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Generate and edit your book content</h1>
        <p className="text-xl text-gray-600 font-sans">
          Create full chapter content and refine with AI assistance
        </p>
      </div>

      <div className="glass-card p-6 mb-8 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 font-sans">
              Generation Mode:
            </label>
            <select 
              value={contentSettings.generationMode}
              onChange={(e) => setContentSettings(prev => ({ ...prev, generationMode: e.target.value as any }))}
              className="w-full px-4 py-2 rounded-lg border-2 transition-colors focus:outline-none"
            >
              <option value="sequential">Sequential (Chapter by Chapter)</option>
              <option value="parallel">Parallel (All Chapters)</option>
              <option value="selective">Selective (Choose Chapters)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 font-sans">
              Content Depth:
            </label>
            <select 
              value={contentSettings.contentDepth}
              onChange={(e) => setContentSettings(prev => ({ ...prev, contentDepth: e.target.value as any }))}
              className="w-full px-4 py-2 rounded-lg border-2 transition-colors focus:outline-none"
            >
              <option value="outline">Detailed Outline</option>
              <option value="draft">Full Draft</option>
              <option value="polished">Polished Content</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            className="cta-button flex items-center space-x-2"
            onClick={generateAllContent}
            disabled={apiLoading || !tocData}
          >
            {apiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{apiLoading ? 'Generating...' : 'Generate All Content'}</span>
          </button>
          <button 
            className="button-secondary flex items-center space-x-2"
            onClick={() => alert('Switching to preview mode...')}
          >
            <Eye className="w-4 h-4" />
            <span>Preview Mode</span>
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex space-x-2 border-b border-gray-200 overflow-x-auto">
          {tocData?.toc ? (
            tocData.toc.map((section, index) => {
              const chapterNum = index + 1;
              const isActive = chapterNum === activeChapter;
              const isGenerated = generatedContent?.chapters[chapterNum];
              const isGenerating = generatingChapters.has(chapterNum);
              
              return (
                <button
                  key={chapterNum}
                  onClick={() => setActiveChapter(chapterNum)}
                  className={`flex items-center space-x-2 px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${
                    isActive 
                      ? 'border-purple-600 text-purple-600 bg-purple-50' 
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span className="text-sm">
                    {isGenerating ? '⏳' : isGenerated ? '✅' : '📝'}
                  </span>
                  <span className="font-medium">Chapter {chapterNum}</span>
                  {isGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
                </button>
              );
            })
          ) : (
            <div className="text-center py-4 text-gray-500">
              Generate table of contents first
            </div>
          )}
        </div>
      </div>

      {tocData?.toc && (
        <div className="glass-card border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 p-6 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Chapter {activeChapter}: {tocData.toc[activeChapter - 1]?.section_name}
                </h3>
                <p className="text-gray-600 font-sans">
                  {tocData.toc[activeChapter - 1]?.section_ideas.join(' • ')}
                </p>
              </div>
              <div className="flex space-x-3">
                <button 
                  className="button-secondary flex items-center space-x-2"
                  onClick={() => generateChapterContent(activeChapter)}
                  disabled={generatingChapters.has(activeChapter)}
                >
                  {generatingChapters.has(activeChapter) ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>
                    {generatingChapters.has(activeChapter) ? 'Generating...' : 'Generate Chapter'}
                  </span>
                </button>
                <button 
                  className="button-secondary flex items-center space-x-2"
                  onClick={() => alert('Expanding section...')}
                >
                  <Plus className="w-4 h-4" />
                  <span>Expand Section</span>
                </button>
                <button 
                  className="button-secondary flex items-center space-x-2"
                  onClick={() => alert('Saving changes...')}
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <button 
                className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                onClick={() => alert('Applying bold formatting...')}
                title="Bold"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button 
                className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                onClick={() => alert('Applying italic formatting...')}
                title="Italic"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button 
                className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                onClick={() => alert('Adding heading...')}
                title="Heading"
              >
                <Hash className="w-4 h-4" />
              </button>
              <button 
                className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                onClick={() => alert('Adding bullet list...')}
                title="Bullet List"
              >
                <List className="w-4 h-4" />
              </button>
              <button 
                className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                onClick={() => alert('Adding numbered list...')}
                title="Numbered List"
              >
                <ListOrdered className="w-4 h-4" />
              </button>
              <div className="w-px h-6 bg-gray-300 mx-2"></div>
              <button 
                className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                onClick={() => alert('Adding new section...')}
                title="Add Section"
              >
                <FileText className="w-4 h-4" />
              </button>
              <button 
                className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                onClick={() => alert('Adding example...')}
                title="Add Example"
              >
                <Lightbulb className="w-4 h-4" />
              </button>
              <button 
                className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                onClick={() => alert('Adding callout...')}
                title="Add Callout"
              >
                <Megaphone className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="relative">
            <textarea
              className="w-full h-96 p-6 border-none resize-none focus:outline-none font-serif text-base leading-relaxed"
              value={generatedContent?.chapters[activeChapter]?.content || 'Chapter content will appear here after generation...'}
              onChange={() => {}}
              placeholder="Chapter content will appear here..."
              readOnly={!generatedContent?.chapters[activeChapter]}
            />
            
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
              <div className="flex space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <span className="font-semibold text-gray-900">
                    {generatedContent?.chapters[activeChapter]?.word_count || 0}
                  </span>
                  <span>words</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="font-semibold text-gray-900">
                    {generatedContent?.chapters[activeChapter]?.estimated_pages || 0}
                  </span>
                  <span>pages</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="font-semibold text-gray-900">
                    {Math.ceil((generatedContent?.chapters[activeChapter]?.word_count || 0) / 200)}
                  </span>
                  <span>min read</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 glass-card p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
        <h4 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
          <Sparkles className="w-5 h-5 mr-2" />
          AI Writing Assistant
        </h4>
        <div className="flex flex-wrap gap-3 mb-4">
          <button 
            className="px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
            onClick={() => alert('Expanding this section with AI...')}
          >
            🔍 Expand This Section
          </button>
          <button 
            className="px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
            onClick={() => alert('Improving writing style...')}
          >
            ✨ Improve Writing
          </button>
          <button 
            className="px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
            onClick={() => alert('Adding relevant examples...')}
          >
            💡 Add Examples
          </button>
          <button 
            className="px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
            onClick={() => alert('Improving transitions...')}
          >
            🔗 Improve Transitions
          </button>
        </div>
        <div className="flex space-x-3">
          <textarea
            className="flex-1 p-3 border border-blue-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Describe specific changes you'd like to make to this section..."
          />
          <button 
            className="button-secondary"
            onClick={() => alert('Applying custom changes...')}
          >
            Apply Custom Changes
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-blue-600 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Export your book</h1>
        <p className="text-xl text-gray-600 font-sans">
          Your book content is ready! Generate your final PDF and download formats.
        </p>
      </div>

      <div className="glass-card p-8">
        {(error || apiError) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
            <span className="text-red-700 font-sans">{error || apiError}</span>
          </div>
        )}

        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-4 font-sans">
            Generate Final PDF
          </label>
          <div className="flex flex-wrap gap-4 mb-6">
            <button 
              className="cta-button flex items-center space-x-2"
              onClick={generateBookPDF}
              disabled={apiLoading || !generatedContent || Object.keys(generatedContent.chapters).length === 0}
            >
              {apiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
              <span>{apiLoading ? 'Generating PDF...' : 'Generate Complete PDF'}</span>
            </button>
            {generatedContent?.pdfUrl && (
              <a 
                href={generatedContent.pdfUrl}
                download
                className="button-secondary flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </a>
            )}
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-4 font-sans">
            Other Export Formats
          </label>
          <div className="flex flex-wrap gap-4">
            <button 
              className="button-secondary flex items-center space-x-2"
              onClick={() => alert('Downloading Markdown...')}
            >
              <FileText className="w-4 h-4" />
              <span>Download Markdown</span>
            </button>
            <button 
              className="button-secondary flex items-center space-x-2"
              onClick={() => alert('Downloading HTML...')}
            >
              <Download className="w-4 h-4" />
              <span>Download HTML</span>
            </button>
            <button 
              className="button-secondary flex items-center space-x-2"
              onClick={() => alert('Downloading EPUB...')}
            >
              <BookOpen className="w-4 h-4" />
              <span>Download EPUB</span>
            </button>
          </div>
        </div>

        <div className="glass-card p-6 bg-gray-50 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Book Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {generatedContent?.stats.totalPages || 0}
              </div>
              <div className="text-sm text-gray-600 font-sans">Total Pages</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {generatedContent?.stats.wordCount.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-gray-600 font-sans">Word Count</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {tocData?.toc.length || 0}
              </div>
              <div className="text-sm text-gray-600 font-sans">Chapters</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {Object.keys(generatedContent?.chapters || {}).length}
              </div>
              <div className="text-sm text-gray-600 font-sans">Generated</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Create your book cover</h1>
        <p className="text-xl text-gray-600 font-sans">
          Design a professional cover for your book with AI assistance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="text-center">
          <div className="w-64 h-80 mx-auto bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg overflow-hidden">
            {generatedContent?.coverUrl ? (
              <img 
                src={generatedContent.coverUrl} 
                alt="Generated book cover"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-6">
                <div className="text-xl font-bold mb-4">{bookRequest.title || 'Your Book Title'}</div>
                <div className="text-sm opacity-90">by {bookRequest.author || 'Author Name'}</div>
              </div>
            )}
          </div>
          <p className="mt-4 text-sm text-gray-500 font-sans">Cover Preview</p>
        </div>

        <div className="glass-card p-6">
          {(error || apiError) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
              <span className="text-red-700 font-sans">{error || apiError}</span>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-sans">
                Describe your ideal cover
              </label>
              <textarea
                value={coverSettings.stylePrompt}
                onChange={(e) => setCoverSettings(prev => ({ ...prev, stylePrompt: e.target.value }))}
                rows={4}
                className="w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none"
                placeholder="Describe the style, colors, and imagery you want for your book cover"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-sans">
                Design Style:
              </label>
              <select 
                value={coverSettings.designStyle}
                onChange={(e) => setCoverSettings(prev => ({ ...prev, designStyle: e.target.value as any }))}
                className="w-full px-4 py-2 rounded-lg border-2 transition-colors focus:outline-none"
              >
                <option value="modern">Modern</option>
                <option value="classic">Classic</option>
                <option value="minimalist">Minimalist</option>
                <option value="bold">Bold</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-sans">
                Color Scheme:
              </label>
              <select 
                value={coverSettings.colorScheme}
                onChange={(e) => setCoverSettings(prev => ({ ...prev, colorScheme: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border-2 transition-colors focus:outline-none"
              >
                <option value="professional">Professional</option>
                <option value="vibrant">Vibrant</option>
                <option value="monochrome">Monochrome</option>
                <option value="warm">Warm Tones</option>
                <option value="cool">Cool Tones</option>
              </select>
            </div>

            <div className="space-y-3">
              <button 
                className="cta-button w-full flex items-center justify-center space-x-2"
                onClick={generateBookCover}
                disabled={apiLoading}
              >
                {apiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{apiLoading ? 'Generating Cover...' : 'Generate AI Cover'}</span>
              </button>
              <button 
                className="button-secondary w-full flex items-center justify-center space-x-2"
                onClick={() => alert('Upload image functionality...')}
              >
                <Upload className="w-4 h-4" />
                <span>Upload Custom Image</span>
              </button>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <button 
                className="cta-button w-full flex items-center justify-center space-x-2"
                onClick={() => alert('Downloading complete package...')}
              >
                <Package className="w-4 h-4" />
                <span>Download Complete Package</span>
              </button>
              <p className="mt-2 text-sm text-gray-500 text-center font-sans">
                Includes book content, cover, and all export formats
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return renderStep1();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="glass-card border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2 text-blue-600 hover:text-blue-700">
                <ArrowLeft className="w-5 h-5" />
                <span className="font-sans">Back to Home</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <ProofboundLogo className="w-10 h-10 text-blue-600" size={40} />
              <span className="text-2xl font-bold text-gray-900">AI Book Generator</span>
            </div>
          </div>
        </div>
      </header>

      {renderProgressBar()}

      <main className="py-12 px-4 sm:px-6 lg:px-8">
        {renderCurrentStep()}

        <div className="max-w-4xl mx-auto mt-12 pt-8 border-t border-gray-200">
          <div className="flex justify-between">
            <button
              onClick={previousStep}
              disabled={currentStep === 1}
              className={`button-secondary ${currentStep === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{ visibility: currentStep === 1 ? 'hidden' : 'visible' }}
            >
              Previous
            </button>
            <button
              onClick={currentStep === 1 ? generateTOC : nextStep}
              disabled={
                (currentStep === 1 && (!bookRequest.title || !bookRequest.author || !bookRequest.book_idea)) ||
                isGenerating || apiLoading
              }
              className="cta-button disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isGenerating || apiLoading ? (
                <span className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </span>
              ) : (
                currentStep === 1 ? 'Generate Structure' : 
                currentStep === totalSteps ? 'Complete' : 'Next Step'
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AIBookGenerator;