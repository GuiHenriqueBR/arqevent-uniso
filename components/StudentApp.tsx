import React, { useState, useEffect, useCallback } from "react";
import { User } from "../types";
import { isSupabaseConfigured } from "../supabaseClient";
import {
  eventosApi,
  palestrasApi,
  inscricoesApi,
  presencaApi,
  avisosApi,
  comprovantesApi,
  notificacoesApi,
  formatCargaHoraria,
  Evento,
  Palestra,
  Aviso,
  Notificacao,
} from "../services/api";
import { motion, AnimatePresence } from "framer-motion";

// Components
import StudentHome from "./student/StudentHome";
import StudentScanner from "./student/StudentScanner";
import StudentProfile from "./student/StudentProfile";
import StudentNav from "./student/StudentNav";
import NotificationModal from "./student/NotificationModal";
import LectureDetailsModal from "./student/LectureDetailsModal";
import { StatusModal } from "./ui/StatusModal";

interface StudentAppProps {
  user: User;
  onLogout: () => void;
}

const StudentApp: React.FC<StudentAppProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<"home" | "scan" | "profile">(
    "home",
  );

  // Status Modal State
  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    message: string;
    title?: string;
  }>({ isOpen: false, type: "success", message: "" });

  const showStatus = (
    type: "success" | "error",
    message: string,
    title?: string,
  ) => {
    setStatusModal({
      isOpen: true,
      type,
      message,
      title: title || (type === "success" ? "Sucesso!" : "Ops!"),
    });
    // Auto hide after 3s if success
    if (type === "success") {
      setTimeout(
        () => setStatusModal((prev) => ({ ...prev, isOpen: false })),
        3000,
      );
    } else {
      setTimeout(
        () => setStatusModal((prev) => ({ ...prev, isOpen: false })),
        4000,
      );
    }
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [palestrasEvento, setPalestrasEvento] = useState<Palestra[]>([]);
  const [eventoSelecionado, setEventoSelecionado] = useState<Evento | null>(
    null,
  );
  const [minhasInscricoes, setMinhasInscricoes] = useState<{
    eventos: any[];
    palestras: any[];
  }>({ eventos: [], palestras: [] });
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [dismissedAvisos, setDismissedAvisos] = useState<string[]>([]);

  // User Profile State
  const [currentUser, setCurrentUser] = useState(user);

  // Notificações state
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [showNotificacoes, setShowNotificacoes] = useState(false);
  const [detailsPalestra, setDetailsPalestra] = useState<Palestra | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Load initial data
  useEffect(() => {
    loadData();
    loadNotificacoes();
  }, []);

  const loadNotificacoes = async () => {
    try {
      const [lista, count] = await Promise.all([
        notificacoesApi.list(),
        notificacoesApi.contarNaoLidas(),
      ]);
      setNotificacoes(lista);
      setNotificacoesNaoLidas(count);
    } catch (err) {
      console.error("Erro ao carregar notificações:", err);
    }
  };

  const handleMarcarNotificacaoLida = async (id: string) => {
    try {
      await notificacoesApi.marcarComoLida(id);
      setNotificacoes(
        notificacoes.map((n) => (n.id === id ? { ...n, lida: true } : n)),
      );
      setNotificacoesNaoLidas(Math.max(0, notificacoesNaoLidas - 1));
    } catch (err) {
      console.error("Erro ao marcar notificação:", err);
    }
  };

  const handleMarcarTodasLidas = async () => {
    try {
      await notificacoesApi.marcarTodasComoLidas();
      setNotificacoes(notificacoes.map((n) => ({ ...n, lida: true })));
      setNotificacoesNaoLidas(0);
    } catch (err) {
      console.error("Erro ao marcar notificações:", err);
    }
  };

  const loadData = async () => {
    if (!isSupabaseConfigured) {
      setError("Configuração do Supabase ausente.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [eventosData, inscricoesData, avisosData] = await Promise.all([
        eventosApi.list(),
        inscricoesApi.getMinhasInscricoes(),
        avisosApi.list(),
      ]);

      setEventos(eventosData);
      setMinhasInscricoes(inscricoesData);
      setAvisos(avisosData);

      if (eventosData.length > 0) {
        setEventoSelecionado(eventosData[0]);
        const palestras = await palestrasApi.listByEvento(eventosData[0].id);
        setPalestrasEvento(palestras);
      }
    } catch (err: any) {
      setError(err.message || "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleInscreverEvento = async (eventoId: string) => {
    try {
      await inscricoesApi.inscreverEvento(eventoId);
      showStatus("success", "Inscrição realizada com sucesso!");
      loadData();
    } catch (err: any) {
      showStatus("error", err.message);
    }
  };

  const handleInscreverPalestra = async (palestraId: string) => {
    try {
      await inscricoesApi.inscreverPalestra(palestraId);
      showStatus("success", "Inscrição na palestra/atividade realizada!");
      await handleDownloadComprovanteInscricao(palestraId);
      loadData();
    } catch (err: any) {
      showStatus("error", err.message);
    }
  };

  const handleViewDetails = (palestra: Palestra) => {
    setDetailsPalestra(palestra);
    setDetailsOpen(true);
  };

  const handleDownloadComprovanteInscricao = async (palestraId: string) => {
    try {
      showStatus("success", "Gerando comprovante...");
      const resultado = await comprovantesApi.gerarInscricao(palestraId);
      downloadFile(resultado.url, resultado.filename);
      showStatus("success", "📄 Comprovante baixado!");
    } catch (err: any) {
      showStatus("error", err.message || "Erro ao gerar comprovante");
    }
  };

  const handleDownloadComprovantePresenca = async (palestraId: string) => {
    try {
      showStatus("success", "Gerando comprovante...");
      const resultado = await comprovantesApi.gerarPresenca(palestraId);
      downloadFile(resultado.url, resultado.filename);
      showStatus("success", "📄 Comprovante de presença baixado!");
    } catch (err: any) {
      showStatus("error", err.message || "Erro ao gerar comprovante");
    }
  };

  const downloadFile = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleQrCodeScan = async (qrData: string) => {
    try {
      const parsed = JSON.parse(qrData);

      if (parsed.type === "PRESENCA_PALESTRA" || parsed.type === "PRESENCA") {
        const palestraId = parsed.palestra_id || parsed.palestraId;
        let successMessage = "";

        if (parsed.type === "PRESENCA") {
          await presencaApi.registrar(palestraId);
          successMessage = `✅ Presença confirmada!\n${parsed.titulo || "Atividade registrada"}`;
        } else {
          const result = await presencaApi.validarQrCode(
            parsed.hash,
            palestraId,
          );
          successMessage = `✅ Presença confirmada!\n${result.palestra.titulo}\n${formatCargaHoraria(result.palestra)}`;
        }

        showStatus("success", successMessage);
        await handleDownloadComprovantePresenca(palestraId);

        // After scan success, redirect to home
        setActiveTab("home");
        loadData();
      } else {
        showStatus("error", "❌ QR Code não reconhecido");
      }
    } catch (err: any) {
      showStatus("error", err.message || "❌ QR Code inválido");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans max-w-lg mx-auto shadow-2xl relative sm:rounded-xl sm:my-4 sm:max-h-[calc(100vh-2rem)] sm:overflow-hidden flex flex-col">
      {/* Modal de Status Global */}
      <StatusModal
        isOpen={statusModal.isOpen}
        type={statusModal.type}
        title={statusModal.title || ""}
        message={statusModal.message}
        onClose={() => setStatusModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar relative w-full">
        <AnimatePresence mode="wait" initial={false}>
          {activeTab === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="min-h-full"
            >
              <StudentHome
                user={currentUser}
                loading={loading}
                error={error}
                onRetry={loadData}
                eventos={eventos}
                eventoSelecionado={eventoSelecionado}
                palestrasEvento={palestrasEvento}
                minhasInscricoes={minhasInscricoes}
                avisos={avisos}
                dismissedAvisos={dismissedAvisos}
                onDismissAviso={(id) =>
                  setDismissedAvisos([...dismissedAvisos, id])
                }
                notificacoesNaoLidas={notificacoesNaoLidas}
                onOpenNotificacoes={() => setShowNotificacoes(true)}
                onInscreverEvento={handleInscreverEvento}
                onInscreverPalestra={handleInscreverPalestra}
                onViewDetails={handleViewDetails}
                onOpenScanner={() => setActiveTab("scan")}
                onDownloadComprovanteInscricao={
                  handleDownloadComprovanteInscricao
                }
                onDownloadComprovantePresenca={
                  handleDownloadComprovantePresenca
                }
              />
            </motion.div>
          )}

          {activeTab === "scan" && (
            <motion.div
              key="scan"
              initial={{ opacity: 0, clipPath: "circle(0% at 50% 100%)" }}
              animate={{ opacity: 1, clipPath: "circle(150% at 50% 100%)" }}
              exit={{ opacity: 0, clipPath: "circle(0% at 50% 100%)" }}
              transition={{ duration: 0.4, ease: "circOut" }}
              className="h-full bg-black z-50 absolute inset-0 sm:rounded-xl"
            >
              <StudentScanner
                onScan={handleQrCodeScan}
                onClose={() => setActiveTab("home")}
              />
            </motion.div>
          )}

          {activeTab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="min-h-full"
            >
              <StudentProfile
                user={currentUser}
                minhasInscricoes={minhasInscricoes}
                onLogout={onLogout}
                onUpdateUser={(updated) => {
                  setCurrentUser({ ...currentUser, ...updated });
                  showStatus("success", "Perfil atualizado com sucesso!");
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <StudentNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Notification Modal */}
      <NotificationModal
        isOpen={showNotificacoes}
        onClose={() => setShowNotificacoes(false)}
        notificacoes={notificacoes}
        notificacoesNaoLidas={notificacoesNaoLidas}
        onMarcarLida={handleMarcarNotificacaoLida}
        onMarcarTodasLidas={handleMarcarTodasLidas}
      />

      <LectureDetailsModal
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        palestra={detailsPalestra}
        eventoTitulo={
          detailsPalestra
            ? eventos.find((e) => e.id === detailsPalestra.evento_id)?.titulo
            : undefined
        }
        isInscrito={
          detailsPalestra
            ? minhasInscricoes.palestras.some(
                (p: any) => p.id === detailsPalestra.id,
              )
            : false
        }
        isInscritoEvento={
          detailsPalestra
            ? minhasInscricoes.eventos.some(
                (e: any) => e.id === detailsPalestra.evento_id,
              )
            : false
        }
        onInscrever={() => {
          if (detailsPalestra) {
            handleInscreverPalestra(detailsPalestra.id);
            setDetailsOpen(false);
          }
        }}
      />
    </div>
  );
};

export default StudentApp;
