import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import { InvestorLayout } from "@/components/InvestorLayout";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Devices from "./pages/Devices";
import DeviceDetail from "./pages/DeviceDetail";
import WhatsApp from "./pages/WhatsApp";
import Recharge from "./pages/Recharge";
import Financial from "./pages/Financial";
import TeamPage from "./pages/TeamPage";
import SettingsPage from "./pages/SettingsPage";
import Provisioning from "./pages/Provisioning";
import Clients from "./pages/Clients";
import ClientsList from "./pages/ClientsList";
import Interested from "./pages/Interested";
import ServiceOrderStatus from "./pages/ServiceOrderStatus";
import Plans from "./pages/Plans";
import NotFound from "./pages/NotFound";
import InvestorDashboard from "./pages/InvestorDashboard";
import InvestorExtrato from "./pages/InvestorExtrato";
import InvestorEquipments from "./pages/InvestorEquipments";
import InvestorExpenses from "./pages/InvestorExpenses";
import InvestorSimulator from "./pages/InvestorSimulator";
import InvestorAudit from "./pages/InvestorAudit";
import AdminInvestors from "./pages/AdminInvestors";
import AdminExpenses from "./pages/AdminExpenses";

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
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Admin/Tech routes */}
            <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
            <Route path="/provisioning" element={<ProtectedRoute><AppLayout><Provisioning /></AppLayout></ProtectedRoute>} />
            <Route path="/devices" element={<ProtectedRoute><AppLayout><Devices /></AppLayout></ProtectedRoute>} />
            <Route path="/devices/:id" element={<ProtectedRoute><AppLayout><DeviceDetail /></AppLayout></ProtectedRoute>} />
            <Route path="/whatsapp" element={<ProtectedRoute><AppLayout><WhatsApp /></AppLayout></ProtectedRoute>} />
            <Route path="/recharge" element={<ProtectedRoute><AppLayout><Recharge /></AppLayout></ProtectedRoute>} />
            <Route path="/clients" element={<ProtectedRoute><AppLayout><Clients /></AppLayout></ProtectedRoute>} />
            <Route path="/interested" element={<ProtectedRoute><AppLayout><Interested /></AppLayout></ProtectedRoute>} />
            <Route path="/clients-list" element={<ProtectedRoute><AppLayout><ClientsList /></AppLayout></ProtectedRoute>} />
            <Route path="/service-orders" element={<ProtectedRoute><AppLayout><ServiceOrderStatus /></AppLayout></ProtectedRoute>} />
            <Route path="/financial" element={<ProtectedRoute><AppLayout><Financial /></AppLayout></ProtectedRoute>} />
            <Route path="/team" element={<ProtectedRoute><AppLayout><TeamPage /></AppLayout></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><AppLayout><SettingsPage /></AppLayout></ProtectedRoute>} />
            <Route path="/plans" element={<ProtectedRoute><AppLayout><Plans /></AppLayout></ProtectedRoute>} />
            <Route path="/admin/investors" element={<ProtectedRoute><AppLayout><AdminInvestors /></AppLayout></ProtectedRoute>} />
            <Route path="/admin/expenses" element={<ProtectedRoute><AppLayout><AdminExpenses /></AppLayout></ProtectedRoute>} />

            {/* Investor routes */}
            <Route path="/investor" element={<ProtectedRoute><InvestorLayout><InvestorDashboard /></InvestorLayout></ProtectedRoute>} />
            <Route path="/investor/extrato" element={<ProtectedRoute><InvestorLayout><InvestorExtrato /></InvestorLayout></ProtectedRoute>} />
            <Route path="/investor/equipments" element={<ProtectedRoute><InvestorLayout><InvestorEquipments /></InvestorLayout></ProtectedRoute>} />
            <Route path="/investor/expenses" element={<ProtectedRoute><InvestorLayout><InvestorExpenses /></InvestorLayout></ProtectedRoute>} />
            <Route path="/investor/simulator" element={<ProtectedRoute><InvestorLayout><InvestorSimulator /></InvestorLayout></ProtectedRoute>} />
            <Route path="/investor/audit" element={<ProtectedRoute><InvestorLayout><InvestorAudit /></InvestorLayout></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
