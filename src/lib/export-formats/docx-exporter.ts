import { SemanticDocument, Block } from '@/lib/document-model'
import { LayoutResult } from '@/lib/layout-engine'
import { TOCEntry } from '@/lib/toc-generator'
import { ExportOptions } from '@/lib/export-engine'

export interface DOCXExportData {
  document: SemanticDocument
  sections: any[]
  layoutResults: Map<string, LayoutResult>
  tocEntries: TOCEntry[]
  pageCount: number
}

export class DOCXExporter {
  async export(data: DOCXExportData, options: ExportOptions): Promise<{ downloadUrl: string; fileSize: number }> {
    // DOCX generation implementation
    // This would use a library like docx or officegen
    
    console.log('Generating DOCX with options:', options)
    console.log('Document data:', data)

    // Create DOCX document structure
    const docxStructure = this.createDOCXStructure(data, options)
    
    // Generate the actual DOCX file
    await this.generateDOCX(docxStructure, data, options)

    // Simulate file generation
    await new Promise(resolve => setTimeout(resolve, 1500))

    return {
      downloadUrl: `/api/exports/${data.document.id}-${Date.now()}.docx`,
      fileSize: Math.floor(Math.random() * 1000000) + 200000 // 0.2-1.2MB
    }
  }

  private createDOCXStructure(data: DOCXExportData, options: ExportOptions) {
    return {
      properties: {
        title: data.document.title,
        creator: 'PageMuse',
        description: data.document.description || '',
        lastModifiedBy: 'PageMuse Export Engine',
        revision: '1',
        createdAt: new Date(),
        modifiedAt: new Date()
      },
      styles: this.createStyles(),
      sections: this.createSections(data, options),
      footnotes: this.extractFootnotes(data),
      numbering: this.createNumbering()
    }
  }

  private createStyles() {
    return {
      paragraphStyles: [
        {
          id: 'Normal',
          name: 'Normal',
          basedOn: 'Normal',
          run: {
            font: 'Calibri',
            size: 22 // 11pt in half-points
          },
          paragraph: {
            spacing: { after: 120 } // 6pt
          }
        },
        {
          id: 'Heading1',
          name: 'Heading 1', 
          basedOn: 'Normal',
          run: {
            font: 'Calibri',
            size: 32, // 16pt
            bold: true,
            color: '2F5496'
          },
          paragraph: {
            spacing: { before: 240, after: 120 },
            outlineLevel: 0
          }
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal', 
          run: {
            font: 'Calibri',
            size: 28, // 14pt
            bold: true,
            color: '2F5496'
          },
          paragraph: {
            spacing: { before: 200, after: 100 },
            outlineLevel: 1
          }
        },
        {
          id: 'Heading3',
          name: 'Heading 3',
          basedOn: 'Normal',
          run: {
            font: 'Calibri', 
            size: 24, // 12pt
            bold: true,
            color: '1F3763'
          },
          paragraph: {
            spacing: { before: 160, after: 80 },
            outlineLevel: 2
          }
        },
        {
          id: 'Caption',
          name: 'Caption',
          basedOn: 'Normal',
          run: {
            font: 'Calibri',
            size: 20, // 10pt
            italic: true,
            color: '44546A'
          },
          paragraph: {
            spacing: { after: 60 }
          }
        },
        {
          id: 'Quote',
          name: 'Quote',
          basedOn: 'Normal',
          run: {
            font: 'Calibri',
            size: 22,
            italic: true,
            color: '595959'
          },
          paragraph: {
            spacing: { before: 120, after: 120 },
            indent: { left: 720 } // 0.5 inch
          }
        },
        {
          id: 'FootnoteText',
          name: 'Footnote Text',
          basedOn: 'Normal',
          run: {
            font: 'Calibri',
            size: 20 // 10pt
          }
        }
      ],
      characterStyles: [
        {
          id: 'FootnoteReference',
          name: 'Footnote Reference',
          run: {
            verticalAlign: 'superscript'
          }
        }
      ]
    }
  }

  private createSections(data: DOCXExportData, options: ExportOptions) {
    const sections = []

    // Add TOC section if requested
    if (options.includeTOC && data.tocEntries.length > 0) {
      sections.push(this.createTOCSection(data.tocEntries))
    }

    // Add content sections
    data.sections.forEach(section => {
      const layoutResult = data.layoutResults.get(section.id)
      if (layoutResult) {
        sections.push(this.createContentSection(section, layoutResult, options))
      }
    })

    return sections
  }

