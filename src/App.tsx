import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Devices from "./pages/Devices";
import DeviceDetail from "./pages/DeviceDetail";
import WhatsApp from "./pages/WhatsApp";
import Recharge from "./pages/Recharge";

import Provisioning from "./pages/Provisioning";
import Clients from "./pages/Clients";
import ClientsList from "./pages/ClientsList";
import Interested from "./pages/Interested";
import ServiceOrderStatus from "./pages/ServiceOrderStatus";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout><Dashboard /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/provisioning"
              element={
                <ProtectedRoute>
                  <AppLayout><Provisioning /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/devices"
              element={
                <ProtectedRoute>
                  <AppLayout><Devices /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/devices/:id"
              element={
                <ProtectedRoute>
                  <AppLayout><DeviceDetail /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/whatsapp"
              element={
                <ProtectedRoute>
                  <AppLayout><WhatsApp /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/recharge"
              element={
                <ProtectedRoute>
                  <AppLayout><Recharge /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients"
              element={
                <ProtectedRoute>
                  <AppLayout><Clients /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/interested"
              element={
                <ProtectedRoute>
                  <AppLayout><Interested /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients-list"
              element={
                <ProtectedRoute>
                  <AppLayout><ClientsList /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/service-orders"
              element={
                <ProtectedRoute>
                  <AppLayout><ServiceOrderStatus /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
