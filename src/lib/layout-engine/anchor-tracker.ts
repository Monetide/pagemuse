export interface AnchorReference {
  id: string
  type: 'heading' | 'figure' | 'table' | 'callout'
  blockId: string
  pageNumber: number
  columnIndex: number
  positionInColumn: number
  title?: string
  number?: number
}

export interface CrossReference {
  id: string
  sourceBlockId: string
  targetAnchorId: string
  type: 'see' | 'figure' | 'table' | 'section'
  text: string
}

export class AnchorTracker {
  private anchors: Map<string, AnchorReference> = new Map()
  private crossReferences: CrossReference[] = []
  private figureCounter = 0
  private tableCounter = 0

  registerAnchor(
    anchorId: string,
    type: AnchorReference['type'],
    blockId: string,
    pageNumber: number,
    columnIndex: number,
    positionInColumn: number,
    title?: string
  ): void {
    // Auto-generate numbers for figures and tables
    let number: number | undefined
    if (type === 'figure') {
      number = ++this.figureCounter
    } else if (type === 'table') {
      number = ++this.tableCounter
    }

    const anchor: AnchorReference = {
      id: anchorId,
      type,
      blockId,
      pageNumber,
      columnIndex,
      positionInColumn,
      title,
      number
    }

    this.anchors.set(anchorId, anchor)
  }

  getAnchor(anchorId: string): AnchorReference | undefined {
    return this.anchors.get(anchorId)
  }

  getAllAnchors(): AnchorReference[] {
    return Array.from(this.anchors.values())
  }

  getAnchorsByType(type: AnchorReference['type']): AnchorReference[] {
    return Array.from(this.anchors.values()).filter(anchor => anchor.type === type)
  }

  getAnchorsByPage(pageNumber: number): AnchorReference[] {
    return Array.from(this.anchors.values()).filter(anchor => anchor.pageNumber === pageNumber)
  }

  addCrossReference(
    sourceBlockId: string,
    targetAnchorId: string,
    type: CrossReference['type'],
    text: string
  ): void {
    const crossRef: CrossReference = {
      id: `xref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sourceBlockId,
      targetAnchorId,
      type,
      text
    }

    this.crossReferences.push(crossRef)
  }

  getCrossReferences(): CrossReference[] {
    return [...this.crossReferences]
  }

  getCrossReferencesForBlock(blockId: string): CrossReference[] {
    return this.crossReferences.filter(ref => ref.sourceBlockId === blockId)
  }

  resolveCrossReference(crossRefId: string): {
    crossReference: CrossReference
    anchor?: AnchorReference
    resolvedText: string
  } | null {
    const crossRef = this.crossReferences.find(ref => ref.id === crossRefId)
    if (!crossRef) return null

    const anchor = this.anchors.get(crossRef.targetAnchorId)
    
    let resolvedText = crossRef.text
    if (anchor) {
      // Generate appropriate reference text based on type
      switch (crossRef.type) {
        case 'figure':
          resolvedText = `Figure ${anchor.number || '?'}`
          if (anchor.title) {
            resolvedText += `: ${anchor.title}`
          }
          break
        case 'table':
          resolvedText = `Table ${anchor.number || '?'}`
          if (anchor.title) {
            resolvedText += `: ${anchor.title}`
          }
          break
        case 'section':
          resolvedText = anchor.title || `Section on page ${anchor.pageNumber}`
          break
        case 'see':
          resolvedText = `see page ${anchor.pageNumber}`
          break
      }
    }

    return {
      crossReference: crossRef,
      anchor,
      resolvedText
    }
  }

  generateTableOfContents(): {
    id: string
    title: string
    level: number
    pageNumber: number
    anchorId: string
  }[] {
    const headingAnchors = this.getAnchorsByType('heading')
    
    return headingAnchors
      .sort((a, b) => {
        // Sort by page number, then by position in column
        if (a.pageNumber !== b.pageNumber) {
          return a.pageNumber - b.pageNumber
        }
        if (a.columnIndex !== b.columnIndex) {
          return a.columnIndex - b.columnIndex
        }
        return a.positionInColumn - b.positionInColumn
      })
      .map(anchor => ({
        id: anchor.id,
        title: anchor.title || 'Untitled',
        level: this.getHeadingLevel(anchor.blockId),
        pageNumber: anchor.pageNumber,
        anchorId: anchor.id
      }))
  }

  generateListOfFigures(): {
    id: string
    title: string
    number: number
    pageNumber: number
    anchorId: string
  }[] {
    const figureAnchors = this.getAnchorsByType('figure')
    
    return figureAnchors
      .sort((a, b) => (a.number || 0) - (b.number || 0))
      .map(anchor => ({
        id: anchor.id,
        title: anchor.title || 'Untitled Figure',
        number: anchor.number || 0,
        pageNumber: anchor.pageNumber,
        anchorId: anchor.id
      }))
  }

  generateListOfTables(): {
    id: string
    title: string
    number: number
    pageNumber: number
    anchorId: string
  }[] {
    const tableAnchors = this.getAnchorsByType('table')
    
    return tableAnchors
      .sort((a, b) => (a.number || 0) - (b.number || 0))
      .map(anchor => ({
        id: anchor.id,
        title: anchor.title || 'Untitled Table',
        number: anchor.number || 0,
        pageNumber: anchor.pageNumber,
        anchorId: anchor.id
      }))
  }

  private getHeadingLevel(blockId: string): number {
    // This would need access to the block data
    // For now, return a default level
    return 1
  }

  clear(): void {
    this.anchors.clear()
    this.crossReferences.length = 0
    this.figureCounter = 0
    this.tableCounter = 0
  }

  updatePageNumbers(anchorId: string, newPageNumber: number): void {
    const anchor = this.anchors.get(anchorId)
    if (anchor) {
      anchor.pageNumber = newPageNumber
    }
  }

  // Batch update anchors when pages are reordered or content moves
  updateAnchorPositions(updates: Array<{
    anchorId: string
    pageNumber: number
    columnIndex: number
    positionInColumn: number
  }>): void {
    updates.forEach(update => {
      const anchor = this.anchors.get(update.anchorId)
      if (anchor) {
        anchor.pageNumber = update.pageNumber
        anchor.columnIndex = update.columnIndex
        anchor.positionInColumn = update.positionInColumn
      }
    })
  }

  // Get anchors that need to be updated after pagination changes
  getOrphanedAnchors(): AnchorReference[] {
    // Return anchors that may have been displaced during pagination
    // This could be used to validate anchor integrity after layout changes
    return Array.from(this.anchors.values()).filter(anchor => {
      // Add validation logic here if needed
      return false
    })
  }
}