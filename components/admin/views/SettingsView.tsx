import React, { useState, useEffect } from "react";
import {
  Save,
  Database,
  Plus,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";

interface SettingsViewProps {
  initialConfig: {
    nome_instituicao: string;
    nome_sistema: string;
    email_contato: string;
    ano_letivo: string;
  };
  loading: boolean;
  onSaveConfig: (config: any) => Promise<void>;
  onCreateTestData: () => Promise<void>;
  onResetSystem: () => Promise<void>;
}

const SettingsView: React.FC<SettingsViewProps> = ({
  initialConfig,
  loading,
  onSaveConfig,
  onCreateTestData,
  onResetSystem,
}) => {
  const [form, setForm] = useState(initialConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingData, setIsCreatingData] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetConfirm, setResetConfirm] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Update form when initialConfig loads
  useEffect(() => {
    setForm(initialConfig);
  }, [initialConfig]);

  const handleSave = async () => {
    setIsSaving(true);
    setFeedback(null);
    try {
      await onSaveConfig(form);
      setFeedback({
        type: "success",
        message: "Configurações salvas com sucesso!",
      });
    } catch (error: any) {
      setFeedback({
        type: "error",
        message: error.message || "Erro ao salvar configurações",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateData = async () => {
    setIsCreatingData(true);
    setFeedback(null);
    try {
      await onCreateTestData();
      setFeedback({
        type: "success",
        message: "Dados de teste criados com sucesso! Recarregando...",
      });
    } catch (error: any) {
      setFeedback({
        type: "error",
        message: error.message || "Erro ao criar dados de teste",
      });
    } finally {
      setIsCreatingData(false);
    }
  };

  const handleReset = async () => {
    if (resetConfirm !== "RESETAR") {
      setFeedback({
        type: "error",
        message: "Digite RESETAR para confirmar a ação.",
      });
      return;
    }

    setIsResetting(true);
    setFeedback(null);
    try {
      await onResetSystem();
      setFeedback({
        type: "success",
        message: "Sistema resetado com sucesso! Todos os dados foram apagados.",
      });
      setResetConfirm("");
    } catch (error: any) {
      setFeedback({
        type: "error",
        message: error.message || "Erro ao resetar o sistema",
      });
    } finally {
      setIsResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          <p className="text-slate-600">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
          Configurações do Sistema
        </h2>
      </div>

      {/* Feedback Message */}
      {feedback && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
            feedback.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="font-medium">{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="ml-auto hover:opacity-70 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 divide-y divide-slate-100">
        {/* Informações do Sistema */}
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-slate-800">
              Informações do Sistema
            </h3>
          </div>
          <p className="text-slate-500 text-sm mb-6">
            Defina as informações básicas que serão exibidas em todo o sistema.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Nome da Instituição
              </label>
              <input
                type="text"
                value={form.nome_instituicao}
                onChange={(e) =>
                  setForm({ ...form, nome_instituicao: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-shadow focus:shadow-sm"
                placeholder="Ex: UNISO"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Nome do Sistema
              </label>
              <input
                type="text"
                value={form.nome_sistema}
                onChange={(e) =>
                  setForm({ ...form, nome_sistema: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-shadow focus:shadow-sm"
                placeholder="Ex: ArqEvent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email de Contato
              </label>
              <input
                type="email"
                value={form.email_contato}
                onChange={(e) =>
                  setForm({ ...form, email_contato: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-shadow focus:shadow-sm"
                placeholder="Ex: eventos@uniso.br"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Ano Letivo
              </label>
              <input
                type="text"
                value={form.ano_letivo}
                onChange={(e) =>
                  setForm({ ...form, ano_letivo: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-shadow focus:shadow-sm"
                placeholder="Ex: 2026"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium shadow-sm hover:shadow shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? (
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
        </div>

        {/* Dados de Teste */}
        <div className="p-4 sm:p-6 bg-slate-50/50">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-800">Dados de Teste</h3>
          </div>
          <p className="text-slate-500 text-sm mb-4">
            Utilize esta ferramenta para popular o sistema com dados fictícios
            para fins de testes e demonstração.
          </p>

          <div className="bg-white border border-indigo-100 rounded-lg p-5 mb-5 shadow-sm">
            <p className="text-sm text-indigo-900 font-medium mb-2">
              Os seguintes dados serão gerados:
            </p>
            <ul className="text-sm text-indigo-700 list-disc list-inside space-y-1.5 ml-1">
              <li>Evento "Semana de Arquitetura e Urbanismo"</li>
              <li>Palestras variadas (Sustentabilidade, BIM, Urbanismo)</li>
              <li>Aviso de boas-vindas na tela inicial</li>
            </ul>
          </div>

          <button
            onClick={handleCreateData}
            disabled={isCreatingData}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50 transition-colors font-medium shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isCreatingData ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Gerando dados...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Gerar Dados de Teste
              </>
            )}
          </button>
        </div>

        {/* Reset do Sistema */}
        <div className="p-4 sm:p-6 bg-red-50/50">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-bold text-red-800">
              Zona de Perigo - Reset do Sistema
            </h3>
          </div>
          <p className="text-red-700 text-sm mb-5 leading-relaxed max-w-3xl">
            Esta ação é irreversível. Ela irá{" "}
            <strong>apagar permanentemente</strong> todos os eventos, palestras,
            inscrições, presença e avisos do banco de dados. Apenas as contas de
            usuário (Admin e Alunos) serão mantidas.
          </p>

          <div className="bg-white border border-red-200 rounded-lg p-5 mb-5 shadow-sm max-w-xl">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Confirmação de segurança
            </label>
            <p className="text-xs text-slate-500 mb-3">
              Para confirmar, digite <strong>RESETAR</strong> no campo abaixo.
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={resetConfirm}
                onChange={(e) => setResetConfirm(e.target.value.toUpperCase())}
                placeholder="RESETAR"
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-mono text-center tracking-widest uppercase placeholder:normal-case placeholder:tracking-normal"
              />
            </div>
          </div>

          <button
            onClick={handleReset}
            disabled={isResetting || resetConfirm !== "RESETAR"}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium shadow-sm shadow-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResetting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Resetando sistema...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Confirmar Reset do Sistema
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
