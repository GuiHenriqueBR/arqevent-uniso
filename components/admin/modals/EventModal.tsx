import React, { useState, useEffect } from "react";
import {
  X,
  AlertCircle,
  Loader2,
  ImagePlus,
  Trash2,
  Eye,
  Plus,
  Star,
  Link2,
} from "lucide-react";
import { Evento } from "../../../services/api";
import ImageUpload from "../ui/ImageUpload";

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
    banner_galeria: [] as string[],
    destaque: false,
    status_manual: "AUTO" as "AUTO" | "ABERTO" | "ENCERRADO" | "AO_VIVO",
    cta_label: "",
    cta_sec_label: "",
    cta_sec_url: "",
    compartilhar_url: "",
    vagas_totais: 100,
    turno_permitido: "TODOS" as "TODOS" | "MANHA" | "NOITE",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBannerPreview, setShowBannerPreview] = useState(false);
  const [bannerError, setBannerError] = useState(false);
  const previewUrl = form.banner_url || form.banner_galeria[0] || "";

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
        banner_galeria: Array.isArray(initialData.banner_galeria)
          ? initialData.banner_galeria
          : [],
        destaque: !!initialData.destaque,
        status_manual: (initialData.status_manual || "AUTO") as
          | "AUTO"
          | "ABERTO"
          | "ENCERRADO"
          | "AO_VIVO",
        cta_label: initialData.cta_label || "",
        cta_sec_label: initialData.cta_sec_label || "",
        cta_sec_url: initialData.cta_sec_url || "",
        compartilhar_url: initialData.compartilhar_url || "",
        vagas_totais: initialData.vagas_totais,
        turno_permitido: initialData.turno_permitido as
          | "TODOS"
          | "MANHA"
          | "NOITE",
      });
      setShowBannerPreview(
        !!initialData.banner_url ||
          (Array.isArray(initialData.banner_galeria) &&
            initialData.banner_galeria.length > 0),
      );
    } else {
      setForm({
        titulo: "",
        descricao: "",
        data_inicio: "",
        data_fim: "",
        local: "",
        banner_url: "",
        banner_galeria: [],
        destaque: false,
        status_manual: "AUTO",
        cta_label: "",
        cta_sec_label: "",
        cta_sec_url: "",
        compartilhar_url: "",
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
            <ImageUpload
              value={form.banner_url}
              onChange={(url) => {
                setForm({ ...form, banner_url: url });
                setBannerError(false);
                setShowBannerPreview(!!url);
              }}
              folder="eventos"
              label="Banner / Imagem de Capa"
              hint="Arraste ou clique para enviar. JPG, PNG ou WebP até 5MB."
              previewHeight="h-48"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Galeria de Imagens
              <span className="text-slate-400 font-normal ml-1 text-xs">
                (opcional, até 4 imagens)
              </span>
            </label>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {(form.banner_galeria || []).map((url, index) => (
                  <ImageUpload
                    key={`gallery-${index}`}
                    value={url}
                    onChange={(newUrl) => {
                      const next = [...form.banner_galeria];
                      if (newUrl) {
                        next[index] = newUrl;
                      } else {
                        next.splice(index, 1);
                      }
                      setForm({ ...form, banner_galeria: next });
                    }}
                    folder="eventos/galeria"
                    hideLabel
                    compact
                    previewHeight="h-24"
                  />
                ))}
                {(form.banner_galeria || []).length < 4 && (
                  <ImageUpload
                    value=""
                    onChange={(url) => {
                      if (url) {
                        setForm({
                          ...form,
                          banner_galeria: [...(form.banner_galeria || []), url],
                        });
                      }
                    }}
                    folder="eventos/galeria"
                    hideLabel
                    compact
                    previewHeight="h-24"
                  />
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Imagens são comprimidas automaticamente. A primeira da galeria é
                usada como capa se não houver banner principal.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Status do Evento
              </label>
              <select
                value={form.status_manual}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status_manual: e.target.value as
                      | "AUTO"
                      | "ABERTO"
                      | "ENCERRADO"
                      | "AO_VIVO",
                  })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
              >
                <option value="AUTO">Automatico</option>
                <option value="ABERTO">Inscricoes abertas</option>
                <option value="ENCERRADO">Inscricoes encerradas</option>
                <option value="AO_VIVO">Ao vivo</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={form.destaque}
                  onChange={(e) =>
                    setForm({ ...form, destaque: e.target.checked })
                  }
                  className="w-4 h-4 accent-indigo-600"
                />
                <span className="inline-flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-500" /> Evento principal
                </span>
              </label>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                CTA Principal
              </label>
              <input
                type="text"
                value={form.cta_label}
                onChange={(e) =>
                  setForm({ ...form, cta_label: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                placeholder="Ex: Garantir vaga"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                CTA Secundario
              </label>
              <input
                type="text"
                value={form.cta_sec_label}
                onChange={(e) =>
                  setForm({ ...form, cta_sec_label: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                placeholder="Ex: Adicionar ao calendario"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Link do CTA Secundario
              </label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="url"
                  value={form.cta_sec_url}
                  onChange={(e) =>
                    setForm({ ...form, cta_sec_url: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  placeholder="https://..."
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Link de Compartilhamento
              </label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="url"
                  value={form.compartilhar_url}
                  onChange={(e) =>
                    setForm({ ...form, compartilhar_url: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  placeholder="https://..."
                />
              </div>
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
