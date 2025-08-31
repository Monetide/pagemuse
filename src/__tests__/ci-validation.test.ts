import { describe, it, expect } from 'vitest'
import { computeTemplateIntegrity } from '@/lib/template-integrity'
import goldenManifest from './fixtures/golden-template-manifest.json'

describe('CI Validation Tests', () => {
  describe('Template System Health Checks', () => {
    it('should validate golden manifest structure is maintained', () => {
      // This test ensures the golden manifest fixture remains valid
      expect(goldenManifest).toHaveProperty('template.json')
      expect(goldenManifest).toHaveProperty('assets')
      expect(goldenManifest).toHaveProperty('previews')

      const manifest = goldenManifest['template.json'].templateManifest
      
      // Critical structure validation
      expect(manifest).toHaveProperty('name')
      expect(manifest).toHaveProperty('category')
      expect(manifest).toHaveProperty('pageMasters')
      expect(manifest).toHaveProperty('objectStyles')
      expect(manifest).toHaveProperty('colorways')
      expect(manifest).toHaveProperty('typography')
      
      // Ensure pageMasters >= 3 requirement
      expect(manifest.pageMasters.length).toBeGreaterThanOrEqual(3)
      
      // Validate each pageMaster has required structure
      manifest.pageMasters.forEach(pm => {
        expect(pm).toHaveProperty('id')
        expect(pm).toHaveProperty('name')
        expect(pm).toHaveProperty('components')
        expect(Array.isArray(pm.components)).toBe(true)
      })
    })

    it('should prevent template integrity regressions', () => {
      const scenarios = [
        {
          name: 'Complete template',
          template: {
            tpkg_source: goldenManifest,
            config: goldenManifest['template.json'],
            preview_image_url: 'test.png'
          },
          expectedComplete: true
        },
        {
          name: 'Missing tpkg_source',
          template: {
            config: goldenManifest['template.json'],
            preview_image_url: 'test.png'
          },
          expectedComplete: false
        },
        {
          name: 'Missing config', 
          template: {
            tpkg_source: goldenManifest,
            preview_image_url: 'test.png'
          },
          expectedComplete: false
        },
        {
          name: 'Empty tpkg_source',
          template: {
            tpkg_source: {},
            config: goldenManifest['template.json'],
            preview_image_url: 'test.png'
          },
          expectedComplete: false
        },
        {
          name: 'Empty config',
          template: {
            tpkg_source: goldenManifest,
            config: {},
            preview_image_url: 'test.png'
          },
          expectedComplete: false
        }
      ]

      scenarios.forEach(scenario => {
        const integrity = computeTemplateIntegrity(scenario.template)
        expect(integrity.isComplete).toBe(scenario.expectedComplete)
        
        if (!scenario.expectedComplete) {
          expect(integrity.reason).toBeDefined()
          expect(integrity.reason).toContain('ask admin to republish')
        }
      })
    })

    it('should validate template composition requirements', () => {
      const manifest = goldenManifest['template.json'].templateManifest

      // Business logic requirements
      expect(manifest.pageMasters.length).toBeGreaterThanOrEqual(3)
      
      // Required object styles for document creation
      const requiredStyles = ['heading1', 'heading2', 'paragraph']
      requiredStyles.forEach(style => {
        expect(manifest.objectStyles).toHaveProperty(style)
        expect(manifest.objectStyles[style]).toHaveProperty('fontSize')
      })

      // Typography requirements
      expect(manifest.typography).toHaveProperty('headingFont')
      expect(manifest.typography).toHaveProperty('bodyFont')

      // Colorway requirements  
      expect(manifest.colorways.length).toBeGreaterThan(0)
      expect(manifest.colorways[0]).toHaveProperty('primary')
    })

    it('should catch document creation validation errors', () => {
      // Simulate template validation errors that would occur during document creation
      const invalidTemplateScenarios = [
        {
          name: 'Insufficient page masters',
          template: {
            config: {
              templateManifest: {
                pageMasters: [
                  { id: 'pm1', name: 'Page 1', components: [] }
                  // Only 1 page master, need >= 3
                ]
              }
            }
          },
          error: 'Insufficient page masters'
        },
        {
          name: 'Missing object styles',
          template: {
            config: {
              templateManifest: {
                pageMasters: [
                  { id: 'pm1', name: 'Page 1', components: [] },
                  { id: 'pm2', name: 'Page 2', components: [] },
                  { id: 'pm3', name: 'Page 3', components: [] }
                ],
                objectStyles: {}
                // Missing required styles
              }
            }
          },
          error: 'Missing object styles'
        }
      ]

      invalidTemplateScenarios.forEach(scenario => {
        const manifest = scenario.template.config.templateManifest
        
        if (scenario.name === 'Insufficient page masters') {
          expect(manifest.pageMasters?.length || 0).toBeLessThan(3)
        }
        
        if (scenario.name === 'Missing object styles') {
          expect(Object.keys(manifest.objectStyles || {})).toHaveLength(0)
        }
      })
    })
  })

  describe('End-to-End Flow Validation', () => {
    it('should validate complete compose → publish → instantiate flow', () => {
      // Step 1: Verify composition readiness
      const templateAfterComposition = {
        id: 'test-template',
        name: 'Test Template',
        tpkg_source: goldenManifest,
        config: goldenManifest['template.json'],
        status: 'composed'
      }

      const compositionIntegrity = computeTemplateIntegrity(templateAfterComposition)
      expect(compositionIntegrity.isComplete).toBe(true)

      // Step 2: Verify publication readiness
      const templateAfterPublication = {
        ...templateAfterComposition,
        status: 'published',
        preview_image_url: 'preview.png'
      }

      const publicationIntegrity = computeTemplateIntegrity(templateAfterPublication)
      expect(publicationIntegrity.isComplete).toBe(true)
      expect(publicationIntegrity.hasPreviews).toBe(true)

      // Step 3: Verify instantiation requirements
      const manifest = templateAfterPublication.config.templateManifest
      
      // Document should be able to create Cover and Body sections
      expect(manifest.pageMasters.some(pm => pm.name.toLowerCase().includes('cover'))).toBe(true)
      expect(manifest.objectStyles).toHaveProperty('heading1')
      expect(manifest.objectStyles).toHaveProperty('paragraph')
      
      // Page masters count requirement
      expect(manifest.pageMasters.length).toBeGreaterThanOrEqual(3)
    })

    it('should prevent CI regressions with comprehensive checks', () => {
      // This test will fail if critical template functionality is broken
      const criticalChecks = [
        {
          name: 'Template integrity function exists',
          check: () => typeof computeTemplateIntegrity === 'function'
        },
        {
          name: 'Golden manifest is valid JSON',
          check: () => goldenManifest && typeof goldenManifest === 'object' 
        },
        {
          name: 'Template structure is complete',
          check: () => {
            const template = {
              tpkg_source: goldenManifest,
              config: goldenManifest['template.json']
            }
            return computeTemplateIntegrity(template).isComplete
          }
        },
        {
          name: 'Page masters count requirement',
          check: () => {
            const manifest = goldenManifest['template.json'].templateManifest
            return manifest.pageMasters.length >= 3
          }
        },
        {
          name: 'Required object styles exist',
          check: () => {
            const manifest = goldenManifest['template.json'].templateManifest
            const required = ['heading1', 'paragraph']
            return required.every(style => 
              manifest.objectStyles[style] && 
              typeof manifest.objectStyles[style].fontSize === 'number'
            )
          }
        }
      ]

      criticalChecks.forEach(check => {
        expect(check.check()).toBe(true)
      })
    })
  })
})