import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AuthGate } from "@/components/auth/AuthGate";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import MyDocuments from "./pages/MyDocuments";
import TemplateLibrary from "./pages/TemplateLibrary";
import MediaLibrary from "./pages/MediaLibrary";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";
import { DocumentModelTest } from "./pages/DocumentModelTest";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthGate>
            <AppLayout>
               <Routes>
                 <Route path="/" element={<Dashboard />} />
                 <Route path="/documents" element={<MyDocuments />} />
                 <Route path="/templates" element={<TemplateLibrary />} />
                 <Route path="/media" element={<MediaLibrary />} />
                 <Route path="/admin" element={<AdminPanel />} />
                 <Route path="/settings" element={<div className="p-6">Settings coming soon...</div>} />
                 <Route path="/test-document-model" element={<DocumentModelTest />} />
                 {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                 <Route path="*" element={<NotFound />} />
               </Routes>
            </AppLayout>
          </AuthGate>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
