import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, User, AlertTriangle } from 'lucide-react';
import { DocumentRenderer } from './DocumentRenderer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PublishedDocument {
  id: string;
  document_id: string;
  published_by_user_id: string;
  version_number: number;
  title: string;
  content: any;
  published_at: string;
  is_current: boolean;
  metadata: Record<string, any>;
  publisher_profile: {
    display_name?: string;
  } | null;
}

export const PublishedDocumentViewer = () => {
  const { token } = useParams<{ token: string }>();
  const [document, setDocument] = useState<PublishedDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      loadPublishedDocument();
    }
  }, [token]);

  const loadPublishedDocument = async () => {
    try {
      const { data, error } = await supabase
        .from('published_documents')
        .select(`
          *,
          publisher_profile:profiles!published_documents_published_by_user_id_fkey(display_name)
        `)
        .eq('public_url_token', token)
        .single();

      if (error) {
        setError('Published document not found');
        return;
      }

      setDocument(data as any);
    } catch (err) {
      setError('Failed to load published document');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Document Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {error || 'The published document you\'re looking for could not be found.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-primary" />
                <h1 className="text-xl font-semibold">{document.title}</h1>
              </div>
              <Badge variant="default" className="bg-green-600">
                Published v{document.version_number}
              </Badge>
              {document.is_current && (
                <Badge variant="outline">Current Version</Badge>
              )}
            </div>
          </div>

          {/* Publication info */}
          <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              Published by {document.publisher_profile?.display_name || 'Unknown'}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(document.published_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Published document banner */}
      <div className="bg-green-50 border-b border-green-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-2 text-green-800">
            <FileText className="w-4 h-4" />
            <span className="text-sm font-medium">
              This is a published version of the document, frozen at the time of publication.
            </span>
          </div>
        </div>
      </div>

      {/* Document Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="prose max-w-none">
            <h1>{document.title}</h1>
            <div>Published document content would be rendered here</div>
          </div>
        </div>
      </div>

      {/* Footer with publication metadata */}
      <div className="border-t mt-8 py-6 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Published Document • Version {document.version_number}
            </p>
            <p className="text-xs text-muted-foreground">
              This document was published on{' '}
              {new Date(document.published_at).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}{' '}
              and represents a frozen snapshot of the content at that time.
            </p>
            {document.metadata?.publishedAt && (
              <p className="text-xs text-muted-foreground">
                Original document last modified:{' '}
                {new Date(document.metadata.originalUpdatedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};