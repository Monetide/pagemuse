import React from 'react'
import { Control, useWatch } from 'react-hook-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Layout, ArrowRight } from 'lucide-react'

export interface SectionMapping {
  sectionType: string
  sectionName: string 
  pageMaster: string
  masterName: string
  enabled: boolean
}

export interface SectionPresetData {
  mappings: SectionMapping[]
}

interface SectionPresetsProps {
  control: Control<any>
  value?: { mappings?: Array<{ sectionType?: string; sectionName?: string; pageMaster?: string; masterName?: string; enabled?: boolean }> }
  onChange: (data: SectionPresetData) => void
  selectedPageMasters: Array<{ id: string; order: number }>
}

// Default section presets for different document types
const DOCUMENT_TYPE_PRESETS: Record<string, SectionMapping[]> = {
  'white-paper': [
    { sectionType: 'cover', sectionName: 'Cover', pageMaster: 'cover-fullbleed', masterName: 'Cover (full-bleed)', enabled: true },
    { sectionType: 'toc', sectionName: 'Table of Contents', pageMaster: 'body-1col', masterName: 'Body — 1-column', enabled: true },
    { sectionType: 'executive-summary', sectionName: 'Executive Summary', pageMaster: 'body-1col', masterName: 'Body — 1-column', enabled: true },
    { sectionType: 'body', sectionName: 'Body Content', pageMaster: 'body-2col', masterName: 'Body — 2-column', enabled: true },
    { sectionType: 'data-appendix', sectionName: 'Data/Appendix', pageMaster: 'data-portrait', masterName: 'Data (portrait)', enabled: true },
    { sectionType: 'references', sectionName: 'References', pageMaster: 'body-1col', masterName: 'Body — 1-column', enabled: true }
  ],
  'report': [
    { sectionType: 'cover', sectionName: 'Cover', pageMaster: 'cover-fullbleed', masterName: 'Cover (full-bleed)', enabled: true },
    { sectionType: 'toc', sectionName: 'Table of Contents', pageMaster: 'body-1col', masterName: 'Body — 1-column', enabled: true },
    { sectionType: 'executive-summary', sectionName: 'Executive Summary', pageMaster: 'body-1col', masterName: 'Body — 1-column', enabled: true },
    { sectionType: 'body', sectionName: 'Body Content', pageMaster: 'body-2col', masterName: 'Body — 2-column', enabled: true },
    { sectionType: 'data-appendix', sectionName: 'Data/Appendix', pageMaster: 'data-portrait', masterName: 'Data (portrait)', enabled: true }
  ],
  'annual-report': [
    { sectionType: 'cover', sectionName: 'Cover', pageMaster: 'cover-fullbleed', masterName: 'Cover (full-bleed)', enabled: true },
    { sectionType: 'toc', sectionName: 'Table of Contents', pageMaster: 'body-1col', masterName: 'Body — 1-column', enabled: true },
    { sectionType: 'executive-summary', sectionName: 'Executive Summary', pageMaster: 'body-1col', masterName: 'Body — 1-column', enabled: true },
    { sectionType: 'body', sectionName: 'Body Content', pageMaster: 'body-2col', masterName: 'Body — 2-column', enabled: true },
    { sectionType: 'data-appendix', sectionName: 'Financial Data', pageMaster: 'data-portrait', masterName: 'Data (portrait)', enabled: true },
    { sectionType: 'references', sectionName: 'References', pageMaster: 'body-1col', masterName: 'Body — 1-column', enabled: true }
  ],
  'ebook': [
    { sectionType: 'cover', sectionName: 'Cover', pageMaster: 'cover-fullbleed', masterName: 'Cover (full-bleed)', enabled: true },
    { sectionType: 'toc', sectionName: 'Table of Contents', pageMaster: 'body-1col', masterName: 'Body — 1-column', enabled: true },
    { sectionType: 'chapters', sectionName: 'Chapters', pageMaster: 'body-1col', masterName: 'Body — 1-column', enabled: true },
    { sectionType: 'feature', sectionName: 'Feature Sections', pageMaster: 'body-2col', masterName: 'Body — 2-column', enabled: false }
  ],
  'case-study': [
    { sectionType: 'cover', sectionName: 'Cover', pageMaster: 'cover-fullbleed', masterName: 'Cover (full-bleed)', enabled: true },
    { sectionType: 'narrative', sectionName: 'Narrative/Story', pageMaster: 'body-1col', masterName: 'Body — 1-column', enabled: true },
    { sectionType: 'metrics', sectionName: 'Metrics/Results', pageMaster: 'body-2col-sidebar', masterName: 'Body — 2-column + Sidebar', enabled: true },
    { sectionType: 'comparison', sectionName: 'Comparison/Analysis', pageMaster: 'body-2col', masterName: 'Body — 2-column', enabled: true }
  ],
  'proposal': [
    { sectionType: 'cover', sectionName: 'Cover', pageMaster: 'cover-fullbleed', masterName: 'Cover (full-bleed)', enabled: true },
    { sectionType: 'narrative', sectionName: 'Narrative/Approach', pageMaster: 'body-1col', masterName: 'Body — 1-column', enabled: true },
    { sectionType: 'metrics', sectionName: 'Metrics/Pricing', pageMaster: 'body-2col-sidebar', masterName: 'Body — 2-column + Sidebar', enabled: true },
    { sectionType: 'comparison', sectionName: 'Comparison/Benefits', pageMaster: 'body-2col', masterName: 'Body — 2-column', enabled: true }
  ]
}

