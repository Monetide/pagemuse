import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  FileText, 
  Palette, 
  Building2,
  Plus,
  Search,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { 
  getDocTypeWithTracking, 
  getStylePackWithTracking, 
  getIndustryWithTracking,
  getAllDocTypes,
  getAllStylePacks,
  getAllIndustries,
  getRegistryStatus,
  type DocType,
  type StylePack,
  type Industry
} from '@/lib/registries/registry-manager'

export function RegistryDemo() {
  const [testId, setTestId] = useState('')
  const [testResults, setTestResults] = useState<{
    docType?: DocType
    stylePack?: StylePack
    industry?: Industry  
  }>({})
  const [registryStatus, setRegistryStatus] = useState(getRegistryStatus())

  const handleTestId = () => {
    if (!testId) return
    
    const results = {
      docType: getDocTypeWithTracking(testId),
      stylePack: getStylePackWithTracking(testId),
      industry: getIndustryWithTracking(testId)
    }
    
    setTestResults(results)
    setRegistryStatus(getRegistryStatus())
  }

  const refreshStatus = () => {
    setRegistryStatus(getRegistryStatus())
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          Registry Demo
        </CardTitle>
        <CardDescription>
          Test the auto-creation behavior for docType, stylePack, and industry registries
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Registry Status */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-900">Doc Types</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {registryStatus.docTypes.total}
              </div>
              <div className="text-sm text-blue-600">
                {registryStatus.docTypes.autoCreated} auto-created
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Palette className="w-4 h-4 text-purple-600" />
                <span className="font-medium text-purple-900">Style Packs</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {registryStatus.stylePacks.total}
              </div>
              <div className="text-sm text-purple-600">
                {registryStatus.stylePacks.autoCreated} auto-created
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-900">Industries</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {registryStatus.industries.total}
              </div>
              <div className="text-sm text-green-600">
                {registryStatus.industries.autoCreated} auto-created
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Auto-Creation */}
        <div className="space-y-4">
          <h4 className="font-semibold">Test Auto-Creation</h4>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="testId">Enter unknown ID to test auto-creation:</Label>
              <Input
                id="testId"
                value={testId}
                onChange={(e) => setTestId(e.target.value)}
                placeholder="e.g., medical-journal, startup-modern, aerospace"
              />
            </div>
            <Button onClick={handleTestId} className="self-end">
              <Search className="w-4 h-4 mr-2" />
              Test ID
            </Button>
            <Button variant="outline" onClick={refreshStatus} className="self-end">
              Refresh
            </Button>
          </div>
        </div>

        {/* Test Results */}
        {Object.keys(testResults).length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold">Test Results for "{testId}"</h4>
            
            {testResults.docType && (
              <Card className="border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Document Type
                    <Badge variant="outline" className="text-blue-600">
                      {testResults.docType.category}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-sm">
                    <div><strong>Name:</strong> {testResults.docType.name}</div>
                    <div><strong>Description:</strong> {testResults.docType.description}</div>
                    <div><strong>Default Sections:</strong> {testResults.docType.defaultSections.join(', ')}</div>
                    <div><strong>Page Masters:</strong> Cover ({testResults.docType.pageMasters.cover.layout}), Body ({testResults.docType.pageMasters.body.layout})</div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {testResults.stylePack && (
              <Card className="border-purple-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Palette className="w-4 h-4 text-purple-600" />
                    Style Pack
                    <Badge variant="outline" className="text-purple-600">
                      {testResults.stylePack.category}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-sm">
                    <div><strong>Name:</strong> {testResults.stylePack.name}</div>
                    <div><strong>Description:</strong> {testResults.stylePack.description}</div>
                    <div><strong>Typography:</strong> {testResults.stylePack.typography.headingFont.family} + {testResults.stylePack.typography.bodyFont.family}</div>
                    <div><strong>Spacing:</strong> Base unit {testResults.stylePack.spacing.baseUnit}rem</div>
                    <div><strong>Dividers:</strong> {testResults.stylePack.dividers.styles.length} styles</div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {testResults.industry && (
              <Card className="border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-green-600" />
                    Industry
                    <Badge variant="outline" className="text-green-600">
                      {testResults.industry.category}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-sm">
                    <div><strong>Name:</strong> {testResults.industry.name}</div>
                    <div><strong>Description:</strong> {testResults.industry.description}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <strong>Palette:</strong>
                      <div className="flex gap-1">
                        <div 
                          className="w-4 h-4 rounded border border-gray-300"
                          style={{ backgroundColor: testResults.industry.palette.primary }}
                          title="Primary"
                        />
                        <div 
                          className="w-4 h-4 rounded border border-gray-300"
                          style={{ backgroundColor: testResults.industry.palette.secondary }}
                          title="Secondary"
                        />
                        <div 
                          className="w-4 h-4 rounded border border-gray-300"
                          style={{ backgroundColor: testResults.industry.palette.accent }}
                          title="Accent"
                        />
                      </div>
                    </div>
                    <div><strong>Snippet Hints:</strong> {testResults.industry.snippetHints.length} templates</div>
                    <div><strong>Common Terms:</strong> {testResults.industry.commonTerms.slice(0, 4).join(', ')}...</div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Pre-registered Items */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <h5 className="font-medium mb-2 text-blue-900">Registered Doc Types</h5>
            <div className="space-y-1">
              {getAllDocTypes().slice(0, 5).map(docType => (
                <div key={docType.id} className="text-sm flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-blue-600" />
                  {docType.name}
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h5 className="font-medium mb-2 text-purple-900">Registered Style Packs</h5>
            <div className="space-y-1">
              {getAllStylePacks().slice(0, 5).map(stylePack => (
                <div key={stylePack.id} className="text-sm flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-purple-600" />
                  {stylePack.name}
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h5 className="font-medium mb-2 text-green-900">Registered Industries</h5>
            <div className="space-y-1">
              {getAllIndustries().slice(0, 5).map(industry => (
                <div key={industry.id} className="text-sm flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  {industry.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}