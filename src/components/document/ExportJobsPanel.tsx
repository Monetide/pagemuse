import { useState, useEffect } from 'react'
import { ExportJob, exportEngine, ExportFormat } from '@/lib/export-engine'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Download, 
  ExternalLink, 
  RefreshCw, 
  FileText, 
  FileType, 
  Folder,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ExportJobsPanelProps {
  documentId: string
  className?: string
}

export const ExportJobsPanel = ({ documentId, className = '' }: ExportJobsPanelProps) => {
  const [jobs, setJobs] = useState<ExportJob[]>([])

  useEffect(() => {
    const loadJobs = () => {
      const documentJobs = exportEngine.getJobsByDocument(documentId)
      setJobs(documentJobs)
    }

    loadJobs()
    
    // Refresh every 2 seconds while there are active jobs
    const interval = setInterval(() => {
      const documentJobs = exportEngine.getJobsByDocument(documentId)
      setJobs(documentJobs)
      
      const hasActiveJobs = documentJobs.some(job => 
        job.status === 'pending' || job.status === 'processing'
      )
      
      if (!hasActiveJobs) {
        clearInterval(interval)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [documentId])

  const getFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case 'pdf': return <FileText className="w-4 h-4" />
      case 'docx': return <FileType className="w-4 h-4" />
      case 'google-docs': return <Folder className="w-4 h-4" />
    }
  }

  const getStatusIcon = (status: ExportJob['status']) => {
    switch (status) {
      case 'pending':
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-500" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />
    }
  }

  const getStatusColor = (status: ExportJob['status']) => {
    switch (status) {
      case 'pending': return 'default'
      case 'processing': return 'default'
      case 'completed': return 'secondary'
      case 'failed': return 'destructive'
      default: return 'default'
    }
  }

  const handleReExport = (job: ExportJob) => {
    // Re-trigger export with same options
    // This would integrate with the export modal or trigger directly
    console.log('Re-export job:', job.id)
  }

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  if (jobs.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm">Export History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground text-sm py-4">
            No exports yet
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm">Export History</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-3">
            {jobs.map((job, index) => (
              <div key={job.id}>
                <div className="space-y-2">
                  {/* Job header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getFormatIcon(job.format)}
                      <span className="text-sm font-medium">
                        {job.format.toUpperCase()}
                      </span>
                      <Badge variant={getStatusColor(job.status)} className="text-xs">
                        {job.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(job.startTime), { addSuffix: true })}
                    </div>
                  </div>

                  {/* Job details */}
                  <div className="text-xs text-muted-foreground">
                    <div>Scope: {job.options.scope}</div>
                    {job.result?.fileSize && (
                      <div>Size: {formatFileSize(job.result.fileSize)}</div>
                    )}
                    {job.warnings.length > 0 && (
                      <div className="flex items-center gap-1 text-yellow-600">
                        <AlertCircle className="w-3 h-3" />
                        {job.warnings.length} warnings
                      </div>
                    )}
                  </div>

                  {/* Progress bar for active jobs */}
                  {(job.status === 'processing' || job.status === 'pending') && (
                    <div className="w-full bg-secondary rounded-full h-1">
                      <div 
                        className="bg-primary h-1 rounded-full transition-all duration-300"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  )}

                  {/* Error message */}
                  {job.status === 'failed' && job.error && (
                    <div className="text-xs text-destructive bg-destructive/10 rounded p-2">
                      {job.error}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {job.status === 'completed' && job.result?.downloadUrl && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-6 px-2 text-xs"
                        asChild
                      >
                        <a href={job.result.downloadUrl} download>
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </a>
                      </Button>
                    )}
                    
                    {job.status === 'completed' && job.result?.googleDocsUrl && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-6 px-2 text-xs"
                        asChild
                      >
                        <a href={job.result.googleDocsUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Open
                        </a>
                      </Button>
                    )}
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2 text-xs"
                      onClick={() => handleReExport(job)}
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Re-export
                    </Button>
                  </div>
                </div>
                
                {index < jobs.length - 1 && <Separator className="mt-3" />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}