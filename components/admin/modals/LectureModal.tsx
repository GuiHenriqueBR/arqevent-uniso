import React, { useState, useEffect } from "react";
import { X, AlertCircle, Loader2 } from "lucide-react";
import { Palestra, Evento } from "../../../services/api";

interface LectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: Palestra | null;
  mode: "create" | "edit";
  eventos: Evento[]; // Needed to select associated event
  palestrantes?: any[]; // Needed to select speaker
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
    palestrante_id: "",
    palestrante_nome: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tipoLabel = form.tipo === "ATIVIDADE" ? "Atividade" : "Palestra";

  useEffect(() => {
    if (initialData && mode === "edit") {
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
        carga_horaria: initialData.carga_horaria,
        palestrante_id: initialData.palestrante_id || "",
        palestrante_nome: initialData.palestrante_nome || "",
      });
    } else {
      // If creating, default to first event if available
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
        palestrante_id: "",
        palestrante_nome: "",
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
        "Tempo limite ao salvar. Verifique sua conexão e tente novamente.",
      );
      setLoading(false);
    }, 15000);

    try {
      const payload =
        form.tipo === "ATIVIDADE"
          ? { ...form, palestrante_id: "", palestrante_nome: "" }
          : form;
      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar palestra");
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">
            {mode === "create" ? `Nova ${tipoLabel}` : `Editar ${tipoLabel}`}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors bg-white hover:bg-slate-100 p-2 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-6 space-y-4 overflow-y-auto"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Evento <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={form.evento_id}
              onChange={(e) => setForm({ ...form, evento_id: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
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
          {form.tipo === "PALESTRA" && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Palestrante
                </label>
                <select
                  value={form.palestrante_id}
                  onChange={(e) =>
                    setForm((prev) => {
                      const selected = palestrantes.find(
                        (p) => p.id === e.target.value,
                      );
                      return {
                        ...prev,
                        palestrante_id: e.target.value,
                        palestrante_nome:
                          selected?.nome || prev.palestrante_nome || "",
                      };
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Selecione um palestrante (opcional)</option>
                  {palestrantes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} ({p.tipo})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nome do Palestrante (manual)
                </label>
                <input
                  type="text"
                  value={form.palestrante_nome}
                  onChange={(e) =>
                    setForm({ ...form, palestrante_nome: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  placeholder="Ex: Prof. João Silva"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Use este campo se o palestrante não estiver na lista.
                </p>
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
              placeholder="Ex: Arquitetura Sustentável"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tipo
            </label>
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-sm font-medium">
              {tipoLabel}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Descrição
            </label>
            <textarea
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
              rows={2}
              placeholder="Descrição da palestra/atividade..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
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
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
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
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Sala
            </label>
            <input
              type="text"
              value={form.sala}
              onChange={(e) => setForm({ ...form, sala: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
              placeholder="Ex: Auditório Principal"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Vagas
              </label>
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
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Carga Horária (h)
              </label>
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
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-slate-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-indigo-200"
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
        </form>
      </div>
    </div>
  );
};

export default LectureModal;
