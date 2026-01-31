import { Layout } from "@stellar/design-system";
import "./styles/opaque-theme.css";
import { Routes, Route, Outlet } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import LandingPage from "./pages/landing/LandingPage";
import PrivacyDeposit from "./pages/PrivacyDeposit";
import PrivacyWithdraw from "./pages/PrivacyWithdraw";

const AppLayout: React.FC = () => (
  <main className="min-h-screen bg-black">
    {/* Background gradient overlay */}
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900/30 via-black to-gray-800/20 pointer-events-none" />

    <div className="relative z-10">
      <Navbar />

      <div className="pt-20">
        <Outlet />
      </div>

      <div className="bg-black/90 border-t border-gray-800/50 text-gray-400">
        <Layout.Footer>
          <span>
            © {new Date().getFullYear()} OPAQUE. Licensed under the{" "}
            <a
              href="http://www.apache.org/licenses/LICENSE-2.0"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#FDDA24] hover:text-[#e6c520] transition-colors duration-300"
            >
              Apache License, Version 2.0
            </a>
            .
          </span>
        </Layout.Footer>
      </div>
    </div>
  </main>
);

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/privacy-deposit" element={<PrivacyDeposit />} />
        <Route path="/privacy-withdraw" element={<PrivacyWithdraw />} />
      </Route>
    </Routes>
  );
}

export default App;
