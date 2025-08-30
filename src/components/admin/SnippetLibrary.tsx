import React from 'react'
import { Control, useWatch } from 'react-hook-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  FileText, 
  DollarSign, 
  Shield, 
  Heart, 
  Building,
  Quote,
  TrendingUp,
  AlertTriangle
} from 'lucide-react'

export interface SnippetData {
  snippets?: string[]
}

interface SnippetLibraryProps {
  control: Control<any>
  value?: SnippetData
  onChange: (data: SnippetData) => void
  className?: string
}

interface Snippet {
  id: string
  name: string
  category: 'common' | 'finance' | 'insurance' | 'healthcare' | 'annual-report'
  docTypes: string[]
  industries?: string[]
  preview: string
  description: string
  content: string
}

const SNIPPET_LIBRARY: Snippet[] = [
  // Common snippets
  {
    id: 'kpi-3up',
    name: 'KPI 3-Up',
    category: 'common',
    docTypes: ['white-paper', 'report', 'annual-report', 'case-study'],
    preview: '📊 Revenue: $2.4M (+12%) | Growth: 23% (+5%) | Users: 45.2K (+8%)',
    description: 'Three key performance indicators in a row layout',
    content: `<div class="kpi-strip">
  <div class="kpi-item">
    <div class="kpi-value">$2.4M</div>
    <div class="kpi-label">Revenue</div>
    <div class="kpi-change">+12%</div>
  </div>
  <div class="kpi-item">
    <div class="kpi-value">23%</div>
    <div class="kpi-label">Growth</div>
    <div class="kpi-change">+5%</div>
  </div>
  <div class="kpi-item">
    <div class="kpi-value">45.2K</div>
    <div class="kpi-label">Users</div> 
    <div class="kpi-change">+8%</div>
  </div>
</div>`
  },
  {
    id: 'pull-quote',
    name: 'Pull Quote',
    category: 'common',
    docTypes: ['white-paper', 'report', 'annual-report', 'ebook', 'case-study'],
    preview: '"Design is not just what it looks like. Design is how it works." — Steve Jobs',
    description: 'Highlighted quote with attribution',
    content: `<blockquote class="pull-quote">
  <p>"Design is not just what it looks like and feels like. Design is how it works."</p>
  <footer>— Steve Jobs</footer>
</blockquote>`
  },
  {
    id: 'cta',
    name: 'Call to Action',
    category: 'common',
    docTypes: ['white-paper', 'ebook', 'case-study', 'proposal'],
    preview: '🎯 Ready to get started? Download our comprehensive guide today.',
    description: 'Action-oriented section to drive engagement',
    content: `<div class="cta-section">
  <h3>Ready to get started?</h3>
  <p>Download our comprehensive guide today.</p>
  <button class="cta-button">Download Free Guide</button>
</div>`
  },

  // Finance snippets
  {
    id: 'disclaimer-finance',
    name: 'Financial Disclaimer',
    category: 'finance',
    docTypes: ['report', 'annual-report', 'white-paper'],
    industries: ['finance', 'insurance'],
    preview: '⚠️ This material is for informational purposes only...',
    description: 'Standard financial disclaimer and risk warning',
    content: `<div class="disclaimer financial">
  <h4>Important Disclaimer</h4>
  <p>This material is for informational purposes only and should not be construed as investment advice. Past performance does not guarantee future results. All investments carry risk of loss.</p>
</div>`
  },
  {
    id: 'forward-looking-statement',
    name: 'Forward-Looking Statement',
    category: 'finance',
    docTypes: ['annual-report', 'report'],
    industries: ['finance', 'insurance', 'public-sector'],
    preview: '📈 Statements regarding future events are forward-looking...',
    description: 'Legal disclaimer for predictive statements',
    content: `<div class="forward-looking-disclaimer">
  <h4>Forward-Looking Statements</h4>
  <p>This document contains forward-looking statements. These statements involve risks and uncertainties that could cause actual results to differ materially from those expressed or implied.</p>
</div>`
  },

  // Insurance snippets  
  {
    id: 'disclaimer-insurance',
    name: 'Insurance Disclaimer',
    category: 'insurance',
    docTypes: ['report', 'white-paper', 'proposal'],
    industries: ['insurance'],
    preview: '🛡️ Coverage details may vary by state and policy...',
    description: 'Insurance-specific disclaimer and coverage notes',
    content: `<div class="disclaimer insurance">
  <h4>Coverage Disclaimer</h4>
  <p>Coverage details may vary by state and policy. This is a general overview and does not constitute a contract. Please refer to your policy documents for complete terms and conditions.</p>
</div>`
  },
  {
    id: 'terms-summary',
    name: 'Terms Summary',
    category: 'insurance',
    docTypes: ['proposal', 'report'],
    industries: ['insurance'],
    preview: '📋 Policy Term: 12 months | Premium: $XXX/month | Deductible: $XXX',
    description: 'Quick summary of policy terms and conditions',
    content: `<div class="terms-summary">
  <h4>Policy Summary</h4>
  <ul>
    <li><strong>Policy Term:</strong> 12 months</li>
    <li><strong>Premium:</strong> $XXX/month</li>
    <li><strong>Deductible:</strong> $XXX</li>
    <li><strong>Coverage Limit:</strong> $XXX</li>
  </ul>
</div>`
  },

  // Healthcare snippets
  {
    id: 'hipaa-note',
    name: 'HIPAA Notice',
    category: 'healthcare',
    docTypes: ['report', 'white-paper', 'case-study'],
    industries: ['healthcare'],
    preview: '🏥 All patient information has been de-identified in accordance with HIPAA...',
    description: 'HIPAA compliance notice for healthcare documents',
    content: `<div class="hipaa-notice">
  <h4>Privacy Notice</h4>
  <p>All patient information in this document has been de-identified in accordance with HIPAA privacy regulations. No protected health information is disclosed.</p>
</div>`
  },

  // Annual Report snippets
  {
    id: 'letter-from-ceo',
    name: 'Letter from CEO',
    category: 'annual-report',
    docTypes: ['annual-report'],
    preview: '👔 Dear Shareholders, I am pleased to present our annual results...',
    description: 'Executive letter template for annual reports',
    content: `<div class="ceo-letter">
  <h2>Letter from the CEO</h2>
  <p>Dear Shareholders,</p>
  <p>I am pleased to present our annual results and reflect on a year of significant achievement and growth...</p>
  <p>Sincerely,<br/>[CEO Name]<br/>Chief Executive Officer</p>
</div>`
  },
  {
    id: 'governance-summary',
    name: 'Governance Summary',
    category: 'annual-report',
    docTypes: ['annual-report'],
    preview: '🏛️ Our Board consists of X independent directors...',
    description: 'Corporate governance overview for annual reports',
    content: `<div class="governance-summary">
  <h3>Corporate Governance</h3>
  <p>Our Board consists of [X] independent directors who provide strategic oversight and ensure accountability to our shareholders.</p>
  <ul>
    <li>Board Independence: XX%</li>
    <li>Diversity: XX% diverse representation</li>
    <li>Committees: Audit, Compensation, Nominating</li>
  </ul>
</div>`
  }
]

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'common': return <FileText className="w-4 h-4" />
    case 'finance': return <DollarSign className="w-4 h-4" />
    case 'insurance': return <Shield className="w-4 h-4" />
    case 'healthcare': return <Heart className="w-4 h-4" />
    case 'annual-report': return <Building className="w-4 h-4" />
    default: return <FileText className="w-4 h-4" />
  }
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'common': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'finance': return 'bg-green-100 text-green-800 border-green-200'
    case 'insurance': return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'healthcare': return 'bg-red-100 text-red-800 border-red-200'
    case 'annual-report': return 'bg-amber-100 text-amber-800 border-amber-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export function SnippetLibrary({ control, value, onChange, className }: SnippetLibraryProps) {
  const usage = useWatch({ control, name: 'usage' })
  const industry = useWatch({ control, name: 'industry' })
  
  const selectedSnippets = value?.snippets || []
  
  // Filter snippets based on document type and industry
  const getFilteredSnippets = () => {
    return SNIPPET_LIBRARY.filter(snippet => {
      // Filter by document type
      const matchesDocType = !usage || snippet.docTypes.includes(usage)
      
      // Filter by industry (if snippet has industry restrictions)
      const matchesIndustry = !snippet.industries || !industry || snippet.industries.includes(industry)
      
      return matchesDocType && matchesIndustry
    })
  }
  
  const filteredSnippets = getFilteredSnippets()
  
  // Group snippets by category
  const groupedSnippets = filteredSnippets.reduce((groups, snippet) => {
    const category = snippet.category
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(snippet)
    return groups
  }, {} as Record<string, Snippet[]>)
  
  const toggleSnippet = (snippetId: string) => {
    const currentSnippets = selectedSnippets || []
    const newSnippets = currentSnippets.includes(snippetId)
      ? currentSnippets.filter(id => id !== snippetId)
      : [...currentSnippets, snippetId]
    
    onChange({ snippets: newSnippets })
  }
  
  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'common': return 'Common'
      case 'finance': return 'Finance'
      case 'insurance': return 'Insurance' 
      case 'healthcare': return 'Healthcare'
      case 'annual-report': return 'Annual Report'
      default: return category
    }
  }

  if (!usage) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Quote className="w-5 h-5" />
            Snippets
          </CardTitle>
          <CardDescription>
            Please select a document type first to see available content snippets.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Quote className="w-5 h-5" />
          Snippets
        </CardTitle>
        <CardDescription>
          Select reusable content snippets filtered by document type and industry.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {Object.entries(groupedSnippets).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Quote className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No snippets available for the selected document type and industry.</p>
          </div>
        ) : (
          Object.entries(groupedSnippets).map(([category, snippets]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                {getCategoryIcon(category)}
                <h4 className="font-medium text-sm">{getCategoryTitle(category)}</h4>
                <Badge variant="outline" className={`text-xs ${getCategoryColor(category)}`}>
                  {snippets.length} snippet{snippets.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              
              <div className="space-y-3">
                {snippets.map((snippet) => {
                  const isSelected = selectedSnippets.includes(snippet.id)
                  
                  return (
                    <div key={snippet.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <Label className="font-medium">{snippet.name}</Label>
                            <Switch
                              checked={isSelected}
                              onCheckedChange={() => toggleSnippet(snippet.id)}
                            />
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {snippet.description}
                          </p>
                          
                          {/* Tiny inline preview */}
                          {isSelected && (
                            <div className="mt-3 p-3 bg-muted/50 rounded-lg border-l-4 border-primary">
                              <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                                Preview:
                              </Label>
                              <div className="text-sm text-foreground">
                                {snippet.preview}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {category !== Object.keys(groupedSnippets)[Object.keys(groupedSnippets).length - 1] && (
                <Separator className="mt-6" />
              )}
            </div>
          ))
        )}
        
            {selectedSnippets && selectedSnippets.length > 0 && (
              <div className="mt-6 p-3 bg-primary/5 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <Label className="text-sm font-medium">Selected Snippets</Label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedSnippets.map(snippetId => {
                    const snippet = SNIPPET_LIBRARY.find(s => s.id === snippetId)
                    return snippet ? (
                      <Badge key={snippetId} variant="secondary" className="text-xs">
                        {snippet.name}
                      </Badge>
                    ) : null
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  These snippets will be included as starter content in your template.
                </p>
              </div>
            )}
      </CardContent>
    </Card>
  )
}

export default SnippetLibrary