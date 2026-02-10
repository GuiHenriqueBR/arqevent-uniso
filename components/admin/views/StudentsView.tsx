import React, { useState, useEffect } from "react";
import {
  Download,
  Search,
  Users,
  Mail,
  CheckCircle,
  AlertCircle,
  X,
  Calendar,
  MapPin,
  Clock,
  Loader2,
  Edit,
  Trash2,
} from "lucide-react";
import { usuariosApi } from "../../../services/api";
import UserEditModal from "../modals/UserEditModal";

interface StudentsViewProps {
  alunos: any[];
  loading: boolean;
  onExportCSV: () => void;
  onRefresh?: () => void;
}

const StudentsView: React.FC<StudentsViewProps> = ({
  alunos,
  loading,
  onExportCSV,
  onRefresh,
}) => {
  const [search, setSearch] = useState("");
  const [semestreFilter, setSemestreFilter] = useState("Todos");
  const [turnoFilter, setTurnoFilter] = useState("Todos");
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [inscricoes, setInscricoes] = useState<{
    eventos: any[];
    palestras: any[];
  } | null>(null);
  const [loadingInscricoes, setLoadingInscricoes] = useState(false);
  const [deletingStudent, setDeletingStudent] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Carregar inscrições quando um aluno for selecionado
  useEffect(() => {
    if (selectedStudent) {
      setLoadingInscricoes(true);
      setInscricoes(null);
      usuariosApi
        .getInscricoes(selectedStudent.id)
        .then((data) => {
          setInscricoes(data);
        })
        .catch((err) => {
          console.error("Erro ao carregar inscrições:", err);
        })
        .finally(() => {
          setLoadingInscricoes(false);
        });
    } else {
      setInscricoes(null);
    }
  }, [selectedStudent]);

  const handleDeleteStudent = async (student: any) => {
    if (deleteConfirmId !== student.id) {
      setDeleteConfirmId(student.id);
      return;
    }
    setDeletingStudent(true);
    try {
      await usuariosApi.deleteAluno(student.id);
      setSelectedStudent(null);
      setDeleteConfirmId(null);
      onRefresh?.();
    } catch (err: any) {
      alert(err.message || "Erro ao excluir aluno");
    } finally {
      setDeletingStudent(false);
    }
  };

  const handleSendEmail = (student: any) => {
    if (!student?.email) return;
    const subject = encodeURIComponent("Contato - ArqEvent");
    const body = encodeURIComponent(
      `Olá ${student.nome || ""},\n\nEntrando em contato pelo ArqEvent.`,
    );
    window.location.href = `mailto:${student.email}?subject=${subject}&body=${body}`;
  };

  // Filter Logic
  const filteredStudents = alunos.filter((student) => {
    const matchesSearch =
      student.nome?.toLowerCase().includes(search.toLowerCase()) ||
      student.ra?.includes(search) ||
      student.email?.toLowerCase().includes(search.toLowerCase());
    const matchesSemestre =
      semestreFilter === "Todos" || student.semestre === semestreFilter;
    const matchesTurno =
      turnoFilter === "Todos" || student.turno === turnoFilter;
    return matchesSearch && matchesSemestre && matchesTurno;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-600">Carregando alunos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
            Alunos Cadastrados
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {alunos.length} alunos no total • {filteredStudents.length} exibidos
          </p>
        </div>
        <button
          onClick={onExportCSV}
          disabled={filteredStudents.length === 0}
          className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
        >
          <Download className="w-4 h-4" /> Exportar Planilha
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 bg-slate-50/50">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome, RA ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
            />
          </div>
          <select
            value={semestreFilter}
            onChange={(e) => setSemestreFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm w-full sm:w-auto"
          >
            <option value="Todos">Todos os Semestres</option>
            {[...Array(10)].map((_, i) => (
              <option key={i} value={`${i + 1}`}>
                {i + 1}º Semestre
              </option>
            ))}
          </select>
          <select
            value={turnoFilter}
            onChange={(e) => setTurnoFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm w-full sm:w-auto"
          >
            <option value="Todos">Todos os Turnos</option>
            <option value="MANHA">Manhã</option>
            <option value="NOITE">Noite</option>
          </select>
        </div>

        {/* Mobile Cards View */}
        <div className="block lg:hidden divide-y divide-slate-100">
          {filteredStudents.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500">
              <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="font-medium">Nenhum aluno encontrado</p>
            </div>
          ) : (
            filteredStudents.map((student) => (
              <div
                key={student.id}
                className="p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                    {student.nome?.charAt(0) || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">
                      {student.nome || "Sem nome"}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {student.email || "Sem email"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-medium border border-slate-200">
                    RA: {student.ra || "-"}
                  </span>
                  {student.semestre && (
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-medium border border-slate-200">
                      {student.semestre}º Sem
                    </span>
                  )}
                  {student.turno && (
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-medium border ${
                        student.turno === "MANHA"
                          ? "bg-amber-50 text-amber-700 border-amber-100"
                          : "bg-indigo-50 text-indigo-700 border-indigo-100"
                      }`}
                    >
                      {student.turno === "MANHA" ? "☀️ Manhã" : "🌙 Noite"}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          (student.presenca || 0) >= 75
                            ? "bg-emerald-500"
                            : (student.presenca || 0) >= 50
                              ? "bg-amber-400"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${student.presenca || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium text-slate-600">
                      {student.presenca || 0}%
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedStudent(student)}
                    className="text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-transparent hover:border-indigo-100"
                  >
                    Detalhes
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left min-w-200">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-100 font-semibold tracking-wider">
              <tr>
                <th className="px-6 py-4">Aluno</th>
                <th className="px-6 py-4">RA</th>
                <th className="px-6 py-4">Semestre</th>
                <th className="px-6 py-4">Turno</th>
                <th className="px-6 py-4">Frequência</th>
                <th className="px-6 py-4">Carga Horária</th>
                <th className="px-6 py-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p className="font-medium">Nenhum aluno encontrado</p>
                    <p className="text-sm mt-1">
                      Ajuste os filtros para ver resultados
                    </p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                          {student.nome?.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {student.nome || "Sem nome"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {student.email || "Sem email"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-mono text-sm">
                      {student.ra || "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-medium border border-slate-200">
                        {student.semestre || "-"}º
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {student.turno && (
                        <span
                          className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                            student.turno === "MANHA"
                              ? "bg-amber-50 text-amber-700 border-amber-100"
                              : "bg-indigo-50 text-indigo-700 border-indigo-100"
                          }`}
                        >
                          {student.turno === "MANHA" ? "Manhã" : "Noite"}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              (student.presenca || 0) >= 75
                                ? "bg-emerald-500"
                                : (student.presenca || 0) >= 50
                                  ? "bg-amber-400"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${student.presenca || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium text-slate-600">
                          {student.presenca || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-sm font-medium">
                      {student.cargaHoraria || 0}h
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-transparent hover:border-indigo-100 opacity-0 group-hover:opacity-100"
                      >
                        Ver Detalhes
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Details Modal */}
      {selectedStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setSelectedStudent(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-slate-900 p-6 flex justify-between items-start text-white shrink-0 relative overflow-hidden">
              {/* Decorative background circle */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex gap-4 flex-1 min-w-0 z-10">
                <div className="w-16 h-16 bg-linear-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-2xl font-bold shrink-0 shadow-lg border-2 border-slate-800">
                  {selectedStudent.nome?.charAt(0) || "?"}
                </div>
                <div className="min-w-0 pt-1">
                  <h3 className="text-xl font-bold truncate">
                    {selectedStudent.nome || "Aluno"}
                  </h3>
                  <p className="text-slate-300 text-sm truncate">
                    {selectedStudent.email || "-"}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-md text-xs border border-white/10 shadow-sm">
                      RA: {selectedStudent.ra || "-"}
                    </span>
                    <span className="bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-md text-xs border border-white/10 shadow-sm">
                      {selectedStudent.semestre || "-"}º Semestre
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-slate-400 hover:text-white ml-2 shrink-0 transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full relative z-10"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto bg-slate-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl text-center shadow-sm border border-slate-100 group hover:border-indigo-100 transition-colors">
                  <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">
                    Presença Total
                  </p>
                  <p
                    className={`text-2xl font-bold ${
                      (selectedStudent.presenca || 0) >= 75
                        ? "text-emerald-600"
                        : "text-amber-500"
                    }`}
                  >
                    {selectedStudent.presenca || 0}%
                  </p>
                </div>
                <div className="bg-white p-4 rounded-xl text-center shadow-sm border border-slate-100 group hover:border-indigo-100 transition-colors">
                  <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">
                    Carga Horária
                  </p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {selectedStudent.cargaHoraria || 0}h
                  </p>
                </div>
              </div>

              {/* Inscrições em Eventos */}
              <h4 className="font-bold text-slate-800 mb-3 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Eventos Inscritos
              </h4>

              {loadingInscricoes ? (
                <div className="bg-white rounded-xl border border-slate-100 p-6 text-center mb-6">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">
                    Carregando inscrições...
                  </p>
                </div>
              ) : inscricoes?.eventos && inscricoes.eventos.length > 0 ? (
                <div className="space-y-2 mb-6">
                  {inscricoes.eventos.map((insc: any) => (
                    <div
                      key={insc.id}
                      className="bg-white rounded-xl border border-slate-100 p-4 hover:border-indigo-100 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 truncate">
                            {insc.eventos?.titulo || "Evento"}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {insc.eventos?.data_inicio
                                ? new Date(
                                    insc.eventos.data_inicio,
                                  ).toLocaleDateString("pt-BR")
                                : "-"}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            insc.status === "CONFIRMADA"
                              ? "bg-emerald-100 text-emerald-700"
                              : insc.status === "PENDENTE"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {insc.status === "CONFIRMADA"
                            ? "Confirmado"
                            : insc.status === "PENDENTE"
                              ? "Pendente"
                              : "Cancelado"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-100 p-6 text-center mb-6">
                  <p className="text-slate-400 text-sm">
                    Nenhum evento inscrito.
                  </p>
                </div>
              )}

              {/* Inscrições em Palestras/Atividades */}
              <h4 className="font-bold text-slate-800 mb-3 text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-indigo-600" />
                Palestras e Atividades
              </h4>

              {loadingInscricoes ? (
                <div className="bg-white rounded-xl border border-slate-100 p-6 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">Carregando...</p>
                </div>
              ) : inscricoes?.palestras && inscricoes.palestras.length > 0 ? (
                <div className="space-y-2">
                  {inscricoes.palestras.map((insc: any) => (
                    <div
                      key={insc.id}
                      className="bg-white rounded-xl border border-slate-100 p-4 hover:border-indigo-100 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                insc.palestras?.tipo === "ATIVIDADE"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {insc.palestras?.tipo === "ATIVIDADE"
                                ? "Atividade"
                                : "Palestra"}
                            </span>
                          </div>
                          <p className="font-medium text-slate-800 truncate">
                            {insc.palestras?.titulo || "Palestra/Atividade"}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {insc.palestras?.data_hora_inicio
                                ? new Date(
                                    insc.palestras.data_hora_inicio,
                                  ).toLocaleString("pt-BR", {
                                    dateStyle: "short",
                                    timeStyle: "short",
                                  })
                                : "-"}
                            </span>
                            {insc.palestras?.sala && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {insc.palestras.sala}
                              </span>
                            )}
                          </div>
                          {insc.palestras?.eventos?.titulo && (
                            <p className="text-[11px] text-slate-400 mt-1">
                              Evento: {insc.palestras.eventos.titulo}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              insc.presente ||
                              insc.status_presenca === "PRESENTE" ||
                              insc.status_presenca === "WALK_IN" ||
                              insc.status_presenca === "ATRASADO"
                                ? "bg-emerald-100 text-emerald-700"
                                : insc.status_presenca === "AUSENTE"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {insc.presente ||
                            insc.status_presenca === "PRESENTE"
                              ? "✓ Presente"
                              : insc.status_presenca === "WALK_IN"
                                ? "✓ Walk-in"
                                : insc.status_presenca === "ATRASADO"
                                  ? "⏰ Atrasado"
                                  : insc.status_presenca === "AUSENTE"
                                    ? "✗ Ausente"
                                    : insc.status_presenca === "JUSTIFICADO"
                                      ? "📝 Justificado"
                                      : "Inscrito"}
                          </span>
                          {insc.is_walk_in && (
                            <span className="text-[10px] text-slate-400">
                              Sem inscrição prévia
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-100 p-6 text-center">
                  <p className="text-slate-400 text-sm">
                    Nenhuma palestra ou atividade inscrita.
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row justify-between gap-3 shrink-0">
              <button
                onClick={() => handleDeleteStudent(selectedStudent)}
                disabled={deletingStudent}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm ${
                  deleteConfirmId === selectedStudent.id
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "border border-red-200 bg-white text-red-600 hover:bg-red-50"
                }`}
              >
                {deletingStudent ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {deleteConfirmId === selectedStudent.id
                  ? "Confirmar Exclusão"
                  : "Excluir Aluno"}
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setEditingStudent(selectedStudent);
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <Edit className="w-4 h-4" /> Editar Usuário
                </button>
                <button
                  onClick={() => handleSendEmail(selectedStudent)}
                  disabled={!selectedStudent?.email}
                  className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 bg-white rounded-lg text-slate-600 text-sm font-medium hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm disabled:opacity-50"
                >
                  <Mail className="w-4 h-4" /> Enviar Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Edit Modal */}
      <UserEditModal
        isOpen={!!editingStudent}
        onClose={() => setEditingStudent(null)}
        user={editingStudent}
        onSave={() => {
          setEditingStudent(null);
          setSelectedStudent(null);
          onRefresh?.();
        }}
        mode="edit"
      />
    </div>
  );
};

export default StudentsView;
