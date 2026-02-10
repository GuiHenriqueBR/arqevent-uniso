import React, { useState, useMemo } from "react";
import { supabase, isSupabaseConfigured } from "../../supabaseClient";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  User,
  Hash,
  Phone,
  Sun,
  Calendar,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import AuthLayout from "./AuthLayout";

interface RegisterFormProps {
  onLoginClick: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onLoginClick }) => {
  const [nome, setNome] = useState("");
  const [ra, setRa] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [turno, setTurno] = useState("");
  const [semestre, setSemestre] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  const formatTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7)
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11)
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTelefone(formatTelefone(e.target.value));
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Convert semester to proper value for storage if needed, but here it's likely just stored as string or int
    // No special changes needed, just validation

    if (!ra.trim() || !telefone.trim() || !turno || !semestre) {
      setMessage({
        type: "error",
        text: "Por favor, preencha todos os campos obrigatórios.",
      });
      return;
    }

    // Strict password check
    if (password.length < 6) {
      setMessage({
        type: "error",
        text: "A senha deve ter pelo menos 6 caracteres.",
      });
      return;
    }

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
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome,
            ra,
            telefone,
            turno,
            semestre,
          },
          emailRedirectTo: redirectUrl,
        },
      });
      if (error) throw error;

      setMessage({
        type: "success",
        text: "Cadastro realizado com sucesso! Redirecionando...",
      });
    } catch (error: any) {
      let errorText = error.message;
      if (
        error.message?.toLowerCase().includes("rate limit") ||
        error.message?.toLowerCase().includes("email rate")
      ) {
        errorText =
          "Muitos cadastros simultâneos. Aguarde alguns minutos e tente novamente.";
      } else if (error.message?.toLowerCase().includes("already registered")) {
        errorText =
          "Este e-mail já está cadastrado. Tente fazer login ou recuperar a senha.";
      }
      setMessage({ type: "error", text: errorText });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Criar conta"
      subtitle="Cadastre-se para acessar o sistema"
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
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSignUp}>
        {/* Nome */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 ml-1">
            Nome completo
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
              placeholder="Seu nome"
            />
          </div>
        </div>

        {/* Grid for RA & Telefone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 ml-1">
              RA
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Hash className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                required
                value={ra}
                onChange={(e) => setRa(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                placeholder="000000"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 ml-1">
              Telefone
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="tel"
                required
                value={telefone}
                onChange={handleTelefoneChange}
                maxLength={16}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                placeholder="(XX) 99999-9999"
              />
            </div>
          </div>
        </div>

        {/* Email */}
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

        {/* Grid for Turno & Semestre */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 ml-1">
              Turno
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Sun className="h-5 w-5 text-slate-400" />
              </div>
              <select
                required
                value={turno}
                onChange={(e) => setTurno(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm appearance-none"
              >
                <option value="" disabled>
                  Selecione
                </option>
                <option value="MANHA">Manhã</option>
                <option value="NOITE">Noite</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 ml-1">
              Semestre
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-slate-400" />
              </div>
              <select
                required
                value={semestre}
                onChange={(e) => setSemestre(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm appearance-none"
              >
                <option value="" disabled>
                  Selecione
                </option>
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}º Sem
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 ml-1">
            Senha
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
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4 shadow-md"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Cadastrando...
            </>
          ) : (
            "Criar conta"
          )}
        </button>
      </form>

      <div className="text-center text-sm pt-2 border-t border-slate-100 mt-6">
        <button
          onClick={onLoginClick}
          className="text-slate-500 hover:text-indigo-600 transition-colors font-medium"
        >
          Já tenho conta
        </button>
      </div>
    </AuthLayout>
  );
};

export default RegisterForm;
