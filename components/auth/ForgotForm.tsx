import React, { useState, useMemo } from "react";
import { supabase, isSupabaseConfigured } from "../../supabaseClient";
import { Mail, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import AuthLayout from "./AuthLayout";

interface ForgotFormProps {
  onLoginClick: () => void;
}

const ForgotForm: React.FC<ForgotFormProps> = ({ onLoginClick }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const redirectUrl = useMemo(() => {
    const envUrl = import.meta.env.VITE_SUPABASE_REDIRECT_URL as
      | string
      | undefined;
    return envUrl ?? window.location.origin;
  }, []);

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setMessage({
        type: "error",
        text: "Configuração do Supabase ausente. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.",
      });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      if (error) throw error;
      setMessage({
        type: "success",
        text: "Enviamos um link de recuperação para o seu e-mail.",
      });
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Erro ao enviar e-mail.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Recuperar senha"
      subtitle="Enviaremos um link para redefinir sua senha"
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

      <form className="space-y-4" onSubmit={handleForgot}>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 ml-1">
            E-mail
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
              placeholder="seu@email.com"
            />
          </div>
        </div>

        <button
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Enviando...
            </>
          ) : (
            "Enviar link"
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

export default ForgotForm;
