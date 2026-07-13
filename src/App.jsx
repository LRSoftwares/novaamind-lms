import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Programs from './pages/Programs';
import Sessions from './pages/Sessions';
import Company from './pages/Company';
import Reports from './pages/Reports';
import Trainers from './pages/Trainers';
import Integrations from './pages/Integrations';
import Invoices from './pages/Invoices';
import Assessments from './pages/Assessments';
import Worksheets from './pages/Worksheets';
import ThoughtLabApp from './pages/thought-lab/ThoughtLabApp';
import ReadingHubApp from './pages/thought-lab/reading-hub/ReadingHubApp';
import CompanyOS from './pages/company-os/CompanyOS';
import LegalSystemsLayout from './pages/company-os/LegalSystemsLayout';
import LegalOverview from './pages/company-os/LegalOverview';
import LegalDocuments from './pages/company-os/LegalDocuments';
import LegalTemplates from './pages/company-os/LegalTemplates';
import LegalDocumentDetail from './pages/company-os/LegalDocumentDetail';
import NdaLanding from './pages/company-os/nda/NdaLanding';
import NdaWizard from './pages/company-os/nda/NdaWizard';
import ProspectingLayout from './pages/prospecting/ProspectingLayout';
import ProspectsList from './pages/prospecting/ProspectsList';
import ResearchQueue from './pages/prospecting/ResearchQueue';
import ReviewedList from './pages/prospecting/ReviewedList';
import ProspectDetail from './pages/prospecting/ProspectDetail';
import Login from './pages/Login';
import AssessmentLanding from './pages/AssessmentLanding';
import AssessmentRegister from './pages/AssessmentRegister';
import AssessmentVerifyOtp from './pages/AssessmentVerifyOtp';
import AssessmentPlayer from './pages/AssessmentPlayer';
import AssessmentResult from './pages/AssessmentResult';
import WorksheetLanding from './pages/WorksheetLanding';
import WorksheetRegister from './pages/WorksheetRegister';
import WorksheetPlayer from './pages/WorksheetPlayer';
import WorksheetResult from './pages/WorksheetResult';

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-surface">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main className={`flex-1 overflow-auto transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <div className="p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/company-os" element={<CompanyOS />} />
            <Route path="/company-os/legal" element={<LegalSystemsLayout />}>
              <Route index element={<LegalOverview />} />
              <Route path="documents" element={<LegalDocuments />} />
              <Route path="nda" element={<NdaLanding />} />
              <Route path="templates" element={<LegalTemplates />} />
            </Route>
            <Route path="/company-os/legal/nda/new" element={<NdaWizard />} />
            <Route path="/company-os/legal/document/:id" element={<LegalDocumentDetail />} />
            <Route path="/company-os/legal/template/:id" element={<LegalDocumentDetail isTemplate />} />
            <Route path="/prospecting" element={<ProspectingLayout />}>
              <Route index element={<ProspectsList />} />
              <Route path="research" element={<ResearchQueue />} />
              <Route path="reviewed" element={<ReviewedList />} />
            </Route>
            <Route path="/prospecting/:id" element={<ProspectDetail />} />
            <Route path="/programs" element={<Programs />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/companies" element={<Company />} />
            <Route path="/trainers" element={<Trainers />} />
            <Route path="/assessments" element={<Assessments />} />
            <Route path="/worksheets" element={<Worksheets />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/integrations" element={<Integrations />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function AuthGate() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-white/70 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <DataProvider>
      <Routes>
        <Route path="/reading-hub/*" element={<ReadingHubApp />} />
        <Route path="/thought-lab/*" element={<ThoughtLabApp />} />
        <Route path="/*" element={<AdminLayout />} />
      </Routes>
    </DataProvider>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/assessment/:slug" element={<AssessmentLanding />} />
      <Route path="/assessment/:slug/register" element={<AssessmentRegister />} />
      <Route path="/assessment/:slug/verify" element={<AssessmentVerifyOtp />} />
      <Route path="/assessment/:slug/test" element={<AssessmentPlayer />} />
      <Route path="/assessment/:slug/result" element={<AssessmentResult />} />
      <Route path="/worksheet/:slug" element={<WorksheetLanding />} />
      <Route path="/worksheet/:slug/register" element={<WorksheetRegister />} />
      <Route path="/worksheet/:slug/fill" element={<WorksheetPlayer />} />
      <Route path="/worksheet/:slug/result" element={<WorksheetResult />} />
      <Route path="/*" element={<AuthGate />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
