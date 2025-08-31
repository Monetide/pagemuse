/**
 * Test Runner Script
 * Provides a simple way to run tests from the browser console
 */

import { computeTemplateIntegrity } from '@/lib/template-integrity'
import goldenManifest from './fixtures/golden-template-manifest.json'

export const runTemplateTests = () => {
  console.log('🧪 Running Template System Tests...\n')

  const tests = [
    {
      name: 'Golden Manifest Structure',
      test: () => {
        const manifest = goldenManifest['template.json'].templateManifest
        return manifest && 
               manifest.pageMasters && 
               manifest.pageMasters.length >= 3 &&
               manifest.objectStyles &&
               manifest.colorways &&
               manifest.typography
      }
    },
    {
      name: 'Template Integrity - Complete',
      test: () => {
        const template = {
          tpkg_source: goldenManifest,
          config: goldenManifest['template.json'],
          preview_image_url: 'test.png'
        }
        const integrity = computeTemplateIntegrity(template)
        return integrity.isComplete && !integrity.reason
      }
    },
    {
      name: 'Template Integrity - Missing Package',
      test: () => {
        const template = {
          config: goldenManifest['template.json'],
          preview_image_url: 'test.png'
        }
        const integrity = computeTemplateIntegrity(template)
        return !integrity.isComplete && 
               integrity.reason && 
               integrity.reason.includes('Template package missing')
      }
    },
    {
      name: 'Template Integrity - Missing Config',
      test: () => {
        const template = {
          tpkg_source: goldenManifest,
          preview_image_url: 'test.png'
        }
        const integrity = computeTemplateIntegrity(template)
        return !integrity.isComplete && 
               integrity.reason && 
               integrity.reason.includes('Template configuration missing')
      }
    },
    {
      name: 'Page Masters Count Requirement',
      test: () => {
        const manifest = goldenManifest['template.json'].templateManifest
        return manifest.pageMasters.length >= 3
      }
    },
    {
      name: 'Required Object Styles',
      test: () => {
        const manifest = goldenManifest['template.json'].templateManifest
        const required = ['heading1', 'heading2', 'paragraph', 'list']
        return required.every(style => 
          manifest.objectStyles[style] && 
          manifest.objectStyles[style].fontSize
        )
      }
    },
    {
      name: 'Document Block Support',
      test: () => {
        const manifest = goldenManifest['template.json'].templateManifest
        // Should support basic document structure
        const coverSection = manifest.pageMasters.some(pm => 
          pm.name.toLowerCase().includes('cover') || pm.id.includes('cover')
        )
        const hasHeadingStyle = manifest.objectStyles.heading1
        const hasParagraphStyle = manifest.objectStyles.paragraph
        
        return coverSection && hasHeadingStyle && hasParagraphStyle
      }
    }
  ]

  let passed = 0
  let total = tests.length

  tests.forEach((test, index) => {
    try {
      const result = test.test()
      if (result) {
        console.log(`✅ ${index + 1}. ${test.name}`)
        passed++
      } else {
        console.log(`❌ ${index + 1}. ${test.name}`)
      }
    } catch (error) {
      console.log(`❌ ${index + 1}. ${test.name} - Error: ${error.message}`)
    }
  })

  console.log(`\n📊 Results: ${passed}/${total} tests passed`)
  
  if (passed === total) {
    console.log('🎉 All tests passed! Template system is healthy.')
  } else {
    console.log('⚠️  Some tests failed. Template system needs attention.')
  }

  return { passed, total, success: passed === total }
}

// Make available in browser console for manual testing
if (typeof window !== 'undefined') {
  (window as any).runTemplateTests = runTemplateTests
}

export default runTemplateTests