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
  Flame,
  CalendarDays,
  Timer,
  ChevronRight,
  Filter,
} from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
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
  onViewDetails: (palestra: Palestra) => void;
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
  onViewDetails,
  onOpenScanner,
  onDownloadComprovanteInscricao,
  onDownloadComprovantePresenca,
}) => {
  const [activeFilter, setActiveFilter] = React.useState<
    "todos" | "palestras" | "atividades" | "inscricoes"
  >("todos");

  const mainListRef = React.useRef<HTMLDivElement>(null);

  const now = new Date();
  const bannerAvisos = avisos.filter((a) => a.imagem_url);

  // Derived Lists
  const happeningNow = React.useMemo(() => {
    return palestrasEvento.filter((p) => {
      const start = new Date(p.data_hora_inicio);
      const end = new Date(p.data_hora_fim);
      return now >= start && now <= end;
    });
  }, [palestrasEvento]); // Note: 'now' changes only on re-render, effectively static unless we use a timer hook. For now simple render time is enough.

  const upcomingActivities = React.useMemo(() => {
    return palestrasEvento
      .filter((p) => new Date(p.data_hora_inicio) > now)
      .sort(
        (a, b) =>
          new Date(a.data_hora_inicio).getTime() -
          new Date(b.data_hora_inicio).getTime(),
      )
      .slice(0, 5);
  }, [palestrasEvento]);

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

  const filteredList = React.useMemo(() => {
    let items = palestrasEvento;
    if (activeFilter === "palestras")
      items = items.filter((p: any) => (p.tipo || "PALESTRA") === "PALESTRA");
    if (activeFilter === "atividades")
      items = items.filter((p: any) => p.tipo === "ATIVIDADE");
    if (activeFilter === "inscricoes")
      items = items.filter((p: any) => isInscritoPalestra(p.id));

    // Sort by date
    return items.sort(
      (a, b) =>
        new Date(a.data_hora_inicio).getTime() -
        new Date(b.data_hora_inicio).getTime(),
    );
  }, [palestrasEvento, activeFilter, minhasInscricoes]);

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
      <div className="flex justify-between items-center pt-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Olá, {user.nome.split(" ")[0]}
            <span className="ml-2 inline-block animate-wave origin-[70%_70%]">
              👋
            </span>
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
            <span className="bg-slate-100 px-2 py-0.5 rounded text-xs text-slate-600 border border-slate-200">
              Arquitetura
            </span>
            <span>•</span>
            <span className="text-slate-400">{user.semestre || "Aluno"}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <motion.div whileTap={{ scale: 0.9 }}>
            <TactileButton
              variant="ghost"
              onClick={onOpenNotificacoes}
              className="rounded-full w-10 h-10 p-0 relative bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all"
            >
              <Bell className="w-5 h-5 text-slate-600" />
              {notificacoesNaoLidas > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm ring-2 ring-white">
                  {notificacoesNaoLidas > 9 ? "9+" : notificacoesNaoLidas}
                </span>
              )}
            </TactileButton>
          </motion.div>
          <motion.div whileTap={{ scale: 0.9 }}>
            <TactileButton
              variant="ghost"
              onClick={onRetry}
              className="rounded-full w-10 h-10 p-0 bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all"
            >
              <RefreshCw className="w-5 h-5 text-slate-600" />
            </TactileButton>
          </motion.div>
        </div>
      </div>

      {/* Avisos */}
      {bannerAvisos.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-slate-700">Destaques</h2>
            <span className="text-xs text-slate-400">
              {bannerAvisos.length} banner{bannerAvisos.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-3 -mx-4 px-4 snap-x hide-scrollbar">
            {bannerAvisos.map((aviso) => (
              <div
                key={aviso.id}
                className="snap-center shrink-0 w-80 sm:w-96 rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm relative"
              >
                <div className="relative h-40 sm:h-44">
                  <img
                    src={aviso.imagem_url as string}
                    alt={aviso.titulo}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h3 className="text-base font-bold leading-tight">
                      {aviso.titulo}
                    </h3>
                    <p className="text-xs text-white/90 mt-1 line-clamp-2">
                      {aviso.mensagem}
                    </p>
                  </div>
                </div>
                {aviso.link_url && (
                  <div className="p-3">
                    <a
                      href={aviso.link_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-indigo-600 hover:underline"
                    >
                      Ver mais
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Avisos */}
      <AnimatePresence>
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
                      text: "text-emerald-800",
                      icon: (
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      ),
                    };
                  case "warning":
                    return {
                      bg: "bg-amber-50",
                      border: "border-amber-200",
                      text: "text-amber-800",
                      icon: (
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                      ),
                    };
                  case "error":
                    return {
                      bg: "bg-rose-50",
                      border: "border-rose-200",
                      text: "text-rose-800",
                      icon: <AlertCircle className="w-5 h-5 text-rose-600" />,
                    };
                  default:
                    return {
                      bg: "bg-indigo-50",
                      border: "border-indigo-200",
                      text: "text-indigo-800",
                      icon: <Info className="w-5 h-5 text-indigo-600" />,
                    };
                }
              };
              const styles = getAvisoStyles();
              return (
                <motion.div
                  key={aviso.id}
                  initial={{ opacity: 0, y: -20, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className={`${styles.bg} ${styles.border} border rounded-2xl p-4 relative overflow-hidden shadow-sm`}
                >
                  <button
                    onClick={() => onDismissAviso(aviso.id)}
                    className={`absolute top-3 right-3 ${styles.text} opacity-40 hover:opacity-100 p-1 transition-opacity`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="flex gap-4">
                    <div
                      className={`mt-0.5 p-2 bg-white/50 rounded-xl rounded-tl-none`}
                    >
                      {styles.icon}
                    </div>
                    <div className="flex-1 pr-6 pt-1">
                      <h4 className={`font-bold text-sm ${styles.text}`}>
                        {aviso.titulo}
                      </h4>
                      <p
                        className={`text-sm mt-1 ${styles.text} opacity-90 leading-relaxed`}
                      >
                        {aviso.mensagem}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
        </div>
      </AnimatePresence>

      {/* Happening Now Section */}
      <AnimatePresence>
        {happeningNow.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 space-y-4"
          >
            <div className="flex items-center gap-2 px-1">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <h2 className="text-lg font-bold text-slate-800">
                Acontecendo Agora
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {happeningNow.map((palestra) => (
                <AnimatedCard
                  key={palestra.id}
                  className="bg-linear-to-r from-slate-900 to-slate-800 text-white border-0 shadow-xl shadow-slate-200 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
                  <div className="absolute right-0 top-0 w-64 h-64 bg-rose-500/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-rose-500/30 transition-all duration-700"></div>

                  <div className="relative z-10 p-5 sm:p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-2">
                        <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider flex items-center gap-1 animate-pulse">
                          <Flame className="w-3 h-3" /> Ao Vivo
                        </span>
                        <span className="bg-white/10 text-white/90 text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 backdrop-blur-sm">
                          <Clock className="w-3 h-3" /> Até{" "}
                          {new Date(palestra.data_hora_fim).toLocaleTimeString(
                            "pt-BR",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </span>
                      </div>
                      <div className="text-xs font-medium text-slate-400 bg-slate-800/50 px-2 py-1 rounded border border-slate-700">
                        {palestra.sala || "Local a definir"}
                      </div>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold mb-2 leading-tight pr-4">
                      {palestra.titulo}
                    </h3>
                    <p className="text-slate-300 text-sm mb-6 line-clamp-1">
                      Com{" "}
                      {palestra.palestrante_nome ||
                        palestra.palestrante?.nome ||
                        "Palestrante Convidado"}
                    </p>

                    <div className="flex gap-3">
                      {isInscritoPalestra(palestra.id) ? (
                        <TactileButton
                          onClick={onOpenScanner}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 font-semibold shadow-lg shadow-emerald-900/20 flex-1 py-3"
                        >
                          <QrCode className="w-5 h-5 mr-2" /> Registrar Presença
                        </TactileButton>
                      ) : (
                        <TactileButton
                          onClick={() => onInscreverPalestra(palestra.id)}
                          className="bg-white hover:bg-slate-50 text-slate-900 border-0 font-semibold shadow-lg shadow-white/10 flex-1 py-3"
                        >
                          Inscrever-se Agora
                        </TactileButton>
                      )}
                    </div>
                  </div>
                </AnimatedCard>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Event */}
      {!loading && eventoSelecionado && happeningNow.length === 0 && (
        <AnimatedCard className="bg-indigo-600 border-none text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden min-h-55 flex flex-col justify-center">
          {eventoSelecionado.banner_url && (
            <div className="absolute inset-0">
              <img
                src={eventoSelecionado.banner_url}
                alt={eventoSelecionado.titulo}
                className="w-full h-full object-cover opacity-25"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-indigo-700/70"></div>
            </div>
          )}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-400 rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-blob"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-400 rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-blob animation-delay-2000"></div>
          <div className="relative z-10 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
              <div className="flex-1">
                <span className="bg-indigo-400/30 text-indigo-50 text-xs px-3 py-1.5 rounded-full mb-4 inline-flex items-center gap-2 backdrop-blur-md border border-indigo-400/30 font-medium">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {new Date(eventoSelecionado.data_inicio).toLocaleDateString(
                    "pt-BR",
                    { weekday: "long", day: "numeric", month: "long" },
                  )}
                </span>
                <h2 className="text-2xl sm:text-4xl font-extrabold mb-2 leading-tight tracking-tight">
                  {eventoSelecionado.titulo}
                </h2>
                <div className="flex items-center gap-2 text-indigo-100 text-sm sm:text-base font-medium opacity-90">
                  <MapPin className="w-4 h-4" />
                  {eventoSelecionado.local || "Auditório Principal"}
                </div>

                <CountdownTimer targetDate={eventoSelecionado.data_inicio} />
              </div>

              <div className="w-full sm:w-auto">
                {!isInscritoEvento(eventoSelecionado.id) ? (
                  <TactileButton
                    onClick={() => onInscreverEvento(eventoSelecionado.id)}
                    className="bg-white text-indigo-600 hover:bg-indigo-50 w-full sm:w-auto font-bold border-none px-8 py-4 text-base shadow-xl shadow-indigo-900/20"
                  >
                    Garantir Vaga
                  </TactileButton>
                ) : (
                  <div className="bg-white/20 text-white px-6 py-3 rounded-xl font-bold text-sm w-full sm:w-auto text-center flex items-center justify-center gap-2 backdrop-blur-md border border-white/20">
                    <CheckCircle className="w-5 h-5" />
                    Inscrição Confirmada
                  </div>
                )}
              </div>
            </div>
          </div>
        </AnimatedCard>
      )}

      {/* Upcoming Horizontal Scroll */}
      {upcomingActivities.length > 0 && (
        <div className="py-2">
          <div className="flex justify-between items-end px-1 mb-3">
            <h3 className="text-lg font-bold text-slate-800">
              Próximas Atividades
            </h3>
            <button
              onClick={() => {
                setActiveFilter("todos");
                setTimeout(() => mainListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
              }}
              className="text-xs text-indigo-600 font-semibold flex items-center gap-0.5 hover:underline"
            >
              Ver todas <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 snap-x hide-scrollbar">
            {upcomingActivities.map((palestra) => (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                key={palestra.id}
                className="snap-center shrink-0 w-70 sm:w-80 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform"></div>

                <div className="relative z-10 flex flex-col h-full">
                  <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded self-start mb-2 inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(palestra.data_hora_inicio).toLocaleTimeString(
                      "pt-BR",
                      { hour: "2-digit", minute: "2-digit" },
                    )}
                  </span>

                  <h4 className="font-bold text-slate-800 text-lg mb-1 leading-snug line-clamp-2">
                    {palestra.titulo}
                  </h4>
                  <p className="text-xs text-slate-500 mb-4 font-medium">
                    {palestra.palestrante_nome || palestra.palestrante?.nome}
                  </p>

                  <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-3">
                    <div className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {palestra.sala || "TBD"}
                    </div>
                    <button
                      onClick={() => onViewDetails(palestra)}
                      className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-100 transition-colors"
                    >
                      Ver Detalhes
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Main List with Filters */}
      <div ref={mainListRef} className="space-y-4 min-h-100">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar scroll-smooth">
          <FilterChip
            label="Tudo"
            active={activeFilter === "todos"}
            onClick={() => setActiveFilter("todos")}
          />
          <FilterChip
            label="Palestras"
            count={
              palestrasEvento.filter(
                (p) => (p.tipo || "PALESTRA") === "PALESTRA",
              ).length
            }
            active={activeFilter === "palestras"}
            onClick={() => setActiveFilter("palestras")}
          />
          <FilterChip
            label="Atividades"
            count={palestrasEvento.filter((p) => p.tipo === "ATIVIDADE").length}
            active={activeFilter === "atividades"}
            onClick={() => setActiveFilter("atividades")}
          />
          <FilterChip
            label="Minhas Inscrições"
            count={minhasInscricoes.palestras.length}
            active={activeFilter === "inscricoes"}
            onClick={() => setActiveFilter("inscricoes")}
          />
        </div>

        <div className="space-y-3">
          <LayoutGroup>
            <AnimatePresence mode="popLayout">
              {filteredList.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200"
                >
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">
                    Nenhuma atividade encontrada
                  </p>
                  <p className="text-slate-400 text-sm mt-1">
                    Tente mudar o filtro selecionado
                  </p>
                </motion.div>
              ) : (
                filteredList.map((palestra) => {
                  const inscrito = isInscritoPalestra(palestra.id);
                  const presente = presencaConfirmada(palestra.id);
                  const isPast = new Date(palestra.data_hora_fim) < new Date();
                  const isLive =
                    new Date() >= new Date(palestra.data_hora_inicio) &&
                    new Date() <= new Date(palestra.data_hora_fim);

                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      key={palestra.id}
                    >
                      <AnimatedCard
                        className={`p-0 border-0 shadow-sm hover:shadow-md transition-all overflow-hidden ${isLive ? "ring-2 ring-rose-500/50" : ""}`}
                      >
                        <div className="p-5 flex gap-4">
                          {/* Time Column */}
                          <div className="flex flex-col items-center justify-start min-w-14 border-r border-slate-50 pr-4">
                            <span className="text-lg font-bold text-slate-800">
                              {new Date(
                                palestra.data_hora_inicio,
                              ).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <span className="text-xs font-semibold text-slate-400 uppercase">
                              {new Date(palestra.data_hora_inicio)
                                .toLocaleDateString("pt-BR", {
                                  weekday: "short",
                                })
                                .replace(".", "")}
                            </span>
                            {isLive && (
                              <span className="mt-2 w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 py-0.5">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                {palestra.tipo === "ATIVIDADE" && (
                                  <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                                    ATIVIDADE
                                  </span>
                                )}
                                <h4 className="font-bold text-slate-800 text-base leading-tight">
                                  {palestra.titulo}
                                </h4>
                              </div>
                            </div>

                            <p className="text-sm text-slate-500 mb-3 truncate">
                              {palestra.palestrante_nome ||
                                palestra.palestrante?.nome ||
                                "Palestrante Convidado"}
                            </p>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                              <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                                <MapPin className="w-3 h-3" />{" "}
                                {palestra.sala || "TBD"}
                              </span>
                              <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                                <Award className="w-3 h-3" />{" "}
                                {palestra.carga_horaria}h
                              </span>

                              <div className="ml-auto flex gap-2">
                                {presente ? (
                                  <Badge
                                    color="green"
                                    icon={<CheckCircle className="w-3 h-3" />}
                                  >
                                    Presente
                                  </Badge>
                                ) : isPast ? (
                                  <Badge
                                    color="red"
                                    icon={<Info className="w-3 h-3" />}
                                  >
                                    Encerrado
                                  </Badge>
                                ) : inscrito ? (
                                  <Badge
                                    color="blue"
                                    icon={<CheckCircle className="w-3 h-3" />}
                                  >
                                    Inscrito
                                  </Badge>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions Footer */}
                        {(!isPast || presente) && (
                          <div className="bg-slate-50 px-5 py-3 flex justify-between items-center border-t border-slate-100">
                            {!isInscritoEvento(eventoSelecionado.id) ? (
                              <span className="text-xs text-slate-400 italic">
                                Inscreva-se no evento para participar
                              </span>
                            ) : !inscrito ? (
                              <div className="flex gap-3 w-full justify-end">
                                <button
                                  onClick={() => onViewDetails(palestra)}
                                  className="text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1"
                                >
                                  <FileText className="w-3 h-3" /> Detalhes
                                </button>
                                <button
                                  onClick={() =>
                                    onInscreverPalestra(palestra.id)
                                  }
                                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                                >
                                  Inscrever-se{" "}
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              </div>
                            ) : !presente && !isPast ? (
                              <div className="flex gap-3 w-full items-center">
                                <button
                                  onClick={() => onViewDetails(palestra)}
                                  className="text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1"
                                >
                                  <FileText className="w-3.5 h-3.5" /> Detalhes
                                </button>
                                <TactileButton
                                  onClick={onOpenScanner}
                                  size="sm"
                                  className="flex-1 bg-slate-900 text-white border-0 text-xs py-2 h-auto"
                                >
                                  <QrCode className="w-3.5 h-3.5 mr-1.5" />{" "}
                                  Registrar
                                </TactileButton>
                                <TactileButton
                                  onClick={() =>
                                    onDownloadComprovanteInscricao(palestra.id)
                                  }
                                  size="sm"
                                  variant="secondary"
                                  className="px-3 bg-white border border-slate-200 h-auto"
                                >
                                  <Download className="w-3.5 h-3.5 text-slate-500" />
                                </TactileButton>
                              </div>
                            ) : presente ? (
                              <button
                                onClick={() =>
                                  onDownloadComprovantePresenca(palestra.id)
                                }
                                className="text-xs font-bold text-green-600 hover:text-green-700 flex items-center gap-1 ml-auto"
                              >
                                <Download className="w-3 h-3" />{" "}
                                Certificado/Comprovante
                              </button>
                            ) : null}
                          </div>
                        )}
                      </AnimatedCard>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </LayoutGroup>
        </div>
      </div>
    </div>
  );
};

const Badge: React.FC<{
  children: React.ReactNode;
  color: "green" | "blue" | "red" | "amber";
  icon?: React.ReactNode;
}> = ({ children, color, icon }) => {
  const colors = {
    green: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    blue: "bg-indigo-100 text-indigo-700 border border-indigo-200",
    red: "bg-rose-100 text-rose-700 border border-rose-200",
    amber: "bg-amber-100 text-amber-700 border border-amber-200",
  };
  return (
    <span
      className={`${colors[color]} text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 shrink-0 shadow-sm`}
    >
      {icon} {children}
    </span>
  );
};

const FilterChip: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
}> = ({ label, active, onClick, count }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 border whitespace-nowrap ${
      active
        ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200 transform scale-105"
        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
    }`}
  >
    {label}
    {count !== undefined && (
      <span
        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
          active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
        }`}
      >
        {count}
      </span>
    )}
  </button>
);

const CountdownTimer: React.FC<{ targetDate: string }> = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = React.useState({
    days: 0,
    hours: 0,
    minutes: 0,
  });

  React.useEffect(() => {
    const calculateTime = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
        });
      }
    };
    calculateTime();
    const timer = setInterval(calculateTime, 60000); // Update every minute
    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0)
    return null;

  return (
    <div className="flex gap-2 sm:gap-4 mt-3">
      <div className="text-center">
        <span className="block text-xl sm:text-2xl font-bold font-mono">
          {timeLeft.days}
        </span>
        <span className="text-[10px] text-indigo-200 uppercase tracking-wider">
          Dias
        </span>
      </div>
      <div className="text-xl sm:text-2xl font-bold opacity-50">:</div>
      <div className="text-center">
        <span className="block text-xl sm:text-2xl font-bold font-mono">
          {timeLeft.hours}
        </span>
        <span className="text-[10px] text-indigo-200 uppercase tracking-wider">
          Horas
        </span>
      </div>
      <div className="text-xl sm:text-2xl font-bold opacity-50">:</div>
      <div className="text-center">
        <span className="block text-xl sm:text-2xl font-bold font-mono">
          {timeLeft.minutes}
        </span>
        <span className="text-[10px] text-indigo-200 uppercase tracking-wider">
          Min
        </span>
      </div>
    </div>
  );
};

export default StudentHome;
