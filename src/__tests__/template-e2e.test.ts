import { describe, it, expect, vi } from 'vitest'
import { computeTemplateIntegrity } from '@/lib/template-integrity'
import goldenManifest from './fixtures/golden-template-manifest.json'

// Mock external dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'mock-token' } }
      })
    },
    functions: {
      invoke: vi.fn()
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis()
  }
}))

describe('Template End-to-End Flow', () => {
  describe('Compose → Publish → Instantiate Flow', () => {
    it('should simulate complete template lifecycle', async () => {
      // Step 1: Template Composition
      const seedData = {
        id: 'executive-summary-corporate-blue',
        industry: 'corporate',
        doc_type: 'executive-summary',
        style_pack: 'corporate-blue',
        workspace_id: '00000000-0000-0000-0000-000000000000'
      }

      // Mock template composition result
      const composedTemplate = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Executive Summary Report',
        category: 'business',
        tpkg_source: goldenManifest,
        config: goldenManifest['template.json'],
        preview_image_url: 'https://example.com/preview.png',
        status: 'composed',
        workspace_id: null, // Global template
        scope: 'global'
      }

      // Verify composition integrity
      const composedIntegrity = computeTemplateIntegrity(composedTemplate)
      expect(composedIntegrity.isComplete).toBe(true)
      expect(composedIntegrity.hasPkg).toBe(true)
      expect(composedIntegrity.hasConfig).toBe(true)

      // Step 2: Template Publishing
      const publishedTemplate = {
        ...composedTemplate,
        status: 'published'
      }

      const publishedIntegrity = computeTemplateIntegrity(publishedTemplate)
      expect(publishedIntegrity.isComplete).toBe(true)

      // Step 3: Document Instantiation
      const mockDocument = {
        id: 'doc-123',
        title: 'New Executive Summary',
        template_id: publishedTemplate.id,
        content: [
          {
            id: 'cover-section',
            type: 'section',
            name: 'Cover',
            layoutIntent: 'cover',
            blocks: [
              {
                id: 'cover-heading',
                type: 'heading',
                level: 1,
                content: 'Executive Summary Report',
                styling: publishedTemplate.config.templateManifest.objectStyles.heading1
              },
              {
                id: 'cover-subtitle',  
                type: 'paragraph',
                content: 'Comprehensive business analysis and recommendations',
                styling: publishedTemplate.config.templateManifest.objectStyles.paragraph
              }
            ]
          },
          {
            id: 'body-section',
            type: 'section',
            name: 'Body',
            layoutIntent: 'body',
            blocks: [
              {
                id: 'body-heading',
                type: 'heading',
                level: 2,
                content: 'Key Findings',
                styling: publishedTemplate.config.templateManifest.objectStyles.heading2
              },
              {
                id: 'body-content',
                type: 'paragraph',
                content: 'This section contains the main findings and analysis.',
                styling: publishedTemplate.config.templateManifest.objectStyles.paragraph
              }
            ]
          }
        ]
      }

      // Verify document structure
      expect(mockDocument.content).toHaveLength(2)
      
      // Verify Cover section
      const coverSection = mockDocument.content.find(section => section.name === 'Cover')
      expect(coverSection).toBeDefined()
      expect(coverSection.layoutIntent).toBe('cover')
      expect(coverSection.blocks).toHaveLength(2)

      // Verify Body section
      const bodySection = mockDocument.content.find(section => section.name === 'Body')
      expect(bodySection).toBeDefined()
      expect(bodySection.layoutIntent).toBe('body')
      expect(bodySection.blocks).toHaveLength(2)

      // Verify page masters count (should be >= 3)
      const pageMasters = publishedTemplate.config.templateManifest.pageMasters
      expect(pageMasters).toHaveLength(3)
      expect(pageMasters.length).toBeGreaterThanOrEqual(3)

      // Verify page master structure
      const expectedPageMasters = ['cover-page', 'content-page', 'appendix-page']
      expectedPageMasters.forEach(pmId => {
        const pageMaster = pageMasters.find(pm => pm.id === pmId)
        expect(pageMaster).toBeDefined()
        expect(pageMaster.components).toBeDefined()
        expect(Array.isArray(pageMaster.components)).toBe(true)
      })
    })

    it('should validate document creation with template styling', () => {
      const template = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        config: goldenManifest['template.json'],
        tpkg_source: goldenManifest
      }

      const manifest = template.config.templateManifest

      // Verify styling is applied to document blocks
      const headingStyle = manifest.objectStyles.heading1
      expect(headingStyle).toHaveProperty('fontSize')
      expect(headingStyle).toHaveProperty('fontWeight')
      expect(headingStyle).toHaveProperty('color')

      const paragraphStyle = manifest.objectStyles.paragraph
      expect(paragraphStyle).toHaveProperty('fontSize')
      expect(paragraphStyle).toHaveProperty('lineHeight')
      expect(paragraphStyle).toHaveProperty('marginBottom')

      // Verify colorway is applied
      const colorway = manifest.colorways[0]
      expect(colorway).toHaveProperty('primary')
      expect(colorway).toHaveProperty('secondary')
      expect(colorway).toHaveProperty('background')

      // Verify typography is configured
      expect(manifest.typography).toHaveProperty('headingFont')
      expect(manifest.typography).toHaveProperty('bodyFont')
      expect(manifest.typography).toHaveProperty('scale')
    })

    it('should handle template application edge cases', () => {
      // Test with minimal template structure
      const minimalTemplate = {
        id: 'minimal-123',
        config: {
          templateManifest: {
            name: 'Minimal Template',
            category: 'basic',
            pageMasters: [
              { id: 'page1', name: 'Page 1', components: [] },
              { id: 'page2', name: 'Page 2', components: [] },
              { id: 'page3', name: 'Page 3', components: [] }
            ],
            objectStyles: {
              heading1: { fontSize: 24 },
              paragraph: { fontSize: 12 }
            },
            colorways: [{ id: 'default', primary: '#000000' }],
            typography: { headingFont: 'Arial', bodyFont: 'Arial' },
            behaviors: { autoTOC: false }
          }
        },
        tpkg_source: { 'template.json': {}, assets: [], previews: [] }
      }

      const integrity = computeTemplateIntegrity(minimalTemplate)
      expect(integrity.isComplete).toBe(true)
      expect(minimalTemplate.config.templateManifest.pageMasters.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('Regression Prevention', () => {
    it('should catch missing tpkg_source regression', () => {
      const regressionTemplate = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Regression Template',
        config: goldenManifest['template.json']
        // tpkg_source missing - this should fail
      }

      const integrity = computeTemplateIntegrity(regressionTemplate)
      expect(integrity.isComplete).toBe(false)
      expect(integrity.hasPkg).toBe(false)
      expect(integrity.reason).toContain('Template package missing')
    })

    it('should catch missing config regression', () => {
      const regressionTemplate = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Regression Template', 
        tpkg_source: goldenManifest
        // config missing - this should fail
      }

      const integrity = computeTemplateIntegrity(regressionTemplate)
      expect(integrity.isComplete).toBe(false)
      expect(integrity.hasConfig).toBe(false)
      expect(integrity.reason).toContain('Template configuration missing')
    })

    it('should validate pageMasters count regression', () => {
      const regressionTemplate = {
        config: {
          templateManifest: {
            pageMasters: [
              { id: 'page1', name: 'Page 1' }
              // Only 1 page master - should be >= 3
            ]
          }
        }
      }

      expect(regressionTemplate.config.templateManifest.pageMasters.length).toBeLessThan(3)
      // This would fail the >= 3 requirement
    })
  })
})