import React from "react";
import caausLogo from "../../imagens/caaus-logo.png";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
}) => {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-100 to-indigo-50 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-white/50">
        <div className="bg-linear-to-br from-slate-50 via-white to-indigo-50 p-6 md:p-8 text-center border-b border-slate-100">
          <div className="inline-flex items-center justify-center rounded-2xl bg-white/90 backdrop-blur-sm px-6 py-4 shadow-lg shadow-slate-200/60 border border-slate-100">
            <img
              src={caausLogo}
              alt="CAAUS"
              className="h-24 md:h-32 w-auto"
              loading="lazy"
            />
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-slate-800">{title}</h2>
            <p className="text-slate-500 text-sm">{subtitle}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
