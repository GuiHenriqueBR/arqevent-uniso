import React, { useState, useEffect } from "react";
import { X, AlertCircle, Loader2, ImagePlus, Trash2, Eye } from "lucide-react";
import { Evento } from "../../../services/api";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: Evento | null;
  mode: "create" | "edit";
}

const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}) => {
  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    data_inicio: "",
    data_fim: "",
    local: "",
    banner_url: "",
    vagas_totais: 100,
    turno_permitido: "TODOS" as "TODOS" | "MANHA" | "NOITE",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBannerPreview, setShowBannerPreview] = useState(false);
  const [bannerError, setBannerError] = useState(false);

  useEffect(() => {
    if (initialData && mode === "edit") {
      setForm({
        titulo: initialData.titulo,
        descricao: initialData.descricao || "",
        data_inicio: new Date(initialData.data_inicio)
          .toISOString()
          .slice(0, 16),
        data_fim: new Date(initialData.data_fim).toISOString().slice(0, 16),
        local: initialData.local || "",
        banner_url: initialData.banner_url || "",
        vagas_totais: initialData.vagas_totais,
        turno_permitido: initialData.turno_permitido as
          | "TODOS"
          | "MANHA"
          | "NOITE",
      });
      setShowBannerPreview(!!initialData.banner_url);
    } else {
      setForm({
        titulo: "",
        descricao: "",
        data_inicio: "",
        data_fim: "",
        local: "",
        banner_url: "",
        vagas_totais: 100,
        turno_permitido: "TODOS",
      });
      setShowBannerPreview(false);
    }
    setBannerError(false);
    setError(null);
  }, [initialData, mode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    let didTimeout = false;
    const timeoutId = window.setTimeout(() => {
      didTimeout = true;
      setLoading(false);
      setError("Tempo limite excedido. Verifique sua conexão com a internet.");
    }, 20000);
    try {
      await onSubmit(form);
      if (!didTimeout) {
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Erro ao salvar evento");
    } finally {
      clearTimeout(timeoutId);
      if (!didTimeout) {
        setLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">
            {mode === "create" ? "Novo Evento" : "Editar Evento"}
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
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
              placeholder="Ex: Semana de Arquitetura 2026"
            />
          </div>
          {/* Banner do Evento */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Banner / Imagem de Capa
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <ImagePlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="url"
                    value={form.banner_url}
                    onChange={(e) => {
                      setForm({ ...form, banner_url: e.target.value });
                      setBannerError(false);
                      setShowBannerPreview(!!e.target.value);
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow text-sm"
                    placeholder="https://exemplo.com/banner.jpg"
                  />
                </div>
                {form.banner_url && (
                  <button
                    type="button"
                    onClick={() => setShowBannerPreview(!showBannerPreview)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                    title="Visualizar"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}
                {form.banner_url && (
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ ...form, banner_url: "" });
                      setShowBannerPreview(false);
                      setBannerError(false);
                    }}
                    className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
                    title="Remover"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Banner Preview */}
              {showBannerPreview && form.banner_url && (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 aspect-video">
                  {!bannerError ? (
                    <img
                      src={form.banner_url}
                      alt="Preview do banner"
                      className="w-full h-full object-cover"
                      onError={() => setBannerError(true)}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                      <AlertCircle className="w-8 h-8" />
                      <span className="text-xs">
                        Não foi possível carregar a imagem
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Verifique se a URL está correta
                      </span>
                    </div>
                  )}
                  {/* Simulated overlay like the student view */}
                  {!bannerError && (
                    <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 via-black/20 to-transparent p-3">
                      <p className="text-white text-xs font-bold truncate">
                        {form.titulo || "Título do Evento"}
                      </p>
                      {form.descricao && (
                        <p className="text-white/70 text-[10px] truncate mt-0.5">
                          {form.descricao}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <p className="text-[11px] text-slate-400">
                Cole a URL de uma imagem. Dica: use o{" "}
                <a
                  href="https://postimages.org/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-500 hover:underline"
                >
                  PostImages
                </a>{" "}
                ou{" "}
                <a
                  href="https://imgur.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-500 hover:underline"
                >
                  Imgur
                </a>{" "}
                para hospedar sua imagem gratuitamente.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Descrição
              <span className="text-slate-400 font-normal ml-1 text-xs">
                (aparece no banner para os alunos)
              </span>
            </label>
            <textarea
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
              rows={3}
              placeholder="Ex: Venha participar da maior semana acadêmica do curso! Palestras, workshops e muito networking."
            />
            {form.descricao && (
              <p className="text-[11px] text-slate-400 mt-1 text-right">
                {form.descricao.length}/300 caracteres
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Data Início <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={form.data_inicio}
                onChange={(e) =>
                  setForm({ ...form, data_inicio: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Data Fim <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={form.data_fim}
                onChange={(e) => setForm({ ...form, data_fim: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Local
            </label>
            <input
              type="text"
              value={form.local}
              onChange={(e) => setForm({ ...form, local: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
              placeholder="Ex: Campus UNISO - Bloco A"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Vagas Totais
              </label>
              <input
                type="number"
                min="1"
                value={form.vagas_totais}
                onChange={(e) =>
                  setForm({
                    ...form,
                    vagas_totais: parseInt(e.target.value) || 100,
                  })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Turno Permitido
              </label>
              <select
                value={form.turno_permitido}
                onChange={(e) =>
                  setForm({
                    ...form,
                    turno_permitido: e.target.value as
                      | "TODOS"
                      | "MANHA"
                      | "NOITE",
                  })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
              >
                <option value="TODOS">Todos</option>
                <option value="MANHA">Manhã</option>
                <option value="NOITE">Noite</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
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
                "Criar Evento"
              ) : (
                "Salvar Alterações"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;
