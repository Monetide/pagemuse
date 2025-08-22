import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AuthGate } from "@/components/auth/AuthGate";
import { AppLayout } from "@/components/layout/AppLayout";
import { ValidationIntegratedLayout } from "@/components/layout/ValidationIntegratedLayout";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import MyDocuments from "./pages/MyDocuments";
import TemplateLibrary from "./pages/TemplateLibrary";
import MediaLibrary from "./pages/MediaLibrary";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import DocumentModelDemo from "./pages/DocumentModelDemo";
import DocumentSettings from "./pages/DocumentSettings";
import DocumentModelRedirect from "./components/DocumentModelRedirect";
import { Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { HealthCheck } from "@/components/HealthCheck";
import { InvitationAcceptance } from "@/components/document/InvitationAcceptance";
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
                  
                  {/* Protected routes - require authentication */}
                  <Route path="/*" element={
                    <AuthGate>
                      <ValidationIntegratedLayout>
                        <AppLayout>
                          <Routes>
                            <Route path="/" element={<Index />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/documents" element={<MyDocuments />} />
                            <Route path="/documents/:id/editor" element={<DocumentModelDemo />} />
                            <Route path="/documents/:id/settings" element={<DocumentSettings />} />
                            <Route path="/templates" element={<TemplateLibrary />} />
                            <Route path="/media" element={<MediaLibrary />} />
                            <Route path="/admin" element={<AdminPanel />} />
                            <Route path="/settings" element={<div className="p-6">Settings coming soon...</div>} />
                            {/* Redirects from old paths */}
                            <Route path="/document-model" element={<DocumentModelRedirect />} />
                            <Route path="/document-model/:documentId" element={<DocumentModelRedirect />} />
                            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </AppLayout>
                      </ValidationIntegratedLayout>
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
