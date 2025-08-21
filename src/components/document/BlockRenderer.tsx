import { Block } from '@/lib/document-model'
import { Minus } from 'lucide-react'

interface BlockRendererProps {
  block: Block
  className?: string
}

export const BlockRenderer = ({ block, className = '' }: BlockRendererProps) => {
  const isChunk = block.metadata?.isChunk
  const chunkIndex = block.metadata?.chunkIndex

  const renderContent = () => {
    switch (block.type) {
      case 'heading':
        const level = block.metadata?.level || 1
        const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements
        const headingClass = level === 1 ? 'text-xl font-bold' : level === 2 ? 'text-lg font-semibold' : 'text-base font-medium'
        
        return (
          <HeadingTag className={`${headingClass} text-foreground mb-2`}>
            {block.content}
          </HeadingTag>
        )
      
      case 'paragraph':
        return (
          <p className="text-sm text-foreground leading-relaxed mb-3">
            {block.content}
          </p>
        )
      
      case 'ordered-list':
        const orderedItems = Array.isArray(block.content) ? block.content : [block.content]
        return (
          <ol className="list-decimal list-inside text-sm text-foreground space-y-1 mb-3 ml-2">
            {orderedItems.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ol>
        )
      
      case 'unordered-list':
        const unorderedItems = Array.isArray(block.content) ? block.content : [block.content]
        return (
          <ul className="list-disc list-inside text-sm text-foreground space-y-1 mb-3 ml-2">
            {unorderedItems.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        )
      
      case 'quote':
        return (
          <blockquote className="border-l-4 border-accent pl-4 py-2 text-sm text-muted-foreground italic mb-3 bg-muted/20">
            "{block.content}"
          </blockquote>
        )
      
      case 'divider':
        return (
          <div className="flex justify-center my-4">
            <Minus className="w-12 h-px text-border" />
          </div>
        )
      
      case 'spacer':
        const height = block.metadata?.height || 0.5
        return (
          <div 
            className="w-full bg-transparent"
            style={{ height: `${height * 24}px` }} // 24px per 0.5 inch approx
          />
        )
      
      default:
        return (
          <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded border border-dashed">
            Unknown block type: {block.type}
          </div>
        )
    }
  }

  return (
    <div className={`block-content ${className}`}>
      {isChunk && (
        <div className="text-xs text-accent font-medium mb-1 flex items-center gap-1">
          <span className="w-2 h-2 bg-accent rounded-full" />
          Continued from previous column (part {chunkIndex! + 1})
        </div>
      )}
      {renderContent()}
    </div>
  )
}