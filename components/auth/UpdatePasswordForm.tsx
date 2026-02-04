import React, { useState } from "react";
import { supabase, isSupabaseConfigured } from "../../supabaseClient";
import {
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import AuthLayout from "./AuthLayout";

interface UpdatePasswordFormProps {
  onLoginClick: () => void;
}

const UpdatePasswordForm: React.FC<UpdatePasswordFormProps> = ({
  onLoginClick,
}) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setMessage({
        type: "error",
        text: "Configuração do Supabase ausente. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.",
      });
      return;
    }
    if (password.length < 6) {
      setMessage({
        type: "error",
        text: "A senha deve ter pelo menos 6 caracteres.",
      });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage({
        type: "success",
        text: "Senha atualizada. Faça login novamente.",
      });
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Erro ao atualizar senha",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Atualizar senha"
      subtitle="Defina uma nova senha para sua conta"
    >
      {message && (
        <div
          className={`flex items-center gap-2 text-sm border rounded-lg p-3 animate-in fade-in slide-in-from-top-1 ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border-green-100"
              : "bg-red-50 text-red-600 border-red-100"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleUpdatePassword}>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 ml-1">
            Nova Senha
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-12 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
              placeholder="Mín. 6 caracteres"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <button
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Atualizando...
            </>
          ) : (
            "Atualizar senha"
          )}
        </button>
      </form>

      <div className="text-center text-sm pt-2 border-t border-slate-100 mt-4">
        <button
          onClick={onLoginClick}
          className="text-slate-500 hover:text-indigo-600 transition-colors font-medium"
        >
          Voltar ao login
        </button>
      </div>
    </AuthLayout>
  );
};

export default UpdatePasswordForm;
