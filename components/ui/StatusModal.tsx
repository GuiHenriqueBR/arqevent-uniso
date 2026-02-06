import React from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface StatusModalProps {
  isOpen: boolean;
  type: "success" | "error";
  title: string;
  message: string;
  onClose?: () => void;
}

export const StatusModal: React.FC<StatusModalProps> = ({
  isOpen,
  type,
  title,
  message,
  onClose,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`bg-white rounded-2xl p-6 sm:p-8 text-center max-w-xs w-full shadow-2xl pointer-events-auto ${
              type === "error" ? "border-2 border-red-100" : ""
            }`}
          >
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                type === "success"
                  ? "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {type === "success" ? (
                <CheckCircle className="w-8 h-8" />
              ) : (
                <AlertCircle className="w-8 h-8" />
              )}
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
            <p className="text-slate-600 whitespace-pre-line text-sm sm:text-base leading-relaxed">
              {message}
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
