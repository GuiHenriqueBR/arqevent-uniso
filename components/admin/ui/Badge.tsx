import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "destructive"
    | "success"
    | "warning";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  className = "",
}) => {
  const variants = {
    default: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200/80",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200/80",
    outline: "text-slate-900 border border-slate-200 hover:bg-slate-100",
    destructive: "bg-red-100 text-red-700 hover:bg-red-200/80",
    success: "bg-green-100 text-green-700 hover:bg-green-200/80",
    warning: "bg-amber-100 text-amber-700 hover:bg-amber-200/80",
  };

  return (
    <div
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 border-transparent ${variants[variant]} ${className}`}
    >
      {children}
    </div>
  );
};
