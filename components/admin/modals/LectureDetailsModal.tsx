import React, { useState } from "react";
import {
  X,
  Clock,
  MapPin,
  User,
  CalendarDays,
  Users,
  RefreshCw,
} from "lucide-react";
import { Palestra, Evento, palestrasApi } from "../../../services/api";

interface LectureDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  palestra: Palestra | null;
  eventos: Evento[];
}

const LectureDetailsModal: React.FC<LectureDetailsModalProps> = ({
  isOpen,
  onClose,
  palestra,
  eventos,
}) => {
  if (!isOpen || !palestra) return null;

  const [regenerating, setRegenerating] = useState(false);
  const [regenMsg, setRegenMsg] = useState<string | null>(null);

  const eventoTitulo =
    eventos.find((e) => e.id === palestra.evento_id)?.titulo || "—";
  const palestranteNome =
    palestra.palestrante_nome || (palestra as any).profiles?.nome || "—";

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
          <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg p-3">
            <div>
              <p className="text-xs text-slate-500">QR Code da palestra</p>
              <p className="text-sm text-slate-700">
                Este QR é estático. Use "Gerar novo" para invalidar o atual.
              </p>
            </div>
            <button
              onClick={async () => {
                if (
                  !window.confirm(
                    "Gerar um novo QR Code para esta palestra? O anterior será invalidado.",
                  )
                ) {
                  return;
                }
                setRegenerating(true);
                setRegenMsg(null);
                try {
                  await palestrasApi.regenerateQrCode(palestra.id);
                  setRegenMsg("Novo QR Code gerado com sucesso!");
                } catch (err: any) {
                  setRegenMsg(err.message || "Erro ao gerar novo QR Code");
                } finally {
                  setRegenerating(false);
                }
              }}
              className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-2"
              disabled={regenerating}
            >
              <RefreshCw
                className={`w-4 h-4 ${regenerating ? "animate-spin" : ""}`}
              />
              {regenerating ? "Gerando..." : "Gerar novo"}
            </button>
          </div>
          {regenMsg && <div className="text-xs text-slate-600">{regenMsg}</div>}
          {palestra.descricao && (
            <div>
              <p className="text-sm text-slate-500 mb-1">Descrição</p>
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
                  {eventoTitulo}
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
              <Users className="w-5 h-5 text-indigo-500 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500">Vagas</p>
                <p className="text-sm font-medium text-slate-800">
                  {palestra.vagas}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <Clock className="w-5 h-5 text-indigo-500 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500">Carga Horária</p>
                <p className="text-sm font-medium text-slate-800">
                  {palestra.carga_horaria}h
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
