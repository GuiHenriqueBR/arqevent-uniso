import React from "react";
import { User } from "../../types";
import {
  Evento,
  Palestra,
  Aviso,
  formatSemestres,
  parseSemestresPermitidos,
} from "../../services/api";
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
  BookOpen,
  Share2,
  Star,
  ChevronRight,
  Filter,
  GraduationCap,
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
  const [isHeroModalOpen, setIsHeroModalOpen] = React.useState(false);
  const [heroImageIndex, setHeroImageIndex] = React.useState(0);

  const mainListRef = React.useRef<HTMLDivElement>(null);

  const parseBannerGallery = (raw?: unknown): string[] => {
    if (Array.isArray(raw)) {
      return raw.filter((item) => typeof item === "string") as string[];
    }
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed)
          ? (parsed.filter((item) => typeof item === "string") as string[])
          : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  React.useEffect(() => {
    setIsHeroModalOpen(false);
  }, [eventoSelecionado?.id]);

  const heroImages = React.useMemo(() => {
    if (!eventoSelecionado) return [] as string[];
    const gallery = parseBannerGallery(eventoSelecionado.banner_galeria);
    const images = [
      ...(eventoSelecionado.banner_url ? [eventoSelecionado.banner_url] : []),
      ...gallery,
    ];
    return Array.from(new Set(images)).filter(Boolean);
  }, [eventoSelecionado?.banner_url, eventoSelecionado?.banner_galeria]);

  React.useEffect(() => {
    setHeroImageIndex(0);
    if (heroImages.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setHeroImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [heroImages.length, eventoSelecionado?.id]);

  const now = new Date();
  const bannerAvisos = avisos.filter((a) => a.imagem_url);

  const getEventoStatus = (evento: Evento) => {
    if (evento.status_manual && evento.status_manual !== "AUTO") {
      return evento.status_manual;
    }
    const start = new Date(evento.data_inicio);
    const end = new Date(evento.data_fim);
    if (now >= start && now <= end) return "AO_VIVO";
    if (now > end) return "ENCERRADO";
    return "ABERTO";
  };

  const getStatusMeta = (status: string) => {
    switch (status) {
      case "AO_VIVO":
        return {
          label: "Ao vivo",
          className: "bg-rose-500/80 text-white border border-rose-200/30",
        };
      case "ENCERRADO":
        return {
          label: "Encerrado",
          className: "bg-slate-700/70 text-white border border-slate-200/10",
        };
      case "ABERTO":
        return {
          label: "Inscricoes abertas",
          className:
            "bg-emerald-500/80 text-white border border-emerald-200/30",
        };
      default:
        return {
          label: "Status",
          className: "bg-white/15 text-white border border-white/20",
        };
    }
  };

  const handleShareEvento = async (evento: Evento) => {
    const shareUrl = evento.compartilhar_url || window.location.href;
    const shareData = {
      title: evento.titulo,
      text: evento.descricao || "",
      url: shareUrl,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
    } catch {
      // ignore share errors
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch {
      // ignore clipboard errors
    }
  };

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
          <p className="text-sm font-medium text-slate-500 mt-0.5 flex items-center gap-2">
            <span className="text-slate-600 font-semibold">Arquitetura</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">{user.semestre || "Aluno"}</span>
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
                  <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent"></div>
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
                        className={`text-sm mt-1 ${styles.text} opacity-90 leading-relaxed whitespace-pre-line`}
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

      {/* Hero Event — Instagram-style Post */}
      {!loading && eventoSelecionado && happeningNow.length === 0 && (
        <div className="rounded-2xl overflow-hidden shadow-xl shadow-slate-900/15 border border-slate-100">
          {/* Image Section — Full visual like an IG post */}
          <div className="relative aspect-4/3 sm:aspect-video bg-slate-900 overflow-hidden group">
            {heroImages.length > 0 ? (
              <img
                src={heroImages[heroImageIndex]}
                alt={eventoSelecionado.titulo}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              /* Fallback visual when no banner */
              <div className="absolute inset-0 bg-linear-to-br from-slate-800 via-slate-900 to-slate-950">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30"></div>
                <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>
                <div className="absolute -left-10 -bottom-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl"></div>
              </div>
            )}

            {/* Gradient overlays for text readability */}
            <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/35 to-transparent"></div>
            <div className="absolute inset-0 bg-linear-to-r from-black/35 to-transparent"></div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(0,0,0,0.6),rgba(0,0,0,0))]"></div>

            {/* Top badges */}
            <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-10">
              <div className="flex flex-wrap gap-2">
                <span className="bg-white/15 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 border border-white/20">
                  <CalendarDays className="w-3 h-3" />
                  {new Date(eventoSelecionado.data_inicio)
                    .toLocaleDateString("pt-BR", {
                      day: "numeric",
                      month: "short",
                    })
                    .toUpperCase()}
                </span>
                {eventoSelecionado.destaque && (
                  <span className="bg-amber-400/80 text-slate-900 text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-amber-200/40">
                    <Star className="w-3 h-3" /> Evento principal
                  </span>
                )}
                <span
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${getStatusMeta(getEventoStatus(eventoSelecionado)).className}`}
                >
                  {getStatusMeta(getEventoStatus(eventoSelecionado)).label}
                </span>
              </div>
              {eventoSelecionado.local && (
                <span className="bg-white/15 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/20">
                  <MapPin className="w-3 h-3" />
                  {eventoSelecionado.local}
                </span>
              )}
            </div>

            {/* Bottom content over image */}
            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 z-10">
              <h2 className="text-2xl sm:text-3xl font-black mb-1.5 leading-tight tracking-tight text-white drop-shadow-lg">
                {eventoSelecionado.titulo}
              </h2>
              {eventoSelecionado.descricao && (
                <p className="text-white/80 text-sm leading-relaxed line-clamp-2 max-w-lg drop-shadow-md">
                  {eventoSelecionado.descricao}
                </p>
              )}
              {eventoSelecionado.descricao && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setIsHeroModalOpen(true)}
                    className="inline-flex items-center gap-1.5 text-white/90 text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Ler mais
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer — Action bar */}
          <div className="bg-white p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {/* Countdown */}
              <div className="flex items-center gap-3">
                <CountdownTimer targetDate={eventoSelecionado.data_inicio} />
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {eventoSelecionado.cta_sec_url && (
                  <a
                    href={eventoSelecionado.cta_sec_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl border border-slate-200"
                  >
                    {eventoSelecionado.cta_sec_label || "Saiba mais"}
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => handleShareEvento(eventoSelecionado)}
                  className="inline-flex items-center justify-center text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200"
                >
                  <Share2 className="w-4 h-4 mr-2" /> Compartilhar
                </button>
                {!isInscritoEvento(eventoSelecionado.id) ? (
                  <TactileButton
                    onClick={() => onInscreverEvento(eventoSelecionado.id)}
                    className="bg-slate-900 text-white hover:bg-slate-800 font-bold border-none px-5 py-2.5 text-sm shadow-md shadow-slate-900/20 rounded-xl"
                  >
                    {eventoSelecionado.cta_label || "Garantir Vaga"}
                  </TactileButton>
                ) : (
                  <div className="bg-emerald-50 text-emerald-700 px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 border border-emerald-100">
                    <CheckCircle className="w-4 h-4" />
                    Inscrito
                  </div>
                )}
              </div>
            </div>
            {heroImages.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-3">
                {heroImages.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setHeroImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === heroImageIndex ? "bg-slate-900" : "bg-slate-300"
                    }`}
                    aria-label={`Banner ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {isHeroModalOpen && eventoSelecionado && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsHeroModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-video bg-slate-900">
              {heroImages.length > 0 ? (
                <img
                  src={heroImages[0]}
                  alt={eventoSelecionado.titulo}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-linear-to-br from-slate-800 via-slate-900 to-slate-950"></div>
              )}
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-white text-xl font-bold drop-shadow">
                  {eventoSelecionado.titulo}
                </h3>
                <p className="text-white/80 text-sm mt-1">
                  {new Date(eventoSelecionado.data_inicio).toLocaleDateString(
                    "pt-BR",
                    { weekday: "long", day: "numeric", month: "long" },
                  )}
                  {eventoSelecionado.local
                    ? ` • ${eventoSelecionado.local}`
                    : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsHeroModalOpen(false)}
                className="absolute top-3 right-3 bg-white/15 text-white hover:bg-white/25 rounded-full p-2 border border-white/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 sm:p-6 max-h-[50vh] overflow-y-auto">
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                {eventoSelecionado.descricao || "Sem descrição disponível."}
              </p>
            </div>
          </div>
        </div>
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
                setTimeout(
                  () =>
                    mainListRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    }),
                  100,
                );
              }}
              className="text-xs text-slate-600 font-semibold flex items-center gap-0.5 hover:underline"
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
                className="snap-center shrink-0 w-70 sm:w-80 bg-white rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all"
              >
                {palestra.imagem_url ? (
                  <div className="w-full h-28 overflow-hidden">
                    <img
                      src={palestra.imagem_url}
                      alt={palestra.titulo}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform"></div>
                )}

                <div className="relative z-10 flex flex-col h-full p-4">
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

                  {parseSemestresPermitidos(palestra.semestres_permitidos) && (
                    <div className="flex items-center gap-1 text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded self-start font-semibold">
                      <GraduationCap className="w-3 h-3" />
                      {formatSemestres(palestra.semestres_permitidos)}
                    </div>
                  )}

                  <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-3">
                    <div className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {palestra.sala || "TBD"}
                    </div>
                    <button
                      onClick={() => onViewDetails(palestra)}
                      className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-200 transition-colors"
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
                        {palestra.imagem_url && (
                          <div className="w-full h-32 overflow-hidden">
                            <img
                              src={palestra.imagem_url}
                              alt={palestra.titulo}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        )}
                        <div className="p-5 flex gap-4">
                          {/* Time Column REFINED */}
                          <div className="flex flex-col items-center justify-center min-w-14 sm:min-w-16 text-center">
                            <span className="text-2xl font-bold text-slate-800 leading-none">
                              {new Date(palestra.data_hora_inicio).getDate()}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                              {new Date(palestra.data_hora_inicio)
                                .toLocaleDateString("pt-BR", {
                                  weekday: "short",
                                })
                                .replace(".", "")}
                            </span>
                            <span className="text-xs font-medium text-slate-500 mt-2 bg-slate-100 px-1.5 py-0.5 rounded">
                              {new Date(
                                palestra.data_hora_inicio,
                              ).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {isLive && (
                              <span className="mt-2 text-[10px] font-bold text-rose-500 animate-pulse">
                                AO VIVO
                              </span>
                            )}
                          </div>

                          {/* Content REFINED */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {palestra.tipo === "ATIVIDADE" && (
                                <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 px-1.5 py-0.5 rounded">
                                  ATIVIDADE
                                </span>
                              )}
                              <h4 className="font-bold text-slate-900 text-base leading-tight truncate">
                                {palestra.titulo}
                              </h4>
                            </div>

                            <p className="text-sm text-slate-500 mb-2 truncate">
                              {palestra.palestrante_nome ||
                                palestra.palestrante?.nome ||
                                "Palestrante Convidado"}
                            </p>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                              <span className="flex items-center gap-1 font-medium text-slate-500">
                                <MapPin className="w-3 h-3" />{" "}
                                {palestra.sala || "TBD"}
                              </span>
                              {parseSemestresPermitidos(
                                palestra.semestres_permitidos,
                              ) && (
                                <span className="flex items-center gap-1 font-medium text-indigo-500">
                                  <GraduationCap className="w-3 h-3" />
                                  {formatSemestres(
                                    palestra.semestres_permitidos,
                                  )}
                                </span>
                              )}

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
                                    color="gray"
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
                          <div className="bg-slate-50/50 px-4 sm:px-5 py-3 flex justify-between items-center border-t border-slate-100">
                            {!inscrito ? (
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
                                  className="text-xs font-bold text-slate-800 hover:text-slate-900 flex items-center gap-1"
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
  color: "green" | "blue" | "red" | "amber" | "gray";
  icon?: React.ReactNode;
}> = ({ children, color, icon }) => {
  const colors = {
    green: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    blue: "bg-indigo-50 text-indigo-700 border border-indigo-100",
    red: "bg-rose-50 text-rose-700 border border-rose-100",
    amber: "bg-amber-50 text-amber-700 border border-amber-100",
    gray: "bg-slate-100 text-slate-500 border border-slate-200",
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
        ? "bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-200 transform scale-105"
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
    <div className="flex items-center gap-1.5 text-sm">
      <Timer className="w-4 h-4 text-slate-400" />
      <span className="font-bold text-slate-800 tabular-nums">
        {timeLeft.days}d {String(timeLeft.hours).padStart(2, "0")}h{" "}
        {String(timeLeft.minutes).padStart(2, "0")}m
      </span>
      <span className="text-slate-400 text-xs font-medium">restantes</span>
    </div>
  );
};

export default StudentHome;
