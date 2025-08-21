import React from 'react'
import { DocumentBuilder } from '@/components/document/DocumentBuilder'

export const DocumentModelTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Document Model Test</h1>
          <p className="text-muted-foreground">
            Test the semantic document structure: Document → Section → Flow → Block
          </p>
        </div>
        <DocumentBuilder />
      </div>
    </div>
  )
}