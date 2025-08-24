export interface ObjectStyle {
  id: string
  name: string
  type: 'figure' | 'table' | 'callout' | 'toc-item'
  properties: Record<string, any>
  variants?: Record<string, any>
}

export interface Snippet {
  id: string
  name: string
  description: string
  category: 'metrics' | 'content' | 'navigation'
  content: any
  preview: string
}

export const DEFAULT_OBJECT_STYLES: ObjectStyle[] = [
  {
    id: 'figure-default',
    name: 'Figure',
    type: 'figure',
    properties: {
      captionStyle: 'caption',
      spacing: { top: 16, bottom: 16 },
      widthPresets: ['column', 'full'],
      defaultWidth: 'column',
      alignment: 'center',
      captionPosition: 'bottom'
    }
  },
  {
    id: 'table-default', 
    name: 'Table',
    type: 'table',
    properties: {
      headerStyle: 'caption-bold',
      cellPadding: 8,
      gridColor: 'border-subtle',
      alternateRows: true,
      repeatHeader: true,
      headerBackground: 'bg-section',
      textAlign: 'left'
    }
  },
  {
    id: 'callout-default',
    name: 'Callout',
    type: 'callout',
    properties: {
      keepTogether: true,
      accentWidth: 4,
      padding: { top: 16, right: 16, bottom: 16, left: 20 },
      borderRadius: 8
    },
    variants: {
      info: {
        accentColor: 'brand',
        backgroundColor: 'bg-section',
        iconColor: 'brand'
      },
      tip: {
        accentColor: 'brand-secondary',
        backgroundColor: 'bg-section',
        iconColor: 'brand-secondary'
      },
      warning: {
        accentColor: 'warning',
        backgroundColor: 'warning-light',
        iconColor: 'warning'
      }
    }
  },
  {
    id: 'toc-item-default',
    name: 'TOC Item',
    type: 'toc-item',
    properties: {
      textStyle: 'body',
      dotLeader: true,
      pageNumberAlign: 'right',
      spacing: { top: 4, bottom: 4 },
      indentUnit: 16
    }
  }
]

export const DEFAULT_SNIPPETS: Snippet[] = [
  {
    id: 'kpi-strip',
    name: 'KPI Strip',
    description: '3-metric performance dashboard',
    category: 'metrics',
    preview: '📊 Revenue | 📈 Growth | 👥 Users',
    content: {
      type: 'kpi-strip',
      metrics: [
        { label: 'Revenue', value: '$2.4M', change: '+12%', trend: 'up' },
        { label: 'Growth', value: '23%', change: '+5%', trend: 'up' },
        { label: 'Users', value: '45.2K', change: '+8%', trend: 'up' }
      ],
      layout: 'horizontal',
      style: 'modern'
    }
  },
  {
    id: 'pull-quote',
    name: 'Pull Quote',
    description: 'Highlighted quote with attribution',
    category: 'content', 
    preview: '"Design is not just what it looks like..." — Steve Jobs',
    content: {
      type: 'pull-quote',
      quote: 'Design is not just what it looks like and feels like. Design is how it works.',
      attribution: 'Steve Jobs',
      style: 'large',
      alignment: 'center'
    }
  },
  {
    id: 'cta-button',
    name: 'Call to Action', 
    description: 'Prominent action button with description',
    category: 'content',
    preview: '🚀 Get Started — Download our free guide',
    content: {
      type: 'cta',
      title: 'Ready to get started?',
      description: 'Download our comprehensive guide and transform your workflow today.',
      buttonText: 'Download Free Guide',
      buttonStyle: 'primary',
      alignment: 'center'
    }
  }
]

export function getObjectStyle(id: string): ObjectStyle | undefined {
  return DEFAULT_OBJECT_STYLES.find(style => style.id === id)
}

export function getSnippet(id: string): Snippet | undefined {
  return DEFAULT_SNIPPETS.find(snippet => snippet.id === id)
}

export function getStylesByType(type: ObjectStyle['type']): ObjectStyle[] {
  return DEFAULT_OBJECT_STYLES.filter(style => style.type === type)
}

export function getSnippetsByCategory(category: Snippet['category']): Snippet[] {
  return DEFAULT_SNIPPETS.filter(snippet => snippet.category === category)
}