import React from "react";
import { X, Clock, MapPin, User, CalendarDays, Award } from "lucide-react";
import { Palestra, formatCargaHoraria } from "../../services/api";

interface LectureDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  palestra: Palestra | null;
  eventoTitulo?: string;
}

const LectureDetailsModal: React.FC<LectureDetailsModalProps> = ({
  isOpen,
  onClose,
  palestra,
  eventoTitulo,
}) => {
  if (!isOpen || !palestra) return null;

  const palestranteNome =
    palestra.palestrante_nome || palestra.palestrante?.nome || "Palestrante";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Detalhes da Palestra/Atividade
            </h3>
            <p className="text-sm text-slate-500 mt-1">{palestra.titulo}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors bg-white hover:bg-slate-100 p-2 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {palestra.descricao && (
            <div>
              <p className="text-sm text-slate-500 mb-1">Descricao</p>
              <p className="text-slate-800 text-sm leading-relaxed">
                {palestra.descricao}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <CalendarDays className="w-5 h-5 text-indigo-500 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500">Evento</p>
                <p className="text-sm font-medium text-slate-800">
                  {eventoTitulo || "-"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <User className="w-5 h-5 text-indigo-500 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500">Palestrante</p>
                <p className="text-sm font-medium text-slate-800">
                  {palestranteNome}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <Clock className="w-5 h-5 text-indigo-500 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500">Data e Horario</p>
                <p className="text-sm font-medium text-slate-800">
                  {new Date(palestra.data_hora_inicio).toLocaleDateString(
                    "pt-BR",
                  )}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(palestra.data_hora_inicio).toLocaleTimeString(
                    "pt-BR",
                    { hour: "2-digit", minute: "2-digit" },
                  )} - {" "}
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
                  {palestra.sala || "Nao definida"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <Award className="w-5 h-5 text-indigo-500 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500">Carga horaria</p>
                <p className="text-sm font-medium text-slate-800">
                  {formatCargaHoraria(palestra)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-600 text-white hover:bg-slate-700 rounded-lg font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default LectureDetailsModal;
