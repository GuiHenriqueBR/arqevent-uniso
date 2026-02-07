import React, { useState } from "react";
import {
  Plus,
  Bell,
  Info,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Edit,
  Trash2,
  X,
} from "lucide-react";
import { Aviso } from "../../../services/api"; // Assuming types are exported from api or types.ts

interface AnnouncementsViewProps {
  avisos: Aviso[];
  loading: boolean;
  onCreate: (aviso: any) => Promise<void>;
  onUpdate: (id: string, aviso: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onToggleActive: (aviso: Aviso) => Promise<void>;
}

const AnnouncementsView: React.FC<AnnouncementsViewProps> = ({
  avisos,
  loading,
  onCreate,
  onUpdate,
  onDelete,
  onToggleActive,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAviso, setSelectedAviso] = useState<Aviso | null>(null);
  const [form, setForm] = useState({
    titulo: "",
    mensagem: "",
    tipo: "info" as "info" | "warning" | "success" | "error",
    imagem_url: "",
    link_url: "",
    ativo: true,
  });

  const openCreateModal = () => {
    setSelectedAviso(null);
    setForm({
      titulo: "",
      mensagem: "",
      tipo: "info",
      imagem_url: "",
      link_url: "",
      ativo: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (aviso: Aviso) => {
    setSelectedAviso(aviso);
    setForm({
      titulo: aviso.titulo,
      mensagem: aviso.mensagem,
      tipo: aviso.tipo,
      imagem_url: aviso.imagem_url || "",
      link_url: aviso.link_url || "",
      ativo: aviso.ativo,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAviso) {
      await onUpdate(selectedAviso.id, form);
    } else {
      await onCreate(form);
    }
    setIsModalOpen(false);
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "success":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "warning":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "error":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-blue-100 text-blue-700 border-blue-200";
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "success":
        return <CheckCircle className="w-5 h-5" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5" />;
      case "error":
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-600">Carregando avisos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
            Avisos e Notificações
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {avisos.length} avisos • {avisos.filter((a) => a.ativo).length}{" "}
            ativos
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm shadow-indigo-200"
        >
          <Plus className="w-5 h-5" /> Novo Aviso
        </button>
      </div>

      <div className="space-y-4">
        {avisos.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 text-center">
            <Bell className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">
              Nenhum aviso cadastrado
            </h3>
            <p className="text-slate-500 mb-4">
              Crie seu primeiro aviso para notificar os alunos
            </p>
            <button
              onClick={openCreateModal}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-5 h-5" /> Criar Aviso
            </button>
          </div>
        ) : (
          avisos.map((aviso) => (
            <div
              key={aviso.id}
              className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all hover:shadow-md ${
                aviso.ativo
                  ? "border-slate-100"
                  : "border-slate-200 opacity-60 bg-slate-50"
              }`}
            >
              <div
                className={`px-4 py-3 flex items-center gap-3 ${getTipoColor(
                  aviso.tipo,
                )}`}
              >
                {getTipoIcon(aviso.tipo)}
                <span className="font-medium capitalize">
                  {aviso.tipo === "info"
                    ? "Informativo"
                    : aviso.tipo === "error"
                      ? "Urgente"
                      : aviso.tipo === "warning"
                        ? "Alerta"
                        : "Sucesso"}
                </span>
                {!aviso.ativo && (
                  <span className="ml-auto bg-slate-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                    Inativo
                  </span>
                )}
              </div>
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800 text-lg mb-2">
                      {aviso.titulo}
                    </h3>
                    {aviso.imagem_url && (
                      <div className="mb-3">
                        <img
                          src={aviso.imagem_url}
                          alt={aviso.titulo}
                          className="w-full max-h-48 object-cover rounded-lg border border-slate-200"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">
                      {aviso.mensagem}
                    </p>
                    {aviso.link_url && (
                      <a
                        href={aviso.link_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center mt-3 text-indigo-600 font-semibold text-sm hover:underline"
                      >
                        Abrir link
                      </a>
                    )}
                    <p className="text-xs text-slate-400 mt-4 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                      Criado em{" "}
                      {new Date(aviso.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 mt-4 sm:mt-0">
                    <button
                      onClick={() => onToggleActive(aviso)}
                      className={`p-2 rounded-lg transition-colors border border-transparent ${
                        aviso.ativo
                          ? "text-amber-600 hover:bg-amber-50 hover:border-amber-100"
                          : "text-emerald-600 hover:bg-emerald-50 hover:border-emerald-100"
                      }`}
                      title={aviso.ativo ? "Desativar" : "Ativar"}
                    >
                      {aviso.ativo ? (
                        <div className="flex items-center gap-1">
                          <AlertCircle className="w-5 h-5" />
                          <span className="text-sm font-medium hidden sm:inline">
                            Desativar
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-sm font-medium hidden sm:inline">
                            Ativar
                          </span>
                        </div>
                      )}
                    </button>
                    <div className="w-px h-6 bg-slate-200 hidden sm:block mx-1"></div>
                    <button
                      onClick={() => openEditModal(aviso)}
                      className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                      title="Editar"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onDelete(aviso.id)}
                      className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors border border-transparent hover:border-red-100"
                      title="Excluir"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">
                {selectedAviso ? "Editar Aviso" : "Novo Aviso"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form
              onSubmit={handleSubmit}
              className="p-4 sm:p-6 space-y-5 overflow-y-auto"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tipo do Aviso
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(["info", "success", "warning", "error"] as const).map(
                    (tipo) => (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => setForm({ ...form, tipo })}
                        className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                          form.tipo === tipo
                            ? tipo === "info"
                              ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100 ring-offset-1"
                              : tipo === "success"
                                ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100 ring-offset-1"
                                : tipo === "warning"
                                  ? "border-amber-500 bg-amber-50 ring-2 ring-amber-100 ring-offset-1"
                                  : "border-red-500 bg-red-50 ring-2 ring-red-100 ring-offset-1"
                            : "border-slate-100 hover:border-slate-200 bg-white"
                        }`}
                      >
                        {tipo === "info" && (
                          <Info
                            className={`w-6 h-6 ${
                              form.tipo === tipo
                                ? "text-blue-600"
                                : "text-slate-400"
                            }`}
                          />
                        )}
                        {tipo === "success" && (
                          <CheckCircle
                            className={`w-6 h-6 ${
                              form.tipo === tipo
                                ? "text-emerald-600"
                                : "text-slate-400"
                            }`}
                          />
                        )}
                        {tipo === "warning" && (
                          <AlertTriangle
                            className={`w-6 h-6 ${
                              form.tipo === tipo
                                ? "text-amber-600"
                                : "text-slate-400"
                            }`}
                          />
                        )}
                        {tipo === "error" && (
                          <AlertCircle
                            className={`w-6 h-6 ${
                              form.tipo === tipo
                                ? "text-red-600"
                                : "text-slate-400"
                            }`}
                          />
                        )}
                        <span
                          className={`text-xs capitalize font-medium ${form.tipo === tipo ? "text-slate-800" : "text-slate-500"}`}
                        >
                          {tipo === "info"
                            ? "Info"
                            : tipo === "success"
                              ? "Sucesso"
                              : tipo === "warning"
                                ? "Alerta"
                                : "Urgente"}
                        </span>
                      </button>
                    ),
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Título <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                  placeholder="Ex: Inscrições abertas!"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Mensagem <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={form.mensagem}
                  onChange={(e) =>
                    setForm({ ...form, mensagem: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                  rows={4}
                  placeholder="Digite a mensagem do aviso..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Imagem (URL)
                </label>
                <input
                  type="url"
                  value={form.imagem_url}
                  onChange={(e) =>
                    setForm({ ...form, imagem_url: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                  placeholder="https://.../banner.jpg"
                />
                {form.imagem_url && (
                  <div className="mt-3">
                    <img
                      src={form.imagem_url}
                      alt="Preview do banner"
                      className="w-full max-h-40 object-cover rounded-lg border border-slate-200"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Link (opcional)
                </label>
                <input
                  type="url"
                  value={form.link_url}
                  onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                  placeholder="https://..."
                />
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <input
                  type="checkbox"
                  id="avisoAtivo"
                  checked={form.ativo}
                  onChange={(e) =>
                    setForm({ ...form, ativo: e.target.checked })
                  }
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300 cursor-pointer"
                />
                <label
                  htmlFor="avisoAtivo"
                  className="text-sm font-medium text-slate-700 cursor-pointer select-none"
                >
                  Aviso ativo (visível para os alunos)
                </label>
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium transition-colors shadow-sm shadow-indigo-200"
                >
                  {selectedAviso ? "Salvar Alterações" : "Criar Aviso"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsView;
