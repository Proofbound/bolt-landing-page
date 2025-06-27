# API Endpoints Overview


### Production Endpoints (Require HAL9_TOKEN)
| Endpoint | Method | Description | Response |
|----------|--------|-------------|----------|
| `/test` | GET | Health check and environment info | JSON status |
| `/toc` | POST | Generate table of contents | JSON array of sections |
| `/draft` | POST | Generate full book draft (legacy) | JSON with markdown |
| `/generate-chapter` | POST | Generate single chapter with context | JSON chapter data |
| `/generate-book` | POST | Generate complete book chapter-by-chapter | JSON with all chapters |
| `/generate-book-chapters` | POST | **NEW**: Generate TOC + selected chapters | JSON with TOC + chapters |
| `/pdf` | POST | Convert markdown to formatted PDF | PDF file download |
| `/cover` | POST | Generate AI book cover | PDF file download |
| `/demo` | GET | Interactive testing interface | HTML demo page |
| `/demo/presets` | GET | Available demo book examples | JSON presets |

### 🚀 Mock Endpoints (No Setup Required)
| Endpoint | Method | Description | Response |
|----------|--------|-------------|----------|
| `/mock/test` | GET | Mock health check | JSON status with mock flag |
| `/mock/toc` | POST | Mock TOC generation (instant) | JSON array of sections |
| `/mock/draft` | POST | Mock full book draft | JSON with markdown |
| `/mock/generate-chapter` | POST | Mock single chapter generation | JSON chapter data |
| `/mock/generate-book` | POST | Mock complete book generation | JSON with all chapters |
| `/mock/generate-book-chapters` | POST | Mock TOC + selected chapters | JSON with TOC + chapters |
| `/mock/pdf` | POST | Mock PDF generation | Sample PDF file download |
| `/mock/cover` | POST | Mock cover generation | Sample PDF file download |
