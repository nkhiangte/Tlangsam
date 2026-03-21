import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { FirebaseProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Hero from './components/Hero';
import DailyInspiration from './components/DailyInspiration';
import Baptism from './pages/Records/Baptism';
import Wedding from './pages/Records/Wedding';
import Funeral from './pages/Records/Funeral';
import Conference from './pages/Records/Conference';
import PemDawnsawn from './pages/Records/PemDawnsawn';
import PawlDang from './pages/Records/PawlDang';
import Minutes from './pages/Archive/Minutes';
import UpaKalTaTe from './pages/Archive/UpaKalTaTe';
import Gallery from './pages/Archive/Gallery';
import KohhranHmeichhia from './pages/Fellowship/KohhranHmeichhia';
import KTP from './pages/Fellowship/KTP';
import KPP from './pages/Fellowship/KPP';
import AdminPanel from './pages/Admin/AdminPanel';
import About from './pages/About';
import News from './pages/News';
import Finance from './pages/Finance';
import Statistics from './pages/Statistics';
import Rawngbawltute from './pages/Rawngbawltute';
import ServicesPage from './pages/Services';
import RecordsPage from './pages/Records';
import ArchivePage from './pages/Archive';
import ContactPage from './pages/Contact';
import KohhranCommittee from './pages/Committee/KohhranCommittee';
import SundaySchoolCommittee from './pages/Committee/SundaySchoolCommittee';
import RamtharCommittee from './pages/Committee/RamtharCommittee';
import BSICommittee from './pages/Committee/BSICommittee';
import RefreshmentCommittee from './pages/Committee/RefreshmentCommittee';
import LightAndSoundCommittee from './pages/Committee/LightAndSoundCommittee';
import { SundaySchoolTeachersPage } from './pages/SundaySchool/TeachersPage';
import { WeeklyReportPage } from './pages/SundaySchool/WeeklyReportPage';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="h-12 w-12 text-church-burgundy animate-spin" />
      </div>
    );
  }
  
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const Home = () => {
  return (
    <>
      <Hero />
      <DailyInspiration />
    </>
  );
};

export default function App() {
  return (
    <FirebaseProvider>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow pt-[80px] sm:pt-[120px] md:pt-[160px] lg:pt-[200px]">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/news" element={<News />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/statistics" element={<Statistics />} />
              <Route path="/rawngbawltute" element={<Rawngbawltute />} />
              <Route path="/about" element={<About />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/records" element={<RecordsPage />} />
              <Route path="/archive" element={<ArchivePage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute>
                    <AdminPanel />
                  </ProtectedRoute>
                } 
              />
              <Route path="/records/baptism" element={<Baptism />} />
              <Route path="/records/wedding" element={<Wedding />} />
              <Route path="/records/funeral" element={<Funeral />} />
              <Route path="/records/conference" element={<Conference />} />
              <Route path="/records/pem-dawnsawn" element={<PemDawnsawn />} />
              <Route path="/records/pawl-dang" element={<PawlDang />} />
              <Route path="/archive/minutes" element={<Minutes />} />
              <Route path="/archive/upa-kal-ta-te" element={<UpaKalTaTe />} />
              <Route path="/archive/gallery" element={<Gallery />} />
              <Route path="/fellowship/hmeichhia" element={<KohhranHmeichhia />} />
              <Route path="/fellowship/ktp" element={<KTP />} />
              <Route path="/fellowship/kpp" element={<KPP />} />
              <Route path="/committee/kohhran" element={<KohhranCommittee />} />
              <Route path="/committee/sunday-school" element={<SundaySchoolCommittee />} />
              <Route path="/committee/ramthar" element={<RamtharCommittee />} />
              <Route path="/committee/bsi" element={<BSICommittee />} />
              <Route path="/committee/refreshment" element={<RefreshmentCommittee />} />
              <Route path="/committee/light-sound" element={<LightAndSoundCommittee />} />
              <Route path="/sunday-school/weekly-report" element={<WeeklyReportPage />} />
              <Route path="/sunday-school/:department" element={<SundaySchoolTeachersPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </FirebaseProvider>
  );
}