export function SectionPresets({ control, value, onChange, selectedPageMasters }: SectionPresetsProps) {
  const usage = useWatch({ control, name: 'usage' })
  
  // Get current mappings or generate defaults based on usage type
  const getCurrentMappings = (): SectionMapping[] => {
    if (value?.mappings) {
      // Convert form data to typed mappings
      return value.mappings.map(mapping => ({
        sectionType: mapping.sectionType || '',
        sectionName: mapping.sectionName || '',
        pageMaster: mapping.pageMaster || '',
        masterName: mapping.masterName || '',
        enabled: mapping.enabled || false
      })).filter(mapping => mapping.sectionType) // Filter out invalid mappings
    }
    
    // Generate defaults based on usage type
    const presetMappings = DOCUMENT_TYPE_PRESETS[usage] || DOCUMENT_TYPE_PRESETS['white-paper']
    
    // Filter mappings to only include page masters that are selected
    const selectedMasterIds = ['cover-fullbleed', ...selectedPageMasters.map(m => m.id)]
    
    return presetMappings.map(mapping => {
      // Check if the page master is available
      const isAvailable = selectedMasterIds.includes(mapping.pageMaster)
      
      // If not available, try to find an alternative
      if (!isAvailable) {
        if (mapping.sectionType === 'cover') {
          // Cover always uses cover-fullbleed (always selected)
          return { ...mapping, pageMaster: 'cover-fullbleed', masterName: 'Cover (full-bleed)' }
        } else {
          // For other sections, use the first available master
          const fallbackMaster = selectedMasterIds.find(id => id !== 'cover-fullbleed') || 'body-1col'
          const fallbackName = getMasterDisplayName(fallbackMaster)
          return { ...mapping, pageMaster: fallbackMaster, masterName: fallbackName }
        }
      }
      
      return mapping
    })
  }

  const getMasterDisplayName = (masterId: string): string => {
    const masterNames: Record<string, string> = {
      'cover-fullbleed': 'Cover (full-bleed)',
      'body-1col': 'Body — 1-column',
      'body-2col': 'Body — 2-column',
      'body-2col-sidebar': 'Body — 2-column + Sidebar',
      'data-portrait': 'Data (portrait)'
    }
    return masterNames[masterId] || masterId
  }

  const currentMappings = getCurrentMappings()

  const toggleMapping = (index: number) => {
    const newMappings = [...currentMappings]
    newMappings[index] = { ...newMappings[index], enabled: !newMappings[index].enabled }
    onChange({ mappings: newMappings })
  }

  const changeMasterForSection = (sectionIndex: number, newMasterId: string) => {
    const newMappings = [...currentMappings]
    newMappings[sectionIndex] = {
      ...newMappings[sectionIndex],
      pageMaster: newMasterId,
      masterName: getMasterDisplayName(newMasterId)
    }
    onChange({ mappings: newMappings })
  }

  // Get available page master options
  const getAvailableMasters = (sectionType: string) => {
    if (sectionType === 'cover') {
      return [{ id: 'cover-fullbleed', name: 'Cover (full-bleed)' }]
    }
    
    const masters = [
      { id: 'body-1col', name: 'Body — 1-column' },
      { id: 'body-2col', name: 'Body — 2-column' },
      { id: 'body-2col-sidebar', name: 'Body — 2-column + Sidebar' },
      { id: 'data-portrait', name: 'Data (portrait)' }
    ]
    
    const selectedIds = selectedPageMasters.map(m => m.id)
    return masters.filter(master => selectedIds.includes(master.id))
  }

  const getUsageDisplayName = (usageId: string): string => {
    const names: Record<string, string> = {
      'white-paper': 'White Paper',
      'report': 'Report', 
      'annual-report': 'Annual Report',
      'ebook': 'E-book',
      'case-study': 'Case Study',
      'proposal': 'Proposal'
    }
    return names[usageId] || usageId
  }

  if (!usage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Section Presets
          </CardTitle>
          <CardDescription>
            Please select a document type first to configure section-to-page-master mappings.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layout className="h-5 w-5" />
          Section Presets
        </CardTitle>
        <CardDescription>
          Configure how different document sections map to page masters for {getUsageDisplayName(usage)} documents.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentMappings.map((mapping, index) => (
          <div key={`${mapping.sectionType}-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={mapping.enabled}
                onCheckedChange={() => toggleMapping(index)}
                disabled={mapping.sectionType === 'cover'} // Cover is always required
              />
              <div>
                <Label className="font-medium">{mapping.sectionName}</Label>
                {mapping.sectionType === 'cover' && (
                  <Badge variant="secondary" className="ml-2 text-xs">Required</Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <select
                value={mapping.pageMaster}
                onChange={(e) => changeMasterForSection(index, e.target.value)}
                disabled={!mapping.enabled || mapping.sectionType === 'cover'}
                className="text-sm bg-background border rounded px-2 py-1"
              >
                {getAvailableMasters(mapping.sectionType).map(master => (
                  <option key={master.id} value={master.id}>
                    {master.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
        
        {currentMappings.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Layout className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No section presets available for this document type.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default SectionPresets