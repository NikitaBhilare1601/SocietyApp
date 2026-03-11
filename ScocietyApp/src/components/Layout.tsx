import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";
import introJs from "intro.js";
import "intro.js/introjs.css";
import { tourSteps } from "@/lib/tourSteps";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const startTour = () => {
    if (location.pathname === "/dashboard" || location.pathname === "/") {
      window.dispatchEvent(new Event("start-dashboard-tour"));
      return;
    }

    introJs()
      .setOptions({
        steps: tourSteps,
        showProgress: true,
        showBullets: false,
        exitOnOverlayClick: false,
        nextLabel: "Next >",
        prevLabel: "< Back",
        doneLabel: "Done",
      })
      .start();
  };

  // Auto-start tour if not seen - DISABLED to allow page-specific tours to control the flow
  // useEffect(() => {
  //   const hasSeenTour = localStorage.getItem("hasSeenTour");
  //   if (!hasSeenTour) {
  //     // Small delay to ensure Sidebar is fully rendered
  //     const timer = setTimeout(() => {
  //       startTour();
  //       localStorage.setItem("hasSeenTour", "true");
  //     }, 1000);
  //     return () => clearTimeout(timer);
  //   }
  // }, []);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar onStartTour={startTour} />
      </div>

      {/* Mobile Sidebar (Drawer) */}
      <div
        className={`fixed inset-0 z-50 flex transform transition-transform duration-300 ease-in-out md:hidden ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar className="w-64 h-full shadow-xl" onClose={() => setIsSidebarOpen(false)} onStartTour={startTour} />
        {/* Overlay */}
        <div
          className={`fixed inset-0 bg-black/50 z-[-1] transition-opacity duration-300 ${
            isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Mobile Toggle Button - Floating */}
        <div className="md:hidden fixed top-3 left-3 z-40">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsSidebarOpen(true)}
            className="bg-background/80 backdrop-blur shadow-sm border-border"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
