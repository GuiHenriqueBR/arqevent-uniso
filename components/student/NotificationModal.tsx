import React from "react";
import { X, Bell, CheckCircle, Calendar, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Notificacao } from "../../services/api";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notificacoes: Notificacao[];
  notificacoesNaoLidas: number;
  onMarcarLida: (id: string) => void;
  onMarcarTodasLidas: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notificacoes,
  notificacoesNaoLidas,
  onMarcarLida,
  onMarcarTodasLidas,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto"
          />

          {/* Modal */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[85vh] overflow-hidden shadow-2xl z-10 pointer-events-auto sm:m-4"
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-slate-800">Notificações</h3>
              <div className="flex items-center gap-2">
                {notificacoesNaoLidas > 0 && (
                  <button
                    onClick={onMarcarTodasLidas}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium px-2 py-1 rounded bg-indigo-50"
                  >
                    Marcar todas como lidas
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="bg-slate-100 p-1.5 rounded-full text-slate-500 hover:bg-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[60vh] p-4 space-y-3">
              {notificacoes.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500 text-sm font-medium">
                    Nenhuma notificação por enquanto
                  </p>
                </div>
              ) : (
                notificacoes.map((notif) => (
                  <motion.div
                    key={notif.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => !notif.lida && onMarcarLida(notif.id)}
                    className={`p-4 rounded-xl border cursor-pointer relative transition-all active:scale-[0.98] ${
                      notif.lida
                        ? "bg-white border-slate-100"
                        : "bg-indigo-50/50 border-indigo-100 shadow-sm"
                    }`}
                  >
                    {!notif.lida && (
                      <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500 ring-4 ring-blue-500/20" />
                    )}

                    <div className="flex items-start gap-4">
                      <div
                        className={`p-2.5 rounded-xl shrink-0 ${
                          notif.tipo === "presenca_confirmada"
                            ? "bg-green-100 text-green-600"
                            : notif.tipo === "inscricao_confirmada"
                              ? "bg-blue-100 text-blue-600"
                              : notif.tipo === "ausente_notificacao"
                                ? "bg-orange-100 text-orange-600"
                                : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {notif.tipo === "presenca_confirmada" ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : notif.tipo === "inscricao_confirmada" ? (
                          <Calendar className="w-5 h-5" />
                        ) : notif.tipo === "ausente_notificacao" ? (
                          <AlertTriangle className="w-5 h-5" />
                        ) : (
                          <Bell className="w-5 h-5" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 pr-2">
                        <p
                          className={`text-sm font-semibold mb-1 ${notif.lida ? "text-slate-700" : "text-slate-900"}`}
                        >
                          {notif.titulo}
                        </p>
                        <p
                          className={`text-xs leading-relaxed ${notif.lida ? "text-slate-500" : "text-slate-600"}`}
                        >
                          {notif.mensagem}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium">
                          {new Date(notif.created_at).toLocaleDateString(
                            "pt-BR",
                            {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default NotificationModal;
