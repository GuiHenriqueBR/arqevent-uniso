import React from "react";
import { User } from "../../types";
import { Evento, Palestra, Aviso } from "../../services/api";
import {
  Bell,
  RefreshCw,
  AlertCircle,
  X,
  CheckCircle,
  Calendar,
  Info,
  AlertTriangle,
  Clock,
  MapPin,
  Award,
  QrCode,
  Download,
  FileText,
} from "lucide-react";
import { motion } from "framer-motion";
import { AnimatedCard } from "../ui/AnimatedCard";
import { TactileButton } from "../ui/TactileButton";

interface StudentHomeProps {
  user: User;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  eventos: Evento[];
  eventoSelecionado: Evento | null;
  palestrasEvento: Palestra[];
  minhasInscricoes: { eventos: any[]; palestras: any[] };
  avisos: Aviso[];
  dismissedAvisos: string[];
  onDismissAviso: (id: string) => void;
  notificacoesNaoLidas: number;
  onOpenNotificacoes: () => void;
  onInscreverEvento: (id: string) => void;
  onInscreverPalestra: (id: string) => void;
  onOpenScanner: () => void;
  onDownloadComprovanteInscricao: (id: string) => void;
  onDownloadComprovantePresenca: (id: string) => void;
}

const StudentHome: React.FC<StudentHomeProps> = ({
  user,
  loading,
  error,
  onRetry,
  eventos,
  eventoSelecionado,
  palestrasEvento,
  minhasInscricoes,
  avisos,
  dismissedAvisos,
  onDismissAviso,
  notificacoesNaoLidas,
  onOpenNotificacoes,
  onInscreverEvento,
  onInscreverPalestra,
  onOpenScanner,
  onDownloadComprovanteInscricao,
  onDownloadComprovantePresenca,
}) => {
  const isInscritoEvento = (eventoId: string) => {
    return minhasInscricoes.eventos.some((i) => i.evento_id === eventoId);
  };

  const isInscritoPalestra = (palestraId: string) => {
    return minhasInscricoes.palestras.some((i) => i.palestra_id === palestraId);
  };

  const presencaConfirmada = (palestraId: string) => {
    const inscricao = minhasInscricoes.palestras.find(
      (i) => i.palestra_id === palestraId,
    );
    return inscricao?.presente || false;
  };

  if (loading) {
    return (
      <div className="pb-20 p-4 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-500">Carregando eventos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pb-20 p-4">
        <div className="bg-red-50 text-red-700 p-4 rounded-xl text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p>{error}</p>
          <TactileButton onClick={onRetry} variant="danger" className="mt-4">
            Tentar novamente
          </TactileButton>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            Olá, {user.nome.split(" ")[0]} 👋
          </h1>
          <p className="text-sm sm:text-base text-slate-500">
            Arquitetura • {user.semestre || "Aluno"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TactileButton
            variant="ghost"
            onClick={onOpenNotificacoes}
            className="rounded-full w-10 h-10 p-0 relative bg-white shadow-sm"
          >
            <Bell className="w-5 h-5 text-slate-400" />
            {notificacoesNaoLidas > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {notificacoesNaoLidas > 9 ? "9+" : notificacoesNaoLidas}
              </span>
            )}
          </TactileButton>
          <TactileButton
            variant="ghost"
            onClick={onRetry}
            className="rounded-full w-10 h-10 p-0 bg-white shadow-sm"
          >
            <RefreshCw className="w-5 h-5 text-slate-400" />
          </TactileButton>
        </div>
      </div>

      {/* Avisos */}
      <div className="space-y-3">
        {avisos
          .filter((a) => !dismissedAvisos.includes(a.id))
          .map((aviso) => {
            const getAvisoStyles = () => {
              switch (aviso.tipo) {
                case "success":
                  return {
                    bg: "bg-emerald-50",
                    border: "border-emerald-200",
                    text: "text-emerald-700",
                    icon: <CheckCircle className="w-5 h-5" />,
                  };
                case "warning":
                  return {
                    bg: "bg-amber-50",
                    border: "border-amber-200",
                    text: "text-amber-700",
                    icon: <AlertTriangle className="w-5 h-5" />,
                  };
                case "error":
                  return {
                    bg: "bg-red-50",
                    border: "border-red-200",
                    text: "text-red-700",
                    icon: <AlertCircle className="w-5 h-5" />,
                  };
                default:
                  return {
                    bg: "bg-blue-50",
                    border: "border-blue-200",
                    text: "text-blue-700",
                    icon: <Info className="w-5 h-5" />,
                  };
              }
            };
            const styles = getAvisoStyles();
            return (
              <motion.div
                key={aviso.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className={`${styles.bg} ${styles.border} border rounded-xl p-4 relative overflow-hidden`}
              >
                <button
                  onClick={() => onDismissAviso(aviso.id)}
                  className={`absolute top-2 right-2 ${styles.text} opacity-60 hover:opacity-100 p-1`}
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex gap-3">
                  <div className={`${styles.text} shrink-0 mt-0.5`}>
                    {styles.icon}
                  </div>
                  <div className="flex-1 pr-6">
                    <h4 className={`font-semibold ${styles.text}`}>
                      {aviso.titulo}
                    </h4>
                    <p className={`text-sm mt-1 ${styles.text} opacity-90`}>
                      {aviso.mensagem}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
      </div>

      {/* Featured Event */}
      {eventoSelecionado ? (
        <AnimatedCard className="bg-indigo-600 border-none text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <div className="relative z-10 p-5">
            <span className="bg-indigo-500/50 text-xs px-2 py-1 rounded-md mb-2 inline-block backdrop-blur-sm">
              {new Date(eventoSelecionado.data_inicio).toLocaleDateString(
                "pt-BR",
              )}
            </span>
            <h2 className="text-xl font-bold mb-1 leading-tight">
              {eventoSelecionado.titulo}
            </h2>
            <p className="text-indigo-100 text-sm mb-6">
              {eventoSelecionado.local || "Local a definir"}
            </p>

            {!isInscritoEvento(eventoSelecionado.id) ? (
              <TactileButton
                onClick={() => onInscreverEvento(eventoSelecionado.id)}
                className="bg-white text-indigo-600 hover:bg-indigo-50 w-full font-semibold border-none"
              >
                Inscrever-se no Evento
              </TactileButton>
            ) : (
              <div className="bg-white/20 text-white px-4 py-2 rounded-lg font-semibold text-sm w-full text-center flex items-center justify-center gap-2 backdrop-blur-md">
                <CheckCircle className="w-4 h-4" />
                Inscrito no Evento
              </div>
            )}
          </div>
        </AnimatedCard>
      ) : eventos.length === 0 ? (
        <div className="bg-slate-100 rounded-xl p-6 text-center">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Nenhum evento disponível no momento</p>
        </div>
      ) : null}

      {/* Palestras List */}
      {eventoSelecionado && (
        <div className="space-y-6">
          {["PALESTRA", "ATIVIDADE"].map((tipo) => {
            const items = palestrasEvento.filter(
              (p: any) => (p.tipo || "PALESTRA") === tipo,
            );
            if (items.length === 0) return null;
            const label = tipo === "PALESTRA" ? "Palestras" : "Atividades";

            return (
              <div key={tipo} className="space-y-3">
                <h3 className="text-lg font-bold text-slate-800 px-1">
                  {label} ({items.length})
                </h3>
                {items.map((palestra: any) => {
                  const inscrito = isInscritoPalestra(palestra.id);
                  const presente = presencaConfirmada(palestra.id);
                  const isPast = new Date(palestra.data_hora_fim) < new Date();

                  return (
                    <AnimatedCard
                      key={palestra.id}
                      className="p-4 flex flex-col gap-3"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-800 truncate">
                            {palestra.titulo}
                          </h4>
                          <p className="text-sm text-slate-500 truncate">
                            {palestra.palestrante_nome ||
                              (palestra as any).profiles?.nome ||
                              "Palestrante"}
                          </p>
                        </div>
                        {presente && (
                          <Badge
                            color="green"
                            icon={<CheckCircle className="w-3 h-3" />}
                          >
                            Presente
                          </Badge>
                        )}
                        {inscrito && !presente && !isPast && (
                          <Badge color="blue">Inscrito</Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs text-slate-500 border-t border-slate-50 pt-3">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(
                            palestra.data_hora_inicio,
                          ).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {palestra.sala || "Sala TBD"}
                        </div>
                        <div className="flex items-center gap-1">
                          <Award className="w-3.5 h-3.5" />
                          {palestra.carga_horaria}h
                        </div>
                      </div>

                      <div className="pt-1">
                        {!isInscritoEvento(eventoSelecionado.id) ? (
                          <p className="text-xs text-slate-400 text-center py-2 bg-slate-50 rounded-lg">
                            Inscreva-se no evento para participar
                          </p>
                        ) : !inscrito ? (
                          <TactileButton
                            variant="secondary"
                            size="sm"
                            onClick={() => onInscreverPalestra(palestra.id)}
                            className="w-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-none"
                          >
                            Inscrever-se
                          </TactileButton>
                        ) : !presente && !isPast ? (
                          <div className="flex gap-2">
                            <TactileButton
                              onClick={onOpenScanner}
                              className="flex-1 bg-slate-800 text-white hover:bg-slate-900 border-none gap-2"
                              size="sm"
                            >
                              <QrCode className="w-4 h-4" /> Registrar Presença
                            </TactileButton>
                            <TactileButton
                              onClick={() =>
                                onDownloadComprovanteInscricao(palestra.id)
                              }
                              variant="secondary"
                              size="sm"
                              className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3"
                            >
                              <Download className="w-4 h-4" />
                            </TactileButton>
                          </div>
                        ) : presente ? (
                          <div className="flex gap-2">
                            <div className="flex-1 text-xs text-green-600 text-center py-2 bg-green-50 rounded-lg flex items-center justify-center gap-1 font-medium">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Confirmado
                            </div>
                            <TactileButton
                              onClick={() =>
                                onDownloadComprovantePresenca(palestra.id)
                              }
                              variant="secondary"
                              size="sm"
                              className="bg-green-50 text-green-700 hover:bg-green-100 px-3"
                            >
                              <FileText className="w-4 h-4" />
                            </TactileButton>
                          </div>
                        ) : (
                          <p className="text-xs text-red-400 text-center py-2 bg-red-50 rounded-lg">
                            Encerrada - presença não registrada
                          </p>
                        )}
                      </div>
                    </AnimatedCard>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Badge: React.FC<{
  children: React.ReactNode;
  color: "green" | "blue";
  icon?: React.ReactNode;
}> = ({ children, color, icon }) => {
  const colors = {
    green: "bg-green-100 text-green-700",
    blue: "bg-blue-100 text-blue-700",
  };
  return (
    <span
      className={`${colors[color]} text-[10px] sm:text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 shrink-0`}
    >
      {icon} {children}
    </span>
  );
};

export default StudentHome;
