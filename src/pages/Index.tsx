import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DesignFromContentDialog } from '@/components/document/DesignFromContentDialog';
import { 
  FileText, 
  Share2, 
  Mail, 
  Link, 
  Download, 
  Users,
  ArrowRight,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();
  const [designFromContentOpen, setDesignFromContentOpen] = useState(false);
  
  const handleDesignFromContent = (content: string, type: 'paste' | 'upload' | 'url') => {
    console.log('Design from content:', { content, type });
    // TODO: Implement the actual design from content flow
    navigate('/document-model');
  };

  const features = [
    {
      icon: Users,
      title: "Role-Based Collaboration",
      description: "Owner, Editor, Commenter, and Viewer roles with hierarchical permissions",
      status: "Live"
    },
    {
      icon: Mail,
      title: "Email Invitations",
      description: "Invite collaborators by email with automatic invitation acceptance flow",
      status: "Live"
    },
    {
      icon: Link,
      title: "Secure Share Links",
      description: "Password-protected links with expiration, view limits, and watermarks",
      status: "Live"
    },
    {
      icon: Download,
      title: "Document Publishing",
      description: "Publish documents as frozen snapshots with public URLs",
      status: "Live"
    }
  ];

  const testRoutes = [
    {
      path: "/invite/sample-token",
      title: "Invitation Acceptance",
      description: "Test the invitation acceptance flow (will show token not found)",
      icon: Mail
    },
    {
      path: "/shared/sample-token", 
      title: "Shared Document Viewer",
      description: "Test the shared document viewer (will show link not found)",
      icon: Link
    },
    {
      path: "/published/sample-token",
      title: "Published Document Viewer", 
      description: "Test the published document viewer (will show document not found)",
      icon: Download
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-6 mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FileText className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Document Collaboration Platform
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Professional document sharing with enterprise-grade security, role-based permissions, 
            and collaborative editing features.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button 
              onClick={() => setDesignFromContentOpen(true)} 
              size="lg" 
              className="bg-gradient-primary hover:shadow-glow transition-all duration-200 gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Design from content
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button onClick={() => navigate('/documents')} variant="outline" size="lg" className="gap-2">
              <FileText className="w-5 h-5" />
              My Documents
            </Button>
            <Button 
              onClick={() => navigate('/documents/new/editor')} 
              variant="outline" 
              size="lg"
              className="gap-2"
            >
              Create New Document
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <IconComponent className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <Badge variant="default" className="w-fit mx-auto">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {feature.status}
                  </Badge>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Sharing System Demo */}
        <Card className="mb-16 border-0 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Share2 className="w-6 h-6 text-primary" />
              Sharing System Features
            </CardTitle>
            <CardDescription className="text-lg">
              Complete document sharing and collaboration system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Roles & Permissions
                </h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• <strong>Owner:</strong> Full access including sharing and deletion</li>
                  <li>• <strong>Editor:</strong> Can view, comment, and edit content</li>
                  <li>• <strong>Commenter:</strong> Can view and add comments</li>
                  <li>• <strong>Viewer:</strong> Read-only access to content</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Link className="w-5 h-5 text-primary" />
                  Secure Links
                </h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Password protection</li>
                  <li>• Expiration dates</li>
                  <li>• View count limits</li>
                  <li>• Watermarked viewing</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Download className="w-5 h-5 text-primary" />
                  Publishing
                </h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Frozen document snapshots</li>
                  <li>• Version control</li>
                  <li>• Public URLs</li>
                  <li>• Activity logging</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Routes Section */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Test Sharing Routes</CardTitle>
            <CardDescription>
              These routes are now available for testing the sharing system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {testRoutes.map((route, index) => {
                const IconComponent = route.icon;
                return (
                  <Card key={index} className="cursor-pointer hover:bg-muted/50 transition-colors" 
                        onClick={() => navigate(route.path)}>
                    <CardContent className="p-4 text-center space-y-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                        <IconComponent className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{route.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{route.description}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {route.path}
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>How to test:</strong> Create a document and use the Share button in the document header 
                to generate real invitations, share links, and published documents. The routes above are for 
                testing the UI with invalid tokens.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Design from Content Dialog */}
      <DesignFromContentDialog
        open={designFromContentOpen}
        onOpenChange={setDesignFromContentOpen}
        onConfirm={handleDesignFromContent}
      />
    </div>
  );
};

export default Index;