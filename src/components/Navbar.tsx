import { NavLink } from "react-router-dom";
import { Menu as MenuIcon, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import ConnectAccount from "./ConnectAccount.tsx";

export const Navbar = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-2xl border-b border-gray-800/30">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand - Clickable */}
          <NavLink
            to="/"
            className="flex items-center space-x-2.5 hover:opacity-80 transition-opacity duration-300"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FDDA24] to-yellow-300 flex items-center justify-center shadow-lg shadow-[#FDDA24]/30 relative">
              <span className="text-black font-bold text-lg">◉</span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#FDDA24]/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div className="leading-none">
              <h1 className="text-xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-300 bg-clip-text text-transparent">
                OPAQUE
              </h1>
              <p className="text-[10px] text-[#FDDA24]/80 font-medium -mt-0.5 tracking-wide uppercase">
                Privacy Payments
              </p>
            </div>
          </NavLink>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1 bg-gradient-to-r from-gray-900/60 via-gray-800/40 to-gray-900/60 rounded-2xl p-2 border border-gray-700/30 backdrop-blur-md shadow-xl">
            <NavLink to="/privacy-deposit">
              {({ isActive }) => (
                <div
                  className={`${
                    isActive
                      ? "bg-gradient-to-r from-[#FDDA24] to-yellow-300 text-black shadow-lg shadow-[#FDDA24]/40"
                      : "text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-gray-800/80 hover:to-gray-700/60"
                  } rounded-xl px-6 py-3 font-semibold transition-all duration-300 transform hover:scale-105 flex items-center space-x-2.5 cursor-pointer relative overflow-hidden`}
                  onClick={() =>
                    !isActive && (window.location.href = "/privacy-deposit")
                  }
                >
                  <ArrowDownCircle size={18} className="drop-shadow-sm" />
                  <span className="tracking-wide">Deposit</span>
                  {!isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-[#FDDA24]/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                  )}
                </div>
              )}
            </NavLink>

            <div className="w-px h-8 bg-gradient-to-b from-transparent via-gray-600/50 to-transparent"></div>

            <NavLink to="/privacy-withdraw">
              {({ isActive }) => (
                <div
                  className={`${
                    isActive
                      ? "bg-gradient-to-r from-[#FDDA24] to-yellow-300 text-black shadow-lg shadow-[#FDDA24]/40"
                      : "text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-gray-800/80 hover:to-gray-700/60"
                  } rounded-xl px-6 py-3 font-semibold transition-all duration-300 transform hover:scale-105 flex items-center space-x-2.5 cursor-pointer relative overflow-hidden`}
                  onClick={() =>
                    !isActive && (window.location.href = "/privacy-withdraw")
                  }
                >
                  <ArrowUpCircle size={18} className="drop-shadow-sm" />
                  <span className="tracking-wide">Withdraw</span>
                  {!isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-[#FDDA24]/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                  )}
                </div>
              )}
            </NavLink>
          </nav>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            <button className="md:hidden p-2.5 rounded-xl bg-gradient-to-br from-gray-800/70 to-gray-900/60 text-gray-400 hover:text-white hover:bg-gradient-to-br hover:from-gray-700/70 hover:to-gray-800/60 transition-all duration-300 border border-gray-700/50 shadow-lg">
              <MenuIcon size={20} />
            </button>

            {/* Connect Account */}
            <div className="hidden md:block">
              <ConnectAccount />
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-3">
          <nav className="flex space-x-2 bg-gradient-to-r from-gray-900/60 via-gray-800/40 to-gray-900/60 rounded-2xl p-2 border border-gray-700/30 backdrop-blur-md">
            <NavLink to="/privacy-deposit" className="flex-1">
              {({ isActive }) => (
                <div
                  className={`${
                    isActive
                      ? "bg-gradient-to-r from-[#FDDA24] to-yellow-300 text-black shadow-md shadow-[#FDDA24]/30"
                      : "text-gray-300 hover:text-white hover:bg-gray-800/60"
                  } rounded-xl px-4 py-3 font-semibold transition-all duration-300 text-center cursor-pointer`}
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
                      ? "bg-gradient-to-r from-[#FDDA24] to-yellow-300 text-black shadow-md shadow-[#FDDA24]/30"
                      : "text-gray-300 hover:text-white hover:bg-gray-800/60"
                  } rounded-xl px-4 py-3 font-semibold transition-all duration-300 text-center cursor-pointer`}
                  onClick={() =>
                    !isActive && (window.location.href = "/privacy-withdraw")
                  }
                >
                  Withdraw
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
  );
};
