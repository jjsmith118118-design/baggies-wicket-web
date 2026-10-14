import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";
import Index from "./pages/Index";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Matches from "./pages/Matches";
import NotFound from "./pages/NotFound";
import Juniors from "./pages/Juniors";
import AdultCricket from "./pages/AdultCricket";
import { AuthProvider } from "./hooks/useAuth";
import MembersLayout from "./pages/members/MembersLayout";
import MembersDashboard from "./pages/members/MembersDashboard";
import MembersShop from "./pages/members/MembersShop";
import MembersAdmin from "./pages/members/MembersAdmin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/juniors" element={<Juniors />} />
          <Route path="/adult-cricket" element={<AdultCricket />} />
          <Route path="/members" element={<MembersLayout />}>
            <Route index element={<MembersDashboard />} />
            <Route path="shop" element={<MembersShop />} />
            <Route path="admin" element={<MembersAdmin />} />
          </Route>
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
