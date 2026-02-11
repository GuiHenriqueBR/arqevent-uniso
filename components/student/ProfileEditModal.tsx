import React, { useState, useEffect } from "react";
import { X, Save, Loader2, User, Phone, BookOpen } from "lucide-react";
import { usuariosApi } from "../../services/api";

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    nome: string;
    email: string;
    telefone?: string;
    semestre?: string;
  };
  onSave: (updatedUser: any) => void;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  user,
  onSave,
}) => {
  const [loading, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nomeError, setNomeError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    semestre: "",
  });

  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        nome: user.nome || "",
        telefone: user.telefone || "",
        semestre: user.semestre || "",
      });
      setError(null);
      setNomeError(null);
    }
  }, [isOpen, user]);

  // Validação de nome completo
  const validarNome = (valor: string): string | null => {
    const trimmed = valor.trim();
    if (!trimmed) return "Nome é obrigatório.";
    if (trimmed.includes("@")) return "O nome não pode conter email.";
    if (/\d/.test(trimmed)) return "O nome não pode conter números.";
    if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(trimmed))
      return "O nome contém caracteres inválidos.";
    const palavras = trimmed.split(/\s+/).filter((p) => p.length > 0);
    if (palavras.length < 2)
      return "Digite seu nome completo (nome e sobrenome).";
    if (palavras.some((p) => p.length < 2))
      return "Cada parte do nome deve ter pelo menos 2 letras.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Validar nome completo
      const erroNome = validarNome(formData.nome);
      if (erroNome) {
        setNomeError(erroNome);
        throw new Error(erroNome);
      }

      if (formData.telefone && !/^[\d\s\-\(\)]+$/.test(formData.telefone)) {
        throw new Error("Telefone inválido");
      }

      const updatedUser = await usuariosApi.update(user.id, {
        nome: formData.nome.trim(),
        telefone: formData.telefone.trim() || undefined,
        semestre: formData.semestre.trim() || undefined,
      });

      onSave(updatedUser);
      onClose();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar alterações");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="text-lg font-bold text-slate-800">Editar Perfil</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

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
                onChange={(e) => {
                  setFormData({ ...formData, nome: e.target.value });
                  if (nomeError) setNomeError(null);
                }}
                onBlur={() => {
                  if (formData.nome.trim())
                    setNomeError(validarNome(formData.nome));
                }}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 transition-all ${
                  nomeError
                    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                    : "border-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                }`}
                placeholder="Nome e sobrenome"
                required
              />
            </div>
            {nomeError && (
              <p className="text-xs text-red-500 mt-1">{nomeError}</p>
            )}
          </div>

          {/* Email (readonly) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
            />
            <p className="text-xs text-slate-400 mt-1">
              O email não pode ser alterado
            </p>
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
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                placeholder="(15) 99999-9999"
              />
            </div>
          </div>

          {/* Semestre */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Semestre atual
            </label>
            <div className="relative">
              <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={formData.semestre}
                onChange={(e) =>
                  setFormData({ ...formData, semestre: e.target.value })
                }
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none bg-white"
              >
                <option value="">Selecione o semestre</option>
                {semestres.map((sem) => (
                  <option key={sem} value={sem}>
                    {sem}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
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
                  Salvar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileEditModal;
