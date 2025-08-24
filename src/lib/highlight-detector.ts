import { IRDocument, IRBlock, IRSection } from './ir-types'

export interface HighlightCandidate {
  id: string
  type: 'quote' | 'stat' | 'key-sentence' | 'lead-sentence'
  text: string
  originalBlockId: string
  sectionIndex: number
  blockIndex: number
  suggestedInsertionPoint: {
    afterParagraph: number
    sectionIndex: number
    estimatedPage?: number
  }
  confidence: number // 0-1 score of how good this highlight is
  reason: string // Why this was selected as a highlight
}

export class HighlightDetector {
  private readonly MIN_HIGHLIGHT_LENGTH = 20
  private readonly MAX_HIGHLIGHT_LENGTH = 200
  private readonly MIN_DISTANCE_BETWEEN_HIGHLIGHTS = 3 // blocks
  private readonly MAX_HIGHLIGHTS = 10

  detectHighlights(irDocument: IRDocument): HighlightCandidate[] {
    const candidates: HighlightCandidate[] = []
    let candidateId = 0

    irDocument.sections.forEach((section, sectionIndex) => {
      section.blocks.forEach((block, blockIndex) => {
        // Detect different types of highlights
        const blockCandidates = [
          ...this.detectQuoteCandidates(block, sectionIndex, blockIndex, candidateId),
          ...this.detectStatCandidates(block, sectionIndex, blockIndex, candidateId),
          ...this.detectKeySentences(block, sectionIndex, blockIndex, candidateId),
          ...this.detectLeadSentences(block, sectionIndex, blockIndex, candidateId)
        ]

        candidates.push(...blockCandidates)
        candidateId += blockCandidates.length
      })
    })

    // Sort by confidence and apply distance filtering
    const sortedCandidates = candidates
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, this.MAX_HIGHLIGHTS * 2) // Get more than we need for filtering

