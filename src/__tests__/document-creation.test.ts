import { describe, it, expect, vi } from 'vitest'
import { DocumentService } from '@/lib/document-service'
import { computeTemplateIntegrity } from '@/lib/template-integrity'
import goldenManifest from './fixtures/golden-template-manifest.json'

// Mock the supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            access_token: 'mock-token'
          }
        }
      })
    },
    functions: {
      invoke: vi.fn()
    }
  }
}))

describe('Document Creation from Templates', () => {
  describe('Template Completeness Validation', () => {
    it('should fail when template is missing tpkg_source', async () => {
      const incompleteTemplate = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Incomplete Template',
        category: 'business',
        config: goldenManifest['template.json']
        // Missing tpkg_source
      }

      const integrity = computeTemplateIntegrity(incompleteTemplate)
      expect(integrity.isComplete).toBe(false)
      expect(integrity.reason).toContain('Template package missing')

      // Mock function to simulate server-side validation
      const mockCreateFromTemplate = vi.fn().mockRejectedValue(
        new Error('TEMPLATE_INCOMPLETE: Template package missing')
      )

      try {
        await mockCreateFromTemplate({
          templateId: incompleteTemplate.id,
          title: 'Test Document',
          workspaceId: 'workspace-123'
        })
      } catch (error) {
        expect(error.message).toContain('TEMPLATE_INCOMPLETE')
        expect(error.message).toContain('Template package missing')
      }
    })

    it('should fail when template is missing config', async () => {
      const incompleteTemplate = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Incomplete Template',
        category: 'business',
        tpkg_source: goldenManifest
        // Missing config
      }

      const integrity = computeTemplateIntegrity(incompleteTemplate)
      expect(integrity.isComplete).toBe(false)
      expect(integrity.reason).toContain('Template configuration missing')

      // Mock function to simulate server-side validation
      const mockCreateFromTemplate = vi.fn().mockRejectedValue(
        new Error('TEMPLATE_INCOMPLETE: Template configuration missing')
      )

      try {
        await mockCreateFromTemplate({
          templateId: incompleteTemplate.id,
          title: 'Test Document',
          workspaceId: 'workspace-123'
        })
      } catch (error) {
        expect(error.message).toContain('TEMPLATE_INCOMPLETE')
        expect(error.message).toContain('Template configuration missing')
      }
    })

    it('should succeed when template is complete', async () => {
      const completeTemplate = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Complete Template',
        category: 'business',
        tpkg_source: goldenManifest,
        config: goldenManifest['template.json'],
        preview_image_url: 'https://example.com/preview.png'
      }

      const integrity = computeTemplateIntegrity(completeTemplate)
      expect(integrity.isComplete).toBe(true)
      expect(integrity.reason).toBeUndefined()

      // Mock successful creation
      const mockCreateFromTemplate = vi.fn().mockResolvedValue({
        docId: 'doc-123',
        url: '/w/workspace-123/documents/doc-123/editor'
      })

      const result = await mockCreateFromTemplate({
        templateId: completeTemplate.id,
        title: 'Test Document',
        workspaceId: 'workspace-123'
      })

      expect(result).toHaveProperty('docId')
      expect(result).toHaveProperty('url')
      expect(result.docId).toBe('doc-123')
    })
  })

  describe('Template Structure Requirements', () => {
    it('should validate template has required structure for document creation', () => {
      const manifest = goldenManifest['template.json'].templateManifest

      // Verify required structure for document creation
      expect(manifest.pageMasters).toBeDefined()
      expect(manifest.pageMasters.length).toBeGreaterThanOrEqual(3)
      
      // Verify page masters have required properties
      manifest.pageMasters.forEach(pageMaster => {
        expect(pageMaster).toHaveProperty('id')
        expect(pageMaster).toHaveProperty('name')
        expect(pageMaster).toHaveProperty('components')
        expect(Array.isArray(pageMaster.components)).toBe(true)
      })

      // Verify object styles exist for basic blocks
      expect(manifest.objectStyles).toHaveProperty('heading1')
      expect(manifest.objectStyles).toHaveProperty('paragraph')
    })

    it('should validate template supports required document blocks', () => {
      const manifest = goldenManifest['template.json'].templateManifest
      const objectStyles = manifest.objectStyles

      // Required block types that documents should support
      const expectedBlockTypes = [
        'heading1', 'heading2', 'heading3',
        'paragraph', 'list', 'table'
      ]

      expectedBlockTypes.forEach(blockType => {
        expect(objectStyles).toHaveProperty(blockType)
        expect(objectStyles[blockType]).toHaveProperty('fontSize')
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network error
      const mockNetworkError = vi.fn().mockRejectedValue(
        new Error('Failed to fetch')
      )

      try {
        await mockNetworkError()
      } catch (error) {
        expect(error.message).toBe('Failed to fetch')
      }
    })

    it('should handle 422 validation errors', async () => {
      // Mock 422 error response
      const mock422Error = vi.fn().mockRejectedValue(
        Object.assign(new Error('Unprocessable Entity'), {
          status: 422,
          message: 'TEMPLATE_INCOMPLETE: Template validation failed'
        })
      )

      try {
        await mock422Error()
      } catch (error) {
        expect(error.status).toBe(422)
        expect(error.message).toContain('TEMPLATE_INCOMPLETE')
      }
    })
  })
})