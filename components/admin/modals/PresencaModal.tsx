import React, { useState, useEffect, useRef } from "react";
import {
  Download,
  X,
  Users,
  Loader2,
  AlertCircle,
  UserPlus,
  Search,
  Check,
} from "lucide-react";
import { Palestra, presencaApi } from "../../../services/api";

interface PresencaModalProps {
  isOpen: boolean;
  onClose: () => void;
  palestra: Palestra | null;
  alunos?: any[];
}

const PresencaModal: React.FC<PresencaModalProps> = ({
  isOpen,
  onClose,
  palestra,
  alunos = [],
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado para adicionar aluno manualmente
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [addingStudentId, setAddingStudentId] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && palestra) {
      loadPresencas();
    } else {
      setData(null);
      setError(null);
      setShowAddStudent(false);
      setSearchTerm("");
      setAddSuccess(null);
    }
  }, [isOpen, palestra]);

  const loadPresencas = async () => {
    if (!palestra) return;
    setLoading(true);
    setError(null);
    try {
      const result = await presencaApi.getPresencasPalestra(palestra.id);
      setData(result);
    } catch (err: any) {
      console.error("Erro ao carregar presenças:", err);
      setError("Não foi possível carregar a lista de presença.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePresenca = async (
    inscricaoId: string,
    novoStatus: string,
  ) => {
    if (!palestra) return;

    try {
      // Optimistic update
      setData((prev: any) => ({
        ...prev,
        presencas: prev.presencas.map((p: any) =>
          p.id === inscricaoId ? { ...p, status_presenca: novoStatus } : p,
        ),
      }));

      await presencaApi.atualizarStatus(inscricaoId, novoStatus as any);

      // Reload stats in background to keep consistent
      const result = await presencaApi.getPresencasPalestra(palestra.id);
      setData(result);
    } catch (err: any) {
      alert("Erro ao atualizar presença: " + err.message);
      loadPresencas(); // Revert on error
    }
  };

  const handleExportCSV = () => {
    if (!data?.presencas || data.presencas.length === 0) {
      alert("Nenhuma presença para exportar");
      return;
    }

    const headers = ["Nome", "Email", "RA", "Status", "Data Presença"];
    const rows = data.presencas.map((p: any) => [
      p.profiles?.nome || "N/A",
      p.profiles?.email || "N/A",
      p.profiles?.ra || "N/A",
      p.status_presenca || "INSCRITO",
      p.data_presenca
        ? new Date(p.data_presenca).toLocaleString("pt-BR")
        : "N/A",
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map((row: string[]) => row.join(";")),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `presencas_${palestra?.titulo || "palestra"}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // IDs dos alunos já inscritos nesta palestra
  const alunosInscritos = new Set(
    data?.presencas?.map((p: any) => p.profiles?.id || p.usuario_id) || [],
  );

  // Filtra alunos disponíveis para adicionar (não inscritos + match na busca)
  const filteredStudents =
    searchTerm.length >= 2
      ? alunos
          .filter((a) => !alunosInscritos.has(a.id))
          .filter(
            (a) =>
              a.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              a.ra?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              a.email?.toLowerCase().includes(searchTerm.toLowerCase()),
          )
          .slice(0, 8)
      : [];

  const handleAddStudent = async (alunoId: string, alunoNome: string) => {
    if (!palestra) return;
    setAddingStudentId(alunoId);
    setAddSuccess(null);
    try {
      await presencaApi.registrarPresencaManual(palestra.id, alunoId);
      setAddSuccess(`Presença de ${alunoNome} registrada!`);
      setSearchTerm("");
      // Recarregar lista de presenças
      await loadPresencas();
      // Limpar mensagem de sucesso após 3s
      setTimeout(() => setAddSuccess(null), 3000);
    } catch (err: any) {
      alert("Erro: " + err.message);
    } finally {
      setAddingStudentId(null);
    }
  };

  if (!isOpen) return null;

  const statusColors: Record<string, string> = {
    INSCRITO: "bg-slate-100 text-slate-700",
    PRESENTE: "bg-emerald-100 text-emerald-700",
    AUSENTE: "bg-red-100 text-red-700",
    WALK_IN: "bg-blue-100 text-blue-700",
    ATRASADO: "bg-amber-100 text-amber-700",
    JUSTIFICADO: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Gerenciar Presenças
            </h3>
            <p className="text-sm text-slate-500 mt-1 max-w-50 sm:max-w-md truncate">
              {palestra?.titulo}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors bg-white hover:bg-slate-100 p-2 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto max-h-[70vh]">
          {loading && !data ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <span className="ml-2 text-slate-600">
                Carregando presenças...
              </span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-12 h-12 text-red-300 mb-3" />
              <p className="text-slate-800 font-medium">
                Erro ao carregar dados
              </p>
              <p className="text-slate-500 text-sm mt-1">{error}</p>
              <button
                onClick={loadPresencas}
                className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Tentar novamente
              </button>
            </div>
          ) : data ? (
            <>
              {/* Estatísticas */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                <div className="bg-slate-50 p-3 sm:p-4 rounded-xl text-center border border-slate-100">
                  <p className="text-xl sm:text-2xl font-bold text-slate-800">
                    {data.stats?.total || 0}
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">
                    Total Inscritos
                  </p>
                </div>
                <div className="bg-emerald-50 p-3 sm:p-4 rounded-xl text-center border border-emerald-100">
                  <p className="text-xl sm:text-2xl font-bold text-emerald-600">
                    {data.stats?.presentes || 0}
                  </p>
                  <p className="text-[10px] sm:text-xs text-emerald-600 font-bold uppercase tracking-wider">
                    Presentes
                  </p>
                </div>
                <div className="bg-red-50 p-3 sm:p-4 rounded-xl text-center border border-red-100">
                  <p className="text-xl sm:text-2xl font-bold text-red-600">
                    {data.stats?.ausentes || 0}
                  </p>
                  <p className="text-[10px] sm:text-xs text-red-600 font-bold uppercase tracking-wider">
                    Ausentes
                  </p>
                </div>
                <div className="bg-blue-50 p-3 sm:p-4 rounded-xl text-center border border-blue-100">
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">
                    {data.stats?.walk_ins || 0}
                  </p>
                  <p className="text-[10px] sm:text-xs text-blue-600 font-bold uppercase tracking-wider">
                    Sem inscrição
                  </p>
                </div>
              </div>

              {/* Botão Exportar + Adicionar Aluno */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <button
                  onClick={() => {
                    setShowAddStudent((v) => !v);
                    setSearchTerm("");
                    setAddSuccess(null);
                    if (!showAddStudent) {
                      setTimeout(
                        () => searchInputRef.current?.focus(),
                        100,
                      );
                    }
                  }}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm text-sm font-medium"
                >
                  <UserPlus className="w-4 h-4" />
                  {showAddStudent ? "Fechar busca" : "Adicionar Aluno"}
                </button>
                <button
                  onClick={handleExportCSV}
                  disabled={!data.presencas || data.presencas.length === 0}
                  className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm text-sm font-medium disabled:opacity-50"
                >
                  <Download className="w-4 h-4" /> Exportar Planilha
                </button>
              </div>

              {/* Painel de busca/adição de aluno */}
              {showAddStudent && (
                <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Buscar aluno por nome, RA ou email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
                    />
                  </div>

                  {addSuccess && (
                    <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-sm">
                      <Check className="w-4 h-4" />
                      {addSuccess}
                    </div>
                  )}

                  {searchTerm.length >= 2 && filteredStudents.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-2">
                      Nenhum aluno encontrado (não inscrito nesta palestra)
                    </p>
                  )}

                  {filteredStudents.length > 0 && (
                    <div className="divide-y divide-indigo-100 border border-indigo-100 rounded-lg bg-white overflow-hidden max-h-52 overflow-y-auto">
                      {filteredStudents.map((aluno) => (
                        <button
                          key={aluno.id}
                          onClick={() =>
                            handleAddStudent(aluno.id, aluno.nome)
                          }
                          disabled={addingStudentId === aluno.id}
                          className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-indigo-50 transition-colors text-left disabled:opacity-50"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                              {aluno.nome?.charAt(0) || "?"}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-slate-800 text-sm truncate">
                                {aluno.nome}
                              </p>
                              <p className="text-xs text-slate-500 truncate">
                                {aluno.ra
                                  ? `RA: ${aluno.ra}`
                                  : aluno.email}
                              </p>
                            </div>
                          </div>
                          {addingStudentId === aluno.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-indigo-600 shrink-0" />
                          ) : (
                            <span className="text-xs text-indigo-600 font-medium shrink-0 flex items-center gap-1">
                              <UserPlus className="w-3.5 h-3.5" />
                              Marcar presente
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {searchTerm.length < 2 && !addSuccess && (
                    <p className="text-xs text-indigo-500 text-center">
                      Digite ao menos 2 caracteres para buscar
                    </p>
                  )}
                </div>
              )}

              {/* Lista de Presenças */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-150">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                      <tr>
                        <th className="px-4 py-3">Aluno</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Check-in</th>
                        <th className="px-4 py-3">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.presencas?.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-4 py-12 text-center text-slate-500"
                          >
                            <Users className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                            <p>Nenhum inscrito nesta palestra</p>
                          </td>
                        </tr>
                      ) : (
                        data.presencas?.map((p: any) => (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                                  {p.profiles?.nome?.charAt(0) || "?"}
                                </div>
                                <div>
                                  <p className="font-medium text-slate-800 text-sm">
                                    {p.profiles?.nome || "N/A"}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {p.profiles?.ra || p.profiles?.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2.5 py-1 rounded-md text-xs font-medium border border-transparent ${statusColors[p.status_presenca] || statusColors.INSCRITO}`}
                              >
                                {p.status_presenca || "INSCRITO"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600 font-mono">
                              {p.data_presenca
                                ? new Date(p.data_presenca).toLocaleTimeString(
                                    "pt-BR",
                                    { hour: "2-digit", minute: "2-digit" },
                                  )
                                : "-"}
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={p.status_presenca || "INSCRITO"}
                                onChange={(e) =>
                                  handleUpdatePresenca(p.id, e.target.value)
                                }
                                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
                              >
                                <option value="INSCRITO">Inscrito</option>
                                <option value="PRESENTE">Presente</option>
                                <option value="AUSENTE">Ausente</option>
                                <option value="ATRASADO">Atrasado</option>
                                <option value="JUSTIFICADO">Justificado</option>
                                <option value="WALK_IN">Walk-in</option>
                              </select>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>

        <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 text-white hover:bg-slate-900 rounded-lg font-medium transition-colors shadow-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PresencaModal;