  private createTOCSection(tocEntries: TOCEntry[]) {
    return {
      type: 'toc',
      properties: {
        pageBreakBefore: true
      },
      children: [
        {
          type: 'paragraph',
          properties: {
            style: 'Heading1'
          },
          children: [
            {
              type: 'text',
              text: 'Table of Contents'
            }
          ]
        },
        {
          type: 'tableOfContents',
          properties: {
            stylesWithLevels: [
              { styleId: 'Heading1', level: 1 },
              { styleId: 'Heading2', level: 2 },
              { styleId: 'Heading3', level: 3 },
              { styleId: 'Heading4', level: 4 },
              { styleId: 'Heading5', level: 5 },
              { styleId: 'Heading6', level: 6 }
            ]
          }
        }
      ]
    }
  }

  private createContentSection(section: any, layout: LayoutResult, options: ExportOptions) {
    const children = []

    // Add section title if not the first section
    if (section.order > 0) {
      children.push({
        type: 'paragraph',
        properties: {
          style: 'Heading1',
          pageBreakBefore: true
        },
        children: [
          {
            type: 'text',
            text: section.name
          }
        ]
      })
    }

    // Process all blocks in the section
    section.flows.forEach((flow: any) => {
      flow.blocks
        .sort((a: Block, b: Block) => a.order - b.order)
        .forEach((block: Block) => {
          const docxBlock = this.convertBlockToDOCX(block, options)
          if (docxBlock) {
            children.push(...(Array.isArray(docxBlock) ? docxBlock : [docxBlock]))
          }
        })
    })

    return {
      type: 'section',
      properties: {
        page: {
          size: {
            orientation: section.pageMaster.orientation || 'portrait',
            width: this.inchesToDXA(this.getPageWidth(section.pageMaster)),
            height: this.inchesToDXA(this.getPageHeight(section.pageMaster))
          },
          margin: {
            top: this.inchesToDXA(section.pageMaster.margins.top),
            right: this.inchesToDXA(section.pageMaster.margins.right),
            bottom: this.inchesToDXA(section.pageMaster.margins.bottom),
            left: this.inchesToDXA(section.pageMaster.margins.left)
          }
        }
      },
      children
    }
  }

  private convertBlockToDOCX(block: Block, options: ExportOptions): any | any[] {
    switch (block.type) {
      case 'heading':
        const level = Math.min(block.metadata?.level || 1, 6)
        return {
          type: 'paragraph',
          properties: {
            style: `Heading${level}`,
            bookmark: `heading-${block.id}`
          },
          children: [
            {
              type: 'text',
              text: typeof block.content === 'string' ? block.content : block.content?.text || ''
            }
          ]
        }

      case 'paragraph':
        const content = typeof block.content === 'string' ? block.content : block.content?.text || ''
        
        return {
          type: 'paragraph',
          properties: {
            style: 'Normal'
          },
          children: [
            {
              type: 'text',
              text: content
            }
          ]
        }

      case 'quote':
        return {
          type: 'paragraph',
          properties: {
            style: 'Quote'
          },
          children: [
            {
              type: 'text',
              text: typeof block.content === 'string' ? block.content : block.content?.text || ''
            }
          ]
        }

      case 'ordered-list':
      case 'unordered-list':
        const items = Array.isArray(block.content) ? block.content : [block.content]
        return items.map((item: string, index: number) => ({
          type: 'paragraph',
          properties: {
            style: 'Normal',
            numbering: {
              reference: block.type === 'ordered-list' ? 'numberedList' : 'bulletList',
              level: 0
            }
          },
          children: [
            {
              type: 'text',
              text: item
            }
          ]
        }))

      case 'figure':
        const figureElements = []
        
        // Add image placeholder
        figureElements.push({
          type: 'paragraph',
          properties: {
            style: 'Normal',
            alignment: 'center'
          },
          children: [
            {
              type: 'drawing',
              properties: {
                inline: {
                  extent: {
                    cx: this.inchesToEMU(4), // 4 inches wide
                    cy: this.inchesToEMU(3)  // 3 inches tall
                  }
                }
              },
              media: {
                type: 'image',
                src: block.content?.imageUrl || '',
                altText: block.content?.altText || 'Figure'
              }
            }
          ]
        })

        // Add caption if present
        if (block.content?.caption) {
          figureElements.push({
            type: 'paragraph',
            properties: {
              style: 'Caption',
              alignment: 'center'
            },
            children: [
              {
                type: 'text',
                text: `Figure ${block.content.number || '1'}: ${block.content.caption}`
              }
            ]
          })
        }

        return figureElements

      case 'table':
        const tableData = block.content || { headers: [], rows: [] }
        const headers = tableData.headers || []
        const rows = tableData.rows || []

        const tableRows = []

        // Add header row
        if (headers.length > 0) {
          tableRows.push({
            type: 'tableRow',
            properties: {
              tableHeader: true
            },
            children: headers.map((header: string) => ({
              type: 'tableCell',
              properties: {
                shading: {
                  fill: 'E7E6E6'
                }          
              },
              children: [
                {
                  type: 'paragraph',
                  properties: {
                    style: 'Normal'
                  },
                  children: [
                    {
                      type: 'text',
                      text: header,
                      bold: true
                    }
                  ]
                }
              ]
            }))
          })
        }

        // Add data rows
        rows.forEach((row: string[]) => {
          tableRows.push({
            type: 'tableRow',
            children: row.map((cell: string) => ({
              type: 'tableCell',
              children: [
                {
                  type: 'paragraph',
                  properties: {
                    style: 'Normal'
                  },
                  children: [
                    {
                      type: 'text',
                      text: cell
                    }
                  ]
                }
              ]
            }))
          })
        })

        const tableElements = []

        tableElements.push({
          type: 'table',
          properties: {
            borders: {
              top: { style: 'single', size: 4, color: '000000' },
              bottom: { style: 'single', size: 4, color: '000000' },
              left: { style: 'single', size: 4, color: '000000' },
              right: { style: 'single', size: 4, color: '000000' },
              insideHorizontal: { style: 'single', size: 4, color: '000000' },
              insideVertical: { style: 'single', size: 4, color: '000000' }
            }
          },
          children: tableRows
        })

        // Add caption if present
        if (tableData.caption) {
          tableElements.push({
            type: 'paragraph',
            properties: {
              style: 'Caption',
              alignment: 'center'
            },
            children: [
              {
                type: 'text',
                text: `Table ${tableData.number || '1'}: ${tableData.caption}`
              }
            ]
          })
        }

        return tableElements

      case 'table-of-contents':
        // TOC block is handled separately
        return null

      case 'footnote':
        // Footnotes are handled as part of the footnotes collection
        return null

      default:
        return {
          type: 'paragraph',
          properties: {
            style: 'Normal'
          },
          children: [
            {
              type: 'text',
              text: `[${block.type}]`
            }
          ]
        }
    }
  }

