import React from "react";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Bell,
  Settings,
  X,
  LogOut,
} from "lucide-react";
import { User } from "../../../types";
import caausLogo from "../../../imagens/caaus-logo.png";

interface AdminSidebarProps {
  activeView:
    | "dashboard"
    | "events"
    | "students"
    | "announcements"
    | "settings";
  onChangeView: (view: any) => void;
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onLogout: () => void;
  activeAvisosCount: number;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeView,
  onChangeView,
  isOpen,
  onClose,
  user,
  onLogout,
  activeAvisosCount,
}) => {
  const menuItems = [
    { id: "dashboard", label: "Visão Geral", icon: LayoutDashboard },
    { id: "events", label: "Eventos", icon: Calendar },
    { id: "students", label: "Alunos", icon: Users },
    {
      id: "announcements",
      label: "Avisos",
      icon: Bell,
      badge: activeAvisosCount,
    },
    { id: "settings", label: "Configurações", icon: Settings },
  ]; // Removed 'as const' to allow mutable manipulation if needed

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:shadow-none
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="h-24 flex items-center justify-between px-6 border-b border-slate-800">
            <div className="bg-white/90 border border-white/10 shadow-sm rounded-lg px-4 py-3">
              <img src={caausLogo} alt="CAAUS" className="h-16 w-auto" />
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-white lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onChangeView(item.id);
                    if (window.innerWidth < 1024) {
                      onClose();
                    }
                  }}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                    ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/50"
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                    }
                  `}
                >
                  <Icon
                    className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-500"}`}
                  />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="bg-indigo-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-9 h-9 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md border border-white/10">
                {user.nome.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-white truncate">
                  {user.nome || "Administrador"}
                </p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center justify-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-950/30 w-full py-2 rounded-lg transition-colors text-sm font-medium"
            >
              <LogOut className="w-4 h-4" /> Sair do Sistema
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
