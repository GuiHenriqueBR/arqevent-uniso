import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  Loader2,
  User,
  Mail,
  Phone,
  BookOpen,
  Shield,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
} from "lucide-react";
import { usuariosApi, Usuario } from "../../../services/api";

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: Usuario | null;
  onSave: () => void;
  mode: "edit" | "view";
}

const UserEditModal: React.FC<UserEditModalProps> = ({
  isOpen,
  onClose,
  user,
  onSave,
  mode,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDeactivate, setShowConfirmDeactivate] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    semestre: "",
    turno: "MANHA" as "MANHA" | "NOITE",
    tipo: "ALUNO" as "ALUNO" | "ORGANIZADOR" | "PALESTRANTE" | "ADMIN",
    ativo: true,
  });

  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        nome: user.nome || "",
        telefone: user.telefone || "",
        semestre: user.semestre || "",
        turno: user.turno || "MANHA",
        tipo: user.tipo || "ALUNO",
        ativo: user.ativo !== false,
      });
      setError(null);
      setShowConfirmDeactivate(false);
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      if (!formData.nome.trim()) {
        throw new Error("Nome é obrigatório");
      }

      await usuariosApi.update(user.id, {
        nome: formData.nome.trim(),
        telefone: formData.telefone.trim() || undefined,
        semestre: formData.semestre.trim() || undefined,
        turno: formData.turno,
        tipo: formData.tipo,
        ativo: formData.ativo,
      });

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar alterações");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = () => {
    if (formData.ativo) {
      setShowConfirmDeactivate(true);
    } else {
      setFormData({ ...formData, ativo: true });
    }
  };

  const confirmDeactivate = () => {
    setFormData({ ...formData, ativo: false });
    setShowConfirmDeactivate(false);
  };

  if (!isOpen || !user) return null;

  const semestres = [
    "1º Semestre",
    "2º Semestre",
    "3º Semestre",
    "4º Semestre",
    "5º Semestre",
    "6º Semestre",
    "7º Semestre",
    "8º Semestre",
    "9º Semestre",
    "10º Semestre",
  ];

  const tiposUsuario = [
    { value: "ALUNO", label: "Aluno", color: "bg-blue-100 text-blue-700" },
    {
      value: "ORGANIZADOR",
      label: "Organizador",
      color: "bg-purple-100 text-purple-700",
    },
    {
      value: "PALESTRANTE",
      label: "Palestrante",
      color: "bg-amber-100 text-amber-700",
    },
    {
      value: "ADMIN",
      label: "Administrador",
      color: "bg-red-100 text-red-700",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl max-h-[90vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              {mode === "edit" ? "Editar Usuário" : "Detalhes do Usuário"}
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              {user.email} • RA: {user.ra || "N/A"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Confirm Deactivate Modal */}
        {showConfirmDeactivate && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 rounded-2xl">
            <div className="bg-white p-6 rounded-xl max-w-sm mx-4 shadow-xl">
              <div className="flex items-center gap-3 text-amber-600 mb-4">
                <AlertTriangle className="w-6 h-6" />
                <h4 className="font-bold">Desativar usuário?</h4>
              </div>
              <p className="text-slate-600 text-sm mb-4">
                O usuário não poderá acessar o sistema enquanto estiver
                desativado. Esta ação pode ser revertida.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmDeactivate(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeactivate}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                >
                  Desativar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[60vh]"
        >
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Status Ativo/Inativo */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-slate-500" />
              <div>
                <p className="font-medium text-slate-700">Status da conta</p>
                <p className="text-xs text-slate-500">
                  {formData.ativo
                    ? "Usuário pode acessar o sistema"
                    : "Usuário bloqueado"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleActive}
              disabled={mode === "view"}
              className={`transition-colors ${mode === "view" ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {formData.ativo ? (
                <ToggleRight className="w-10 h-10 text-green-500" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-slate-300" />
              )}
            </button>
          </div>

          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Nome completo
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                disabled={mode === "view"}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all disabled:bg-slate-50 disabled:text-slate-500"
                placeholder="Nome do usuário"
                required
              />
            </div>
          </div>

          {/* Email (readonly) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Telefone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="tel"
                value={formData.telefone}
                onChange={(e) =>
                  setFormData({ ...formData, telefone: e.target.value })
                }
                disabled={mode === "view"}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all disabled:bg-slate-50 disabled:text-slate-500"
                placeholder="(15) 99999-9999"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Semestre */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Semestre
              </label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select
                  value={formData.semestre}
                  onChange={(e) =>
                    setFormData({ ...formData, semestre: e.target.value })
                  }
                  disabled={mode === "view"}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none bg-white disabled:bg-slate-50 disabled:text-slate-500"
                >
                  <option value="">Selecione</option>
                  {semestres.map((sem) => (
                    <option key={sem} value={sem}>
                      {sem}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Turno */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Turno
              </label>
              <select
                value={formData.turno}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    turno: e.target.value as "MANHA" | "NOITE",
                  })
                }
                disabled={mode === "view"}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none bg-white disabled:bg-slate-50 disabled:text-slate-500"
              >
                <option value="MANHA">Manhã</option>
                <option value="NOITE">Noite</option>
              </select>
            </div>
          </div>

          {/* Tipo de Usuário */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Tipo de usuário
            </label>
            <div className="grid grid-cols-2 gap-2">
              {tiposUsuario.map((tipo) => (
                <button
                  key={tipo.value}
                  type="button"
                  onClick={() =>
                    mode === "edit" &&
                    setFormData({
                      ...formData,
                      tipo: tipo.value as typeof formData.tipo,
                    })
                  }
                  disabled={mode === "view"}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all border-2 ${
                    formData.tipo === tipo.value
                      ? `${tipo.color} border-current`
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                  } ${mode === "view" ? "cursor-not-allowed opacity-70" : ""}`}
                >
                  {tipo.label}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          {mode === "edit" && (
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          )}

          {mode === "view" && (
            <div className="pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="w-full px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors"
              >
                Fechar
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default UserEditModal;
