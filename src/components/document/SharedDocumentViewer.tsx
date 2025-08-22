import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, Eye, FileText, Download, AlertTriangle } from 'lucide-react';
import { DocumentRenderer } from './DocumentRenderer';
import { useToast } from '@/hooks/use-toast';

interface SharedDocument {
  document: {
    id: string;
    title: string;
    content: any;
  };
  permissions: {
    role: string;
    canDownload: boolean;
    hasWatermark: boolean;
  };
  linkInfo: {
    viewCount: number;
    maxViews?: number;
    expiresAt?: string;
  };
}

export const SharedDocumentViewer = () => {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [document, setDocument] = useState<SharedDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      loadSharedDocument();
    }
  }, [token]);

  const loadSharedDocument = async (passwordAttempt?: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('handle-share-link', {
        body: { 
          token,
          password: passwordAttempt || password 
        }
      });

      if (error) {
        if (error.message === 'Password required') {
          setRequiresPassword(true);
          return;
        }
        throw error;
      }

      setDocument(data);
      setRequiresPassword(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load shared document');
      if (err.message === 'Invalid password') {
        setRequiresPassword(true);
        toast({
          title: 'Invalid password',
          description: 'Please check your password and try again',
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      loadSharedDocument(password);
    }
  };

  const downloadDocument = () => {
    if (!document || !document.permissions.canDownload) return;

    const blob = new Blob([JSON.stringify(document.document.content, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = globalThis.document.createElement('a');
    a.href = url;
    a.download = `${document.document.title}.json`;
    globalThis.document.body.appendChild(a);
    a.click();
    globalThis.document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Document downloaded',
      description: 'Document has been downloaded to your device'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error && !requiresPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (requiresPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle>Password Required</CardTitle>
            <CardDescription>
              This shared document is password protected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              <Button type="submit" className="w-full" disabled={!password.trim() || loading}>
                {loading ? 'Verifying...' : 'Access Document'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!document) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-primary" />
                <h1 className="text-xl font-semibold">{document.document.title}</h1>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  <Eye className="w-3 h-3 mr-1" />
                  {document.permissions.role}
                </Badge>
                {document.permissions.hasWatermark && (
                  <Badge variant="secondary">Watermarked</Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {document.linkInfo.maxViews && (
                <span className="text-sm text-muted-foreground">
                  {document.linkInfo.viewCount}/{document.linkInfo.maxViews} views
                </span>
              )}
              {document.permissions.canDownload && (
                <Button onClick={downloadDocument} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              )}
            </div>
          </div>

          {document.linkInfo.expiresAt && (
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                Expires: {new Date(document.linkInfo.expiresAt).toLocaleDateString()}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Watermark overlay */}
      {document.permissions.hasWatermark && (
        <div className="fixed inset-0 pointer-events-none z-10 flex items-center justify-center opacity-10">
          <div className="transform rotate-45 text-6xl font-bold text-gray-800 select-none">
            {document.document.content.watermark || 'CONFIDENTIAL'}
          </div>
        </div>
      )}

      {/* Document Content */}
      <div className="container mx-auto px-4 py-8 relative z-20">
        <div className="max-w-4xl mx-auto">
          <div className="prose max-w-none">
            <h1>{document.document.title}</h1>
            <div>Document content would be rendered here</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t mt-8 py-4 bg-muted/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>This document is shared with {document.permissions.role} permissions.</p>
          {document.permissions.hasWatermark && (
            <p className="mt-1">This document contains watermarks and is for authorized viewing only.</p>
          )}
        </div>
      </div>
    </div>
  );
};