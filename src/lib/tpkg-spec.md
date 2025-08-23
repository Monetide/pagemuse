# TPKG (Template Package) Format Specification

## Overview
TPKG is a standardized format for distributing PageMuse templates as zip archives containing all necessary assets, configurations, and metadata.

## File Structure
```
template-name.tpkg (zip archive)
├── template.json          # Template manifest (required)
├── preview.jpg            # Template preview image (recommended)
├── assets/               # Template assets folder
│   ├── images/
│   ├── fonts/
│   └── icons/
├── layouts/              # Layout configurations
│   ├── page1.json
│   └── page2.json
└── README.md             # Documentation (optional)
```

## Template Manifest (template.json)
```json
{
  "name": "Business Report Template",
  "version": "1.0.0",
  "description": "Professional business report template with charts and tables",
  "category": "Business",
  "author": "PageMuse Team",
  "license": "MIT",
  "preview": "preview.jpg",
  "assets": [
    "assets/images/logo.png",
    "assets/images/chart-bg.svg"
  ],
  "themeTokens": {
    "primary": "hsl(222, 84%, 5%)",
    "secondary": "hsl(210, 40%, 98%)",
    "accent": "hsl(217, 91%, 60%)"
  },
  "objectStyles": {
    "heading": {
      "fontFamily": "Inter",
      "fontWeight": 600,
      "lineHeight": 1.2
    },
    "body": {
      "fontFamily": "Inter",
      "fontSize": 14,
      "lineHeight": 1.6
    }
  },
  "layouts": [
    {
      "name": "Cover Page",
      "file": "layouts/page1.json"
    },
    {
      "name": "Content Page", 
      "file": "layouts/page2.json"
    }
  ],
  "metadata": {
    "tags": ["business", "report", "professional"],
    "complexity": "intermediate",
    "estimatedPages": 20,
    "supportedLanguages": ["en", "es", "fr"]
  }
}
```

## Required Fields
- `name`: Template display name
- `version`: Semantic version (e.g., "1.0.0")
- `category`: Template category
- `themeTokens`: Color and design tokens
- `objectStyles`: Typography and styling rules

## Optional Fields
- `description`: Template description
- `author`: Template creator
- `license`: License type
- `preview`: Preview image filename
- `assets`: Array of asset file paths
- `layouts`: Page layout configurations
- `metadata`: Additional template metadata

## Asset Guidelines
- **Images**: PNG, JPG, SVG, WebP (max 2MB each)
- **Fonts**: WOFF, WOFF2, TTF (max 1MB each)
- **Total package size**: Maximum 50MB
- **Preview image**: 800x600px recommended

## Validation Rules
1. `template.json` must be valid JSON
2. Required fields must be present
3. Asset references must exist in the package
4. Color values must be valid HSL, RGB, or hex
5. Font references must point to included font files

## Usage
1. Create template structure following the specification
2. Package as ZIP archive with `.tpkg` extension
3. Upload through PageMuse admin interface
4. System validates and extracts template
5. Assets stored in Supabase storage
6. Template created in draft status