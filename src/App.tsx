import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "next-themes";
import { SearchModeProvider } from "@/contexts/SearchModeContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Watchlist from "./pages/Watchlist";
import Settings from "./pages/Settings";
import Pro from "./pages/Pro";
import ExpandedSearch from "./pages/ExpandedSearch";
import MyEvents from "./pages/MyEvents";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - good for TMDB data
      retry: 1,
      refetchOnWindowFocus: false, // Avoid refetch storms on mobile tab switch
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <AuthProvider>
        <SearchModeProvider>
          <TooltipProvider>
            <Toaster />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/watchlist" element={<ProtectedRoute><Watchlist /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/pro" element={<Pro />} />
                <Route path="/expanded-search" element={<ExpandedSearch />} />
                <Route path="/my-events" element={<ProtectedRoute><MyEvents /></ProtectedRoute>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </SearchModeProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;