import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppLayout } from "@/components/AppLayout";
import { OnboardingTutorial } from "@/components/OnboardingTutorial";
import Index from "./pages/Index";
import PreparePractice from "./pages/PreparePractice";
import PracticeSession from "./pages/PracticeSession";
import SessionResults from "./pages/SessionResults";
import History from "./pages/History";
import Practice from "./pages/Practice";
import Analytics from "./pages/Analytics";
import Resources from "./pages/Resources";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <OnboardingTutorial onComplete={() => console.log("Tutorial completed")} />
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/prepare" element={<PreparePractice />} />
              <Route path="/session" element={<PracticeSession />} />
              <Route path="/results" element={<SessionResults />} />
              <Route path="/history" element={<History />} />
              <Route path="/practice" element={<Practice />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/settings" element={<Settings />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
