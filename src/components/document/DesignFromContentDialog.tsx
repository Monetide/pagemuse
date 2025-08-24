import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';
import { FileText, Upload, Link, AlertCircle, Sparkles, Loader2, Globe, X } from 'lucide-react';

interface DesignFromContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm?: (payload: IngestPayload) => void;
}

interface IngestPayload {
  type: 'paste' | 'upload' | 'url';
  content: string;
  metadata?: {
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    domain?: string;
    additionalFiles?: File[];
  };
}

export const DesignFromContentDialog = ({ open, onOpenChange, onConfirm }: DesignFromContentDialogProps) => {
  const { currentWorkspace } = useWorkspaceContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'paste' | 'upload' | 'url'>('paste');
  const [pastedContent, setPastedContent] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [fetchedContent, setFetchedContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const supportedFormats = ['.docx', '.pdf', '.txt', '.md', '.html'];
  const supportedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/pdf',
    'text/plain',
    'text/markdown',
    'text/html'
  ];
  const maxFileSize = 10; // MB
  
  const hasContent = () => {
    switch (activeTab) {
      case 'paste':
        return pastedContent.trim().length > 0;
      case 'upload':
        return uploadedFiles.length > 0;
      case 'url':
        return urlInput.trim().length > 0 && isValidUrl(urlInput) && fetchedContent.length > 0;
      default:
        return false;
    }
  };
  
  const isValidUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  };
  
  const getDomainFromUrl = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  };
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setError(null);
    
    if (files.length === 0) return;
    
    const validFiles = files.filter(file => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      const isValidFormat = supportedFormats.includes(extension) || 
                           supportedMimeTypes.includes(file.type);
      const isValidSize = file.size <= maxFileSize * 1024 * 1024;
      
      if (!isValidFormat) {
        setError(`File "${file.name}" is not a supported format. Please use: ${supportedFormats.join(', ')}`);
        return false;
      }
      
      if (!isValidSize) {
        setError(`File "${file.name}" is too large. Maximum size is ${maxFileSize}MB.`);
        return false;
      }
      
      return true;
    });
    
    if (validFiles.length === 0) return;
    
    setUploadedFiles(validFiles);
  };
  
  const handleUrlFetch = async () => {
    if (!isValidUrl(urlInput)) {
      setError('Please enter a valid HTTP or HTTPS URL');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setFetchedContent('');
    
    try {
      // Note: In a real implementation, this would need to be done through a backend
      // due to CORS restrictions. For now, we'll simulate the fetch.
      const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(urlInput)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const htmlContent = data.contents;
      
      if (!htmlContent) {
        throw new Error('No content found at this URL');
      }
      
      setFetchedContent(htmlContent);
    } catch (err) {
      console.error('URL fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch content from URL. Try a different source.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleContinue = () => {
    if (!hasContent()) return;
    
    let payload: IngestPayload;
    
    switch (activeTab) {
      case 'paste':
        payload = {
          type: 'paste',
          content: pastedContent,
        };
        break;
        
      case 'upload': {
        const primaryFile = uploadedFiles[0];
        const additionalFiles = uploadedFiles.slice(1);
        payload = {
          type: 'upload',
          content: '', // Will be populated by file reading
          metadata: {
            fileName: primaryFile.name,
            fileSize: primaryFile.size,
            fileType: primaryFile.type,
            additionalFiles: additionalFiles.length > 0 ? additionalFiles : undefined,
          },
        };
        break;
      }
        
      case 'url':
        payload = {
          type: 'url',
          content: fetchedContent,
          metadata: {
            domain: getDomainFromUrl(urlInput),
          },
        };
        break;
        
      default:
        return;
    }
    
    onConfirm?.(payload);
    handleClose();
  };
  
  const handleClose = () => {
    // Reset form when closing
    setPastedContent('');
    setUploadedFiles([]);
    setUrlInput('');
    setFetchedContent('');
    setError(null);
    setIsLoading(false);
    setActiveTab('paste');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onOpenChange(false);
  };
  
  const clearError = () => {
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Design from content
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-destructive font-medium">{error}</p>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs text-destructive/80 hover:text-destructive"
                      onClick={clearError}
                    >
                      Try a different source
                    </Button>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto w-auto p-1"
                  onClick={clearError}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
          
          {/* Workspace Info */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              Creating in workspace:
              <Badge variant="secondary" className="font-medium">
                {currentWorkspace?.name || 'Default Workspace'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Paste text or upload {supportedFormats.join(', ')} files. We'll design it beautifully.
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="paste" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Paste
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="url" className="flex items-center gap-2">
                <Link className="w-4 h-4" />
                URL
              </TabsTrigger>
            </TabsList>

            <div className="mt-6 overflow-y-auto max-h-[400px]">
              <TabsContent value="paste" className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Paste your content
                  </label>
                  <Textarea
                    placeholder="Paste your text, markdown, or any content here..."
                    value={pastedContent}
                    onChange={(e) => setPastedContent(e.target.value)}
                    className="min-h-[200px] resize-none"
                    onFocus={clearError}
                  />
                  {pastedContent.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {pastedContent.length.toLocaleString()} characters
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="upload" className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Upload files
                  </label>
                  <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
                    <CardContent className="p-6">
                      <input
                        ref={fileInputRef}
                        type="file"
                        id="file-upload"
                        multiple
                        accept={supportedFormats.join(',')}
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer flex flex-col items-center justify-center text-center"
                      >
                        <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                        <p className="text-sm font-medium text-foreground mb-1">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {supportedFormats.join(', ')} up to {maxFileSize}MB each
                        </p>
                      </label>
                    </CardContent>
                  </Card>
                  
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Selected files:</p>
                        {uploadedFiles.length > 1 && (
                          <Badge variant="secondary" className="text-xs">
                            Using first file, {uploadedFiles.length - 1} stored for later
                          </Badge>
                        )}
                      </div>
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className={`flex items-center justify-between p-2 rounded-md ${
                          index === 0 ? 'bg-primary/10 border border-primary/20' : 'bg-muted'
                        }`}>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            <span className="text-sm">{file.name}</span>
                            {index === 0 && (
                              <Badge variant="secondary" className="text-xs">Primary</Badge>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {(file.size / (1024 * 1024)).toFixed(1)}MB
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="url" className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Website URL
                  </label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        type="url"
                        placeholder="https://example.com/article"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        onFocus={clearError}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleUrlFetch}
                        disabled={!isValidUrl(urlInput) || isLoading}
                        variant="outline"
                        className="px-3"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Fetch'
                        )}
                      </Button>
                    </div>
                    
                    {urlInput.length > 0 && isValidUrl(urlInput) && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Globe className="w-4 h-4" />
                        <span>Domain: {getDomainFromUrl(urlInput)}</span>
                      </div>
                    )}
                    
                    {urlInput.length > 0 && !isValidUrl(urlInput) && (
                      <div className="flex items-center gap-2 text-sm text-destructive">
                        <AlertCircle className="w-4 h-4" />
                        Please enter a valid HTTP or HTTPS URL
                      </div>
                    )}
                    
                    {fetchedContent && (
                      <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-success">
                          <Sparkles className="w-4 h-4" />
                          Content fetched successfully ({fetchedContent.length.toLocaleString()} characters)
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-2">
                    We'll extract and format the content from the webpage
                  </p>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          {/* File Size Limits Info */}
          <div className="mt-6 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Supported formats: {supportedFormats.join(', ')}</p>
                <p>Maximum file size: {maxFileSize}MB per file</p>
                <p>Multiple files will be processed sequentially</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleContinue}
            disabled={!hasContent() || isLoading}
            className="bg-gradient-primary hover:shadow-glow transition-all duration-200"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Continue
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};