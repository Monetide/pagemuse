import { describe, it, expect, beforeEach } from 'vitest'
import { createTemplate } from '@/lib/template-model'
import { computeTemplateIntegrity } from '@/lib/template-integrity'
import goldenManifest from './fixtures/golden-template-manifest.json'

describe('Template Composer', () => {
  describe('Template Package Structure', () => {
    it('should have required tpkg_source structure', () => {
      const mockTemplate = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Template',
        category: 'business',
        tpkg_source: goldenManifest,
        config: goldenManifest['template.json'],
        preview_image_url: 'https://example.com/preview.png'
      }

      const integrity = computeTemplateIntegrity(mockTemplate)

      expect(integrity.hasPkg).toBe(true)
      expect(integrity.hasConfig).toBe(true)
      expect(integrity.hasPreviews).toBe(true)
      expect(integrity.isComplete).toBe(true)
      expect(integrity.reason).toBeUndefined()
    })

    it('should validate template package contains required keys', () => {
      const tpkg = goldenManifest
      
      // Verify structure
      expect(tpkg).toHaveProperty('template.json')
      expect(tpkg).toHaveProperty('assets')
      expect(tpkg).toHaveProperty('previews')

      // Verify template.json structure
      const templateJson = tpkg['template.json']
      expect(templateJson).toHaveProperty('templateManifest')
      
      const manifest = templateJson.templateManifest
      expect(manifest).toHaveProperty('name')
      expect(manifest).toHaveProperty('description')
      expect(manifest).toHaveProperty('category')
      expect(manifest).toHaveProperty('colorways')
      expect(manifest).toHaveProperty('typography')
      expect(manifest).toHaveProperty('pageMasters')
      expect(manifest).toHaveProperty('objectStyles')
      expect(manifest).toHaveProperty('behaviors')

      // Verify pageMasters count
      expect(manifest.pageMasters).toHaveLength(3)
      expect(manifest.pageMasters.length).toBeGreaterThanOrEqual(3)

      // Verify required pageMaster properties
      manifest.pageMasters.forEach(pageMaster => {
        expect(pageMaster).toHaveProperty('id')
        expect(pageMaster).toHaveProperty('name')
        expect(pageMaster).toHaveProperty('pageSize')
        expect(pageMaster).toHaveProperty('margins')
        expect(pageMaster).toHaveProperty('components')
      })

      // Verify assets
      expect(Array.isArray(tpkg.assets)).toBe(true)
      expect(tpkg.assets.length).toBeGreaterThan(0)

      // Verify previews
      expect(Array.isArray(tpkg.previews)).toBe(true)
      expect(tpkg.previews.length).toBeGreaterThan(0)
    })

    it('should validate object styles contain required block types', () => {
      const manifest = goldenManifest['template.json'].templateManifest
      const objectStyles = manifest.objectStyles

      // Required block types for business templates
      const requiredStyles = ['heading1', 'heading2', 'heading3', 'paragraph', 'list', 'table']
      
      requiredStyles.forEach(styleKey => {
        expect(objectStyles).toHaveProperty(styleKey)
        expect(objectStyles[styleKey]).toHaveProperty('fontSize')
      })
    })

    it('should validate behaviors configuration', () => {
      const manifest = goldenManifest['template.json'].templateManifest
      const behaviors = manifest.behaviors

      expect(behaviors).toHaveProperty('autoTOC')
      expect(behaviors).toHaveProperty('pageBreaks')
      expect(behaviors).toHaveProperty('numbering')
      
      expect(typeof behaviors.autoTOC).toBe('boolean')
      expect(behaviors.pageBreaks).toHaveProperty('beforeH1')
      expect(behaviors.pageBreaks).toHaveProperty('beforeH2')
      expect(behaviors.numbering).toHaveProperty('sections')
      expect(behaviors.numbering).toHaveProperty('figures')
      expect(behaviors.numbering).toHaveProperty('tables')
    })
  })

  describe('Template Integrity Validation', () => {
    it('should detect incomplete templates - missing tpkg_source', () => {
      const incompleteTemplate = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Incomplete Template',
        category: 'business',
        config: goldenManifest['template.json'],
        preview_image_url: 'https://example.com/preview.png'
        // Missing tpkg_source
      }

      const integrity = computeTemplateIntegrity(incompleteTemplate)

      expect(integrity.hasPkg).toBe(false)
      expect(integrity.hasConfig).toBe(true)
      expect(integrity.isComplete).toBe(false)
      expect(integrity.reason).toBe('Template package missing — ask admin to republish')
    })

    it('should detect incomplete templates - missing config', () => {
      const incompleteTemplate = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Incomplete Template',
        category: 'business',
        tpkg_source: goldenManifest,
        preview_image_url: 'https://example.com/preview.png'
        // Missing config
      }

      const integrity = computeTemplateIntegrity(incompleteTemplate)

      expect(integrity.hasPkg).toBe(true)
      expect(integrity.hasConfig).toBe(false)
      expect(integrity.isComplete).toBe(false)
      expect(integrity.reason).toBe('Template configuration missing — ask admin to republish')
    })

    it('should detect incomplete templates - missing both', () => {
      const incompleteTemplate = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Incomplete Template',
        category: 'business',
        preview_image_url: 'https://example.com/preview.png'
        // Missing both tpkg_source and config
      }

      const integrity = computeTemplateIntegrity(incompleteTemplate)

      expect(integrity.hasPkg).toBe(false)
      expect(integrity.hasConfig).toBe(false)
      expect(integrity.isComplete).toBe(false)
      expect(integrity.reason).toBe('Template not packaged yet — ask admin to republish')
    })

    it('should validate complete templates', () => {
      const completeTemplate = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Complete Template',
        category: 'business',
        tpkg_source: goldenManifest,
        config: goldenManifest['template.json'],
        preview_image_url: 'https://example.com/preview.png'
      }

      const integrity = computeTemplateIntegrity(completeTemplate)

      expect(integrity.hasPkg).toBe(true)
      expect(integrity.hasConfig).toBe(true)
      expect(integrity.hasPreviews).toBe(true)
      expect(integrity.isComplete).toBe(true)
      expect(integrity.reason).toBeUndefined()
    })
  })
})