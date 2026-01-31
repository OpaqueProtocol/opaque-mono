import { Layout } from "@stellar/design-system";
import {
  Home as HomeIcon,
  Wallet as WalletIcon,
  Code as CodeIcon,
  Menu as MenuIcon,
  ArrowDownCircle,
  ArrowUpCircle,
} from "lucide-react";
import ConnectAccount from "./components/ConnectAccount.tsx";
import { Routes, Route, Outlet, NavLink } from "react-router-dom";
import LandingPage from "./pages/landing/LandingPage";
import Debugger from "./pages/Debugger.tsx";
import Wallet from "./pages/Wallet";
import Deposit from "./pages/Deposit";
import PrivacyDeposit from "./pages/PrivacyDeposit";
import PrivacyWithdraw from "./pages/PrivacyWithdraw";

const AppLayout: React.FC = () => (
  <main className="min-h-screen bg-black">
    {/* Background gradient overlay */}
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900/30 via-black to-gray-800/20 pointer-events-none" />

    <div className="relative z-10">
      {/* Enhanced Modern Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-2xl border-b border-gray-800/30">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Enhanced Logo/Brand */}
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FDDA24] to-yellow-300 flex items-center justify-center shadow-md shadow-[#FDDA24]/20">
                <span className="text-black font-bold text-base">◉</span>
              </div>
              <div className="leading-none">
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  OPAQUE
                </h1>
                <p className="text-[10px] text-gray-500 font-medium -mt-0.5">
                  Privacy Payments
                </p>
              </div>
            </div>

            {/* Enhanced Navigation */}
            <nav className="hidden md:flex items-center space-x-1 bg-gray-900/40 rounded-xl p-1.5 border border-gray-800/50 backdrop-blur-sm">
              <NavLink to="/">
                {({ isActive }) => (
                  <div
                    className={`${
                      isActive
                        ? "bg-[#FDDA24] text-black shadow-lg shadow-[#FDDA24]/30"
                        : "text-gray-400 hover:text-white hover:bg-gray-800/60"
                    } rounded-lg px-4 py-2 font-medium transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 cursor-pointer`}
                    onClick={() => !isActive && (window.location.href = "/")}
                  >
                    <HomeIcon size={16} />
                    <span>Home</span>
                  </div>
                )}
              </NavLink>

              <NavLink to="/wallet">
                {({ isActive }) => (
                  <div
                    className={`${
                      isActive
                        ? "bg-[#FDDA24] text-black shadow-lg shadow-[#FDDA24]/30"
                        : "text-gray-400 hover:text-white hover:bg-gray-800/60"
                    } rounded-lg px-4 py-2 font-medium transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 cursor-pointer`}
                    onClick={() =>
                      !isActive && (window.location.href = "/wallet")
                    }
                  >
                    <WalletIcon size={16} />
                    <span>Wallet</span>
                  </div>
                )}
              </NavLink>

              <NavLink to="/privacy-deposit">
                {({ isActive }) => (
                  <div
                    className={`${
                      isActive
                        ? "bg-[#FDDA24] text-black shadow-lg shadow-[#FDDA24]/30"
                        : "text-gray-400 hover:text-white hover:bg-gray-800/60"
                    } rounded-lg px-4 py-2 font-medium transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 cursor-pointer`}
                    onClick={() =>
                      !isActive && (window.location.href = "/privacy-deposit")
                    }
                  >
                    <ArrowDownCircle size={16} />
                    <span>Deposit</span>
                  </div>
                )}
              </NavLink>

              <NavLink to="/privacy-withdraw">
                {({ isActive }) => (
                  <div
                    className={`${
                      isActive
                        ? "bg-[#FDDA24] text-black shadow-lg shadow-[#FDDA24]/30"
                        : "text-gray-400 hover:text-white hover:bg-gray-800/60"
                    } rounded-xl px-6 py-3 font-medium transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 cursor-pointer`}
                    onClick={() =>
                      !isActive && (window.location.href = "/privacy-withdraw")
                    }
                  >
                    <ArrowUpCircle size={18} />
                    <span>Withdraw</span>
                  </div>
                )}
              </NavLink>

              <NavLink to="/debug">
                {({ isActive }) => (
                  <div
                    className={`${
                      isActive
                        ? "bg-[#FDDA24] text-black shadow-lg shadow-[#FDDA24]/30"
                        : "text-gray-400 hover:text-white hover:bg-gray-800/60"
                    } rounded-lg px-4 py-2 font-medium transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 cursor-pointer`}
                    onClick={() =>
                      !isActive && (window.location.href = "/debug")
                    }
                  >
                    <CodeIcon size={16} />
                    <span>Debug</span>
                  </div>
                )}
              </NavLink>
            </nav>

            {/* Enhanced Right Section */}
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Button */}
              <button className="md:hidden p-2 rounded-xl bg-gray-800/60 text-gray-400 hover:text-white hover:bg-gray-700/60 transition-all duration-300">
                <MenuIcon size={20} />
              </button>

              {/* Connect Account - Enhanced */}
              <div className="hidden md:block">
                <ConnectAccount />
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden pb-3">
            <nav className="flex space-x-1 bg-gray-900/40 rounded-xl p-1.5 border border-gray-800/50">
              <NavLink to="/" className="flex-1">
                {({ isActive }) => (
                  <div
                    className={`${
                      isActive
                        ? "bg-[#FDDA24] text-black"
                        : "text-gray-400 hover:text-white hover:bg-gray-800/60"
                    } rounded-lg px-3 py-2 font-medium transition-all duration-300 text-center cursor-pointer`}
                    onClick={() => !isActive && (window.location.href = "/")}
                  >
                    Home
                  </div>
                )}
              </NavLink>
              <NavLink to="/wallet" className="flex-1">
                {({ isActive }) => (
                  <div
                    className={`${
                      isActive
                        ? "bg-[#FDDA24] text-black"
                        : "text-gray-400 hover:text-white hover:bg-gray-800/60"
                    } rounded-lg px-3 py-2 font-medium transition-all duration-300 text-center cursor-pointer`}
                    onClick={() =>
                      !isActive && (window.location.href = "/wallet")
                    }
                  >
                    Wallet
                  </div>
                )}
              </NavLink>
              <NavLink to="/privacy-deposit" className="flex-1">
                {({ isActive }) => (
                  <div
                    className={`${
                      isActive
                        ? "bg-[#FDDA24] text-black"
                        : "text-gray-400 hover:text-white hover:bg-gray-800/60"
                    } rounded-lg px-3 py-2 font-medium transition-all duration-300 text-center cursor-pointer`}
                    onClick={() =>
                      !isActive && (window.location.href = "/privacy-deposit")
                    }
                  >
                    Deposit
                  </div>
                )}
              </NavLink>
              <NavLink to="/privacy-withdraw" className="flex-1">
                {({ isActive }) => (
                  <div
                    className={`${
                      isActive
                        ? "bg-[#FDDA24] text-black"
                        : "text-gray-400 hover:text-white hover:bg-gray-800/60"
                    } rounded-xl px-4 py-3 font-medium transition-all duration-300 text-center cursor-pointer`}
                    onClick={() =>
                      !isActive && (window.location.href = "/privacy-withdraw")
                    }
                  >
                    Withdraw
                  </div>
                )}
              </NavLink>
              <NavLink to="/debug" className="flex-1">
                {({ isActive }) => (
                  <div
                    className={`${
                      isActive
                        ? "bg-[#FDDA24] text-black"
                        : "text-gray-400 hover:text-white hover:bg-gray-800/60"
                    } rounded-lg px-3 py-2 font-medium transition-all duration-300 text-center cursor-pointer`}
                    onClick={() =>
                      !isActive && (window.location.href = "/debug")
                    }
                  >
                    Debug
                  </div>
                )}
              </NavLink>
            </nav>

            {/* Mobile Connect Account */}
            <div className="mt-4">
              <ConnectAccount />
            </div>
          </div>
        </div>
      </header>

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
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/deposit" element={<Deposit />} />
        <Route path="/privacy-deposit" element={<PrivacyDeposit />} />
        <Route path="/privacy-withdraw" element={<PrivacyWithdraw />} />
        <Route path="/debug" element={<Debugger />} />
        <Route path="/debug/:contractName" element={<Debugger />} />
      </Route>
    </Routes>
  );
}

export default App;
