import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Type,
  Palette,
  Image,
  FileImage
} from 'lucide-react'
import { typographyPairings } from '@/components/admin/TypographySelector'
import { generateMotifAssets } from '@/lib/svg-motif-generator'
import { exportPageAsPNG } from '@/lib/page-composer'
import { adjustForAACompliance, getContrastRatio } from '@/lib/colorway-generator'

interface HealthCheckResult {
  id: string
  name: string
  description: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  icon: React.ComponentType<{ className?: string }>
  suggestedFix?: string
}

interface TemplateGeneratorHealthCheckProps {
  onComplete?: (results: HealthCheckResult[]) => void
}

export function TemplateGeneratorHealthCheck({ onComplete }: TemplateGeneratorHealthCheckProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<HealthCheckResult[]>([])
  const [hasRun, setHasRun] = useState(false)

  const runHealthCheck = async () => {
    setIsRunning(true)
    setHasRun(true)
    
    const checkResults: HealthCheckResult[] = []

    // 1. Check typography pairings availability
    try {
      const pairingCount = typographyPairings.length
      if (pairingCount >= 3) {
        checkResults.push({
          id: 'typography-pairings',
          name: 'Typography Pairings',
          description: 'Font pairing system availability',
          status: 'pass',
          message: `${pairingCount} typography pairings available`,
          icon: Type
        })
      } else if (pairingCount >= 1) {
        checkResults.push({
          id: 'typography-pairings',
          name: 'Typography Pairings',
          description: 'Font pairing system availability',
          status: 'warning',
          message: `Only ${pairingCount} typography pairing(s) available`,
          icon: Type,
          suggestedFix: 'Add more typography pairings to provide variety in template generation'
        })
      } else {
        checkResults.push({
          id: 'typography-pairings',
          name: 'Typography Pairings',
          description: 'Font pairing system availability',
          status: 'fail',
          message: 'No typography pairings found',
          icon: Type,
          suggestedFix: 'Configure default typography pairings: Inter × Source Serif, Roboto × Merriweather'
        })
      }
    } catch (error) {
      checkResults.push({
        id: 'typography-pairings',
        name: 'Typography Pairings',
        description: 'Font pairing system availability',
        status: 'fail',
        message: 'Typography pairing system error',
        icon: Type,
        suggestedFix: 'Check typography selector configuration'
      })
    }

    // 2. Check AA guardrails
    try {
      // Test AA compliance functions
      const testTextColor = '#333333'
      const testBgColor = '#ffffff'
      const contrastRatio = getContrastRatio(testTextColor, testBgColor)
      const adjustedColor = adjustForAACompliance(testTextColor, testBgColor, 4.5)
      
      if (contrastRatio >= 4.5 && adjustedColor) {
        checkResults.push({
          id: 'aa-guardrails',
          name: 'AA Guardrails',
          description: 'WCAG AA compliance system',
          status: 'pass',
          message: 'AA compliance functions operational',
          icon: Shield
        })
      } else {
        checkResults.push({
          id: 'aa-guardrails',
          name: 'AA Guardrails',
          description: 'WCAG AA compliance system',
          status: 'warning',
          message: 'AA compliance functions present but may need calibration',
          icon: Shield,
          suggestedFix: 'Verify contrast ratio calculations and AA adjustment algorithms'
        })
      }
    } catch (error) {
      checkResults.push({
        id: 'aa-guardrails',
        name: 'AA Guardrails',
        description: 'WCAG AA compliance system',
        status: 'fail',
        message: 'AA compliance system error',
        icon: Shield,
        suggestedFix: 'Enable WCAG AA compliance checking with 4.5:1 minimum contrast ratio'
      })
    }

    // 3. Check SVG motif generator
    try {
      const testColors = {
        brand: '#3b82f6',
        brandSecondary: '#1d4ed8',
        borderSubtle: '#e5e7eb',
        textMuted: '#6b7280'
      }
      const motifAssets = generateMotifAssets(testColors)
      
      if (motifAssets.length >= 3 && motifAssets.every(asset => asset.variants.length > 0)) {
        checkResults.push({
          id: 'svg-motif-generator',
          name: 'SVG Motif Generator',
          description: 'Procedural vector asset generation',
          status: 'pass',
          message: `${motifAssets.length} motif types with ${motifAssets.reduce((sum, asset) => sum + asset.variants.length, 0)} total variants`,
          icon: Palette
        })
      } else {
        checkResults.push({
          id: 'svg-motif-generator',
          name: 'SVG Motif Generator',
          description: 'Procedural vector asset generation',
          status: 'warning',
          message: 'SVG motif generator has limited variants',
          icon: Palette,
          suggestedFix: 'Add more motif variants for body backgrounds, dividers, and cover shapes'
        })
      }
    } catch (error) {
      checkResults.push({
        id: 'svg-motif-generator',
        name: 'SVG Motif Generator',
        description: 'Procedural vector asset generation',
        status: 'fail',
        message: 'SVG motif generator error',
        icon: Palette,
        suggestedFix: 'Configure SVG motif generation with background patterns, dividers, and cover shapes'
      })
    }

    // 4. Check PNG export pipeline
    try {
      // Create a temporary test element
      const testElement = document.createElement('div')
      testElement.id = 'health-check-test-element'
      testElement.style.cssText = 'width: 100px; height: 100px; background: #f0f0f0; position: absolute; top: -9999px;'
      testElement.textContent = 'Test'
      document.body.appendChild(testElement)

      try {
        const blob = await exportPageAsPNG('health-check-test-element', 'test.png', { width: 100, height: 100 })
        if (blob && blob.size > 0) {
          checkResults.push({
            id: 'png-export-pipeline',
            name: 'PNG Export Pipeline',
            description: 'Template preview export system',
            status: 'pass',
            message: 'PNG export pipeline operational',
            icon: FileImage
          })
        } else {
          checkResults.push({
            id: 'png-export-pipeline',
            name: 'PNG Export Pipeline',
            description: 'Template preview export system',
            status: 'fail',
            message: 'PNG export produced empty result',
            icon: FileImage,
            suggestedFix: 'Configure html2canvas for PNG preview generation'
          })
        }
      } finally {
        document.body.removeChild(testElement)
      }
    } catch (error) {
      checkResults.push({
        id: 'png-export-pipeline',
        name: 'PNG Export Pipeline',
        description: 'Template preview export system',
        status: 'fail',
        message: 'PNG export pipeline error',
        icon: FileImage,
        suggestedFix: 'Install and configure html2canvas dependency for preview generation'
      })
    }

    setResults(checkResults)
    onComplete?.(checkResults)
    setIsRunning(false)
  }

  const getStatusColor = (status: HealthCheckResult['status']) => {
    switch (status) {
      case 'pass':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'fail':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: HealthCheckResult['status']) => {
    switch (status) {
      case 'pass':
        return CheckCircle
      case 'warning':
        return AlertTriangle
      case 'fail':
        return XCircle
      default:
        return AlertTriangle
    }
  }

  const overallStatus = hasRun ? (
    results.some(r => r.status === 'fail') ? 'fail' :
    results.some(r => r.status === 'warning') ? 'warning' : 'pass'
  ) : null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <CardTitle>System Health Check</CardTitle>
            {hasRun && overallStatus && (
              <Badge 
                variant={overallStatus === 'pass' ? 'default' : overallStatus === 'warning' ? 'secondary' : 'destructive'}
              >
                {overallStatus === 'pass' ? 'All Systems Go' : 
                 overallStatus === 'warning' ? 'Minor Issues' : 'Action Required'}
              </Badge>
            )}
          </div>
          <Button 
            onClick={runHealthCheck} 
            disabled={isRunning}
            size="sm"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Run Health Check
              </>
            )}
          </Button>
        </div>
        <CardDescription>
          Verify template generation systems: type pairings, AA guardrails, SVG motifs, and PNG export pipeline
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasRun ? (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Run the health check to verify all template generation systems are operational and properly configured.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {results.map((result) => {
              const StatusIcon = getStatusIcon(result.status)
              const IconComponent = result.icon
              
              return (
                <div 
                  key={result.id}
                  className={`border rounded-lg p-4 ${getStatusColor(result.status)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 flex items-center gap-2">
                      <IconComponent className="w-5 h-5" />
                      <StatusIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-sm">{result.name}</h4>
                        <Badge 
                          variant={result.status === 'pass' ? 'default' : result.status === 'warning' ? 'secondary' : 'destructive'}
                          className="text-xs"
                        >
                          {result.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm opacity-80 mb-2">{result.message}</p>
                      {result.suggestedFix && (
                        <div className="text-xs opacity-70 mt-2 p-2 bg-white/50 rounded border border-current/20">
                          <strong>Suggested fix:</strong> {result.suggestedFix}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            
            {hasRun && (
              <div className="pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Health check completed. {results.filter(r => r.status === 'pass').length} of {results.length} systems operational.
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}