  private extractFootnotes(data: DOCXExportData) {
    const footnotes = []
    
    data.sections.forEach(section => {
      section.flows.forEach((flow: any) => {
        flow.blocks.forEach((block: Block) => {
          if (block.type === 'footnote') {
            footnotes.push({
              id: block.id,
              children: [
                {
                  type: 'paragraph',
                  properties: {
                    style: 'FootnoteText'
                  },
                  children: [
                    {
                      type: 'text',
                      text: block.content?.content || ''
                    }
                  ]
                }
              ]
            })
          }
        })
      })
    })

    return footnotes
  }

  private createNumbering() {
    return {
      config: [
        {
          reference: 'numberedList',
          levels: [
            {
              level: 0,
              format: 'decimal',
              text: '%1.',
              alignment: 'left',
              style: {
                paragraph: {
                  indent: { left: 720, hanging: 360 }
                }
              }
            }
          ]
        },
        {
          reference: 'bulletList',
          levels: [
            {
              level: 0,
              format: 'bullet',
              text: '•',
              alignment: 'left',
              style: {
                paragraph: {
                  indent: { left: 720, hanging: 360 }
                }
              }
            }
          ]
        }
      ]
    }
  }

  private async generateDOCX(structure: any, data: DOCXExportData, options: ExportOptions) {
    // Generate the actual DOCX file using the structure
    console.log('Generating DOCX file with structure:', structure)
    
    // This would use a library like docx to create the actual file
    // The structure would be converted to the library's format
  }

  private getPageWidth(pageMaster: any): number {
    const PAGE_SIZES: { [key: string]: { width: number; height: number } } = {
      Letter: { width: 8.5, height: 11 },
      A4: { width: 8.27, height: 11.69 },
      Legal: { width: 8.5, height: 14 },
      Tabloid: { width: 11, height: 17 }
    }
    
    const size = PAGE_SIZES[pageMaster.pageSize] || PAGE_SIZES.Letter
    return pageMaster.orientation === 'landscape' ? size.height : size.width
  }

  private getPageHeight(pageMaster: any): number {
    const PAGE_SIZES: { [key: string]: { width: number; height: number } } = {
      Letter: { width: 8.5, height: 11 },
      A4: { width: 8.27, height: 11.69 },
      Legal: { width: 8.5, height: 14 },
      Tabloid: { width: 11, height: 17 }
    }
    
    const size = PAGE_SIZES[pageMaster.pageSize] || PAGE_SIZES.Letter
    return pageMaster.orientation === 'landscape' ? size.width : size.height
  }

  private inchesToDXA(inches: number): number {
    // Convert inches to DXA (twentieths of a point)
    return Math.round(inches * 72 * 20)
  }

  private inchesToEMU(inches: number): number {
    // Convert inches to EMU (English Metric Units)
    return Math.round(inches * 914400)
  }
}

export const docxExporter = new DOCXExporter()