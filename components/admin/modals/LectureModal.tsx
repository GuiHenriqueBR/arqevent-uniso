import React, { useState, useEffect } from "react";
import {
  X,
  AlertCircle,
  Loader2,
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  Timer,
  User,
  BookOpen,
} from "lucide-react";
import { Palestra, Evento } from "../../../services/api";

interface LectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: Palestra | null;
  mode: "create" | "edit";
  eventos: Evento[];
  palestrantes?: any[];
  defaultTipo?: "PALESTRA" | "ATIVIDADE";
}

const LectureModal: React.FC<LectureModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
  eventos = [],
  palestrantes = [],
  defaultTipo = "PALESTRA",
}) => {
  const [form, setForm] = useState({
    evento_id: "",
    titulo: "",
    descricao: "",
    tipo: "PALESTRA" as "PALESTRA" | "ATIVIDADE",
    data_hora_inicio: "",
    data_hora_fim: "",
    sala: "",
    vagas: 50,
    carga_horaria: 1,
    carga_horaria_minutos: 60,
    carga_unidade: "horas" as "minutos" | "horas",
    palestrante_id: "",
    palestrante_nome: "",
    qr_expiration_seconds: 60,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tipoLabel = form.tipo === "ATIVIDADE" ? "Atividade" : "Palestra";

  useEffect(() => {
    if (initialData && mode === "edit") {
      const minutos =
        (initialData as any).carga_horaria_minutos ??
        initialData.carga_horaria * 60;
      const ehHoras = minutos >= 60 && minutos % 60 === 0;

      setForm({
        evento_id: initialData.evento_id,
        titulo: initialData.titulo,
        descricao: initialData.descricao || "",
        tipo: (initialData.tipo as "PALESTRA" | "ATIVIDADE") || "PALESTRA",
        data_hora_inicio: new Date(initialData.data_hora_inicio)
          .toISOString()
          .slice(0, 16),
        data_hora_fim: new Date(initialData.data_hora_fim)
          .toISOString()
          .slice(0, 16),
        sala: initialData.sala || "",
        vagas: initialData.vagas,
        carga_horaria: ehHoras ? minutos / 60 : minutos,
        carga_horaria_minutos: minutos,
        carga_unidade: ehHoras ? "horas" : "minutos",
        palestrante_id: initialData.palestrante_id || "",
        palestrante_nome: initialData.palestrante_nome || "",
        qr_expiration_seconds: (initialData as any).qr_expiration_seconds || 60,
      });
    } else {
      setForm({
        evento_id: eventos.length > 0 ? eventos[0].id : "",
        titulo: "",
        descricao: "",
        tipo: defaultTipo,
        data_hora_inicio: "",
        data_hora_fim: "",
        sala: "",
        vagas: 50,
        carga_horaria: 1,
        carga_horaria_minutos: 60,
        carga_unidade: "horas",
        palestrante_id: "",
        palestrante_nome: "",
        qr_expiration_seconds: 60,
      });
    }
    setError(null);
  }, [initialData, mode, isOpen, eventos, defaultTipo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const timeoutId = window.setTimeout(() => {
      setError(
        "Tempo limite ao salvar. Verifique sua conexão e tente novamente."
      );
      setLoading(false);
    }, 15000);

    try {
      // Calcular carga horária em minutos baseado na unidade selecionada
      const cargaMinutos =
        form.carga_unidade === "horas"
          ? form.carga_horaria * 60
          : form.carga_horaria;

      // Remover carga_unidade do payload (campo apenas de UI)
      const { carga_unidade, carga_horaria, carga_horaria_minutos, ...formData } = form;

      const basePayload = {
        ...formData,
        carga_horaria: Math.ceil(cargaMinutos / 60), // Manter compatibilidade (em horas)
        carga_horaria_minutos: cargaMinutos,
      };

      const payload =
        form.tipo === "ATIVIDADE"
          ? { ...basePayload, palestrante_id: "", palestrante_nome: "" }
          : basePayload;

      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar");
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputClass =
    "w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:border-slate-300 bg-white text-slate-800";
  const labelClass = "block text-sm font-semibold text-slate-700 mb-1.5";
  const sectionClass = "space-y-4";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {mode === "create" ? `Nova ${tipoLabel}` : `Editar ${tipoLabel}`}
              </h3>
              <p className="text-xs text-slate-500">
                {mode === "create"
                  ? "Preencha os dados abaixo"
                  : "Atualize as informações"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors hover:bg-slate-100 p-2 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-5 sm:p-6"
        >
          <div className="space-y-6">
            {/* Seção: Informações Básicas */}
            <div className={sectionClass}>
              <div className="flex items-center gap-2 text-slate-600 mb-3">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">Informações Básicas</span>
              </div>

              <div>
                <label className={labelClass}>
                  Evento <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={form.evento_id}
                  onChange={(e) =>
                    setForm({ ...form, evento_id: e.target.value })
                  }
                  className={inputClass}
                  disabled={mode === "edit"}
                >
                  <option value="">Selecione um evento</option>
                  {eventos.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.titulo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>
                  Título <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  className={inputClass}
                  placeholder="Ex: Arquitetura Sustentável"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Tipo</label>
                  <div className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium">
                    {tipoLabel}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Vagas</label>
                  <input
                    type="number"
                    min="1"
                    value={form.vagas}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        vagas: parseInt(e.target.value) || 50,
                      })
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Descrição</label>
                <textarea
                  value={form.descricao}
                  onChange={(e) =>
                    setForm({ ...form, descricao: e.target.value })
                  }
                  className={`${inputClass} resize-none`}
                  rows={3}
                  placeholder="Descrição da palestra/atividade..."
                />
              </div>
            </div>

            {/* Divisor */}
            <div className="border-t border-slate-100" />

            {/* Seção: Palestrante (apenas para PALESTRA) */}
            {form.tipo === "PALESTRA" && (
              <>
                <div className={sectionClass}>
                  <div className="flex items-center gap-2 text-slate-600 mb-3">
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">Palestrante</span>
                  </div>

                  <div>
                    <label className={labelClass}>Selecionar Palestrante</label>
                    <select
                      value={form.palestrante_id}
                      onChange={(e) =>
                        setForm((prev) => {
                          const selected = palestrantes.find(
                            (p) => p.id === e.target.value
                          );
                          return {
                            ...prev,
                            palestrante_id: e.target.value,
                            palestrante_nome:
                              selected?.nome || prev.palestrante_nome || "",
                          };
                        })
                      }
                      className={inputClass}
                    >
                      <option value="">Selecione (opcional)</option>
                      {palestrantes.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome} ({p.tipo})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>
                      Nome do Palestrante (manual)
                    </label>
                    <input
                      type="text"
                      value={form.palestrante_nome}
                      onChange={(e) =>
                        setForm({ ...form, palestrante_nome: e.target.value })
                      }
                      className={inputClass}
                      placeholder="Ex: Prof. João Silva"
                    />
                    <p className="text-xs text-slate-500 mt-1.5">
                      Use se o palestrante não estiver na lista
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-100" />
              </>
            )}

            {/* Seção: Data e Horário */}
            <div className={sectionClass}>
              <div className="flex items-center gap-2 text-slate-600 mb-3">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">Data e Horário</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>
                    Início <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={form.data_hora_inicio}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        data_hora_inicio: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    Fim <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={form.data_hora_fim}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        data_hora_fim: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Divisor */}
            <div className="border-t border-slate-100" />

            {/* Seção: Local */}
            <div className={sectionClass}>
              <div className="flex items-center gap-2 text-slate-600 mb-3">
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-medium">Local</span>
              </div>

              <div>
                <label className={labelClass}>Sala</label>
                <input
                  type="text"
                  value={form.sala}
                  onChange={(e) => setForm({ ...form, sala: e.target.value })}
                  className={inputClass}
                  placeholder="Ex: Auditório Principal"
                />
              </div>
            </div>

            {/* Divisor */}
            <div className="border-t border-slate-100" />

            {/* Seção: Carga Horária e QR Code */}
            <div className={sectionClass}>
              <div className="flex items-center gap-2 text-slate-600 mb-3">
                <Timer className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Carga Horária e Configurações
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Carga Horária</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      value={form.carga_horaria}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          carga_horaria: parseInt(e.target.value) || 1,
                        })
                      }
                      className={`${inputClass} flex-1`}
                    />
                    <select
                      value={form.carga_unidade}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          carga_unidade: e.target.value as "minutos" | "horas",
                        })
                      }
                      className="w-28 px-3 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm font-medium"
                    >
                      <option value="minutos">minutos</option>
                      <option value="horas">horas</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Timer do QR Code</label>
                  <select
                    value={form.qr_expiration_seconds}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        qr_expiration_seconds: parseInt(e.target.value),
                      })
                    }
                    className={inputClass}
                  >
                    <option value={15}>15s - Máxima segurança</option>
                    <option value={30}>30s - Alta segurança</option>
                    <option value={45}>45s</option>
                    <option value={60}>1 min - Recomendado</option>
                    <option value={90}>1min 30s</option>
                    <option value={120}>2 min</option>
                    <option value={180}>3 min</option>
                    <option value={300}>5 min</option>
                    <option value={600}>10 min - Baixa segurança</option>
                  </select>
                </div>
              </div>

              <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                💡 O timer define o intervalo de regeneração do QR Code durante
                a apresentação. Timers mais curtos são mais seguros.
              </p>
            </div>

            {/* Erro */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Erro ao salvar</p>
                  <p className="text-red-600">{error}</p>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 border-t border-slate-100 bg-slate-50 flex flex-col-reverse sm:flex-row gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="lecture-form"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {mode === "create" ? "Criando..." : "Salvando..."}
              </>
            ) : mode === "create" ? (
              `Criar ${tipoLabel}`
            ) : (
              `Salvar ${tipoLabel}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LectureModal;
