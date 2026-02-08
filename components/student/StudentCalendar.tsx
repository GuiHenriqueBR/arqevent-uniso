import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  CalendarDays,
  Clock,
  MapPin,
  User as UserIcon,
  GraduationCap,
  CheckCircle,
  Radio,
  ChevronRight,
  CalendarX,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Palestra, Evento, formatCargaHoraria } from "../../services/api";

interface StudentCalendarProps {
  eventos: Evento[];
  palestras: Palestra[];
  minhasInscricoes: { eventos: any[]; palestras: any[] };
  userSemestre?: string;
  onViewDetails: (palestra: Palestra) => void;
  onInscreverPalestra: (palestraId: string) => void;
  loading?: boolean;
}

// Parse semestre string to number: "5" -> 5, "5º Semestre" -> 5, "5º" -> 5
const parseSemestre = (semestre?: string): number | null => {
  if (!semestre) return null;
  const match = semestre.match(/(\d+)/);
  return match ? parseInt(match[1]) : null;
};

// Parse semestres_permitidos JSON string to number array
const parseSemestresPermitidos = (raw?: string | null): number[] | null => {
  if (!raw) return null; // null = todos
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) && arr.length > 0 ? arr : null;
  } catch {
    return null;
  }
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
};

const formatTime = (dateStr: string): string => {
  return new Date(dateStr).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDayLabel = (dateStr: string): string => {
  const d = new Date(dateStr);
  const day = d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
  const weekday = d
    .toLocaleDateString("pt-BR", { weekday: "short" })
    .replace(".", "");
  return `${weekday} ${day}`;
};

const isToday = (dateStr: string): boolean => {
  const d = new Date(dateStr);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
};

const isLive = (palestra: Palestra): boolean => {
  const now = new Date();
  return (
    new Date(palestra.data_hora_inicio) <= now &&
    new Date(palestra.data_hora_fim) >= now
  );
};

const getEventoStatus = (evento?: Evento) => {
  if (!evento) return null;
  if (evento.status_manual && evento.status_manual !== "AUTO") {
    return evento.status_manual;
  }
  const now = new Date();
  const start = new Date(evento.data_inicio);
  const end = new Date(evento.data_fim);
  if (now >= start && now <= end) return "AO_VIVO";
  if (now > end) return "ENCERRADO";
  return "ABERTO";
};

const StudentCalendar: React.FC<StudentCalendarProps> = ({
  eventos,
  palestras,
  minhasInscricoes,
  userSemestre,
  onViewDetails,
  onInscreverPalestra,
  loading,
}) => {
  const userSem = parseSemestre(userSemestre);
  const dayScrollRef = useRef<HTMLDivElement>(null);
  const primaryEvent = eventos.find((e) => e.destaque) || eventos[0];
  const eventStatus = getEventoStatus(primaryEvent);

  // Group palestras by date
  const { days, palestrasByDay } = useMemo(() => {
    const groups: Record<string, Palestra[]> = {};
    const sorted = [...palestras].sort(
      (a, b) =>
        new Date(a.data_hora_inicio).getTime() -
        new Date(b.data_hora_inicio).getTime(),
    );

    sorted.forEach((p) => {
      const dateKey = new Date(p.data_hora_inicio).toISOString().slice(0, 10);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(p);
    });

    const dayKeys = Object.keys(groups).sort();
    return { days: dayKeys, palestrasByDay: groups };
  }, [palestras]);

  // Default to today or first day
  const [selectedDay, setSelectedDay] = useState<string>("");

  useEffect(() => {
    if (days.length === 0) return;
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayDay = days.find((d) => d === todayStr);
    setSelectedDay(todayDay || days[0]);
  }, [days]);

  // Scroll active day chip into view
  useEffect(() => {
    if (!dayScrollRef.current || !selectedDay) return;
    const activeBtn = dayScrollRef.current.querySelector(
      `[data-day="${selectedDay}"]`,
    ) as HTMLElement;
    if (activeBtn) {
      activeBtn.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [selectedDay]);

  const currentPalestras = selectedDay ? palestrasByDay[selectedDay] || [] : [];

  const isInscrito = (palestraId: string) =>
    minhasInscricoes.palestras.some((p: any) => p.id === palestraId);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-3 border-slate-200 border-t-slate-700 rounded-full animate-spin" />
        <p className="text-sm text-slate-500 mt-4">Carregando calendário...</p>
      </div>
    );
  }

  if (palestras.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <CalendarX className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-700 mb-1">
          Nenhuma atividade
        </h3>
              <p className="text-xs text-slate-500">
                Programacao do evento
                {primaryEvent && ` • ${primaryEvent.titulo}`}
              </p>
              {primaryEvent && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {primaryEvent.destaque && (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                      Evento principal
                    </span>
                  )}
                  {eventStatus && (
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      {eventStatus === "AO_VIVO"
                        ? "Ao vivo"
                        : eventStatus === "ENCERRADO"
                          ? "Encerrado"
                          : "Inscricoes abertas"}
                    </span>
                  )}
                </div>
              )}
    );
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="px-5 pt-6 pb-3">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Calendário</h2>
              <p className="text-xs text-slate-500">
                Programação do evento
                {eventos.length > 0 && ` • ${eventos[0].titulo}`}
              </p>
            </div>
          </div>

          {/* Day Selector */}
          <div
            ref={dayScrollRef}
            className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1"
          >
            {days.map((day) => {
              const active = day === selectedDay;
              const today = isToday(day);
              return (
                <button
                  key={day}
                  data-day={day}
                  onClick={() => setSelectedDay(day)}
                  className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border relative ${
                    active
                      ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span className="capitalize">{formatDayLabel(day)}</span>
                  {today && (
                    <span
                      className={`block text-[9px] mt-0.5 font-bold ${
                        active ? "text-indigo-300" : "text-indigo-500"
                      }`}
                    >
                      HOJE
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-5 pt-4 space-y-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDay}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {currentPalestras.length === 0 ? (
              <div className="text-center py-12">
                <CalendarX className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">
                  Nenhuma atividade neste dia
                </p>
              </div>
            ) : (
              currentPalestras.map((palestra, idx) => {
                const inscrito = isInscrito(palestra.id);
                const live = isLive(palestra);
                const semestres = parseSemestresPermitidos(
                  palestra.semestres_permitidos,
                );
                const palestrante =
                  palestra.palestrante_nome || palestra.palestrante?.nome;
                const isPast = new Date(palestra.data_hora_fim) < new Date();

                return (
                  <motion.button
                    key={palestra.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.25 }}
                    onClick={() => onViewDetails(palestra)}
                    className={`w-full text-left rounded-2xl border transition-all active:scale-[0.98] ${
                      live
                        ? "bg-emerald-50 border-emerald-200 shadow-md shadow-emerald-100"
                        : inscrito
                          ? "bg-indigo-50/50 border-indigo-200"
                          : isPast
                            ? "bg-slate-50 border-slate-100 opacity-70"
                            : "bg-white border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md"
                    }`}
                  >
                    <div className="flex">
                      {/* Time Column */}
                      <div
                        className={`shrink-0 w-18 flex flex-col items-center justify-center py-4 border-r ${
                          live
                            ? "border-emerald-200"
                            : inscrito
                              ? "border-indigo-200"
                              : "border-slate-100"
                        }`}
                      >
                        <span
                          className={`text-base font-bold ${
                            live
                              ? "text-emerald-700"
                              : isPast
                                ? "text-slate-400"
                                : "text-slate-800"
                          }`}
                        >
                          {formatTime(palestra.data_hora_inicio)}
                        </span>
                        <span className="text-[10px] text-slate-400 my-0.5">
                          até
                        </span>
                        <span
                          className={`text-xs ${
                            live ? "text-emerald-600" : "text-slate-500"
                          }`}
                        >
                          {formatTime(palestra.data_hora_fim)}
                        </span>
                      </div>

                      {/* Content Column */}
                      <div className="flex-1 min-w-0 p-4">
                        {/* Badges Row */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-2">
                          {palestra.tipo === "ATIVIDADE" ? (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                              ATIVIDADE
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                              PALESTRA
                            </span>
                          )}

                          {live && (
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Radio className="w-2.5 h-2.5 animate-pulse" /> AO
                              VIVO
                            </span>
                          )}

                          {inscrito && (
                            <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <CheckCircle className="w-2.5 h-2.5" /> INSCRITO
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h4
                          className={`text-sm font-bold leading-snug mb-1.5 ${
                            isPast ? "text-slate-500" : "text-slate-800"
                          }`}
                        >
                          {palestra.titulo}
                        </h4>

                        {/* Info rows */}
                        <div className="space-y-1">
                          {palestrante && (
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <UserIcon className="w-3 h-3 shrink-0" />
                              <span className="text-xs truncate">
                                {palestrante}
                              </span>
                            </div>
                          )}

                          {palestra.sala && (
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span className="text-xs">{palestra.sala}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span className="text-xs">
                              {formatCargaHoraria(palestra)}
                            </span>
                          </div>
                        </div>

                        {/* Semestres Badges */}
                        <div className="flex flex-wrap items-center gap-1 mt-2.5">
                          <GraduationCap className="w-3 h-3 text-slate-400 shrink-0" />
                          {semestres === null ? (
                            <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              Todos os semestres
                            </span>
                          ) : (
                            semestres.map((sem) => {
                              const isUserSem = userSem === sem;
                              return (
                                <span
                                  key={sem}
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    isUserSem
                                      ? "bg-indigo-500 text-white ring-1 ring-indigo-300"
                                      : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {sem}º
                                </span>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="shrink-0 flex items-center pr-3">
                        <ChevronRight
                          className={`w-4 h-4 ${
                            live ? "text-emerald-400" : "text-slate-300"
                          }`}
                        />
                      </div>
                    </div>
                  </motion.button>
                );
              })
            )}
          </motion.div>
        </AnimatePresence>

        {/* Legend */}
        {currentPalestras.length > 0 && userSem && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
            <span className="inline-block w-4 h-4 rounded bg-indigo-500" />
            <span>= Seu semestre ({userSem}º)</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentCalendar;
