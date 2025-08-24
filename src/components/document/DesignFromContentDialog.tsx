import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';
import { FileText, Upload, Link, AlertCircle, Sparkles } from 'lucide-react';

interface DesignFromContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm?: (content: string, type: 'paste' | 'upload' | 'url') => void;
}

export const DesignFromContentDialog = ({ open, onOpenChange, onConfirm }: DesignFromContentDialogProps) => {
  const { currentWorkspace } = useWorkspaceContext();
  const [activeTab, setActiveTab] = useState<'paste' | 'upload' | 'url'>('paste');
  const [pastedContent, setPastedContent] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [urlInput, setUrlInput] = useState('');
  
  const supportedFormats = ['.docx', '.pdf', '.txt', '.md', '.html'];
  const maxFileSize = 10; // MB
  
  const hasContent = () => {
    switch (activeTab) {
      case 'paste':
        return pastedContent.trim().length > 0;
      case 'upload':
        return uploadedFiles.length > 0;
      case 'url':
        return urlInput.trim().length > 0 && isValidUrl(urlInput);
      default:
        return false;
    }
  };
  
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      const isValidFormat = supportedFormats.includes(extension);
      const isValidSize = file.size <= maxFileSize * 1024 * 1024;
      return isValidFormat && isValidSize;
    });
    setUploadedFiles(validFiles);
  };
  
  const handleContinue = () => {
    if (!hasContent()) return;
    
    let content = '';
    switch (activeTab) {
      case 'paste':
        content = pastedContent;
        break;
      case 'upload':
        content = uploadedFiles[0]?.name || '';
        break;
      case 'url':
        content = urlInput;
        break;
    }
    
    onConfirm?.(content, activeTab);
    onOpenChange(false);
  };
  
  const handleClose = () => {
    // Reset form when closing
    setPastedContent('');
    setUploadedFiles([]);
    setUrlInput('');
    setActiveTab('paste');
    onOpenChange(false);
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
                  />
                  {pastedContent.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {pastedContent.length} characters
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
                      <p className="text-sm font-medium">Selected files:</p>
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            <span className="text-sm">{file.name}</span>
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
                  <Input
                    type="url"
                    placeholder="https://example.com/article"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                  />
                  {urlInput.length > 0 && !isValidUrl(urlInput) && (
                    <div className="flex items-center gap-2 mt-2 text-destructive text-sm">
                      <AlertCircle className="w-4 h-4" />
                      Please enter a valid URL
                    </div>
                  )}
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
            disabled={!hasContent()}
            className="bg-gradient-primary hover:shadow-glow transition-all duration-200"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};