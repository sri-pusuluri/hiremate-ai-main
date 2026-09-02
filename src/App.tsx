import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import PublicCareers from "./pages/PublicCareers";
import PublicJobApplication from "./pages/PublicJobApplication";
import EmbedJobWidget from "./pages/EmbedJobWidget";
import { SetPasswordDialog } from "@/components/auth/SetPasswordDialog";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Public ATS Careers Portals & Applications */}
            <Route path="/careers" element={<PublicCareers />} />
            <Route path="/careers/:clientSlug" element={<PublicCareers />} />
            <Route path="/careers/:clientSlug/:jobSlug" element={<PublicJobApplication />} />
            
            {/* Third-Party Responsive iFrame Embed Widgets */}
            <Route path="/embed/job/:jobId" element={<EmbedJobWidget />} />
            <Route path="/embed/careers/:clientSlug" element={<PublicCareers />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <SetPasswordDialog />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
