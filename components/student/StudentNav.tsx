import React from "react";
import { Home, QrCode, User as UserIcon, CalendarDays } from "lucide-react";
import { motion } from "framer-motion";

interface StudentNavProps {
  activeTab: "home" | "calendar" | "scan" | "profile";
  onTabChange: (tab: "home" | "calendar" | "scan" | "profile") => void;
}

const StudentNav: React.FC<StudentNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white/80 backdrop-blur-md border-t border-slate-200 px-4 sm:px-6 py-2 flex justify-between items-center z-40 pb-safe sm:rounded-b-2xl">
      <NavButton
        active={activeTab === "home"}
        onClick={() => onTabChange("home")}
        icon={<Home className="w-5 h-5 sm:w-6 sm:h-6" />}
        label="Início"
      />

      <NavButton
        active={activeTab === "calendar"}
        onClick={() => onTabChange("calendar")}
        icon={<CalendarDays className="w-5 h-5 sm:w-6 sm:h-6" />}
        label="Calendário"
      />

      <div className="relative -mt-8">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => onTabChange("scan")}
          className={`flex items-center justify-center w-14 h-14 rounded-full transition-all ${
            activeTab === "scan"
              ? "bg-slate-900 text-white shadow-xl shadow-slate-900/30 ring-4 ring-white"
              : "bg-white text-slate-900 shadow-lg shadow-slate-200 border border-slate-100"
          }`}
        >
          <QrCode className="w-6 h-6" />
        </motion.button>
      </div>

      <NavButton
        active={activeTab === "profile"}
        onClick={() => onTabChange("profile")}
        icon={<UserIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
        label="Perfil"
      />
    </nav>
  );
};

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const NavButton: React.FC<NavButtonProps> = ({
  active,
  onClick,
  icon,
  label,
}) => (
  <motion.button
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
    className={`flex flex-col items-center p-2 rounded-lg transition-colors ${active ? "text-slate-900" : "text-slate-400"}`}
  >
    {icon}
    <span className="text-[10px] sm:text-xs font-medium mt-1">{label}</span>
  </motion.button>
);

export default StudentNav;
