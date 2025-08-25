-- Create template generator registries tables
CREATE TABLE public.template_registry_doc_types (
  id text PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.template_registry_style_packs (
  id text PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.template_registry_industries (
  id text PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.template_registry_doc_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_registry_style_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_registry_industries ENABLE ROW LEVEL SECURITY;

-- Create policies for admins to manage registries
CREATE POLICY "Admins can manage doc type registry" ON public.template_registry_doc_types
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage style pack registry" ON public.template_registry_style_packs
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage industry registry" ON public.template_registry_industries
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create policies for authenticated users to read registries
CREATE POLICY "Authenticated users can read doc type registry" ON public.template_registry_doc_types
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read style pack registry" ON public.template_registry_style_packs
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read industry registry" ON public.template_registry_industries
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Add updated_at triggers
CREATE TRIGGER update_template_registry_doc_types_updated_at
  BEFORE UPDATE ON public.template_registry_doc_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_template_registry_style_packs_updated_at  
  BEFORE UPDATE ON public.template_registry_style_packs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_template_registry_industries_updated_at
  BEFORE UPDATE ON public.template_registry_industries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Bootstrap default data
INSERT INTO public.template_registry_doc_types (id, data) VALUES
  ('white-paper', '{"pageMasters": ["pm/cover-fullbleed-{paper}","pm/body-1col-{paper}","pm/body-2col-{paper}"], "sectionOrder": ["Cover","TOC?","Body","DataAppendix?"], "tocDefaults": { "depth": ["H1","H2","H3"] }, "validationPreset": "standard"}'),
  ('report', '{"pageMasters": ["pm/cover-fullbleed-{paper}","pm/body-1col-{paper}","pm/body-2col-{paper}"], "sectionOrder": ["Cover","TOC?","Body","DataAppendix?"], "tocDefaults": { "depth": ["H1","H2","H3"] }, "validationPreset": "standard"}'),
  ('ebook', '{"pageMasters": ["pm/cover-fullbleed-{paper}","pm/body-1col-{paper}","pm/body-2col-{paper}"], "sectionOrder": ["Cover","TOC?","Body","DataAppendix?"], "tocDefaults": { "depth": ["H1","H2","H3"] }, "validationPreset": "standard"}'),
  ('case-study', '{"pageMasters": ["pm/cover-fullbleed-{paper}","pm/body-1col-{paper}","pm/body-2col-{paper}"], "sectionOrder": ["Cover","TOC?","Body","DataAppendix?"], "tocDefaults": { "depth": ["H1","H2","H3"] }, "validationPreset": "standard"}'),
  ('proposal', '{"pageMasters": ["pm/cover-fullbleed-{paper}","pm/body-1col-{paper}","pm/body-2col-{paper}"], "sectionOrder": ["Cover","TOC?","Body","DataAppendix?"], "tocDefaults": { "depth": ["H1","H2","H3"] }, "validationPreset": "standard"}'),
  ('annual-report', '{"pageMasters": ["pm/cover-fullbleed-{paper}","pm/body-1col-{paper}","pm/body-2col-{paper}"], "sectionOrder": ["Cover","TOC?","Body","DataAppendix?"], "tocDefaults": { "depth": ["H1","H2","H3"] }, "validationPreset": "standard"}');

INSERT INTO public.template_registry_style_packs (id, data) VALUES
  ('professional', '{"fontPairing": ["Inter","Source Serif Pro"], "scale": { "bodyPt": 11, "h3Pt": 16, "h2Pt": 22, "h1Pt": 34, "baselinePt": 12, "lineHeights": { "body": 1.5, "caption": 1.35 } }, "divider": "thin-rule", "callout": "left-accent-bar", "chartDefaults": { "grid": "light", "legend": "top", "numberFormat": "plain" }}'),
  ('editorial', '{"fontPairing": ["Inter","Source Serif Pro"], "scale": { "bodyPt": 11, "h3Pt": 16, "h2Pt": 22, "h1Pt": 34, "baselinePt": 12, "lineHeights": { "body": 1.5, "caption": 1.35 } }, "divider": "thin-rule", "callout": "left-accent-bar", "chartDefaults": { "grid": "light", "legend": "top", "numberFormat": "plain" }}'),
  ('minimal', '{"fontPairing": ["Inter","Source Serif Pro"], "scale": { "bodyPt": 11, "h3Pt": 16, "h2Pt": 22, "h1Pt": 34, "baselinePt": 12, "lineHeights": { "body": 1.5, "caption": 1.35 } }, "divider": "thin-rule", "callout": "left-accent-bar", "chartDefaults": { "grid": "light", "legend": "top", "numberFormat": "plain" }}'),
  ('bold', '{"fontPairing": ["Inter","Source Serif Pro"], "scale": { "bodyPt": 11, "h3Pt": 16, "h2Pt": 22, "h1Pt": 34, "baselinePt": 12, "lineHeights": { "body": 1.5, "caption": 1.35 } }, "divider": "thin-rule", "callout": "left-accent-bar", "chartDefaults": { "grid": "light", "legend": "top", "numberFormat": "plain" }}'),
  ('technical', '{"fontPairing": ["Inter","Source Serif Pro"], "scale": { "bodyPt": 11, "h3Pt": 16, "h2Pt": 22, "h1Pt": 34, "baselinePt": 12, "lineHeights": { "body": 1.5, "caption": 1.35 } }, "divider": "thin-rule", "callout": "left-accent-bar", "chartDefaults": { "grid": "light", "legend": "top", "numberFormat": "plain" }}'),
  ('friendly', '{"fontPairing": ["Inter","Source Serif Pro"], "scale": { "bodyPt": 11, "h3Pt": 16, "h2Pt": 22, "h1Pt": 34, "baselinePt": 12, "lineHeights": { "body": 1.5, "caption": 1.35 } }, "divider": "thin-rule", "callout": "left-accent-bar", "chartDefaults": { "grid": "light", "legend": "top", "numberFormat": "plain" }}');

INSERT INTO public.template_registry_industries (id, data) VALUES
  ('finance', '{"paletteHints": { "accentSaturation": "medium", "neutrals": "cool" }, "motifs": { "bg": "subtle-geometry", "divider": "thin-rule", "coverShape": "simple-shape" }, "snippets": []}'),
  ('insurance', '{"paletteHints": { "accentSaturation": "medium", "neutrals": "cool" }, "motifs": { "bg": "subtle-geometry", "divider": "thin-rule", "coverShape": "simple-shape" }, "snippets": []}'),
  ('real-estate', '{"paletteHints": { "accentSaturation": "medium", "neutrals": "cool" }, "motifs": { "bg": "subtle-geometry", "divider": "thin-rule", "coverShape": "simple-shape" }, "snippets": []}'),
  ('healthcare', '{"paletteHints": { "accentSaturation": "medium", "neutrals": "cool" }, "motifs": { "bg": "subtle-geometry", "divider": "thin-rule", "coverShape": "simple-shape" }, "snippets": []}'),
  ('manufacturing', '{"paletteHints": { "accentSaturation": "medium", "neutrals": "cool" }, "motifs": { "bg": "subtle-geometry", "divider": "thin-rule", "coverShape": "simple-shape" }, "snippets": []}'),
  ('tech-saas', '{"paletteHints": { "accentSaturation": "medium", "neutrals": "cool" }, "motifs": { "bg": "subtle-geometry", "divider": "thin-rule", "coverShape": "simple-shape" }, "snippets": []}'),
  ('consumer-goods', '{"paletteHints": { "accentSaturation": "medium", "neutrals": "cool" }, "motifs": { "bg": "subtle-geometry", "divider": "thin-rule", "coverShape": "simple-shape" }, "snippets": []}'),
  ('public-sector', '{"paletteHints": { "accentSaturation": "medium", "neutrals": "cool" }, "motifs": { "bg": "subtle-geometry", "divider": "thin-rule", "coverShape": "simple-shape" }, "snippets": []}');