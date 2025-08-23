-- Add sample templates for testing
INSERT INTO public.templates (
  name,
  description,
  category,
  is_global,
  is_premium,
  global_styling,
  metadata,
  usage_count
) VALUES
(
  'Marketing E-Book',
  'Professional e-book template for marketing content with modern typography and engaging layouts.',
  'Marketing',
  true,
  false,
  '{"themeTokens": {"primary": "hsl(222, 84%, 5%)", "secondary": "hsl(210, 40%, 98%)", "accent": "hsl(217, 91%, 60%)"}, "objectStyles": {"heading": {"fontFamily": "Inter", "fontWeight": 600}, "body": {"fontFamily": "Inter", "lineHeight": 1.6}}}',
  '{"previewImage": null, "tags": ["marketing", "ebook", "content"], "complexity": "intermediate", "estimatedPages": 20}',
  45
),
(
  'Research White Paper',
  'Academic and professional white paper template with structured layouts for data presentation.',
  'Business',
  true,
  false,
  '{"themeTokens": {"primary": "hsl(210, 40%, 20%)", "secondary": "hsl(210, 40%, 98%)", "accent": "hsl(142, 76%, 36%)"}, "objectStyles": {"heading": {"fontFamily": "Georgia", "fontWeight": 700}, "body": {"fontFamily": "Georgia", "lineHeight": 1.7}}}',
  '{"previewImage": null, "tags": ["research", "business", "academic"], "complexity": "advanced", "estimatedPages": 35}',
  32
),
(
  'Case Study Report',
  'Comprehensive case study template with sections for analysis, findings, and recommendations.',
  'Business',
  true,
  true,
  '{"themeTokens": {"primary": "hsl(220, 14%, 96%)", "secondary": "hsl(220, 13%, 18%)", "accent": "hsl(24, 70%, 56%)"}, "objectStyles": {"heading": {"fontFamily": "Source Sans Pro", "fontWeight": 600}, "body": {"fontFamily": "Source Sans Pro", "lineHeight": 1.5}}}',
  '{"previewImage": null, "tags": ["case-study", "analysis", "business"], "complexity": "advanced", "estimatedPages": 25}',
  28
),
(
  'Product Launch Plan',
  'Strategic product launch template with timelines, milestones, and marketing strategies.',
  'Marketing',
  true,
  true,
  '{"themeTokens": {"primary": "hsl(271, 91%, 65%)", "secondary": "hsl(270, 20%, 98%)", "accent": "hsl(47, 96%, 53%)"}, "objectStyles": {"heading": {"fontFamily": "Roboto", "fontWeight": 700}, "body": {"fontFamily": "Roboto", "lineHeight": 1.6}}}',
  '{"previewImage": null, "tags": ["product", "launch", "strategy"], "complexity": "intermediate", "estimatedPages": 30}',
  18
),
(
  'Technical Documentation',
  'Developer-focused documentation template with code blocks and API reference layouts.',
  'Technology',
  true,
  false,
  '{"themeTokens": {"primary": "hsl(210, 40%, 8%)", "secondary": "hsl(210, 40%, 98%)", "accent": "hsl(195, 100%, 50%)"}, "objectStyles": {"heading": {"fontFamily": "JetBrains Mono", "fontWeight": 600}, "body": {"fontFamily": "Inter", "lineHeight": 1.6}}}',
  '{"previewImage": null, "tags": ["technical", "documentation", "api"], "complexity": "advanced", "estimatedPages": 50}',
  67
);