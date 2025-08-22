import { Block } from '@/lib/document-model'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ArrowRight,
  Check,
  X,
  Rocket,
  Shield,
  Users,
  BarChart3
} from 'lucide-react'

interface SnippetBlockRendererProps {
  block: Block
  className?: string
}

export const SnippetBlockRenderer = ({ block, className = '' }: SnippetBlockRendererProps) => {
  const content = block.content || {}

  const renderKPIStrip = () => {
    const items = content.items || []
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 rounded-lg">
        {items.map((item: any, index: number) => (
          <div key={index} className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="text-2xl font-bold text-primary">{item.value}</div>
              {item.trend === 'up' && <TrendingUp className="w-4 h-4 text-success" />}
              {item.trend === 'down' && <TrendingDown className="w-4 h-4 text-destructive" />}
              {item.trend === 'neutral' && <Minus className="w-4 h-4 text-muted-foreground" />}
            </div>
            <div className="text-sm text-muted-foreground font-medium">{item.label}</div>
          </div>
        ))}
      </div>
    )
  }

  const renderPullQuote = () => {
    return (
      <Card className="border-l-4 border-l-primary bg-primary/5 my-6">
        <CardContent className="p-6">
          <blockquote className="text-lg font-medium leading-relaxed text-foreground mb-4">
            "{content.quote}"
          </blockquote>
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-primary">
              {content.attribution}
            </div>
            {content.company && (
              <>
                <div className="text-sm text-muted-foreground">•</div>
                <div className="text-sm text-muted-foreground">
                  {content.company}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderCTACard = () => {
    const isPrimary = content.style === 'primary'
    
    return (
      <Card className={`text-center ${isPrimary ? 'bg-primary text-primary-foreground' : 'border-primary'}`}>
        <CardHeader>
          <CardTitle className={`text-xl ${isPrimary ? 'text-primary-foreground' : 'text-primary'}`}>
            {content.headline}
          </CardTitle>
          <CardDescription className={isPrimary ? 'text-primary-foreground/80' : 'text-muted-foreground'}>
            {content.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            size="lg" 
            variant={isPrimary ? 'secondary' : 'default'}
            className="w-full"
          >
            {content.buttonText}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    )
  }

  const renderFeatureGrid = () => {
    const items = content.items || []
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      rocket: Rocket,
      shield: Shield,
      users: Users,
      chart: BarChart3
    }
    
    return (
      <div className="space-y-4">
        {content.title && (
          <h3 className="text-lg font-semibold text-center text-primary mb-6">
            {content.title}
          </h3>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item: any, index: number) => {
            const IconComponent = iconMap[item.icon] || Rocket
            
            return (
              <Card key={index} className="border-border/50 hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/20">
                      <IconComponent className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm mb-1">{item.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  const renderTimeline = () => {
    const items = content.items || []
    
    return (
      <div className="space-y-4">
        {content.title && (
          <h3 className="text-lg font-semibold text-primary mb-6">
            {content.title}
          </h3>
        )}
        <div className="space-y-4">
          {items.map((item: any, index: number) => (
            <div key={index} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                {index < items.length - 1 && (
                  <div className="w-px h-12 bg-border mt-2"></div>
                )}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-xs">
                    {item.date}
                  </Badge>
                </div>
                <h4 className="font-medium text-sm mb-1">{item.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderContent = () => {
    switch (content.type) {
      case 'kpi-strip':
        return renderKPIStrip()
      case 'pull-quote':
        return renderPullQuote()
      case 'cta-card':
        return renderCTACard()
      case 'feature-grid':
        return renderFeatureGrid()
      case 'timeline':
        return renderTimeline()
      default:
        return (
          <div className="p-4 border border-dashed border-muted-foreground/30 rounded bg-muted/10 text-center">
            <div className="text-sm text-muted-foreground">
              Unknown snippet type: {content.type}
            </div>
          </div>
        )
    }
  }

  return (
    <div className={`snippet-block ${className} mb-6`}>
      {renderContent()}
    </div>
  )
}