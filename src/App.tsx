import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AuthGate } from "@/components/auth/AuthGate";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { WorkspaceGuard } from "@/components/layout/WorkspaceGuard";
import { AppLayout } from "@/components/layout/AppLayout";
import { ValidationIntegratedLayout } from "@/components/layout/ValidationIntegratedLayout";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import MyDocuments from "./pages/MyDocuments";
import TemplateLibrary from "./pages/TemplateLibrary";
import MediaLibrary from "./pages/MediaLibrary";
import AdminPanel from "./pages/AdminPanel";
import AdminTemplates from "./pages/admin/AdminTemplates";
import AdminTemplateEdit from "./pages/admin/AdminTemplateEdit";
import TemplateGenerator from "./pages/admin/TemplateGenerator";
import { AdminGuard } from "./components/auth/AdminGuard";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import DocumentModelDemo from "./pages/DocumentModelDemo";
import DocumentSettings from "./pages/DocumentSettings";
import DocumentModelRedirect from "./components/DocumentModelRedirect";
import { Navigate } from "react-router-dom";
import { WorkspaceRedirectHandler } from "@/components/workspace/WorkspaceRedirectHandler";
import AuthDebug from "./pages/AuthDebug";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { HealthCheck } from "@/components/HealthCheck";
import { InvitationAcceptance } from "@/pages/InvitationAcceptance";
import { WorkspaceMembers } from "@/components/workspace/WorkspaceMembers";
import { WorkspaceSettings } from "@/components/workspace/WorkspaceSettings";
import { WorkspaceBrandSettings } from "@/components/workspace/WorkspaceBrandSettings";
import { WorkspaceBrandActivity } from "@/components/workspace/WorkspaceBrandActivity";
import { SharedDocumentViewer } from "@/components/document/SharedDocumentViewer";
import { PublishedDocumentViewer } from "@/components/document/PublishedDocumentViewer";

const queryClient = new QueryClient();

const App = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const showDebug = urlParams.get('debug') === '1'

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="pagemuse-theme">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            {showDebug && <HealthCheck />}
            <BrowserRouter>
              <ErrorBoundary>
                <Routes>
                  {/* Public routes - accessible without authentication */}
                  <Route path="/invite/:token" element={<InvitationAcceptance />} />
                  <Route path="/shared/:token" element={<SharedDocumentViewer />} />
                  <Route path="/published/:token" element={<PublishedDocumentViewer />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/auth-debug" element={<AuthDebug />} />
                  
                  {/* Legacy route redirects - redirect to workspace handler */}
                  <Route path="/dashboard" element={<Navigate to="/w/redirect/dashboard" replace />} />
                  <Route path="/documents" element={<Navigate to="/w/redirect/documents" replace />} />
                  <Route path="/documents/:id/editor" element={<Navigate to="/w/redirect/documents" replace />} />
                  <Route path="/templates" element={<Navigate to="/w/redirect/templates" replace />} />
                  <Route path="/media" element={<Navigate to="/w/redirect/media" replace />} />
                  <Route path="/admin" element={<Navigate to="/w/redirect/admin" replace />} />
                  <Route path="/admin/templates" element={<Navigate to="/w/redirect/admin/templates" replace />} />
                  <Route path="/admin/template-generator" element={<Navigate to="/w/redirect/admin/template-generator" replace />} />
                  
                  {/* Workspace redirect handler */}
                  <Route path="/w/redirect/*" element={
                    <AuthGate>
                      <WorkspaceProvider>
                        <WorkspaceRedirectHandler />
                      </WorkspaceProvider>
                    </AuthGate>
                  } />
                  
                  {/* Workspace routes - require authentication and workspace context */}
                  <Route path="/w/:workspaceId/*" element={
                    <AuthGate>
                      <WorkspaceProvider>
                        <WorkspaceGuard>
                          <ValidationIntegratedLayout>
                            <AppLayout>
                              <Routes>
                                <Route path="/" element={<Index />} />
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route path="/documents" element={<MyDocuments />} />
                                <Route path="/documents/new/editor" element={<DocumentModelDemo />} />
                                <Route path="/documents/:id/editor" element={<DocumentModelDemo />} />
                                <Route path="/documents/:id/settings" element={<DocumentSettings />} />
                                <Route path="/templates" element={<TemplateLibrary />} />
                                <Route path="/media" element={<MediaLibrary />} />
                                <Route path="/admin" element={
                                  <AdminGuard>
                                    <AdminPanel />
                                  </AdminGuard>
                                } />
                                <Route path="/admin/templates" element={
                                  <AdminGuard>
                                    <AdminTemplates />
                                  </AdminGuard>
                                } />
                                <Route path="/admin/templates/:id/edit" element={
                                  <AdminGuard>
                                    <AdminTemplateEdit />
                                  </AdminGuard>
                                } />
                                <Route path="/admin/template-generator" element={
                                  <AdminGuard>
                                    <TemplateGenerator />
                                  </AdminGuard>
                                } />
                                 <Route path="/members" element={<WorkspaceMembers />} />
                                 <Route path="/settings" element={<WorkspaceSettings />} />
                                 <Route path="/settings/brand" element={<WorkspaceBrandSettings />} />
                                 <Route path="/settings/brand/activity" element={<WorkspaceBrandActivity />} />
                                {/* Redirects from old paths */}
                                <Route path="/document-model" element={<DocumentModelRedirect />} />
                                <Route path="/document-model/:documentId" element={<DocumentModelRedirect />} />
                                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                                <Route path="*" element={<NotFound />} />
                              </Routes>
                            </AppLayout>
                          </ValidationIntegratedLayout>
                        </WorkspaceGuard>
                      </WorkspaceProvider>
                    </AuthGate>
                  } />
                  
                  {/* Root redirect - redirect to workspace handler */}
                  <Route path="/" element={
                    <AuthGate>
                      <WorkspaceProvider>
                        <WorkspaceRedirectHandler />
                      </WorkspaceProvider>
                    </AuthGate>
                  } />
                  
                  {/* Catch-all - redirect to workspace handler */}
                  <Route path="*" element={
                    <AuthGate>
                      <WorkspaceProvider>
                        <WorkspaceRedirectHandler />
                      </WorkspaceProvider>
                    </AuthGate>
                  } />
                </Routes>
              </ErrorBoundary>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App;
