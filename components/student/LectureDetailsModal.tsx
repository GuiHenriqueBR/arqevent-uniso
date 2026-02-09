import React from "react";
import {
  X,
  Clock,
  MapPin,
  User,
  CalendarDays,
  Award,
  CheckCircle,
  FileText,
  ChevronRight,
  GraduationCap,
} from "lucide-react";
import { Palestra, formatCargaHoraria } from "../../services/api";

interface LectureDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  palestra: Palestra | null;
  eventoTitulo?: string;
  isInscrito?: boolean;
  isInscritoEvento?: boolean;
  onInscrever?: () => void;
  userSemestre?: string;
}

const LectureDetailsModal: React.FC<LectureDetailsModalProps> = ({
  isOpen,
  onClose,
  palestra,
  eventoTitulo,
  isInscrito = false,
  isInscritoEvento = false,
  onInscrever,
  userSemestre,
}) => {
  if (!isOpen || !palestra) return null;

  const palestranteNome =
    palestra.palestrante_nome || palestra.palestrante?.nome || "Palestrante";

  // Parse semestres
  const parseSemestresPermitidos = (raw?: string | null): number[] | null => {
    if (!raw) return null;
    try {
      const arr = JSON.parse(raw);
      return Array.isArray(arr) && arr.length > 0 ? arr : null;
    } catch {
      return null;
    }
  };

  const parseSemestre = (sem?: string): number | null => {
    if (!sem) return null;
    const match = sem.match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
  };

  const semestres = parseSemestresPermitidos(palestra.semestres_permitidos);
  const userSem = parseSemestre(userSemestre);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {palestra.tipo === "ATIVIDADE" && (
                <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded shrink-0">
                  ATIVIDADE
                </span>
              )}
              {isInscrito && (
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0">
                  <CheckCircle className="w-3 h-3" /> INSCRITO
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-800 leading-tight">
              {palestra.titulo}
            </h3>
            {palestra.tipo !== "ATIVIDADE" && (
              <p className="text-sm text-slate-500 mt-0.5">{palestranteNome}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors bg-white hover:bg-slate-100 p-2 rounded-full shrink-0 ml-3"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">
          {/* Imagem de capa */}
          {palestra.imagem_url && (
            <div className="w-full h-40 sm:h-52 rounded-xl overflow-hidden -mt-1">
              <img
                src={palestra.imagem_url}
                alt={palestra.titulo}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Descrição - Seção principal destacada */}
          <div className="border-l-4 border-indigo-400 bg-indigo-50/50 rounded-r-xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              <p className="text-sm font-semibold text-indigo-700">
                Sobre esta atividade
              </p>
            </div>
            {palestra.descricao ? (
              <p className="text-slate-700 text-base leading-relaxed whitespace-pre-line">
                {palestra.descricao}
              </p>
            ) : (
              <p className="text-slate-400 text-sm italic">
                Nenhuma descrição disponível para esta atividade.
              </p>
            )}
          </div>

          {/* Informações em grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <CalendarDays className="w-5 h-5 text-indigo-500 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500">Evento</p>
                <p className="text-sm font-medium text-slate-800">
                  {eventoTitulo || "-"}
                </p>
              </div>
            </div>

            {palestra.tipo !== "ATIVIDADE" && (
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <User className="w-5 h-5 text-indigo-500 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Palestrante</p>
                  <p className="text-sm font-medium text-slate-800">
                    {palestranteNome}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <Clock className="w-5 h-5 text-indigo-500 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500">Data e Horário</p>
                <p className="text-sm font-medium text-slate-800">
                  {new Date(palestra.data_hora_inicio).toLocaleDateString(
                    "pt-BR",
                  )}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(palestra.data_hora_inicio).toLocaleTimeString(
                    "pt-BR",
                    { hour: "2-digit", minute: "2-digit" },
                  )}{" "}
                  -{" "}
                  {new Date(palestra.data_hora_fim).toLocaleTimeString(
                    "pt-BR",
                    { hour: "2-digit", minute: "2-digit" },
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <MapPin className="w-5 h-5 text-indigo-500 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500">Sala</p>
                <p className="text-sm font-medium text-slate-800">
                  {palestra.sala || "Não definida"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <Award className="w-5 h-5 text-indigo-500 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500">Carga Horária</p>
                <p className="text-sm font-medium text-slate-800">
                  {formatCargaHoraria(palestra)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 sm:col-span-2">
              <GraduationCap className="w-5 h-5 text-indigo-500 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500">Semestres</p>
                {semestres === null ? (
                  <p className="text-sm font-medium text-slate-800">
                    Todos os semestres
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {semestres.map((sem) => {
                      const isUserSem = userSem === sem;
                      return (
                        <span
                          key={sem}
                          className={`text-xs font-bold px-2 py-0.5 rounded ${
                            isUserSem
                              ? "bg-indigo-500 text-white"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {sem}º Sem
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer com ações */}
        <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          {!isInscrito && !isInscritoEvento ? (
            <>
              <p className="text-xs text-slate-400 italic">
                Inscreva-se no evento para participar
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 text-slate-600 hover:bg-slate-300 rounded-lg font-medium transition-colors text-sm"
              >
                Fechar
              </button>
            </>
          ) : !isInscrito ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 text-slate-600 hover:bg-slate-300 rounded-lg font-medium transition-colors text-sm"
              >
                Fechar
              </button>
              <button
                onClick={onInscrever}
                className="px-5 py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg font-bold transition-colors text-sm flex items-center gap-1.5 shadow-sm"
              >
                Inscrever-se <ChevronRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <CheckCircle className="w-3.5 h-3.5" /> Você está inscrito
              </span>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-600 text-white hover:bg-slate-700 rounded-lg font-medium transition-colors text-sm"
              >
                Fechar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LectureDetailsModal;
