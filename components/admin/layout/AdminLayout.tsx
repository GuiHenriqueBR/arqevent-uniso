import React, { useState } from "react";
import { User, Aviso } from "../../../types";
import AdminSidebar from "./AdminSidebar";
import { Menu } from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
  user: User;
  activeView: any;
  setActiveView: (view: any) => void;
  onLogout: () => void;
  avisos: Aviso[];
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  user,
  activeView,
  setActiveView,
  onLogout,
  avisos,
  sidebarOpen,
  setSidebarOpen,
}) => {
  const activeAvisosCount = avisos.filter((a) => a.ativo).length;

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      <AdminSidebar
        activeView={activeView}
        onChangeView={setActiveView}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        onLogout={onLogout}
        activeAvisosCount={activeAvisosCount}
      />

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 lg:ml-0 relative">
        {/* Mobile Header Bar - Only visible on small screens */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:hidden sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-semibold text-slate-800">ArqEvent</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
            {user.nome.charAt(0)}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto h-[calc(100vh-4rem)] lg:h-screen">
          <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