    return this.filterByDistance(sortedCandidates).slice(0, this.MAX_HIGHLIGHTS)
  }

  private detectQuoteCandidates(
    block: IRBlock, 
    sectionIndex: number, 
    blockIndex: number, 
    baseId: number
  ): HighlightCandidate[] {
    if (block.type !== 'paragraph' && block.type !== 'quote') return []

    const text = this.extractTextFromBlock(block)
    const quotes = this.extractQuotes(text)

    return quotes.map((quote, index) => ({
      id: `quote-${baseId}-${index}`,
      type: 'quote' as const,
      text: quote.text,
      originalBlockId: block.id,
      sectionIndex,
      blockIndex,
      suggestedInsertionPoint: this.calculateInsertionPoint(sectionIndex, blockIndex),
      confidence: this.calculateQuoteConfidence(quote.text),
      reason: quote.reason
    }))
  }

  private detectStatCandidates(
    block: IRBlock, 
    sectionIndex: number, 
    blockIndex: number, 
    baseId: number
  ): HighlightCandidate[] {
    if (block.type !== 'paragraph') return []

    const text = this.extractTextFromBlock(block)
    const stats = this.extractStatistics(text)

    return stats.map((stat, index) => ({
      id: `stat-${baseId}-${index}`,
      type: 'stat' as const,
      text: stat.text,
      originalBlockId: block.id,
      sectionIndex,
      blockIndex,
      suggestedInsertionPoint: this.calculateInsertionPoint(sectionIndex, blockIndex),
      confidence: this.calculateStatConfidence(stat.text),
      reason: stat.reason
    }))
  }

  private detectKeySentences(
    block: IRBlock, 
    sectionIndex: number, 
    blockIndex: number, 
    baseId: number
  ): HighlightCandidate[] {
    if (block.type !== 'paragraph') return []

    const text = this.extractTextFromBlock(block)
    const sentences = this.splitIntoSentences(text)
    const keySentences = sentences.filter(sentence => this.isKeySentence(sentence))

    return keySentences.map((sentence, index) => ({
      id: `key-${baseId}-${index}`,
      type: 'key-sentence' as const,
      text: sentence,
      originalBlockId: block.id,
      sectionIndex,
      blockIndex,
      suggestedInsertionPoint: this.calculateInsertionPoint(sectionIndex, blockIndex),
      confidence: this.calculateKeySentenceConfidence(sentence),
      reason: this.getKeySentenceReason(sentence)
    }))
  }

  private detectLeadSentences(
    block: IRBlock, 
    sectionIndex: number, 
    blockIndex: number, 
    baseId: number
  ): HighlightCandidate[] {
    if (block.type !== 'paragraph' || blockIndex !== 0) return [] // Only first paragraph of section

    const text = this.extractTextFromBlock(block)
    const firstSentence = this.splitIntoSentences(text)[0]

    if (!firstSentence || !this.isGoodLeadSentence(firstSentence)) return []

    return [{
      id: `lead-${baseId}`,
      type: 'lead-sentence' as const,
      text: firstSentence,
      originalBlockId: block.id,
      sectionIndex,
      blockIndex,
      suggestedInsertionPoint: this.calculateInsertionPoint(sectionIndex, blockIndex),
      confidence: this.calculateLeadSentenceConfidence(firstSentence),
      reason: "Opening sentence of section"
    }]
  }

  private extractTextFromBlock(block: IRBlock): string {
    if (typeof block.content === 'string') return block.content
    if (block.content?.text) return block.content.text
    if (block.content?.content) return block.content.content
    return ''
  }

  private extractQuotes(text: string): Array<{ text: string; reason: string }> {
    const quotes: Array<{ text: string; reason: string }> = []
    
    // Look for text in quotes
    const quotedText = text.match(/"([^"]{20,200})"/g)
    if (quotedText) {
      quotedText.forEach(quote => {
        const cleanQuote = quote.slice(1, -1) // Remove quotes
        quotes.push({
          text: cleanQuote,
          reason: "Direct quotation"
        })
      })
    }

    // Look for emphasized text that could be quotes
    const emphasizedPatterns = [
      /\*\*([^*]{20,200})\*\*/g, // Bold
      /\*([^*]{20,200})\*/g,     // Italic
      /_([^_]{20,200})_/g        // Underscore
    ]

    emphasizedPatterns.forEach(pattern => {
      const matches = text.match(pattern)
      if (matches) {
        matches.forEach(match => {
          const cleanText = match.replace(/[\*_]/g, '')
          if (this.looksLikeQuote(cleanText)) {
            quotes.push({
              text: cleanText,
              reason: "Emphasized text"
            })
          }
        })
      }
    })

    return quotes.filter(quote => 
      quote.text.length >= this.MIN_HIGHLIGHT_LENGTH && 
      quote.text.length <= this.MAX_HIGHLIGHT_LENGTH
    )
  }

  private extractStatistics(text: string): Array<{ text: string; reason: string }> {
    const stats: Array<{ text: string; reason: string }> = []
    
    // Look for sentences with numbers and percentages
    const sentences = this.splitIntoSentences(text)
    
    sentences.forEach(sentence => {
      if (this.containsStatistics(sentence)) {
        stats.push({
          text: sentence,
          reason: this.getStatReason(sentence)
        })
      }
    })

    return stats.filter(stat => 
      stat.text.length >= this.MIN_HIGHLIGHT_LENGTH && 
      stat.text.length <= this.MAX_HIGHLIGHT_LENGTH
    )
  }

  private splitIntoSentences(text: string): string[] {
    return text.split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10)
  }

  private isKeySentence(sentence: string): boolean {
    const keyIndicators = [
      /\b(important|crucial|essential|key|critical|significant|major)\b/i,
      /\b(however|therefore|consequently|furthermore|moreover|nevertheless)\b/i,
      /\b(results? show|data reveals?|findings indicate|research demonstrates)\b/i,
      /\b(in conclusion|to summarize|most importantly|it turns out)\b/i
    ]

    return keyIndicators.some(pattern => pattern.test(sentence)) &&
           sentence.length >= this.MIN_HIGHLIGHT_LENGTH &&
           sentence.length <= this.MAX_HIGHLIGHT_LENGTH
  }

  private isGoodLeadSentence(sentence: string): boolean {
    return sentence.length >= this.MIN_HIGHLIGHT_LENGTH &&
           sentence.length <= this.MAX_HIGHLIGHT_LENGTH &&
           !sentence.toLowerCase().startsWith('the') &&
           !sentence.toLowerCase().startsWith('this') &&
           !sentence.toLowerCase().startsWith('in')
  }

  private looksLikeQuote(text: string): boolean {
    const quoteIndicators = [
      /\bsaid\b/i,
      /\bstated\b/i,
      /\bexplained\b/i,
      /\baccording to\b/i,
      /\I\b/,
      /\bwe\b/
    ]

    return quoteIndicators.some(pattern => pattern.test(text))
  }

  private containsStatistics(sentence: string): boolean {
    const statPatterns = [
      /\d+%/,                    // Percentages
      /\$[\d,]+/,                // Money
      /\b\d+\.\d+\b/,           // Decimals
      /\b\d{4,}\b/,             // Large numbers
      /\b(increased|decreased|rose|fell|grew|dropped).{0,20}\d+/i,
      /\b\d+.{0,20}(times|fold|percent|million|billion|thousand)/i
    ]

    return statPatterns.some(pattern => pattern.test(sentence))
  }

  private calculateInsertionPoint(sectionIndex: number, blockIndex: number) {
    return {
      afterParagraph: blockIndex + 1,
      sectionIndex,
      estimatedPage: Math.floor((sectionIndex * 10 + blockIndex) / 25) + 1 // Rough estimate
    }
  }

  private calculateQuoteConfidence(text: string): number {
    let confidence = 0.6 // Base confidence for quotes
    
    if (text.includes('"')) confidence += 0.2
    if (/\bsaid\b|\bstated\b/i.test(text)) confidence += 0.1
    if (text.length > 50 && text.length < 120) confidence += 0.1 // Ideal length
    
    return Math.min(confidence, 1)
  }

  private calculateStatConfidence(text: string): number {
    let confidence = 0.7 // Base confidence for stats
    
    if (text.includes('%')) confidence += 0.1
    if (/\$[\d,]+/.test(text)) confidence += 0.1
    if (/\b(study|research|survey|data)\b/i.test(text)) confidence += 0.1
    
    return Math.min(confidence, 1)
  }

  private calculateKeySentenceConfidence(sentence: string): number {
    let confidence = 0.5 // Base confidence
    
    if (/\b(important|crucial|essential|key)\b/i.test(sentence)) confidence += 0.2
    if (/\b(however|therefore|consequently)\b/i.test(sentence)) confidence += 0.1
    if (sentence.length > 40 && sentence.length < 100) confidence += 0.1
    
    return Math.min(confidence, 1)
  }

  private calculateLeadSentenceConfidence(sentence: string): number {
    let confidence = 0.4 // Base confidence
    
    if (!/^(the|this|in|a)\b/i.test(sentence)) confidence += 0.2 // Good opening
    if (sentence.length > 30 && sentence.length < 80) confidence += 0.2
    
    return Math.min(confidence, 1)
  }

  private getKeySentenceReason(sentence: string): string {
    if (/\b(important|crucial|essential|key)\b/i.test(sentence)) return "Contains key indicators"
    if (/\b(however|therefore|consequently)\b/i.test(sentence)) return "Transition sentence"
    if (/\b(results? show|findings indicate)\b/i.test(sentence)) return "Research findings"
    return "Key sentence pattern"
  }

  private getStatReason(sentence: string): string {
    if (sentence.includes('%')) return "Contains percentage"
    if (/\$[\d,]+/.test(sentence)) return "Contains financial data"
    if (/\b\d{4,}\b/.test(sentence)) return "Contains large numbers"
    return "Contains statistical information"
  }

  private filterByDistance(candidates: HighlightCandidate[]): HighlightCandidate[] {
    const filtered: HighlightCandidate[] = []
    
    for (const candidate of candidates) {
      const tooClose = filtered.some(existing => {
        return existing.sectionIndex === candidate.sectionIndex &&
               Math.abs(existing.blockIndex - candidate.blockIndex) < this.MIN_DISTANCE_BETWEEN_HIGHLIGHTS
      })
      
      if (!tooClose) {
        filtered.push(candidate)
      }
    }
    
    return filtered
  }
}