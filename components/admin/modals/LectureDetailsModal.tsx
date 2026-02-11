import React, { useState, useEffect } from "react";
import {
  X,
  Clock,
  MapPin,
  User,
  CalendarDays,
  Users,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserPlus,
  Loader2,
  Download,
} from "lucide-react";
import {
  Palestra,
  Evento,
  presencaApi,
  formatCargaHoraria,
} from "../../../services/api";

interface LectureDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  palestra: Palestra | null;
  eventos: Evento[];
}

const LectureDetailsModal: React.FC<LectureDetailsModalProps> = ({
  isOpen,
  onClose,
  palestra,
  eventos,
}) => {
  const [activeTab, setActiveTab] = useState<"detalhes" | "inscritos">(
    "detalhes",
  );
  const [inscritos, setInscritos] = useState<any[]>([]);
  const [estatisticas, setEstatisticas] = useState<any>(null);
  const [loadingInscritos, setLoadingInscritos] = useState(false);
  const [searchInscritos, setSearchInscritos] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("TODOS");

  // Reset ao abrir/fechar
  useEffect(() => {
    if (isOpen && palestra) {
      setActiveTab("detalhes");
      setSearchInscritos("");
      setFiltroStatus("TODOS");
      setInscritos([]);
      setEstatisticas(null);
    }
  }, [isOpen, palestra?.id]);

  // Carregar inscritos quando aba é selecionada
  useEffect(() => {
    if (activeTab === "inscritos" && palestra) {
      loadInscritos();
    }
  }, [activeTab, palestra?.id]);

  const loadInscritos = async () => {
    if (!palestra) return;
    setLoadingInscritos(true);
    try {
      const result = await presencaApi.getPresencasPalestra(palestra.id);
      setInscritos(result.inscricoes || []);
      setEstatisticas(result.estatisticas || null);
    } catch (err) {
      console.error("Erro ao carregar inscritos:", err);
    } finally {
      setLoadingInscritos(false);
    }
  };

  if (!isOpen || !palestra) return null;

  const eventoTitulo =
    eventos.find((e) => e.id === palestra.evento_id)?.titulo || "—";
  const palestranteNome =
    palestra.palestrante_nome || (palestra as any).profiles?.nome || "—";

  // Filtrar inscritos por busca e status
  const inscritosFiltrados = inscritos.filter((insc) => {
    const perfil = insc.profiles || {};
    const matchesSearch =
      !searchInscritos ||
      (perfil.nome || "")
        .toLowerCase()
        .includes(searchInscritos.toLowerCase()) ||
      (perfil.ra || "").toLowerCase().includes(searchInscritos.toLowerCase()) ||
      (perfil.email || "")
        .toLowerCase()
        .includes(searchInscritos.toLowerCase());

    const matchesStatus =
      filtroStatus === "TODOS" ||
      insc.status_presenca === filtroStatus ||
      (filtroStatus === "WALK_IN" && insc.is_walk_in);

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (insc: any) => {
    const status =
      insc.status_presenca || (insc.presente ? "PRESENTE" : "INSCRITO");
    switch (status) {
      case "PRESENTE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-50 text-green-700 border border-green-200">
            <CheckCircle className="w-3 h-3" /> Presente
          </span>
        );
      case "AUSENTE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3 h-3" /> Ausente
          </span>
        );
      case "WALK_IN":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            <UserPlus className="w-3 h-3" /> Avulso
          </span>
        );
      case "ATRASADO":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3" /> Atrasado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-slate-50 text-slate-600 border border-slate-200">
            <Clock className="w-3 h-3" /> Inscrito
          </span>
        );
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Nome",
      "RA",
      "Email",
      "Semestre",
      "Turno",
      "Status",
      "Data Inscrição",
    ];
    const rows = inscritosFiltrados.map((insc) => {
      const p = insc.profiles || {};
      return [
        p.nome || "",
        p.ra || "",
        p.email || "",
        p.semestre || "",
        p.turno || "",
        insc.status_presenca || (insc.presente ? "PRESENTE" : "INSCRITO"),
        insc.data_inscricao
          ? new Date(insc.data_inscricao).toLocaleString("pt-BR")
          : "",
      ];
    });
    const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `inscritos_${palestra.titulo.replace(/\s+/g, "_")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-slate-800 truncate">
              {palestra.titulo}
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">{eventoTitulo}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors bg-white hover:bg-slate-100 p-2 rounded-full ml-2 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setActiveTab("detalhes")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === "detalhes"
                ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Detalhes
          </button>
          <button
            onClick={() => setActiveTab("inscritos")}
            className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === "inscritos"
                ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Users className="w-4 h-4" />
            Inscritos
            {estatisticas && (
              <span className="bg-indigo-100 text-indigo-700 text-xs px-1.5 py-0.5 rounded-full font-semibold">
                {estatisticas.total_registros}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "detalhes" && (
            <div className="p-4 sm:p-6 space-y-4">
              {palestra.descricao && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Descrição</p>
                  <p className="text-slate-800 text-sm leading-relaxed">
                    {palestra.descricao}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <CalendarDays className="w-5 h-5 text-indigo-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Evento</p>
                    <p className="text-sm font-medium text-slate-800">
                      {eventoTitulo}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <User className="w-5 h-5 text-indigo-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Palestrante</p>
                    <p className="text-sm font-medium text-slate-800">
                      {palestranteNome}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <Clock className="w-5 h-5 text-indigo-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Data e Horário</p>
                    <p className="text-sm font-medium text-slate-800">
                      {new Date(palestra.data_hora_inicio).toLocaleDateString(
                        "pt-BR",
                      )}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(palestra.data_hora_inicio).toLocaleTimeString(
                        "pt-BR",
                        { hour: "2-digit", minute: "2-digit" },
                      )}{" "}
                      -{" "}
                      {new Date(palestra.data_hora_fim).toLocaleTimeString(
                        "pt-BR",
                        { hour: "2-digit", minute: "2-digit" },
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <MapPin className="w-5 h-5 text-indigo-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Sala</p>
                    <p className="text-sm font-medium text-slate-800">
                      {palestra.sala || "Não definida"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <Users className="w-5 h-5 text-indigo-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Vagas</p>
                    <p className="text-sm font-medium text-slate-800">
                      {palestra.vagas}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <Clock className="w-5 h-5 text-indigo-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Carga Horária</p>
                    <p className="text-sm font-medium text-slate-800">
                      {formatCargaHoraria(palestra)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "inscritos" && (
            <div className="p-4 sm:p-6 space-y-4">
              {/* Estatísticas rápidas */}
              {estatisticas && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-slate-800">
                      {estatisticas.total_registros}
                    </p>
                    <p className="text-xs text-slate-500">Total</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-green-700">
                      {estatisticas.presentes}
                    </p>
                    <p className="text-xs text-green-600">Presentes</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-red-700">
                      {estatisticas.ausentes}
                    </p>
                    <p className="text-xs text-red-600">Ausentes</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-blue-700">
                      {estatisticas.walk_ins}
                    </p>
                    <p className="text-xs text-blue-600">Avulsos</p>
                  </div>
                </div>
              )}

              {/* Busca + filtro + export */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchInscritos}
                    onChange={(e) => setSearchInscritos(e.target.value)}
                    placeholder="Buscar por nome, RA ou email..."
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="TODOS">Todos</option>
                  <option value="INSCRITO">Inscritos</option>
                  <option value="PRESENTE">Presentes</option>
                  <option value="AUSENTE">Ausentes</option>
                  <option value="WALK_IN">Avulsos</option>
                </select>
                <button
                  onClick={handleExportCSV}
                  disabled={inscritosFiltrados.length === 0}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                  title="Exportar CSV"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">CSV</span>
                </button>
              </div>

              {/* Lista */}
              {loadingInscritos ? (
                <div className="flex items-center justify-center py-12 text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Carregando inscritos...
                </div>
              ) : inscritosFiltrados.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">
                    {inscritos.length === 0
                      ? "Nenhum inscrito nesta palestra/atividade."
                      : "Nenhum resultado para o filtro aplicado."}
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  {/* Header da tabela */}
                  <div className="hidden sm:grid sm:grid-cols-[1fr_80px_1fr_100px] bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <span>Aluno</span>
                    <span>RA</span>
                    <span>Email</span>
                    <span className="text-center">Status</span>
                  </div>

                  {/* Linhas */}
                  <div className="divide-y divide-slate-100 max-h-85 overflow-y-auto">
                    {inscritosFiltrados.map((insc, idx) => {
                      const perfil = insc.profiles || {};
                      return (
                        <div
                          key={insc.id || idx}
                          className="px-4 py-3 hover:bg-slate-50/80 transition-colors"
                        >
                          {/* Desktop */}
                          <div className="hidden sm:grid sm:grid-cols-[1fr_80px_1fr_100px] items-center gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-800 truncate">
                                {perfil.nome || "—"}
                              </p>
                              <p className="text-xs text-slate-400">
                                {perfil.semestre
                                  ? `${perfil.semestre}º Sem`
                                  : ""}{" "}
                                {perfil.turno || ""}
                              </p>
                            </div>
                            <p className="text-sm text-slate-600 font-mono">
                              {perfil.ra || "—"}
                            </p>
                            <p className="text-sm text-slate-500 truncate">
                              {perfil.email || "—"}
                            </p>
                            <div className="text-center">
                              {getStatusBadge(insc)}
                            </div>
                          </div>

                          {/* Mobile */}
                          <div className="sm:hidden flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-800 truncate">
                                {perfil.nome || "—"}
                              </p>
                              <p className="text-xs text-slate-400">
                                RA: {perfil.ra || "—"} •{" "}
                                {perfil.semestre
                                  ? `${perfil.semestre}º Sem`
                                  : ""}{" "}
                                {perfil.turno || ""}
                              </p>
                            </div>
                            {getStatusBadge(insc)}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Rodapé */}
                  <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 text-xs text-slate-500 text-right">
                    {inscritosFiltrados.length} de {inscritos.length} inscritos
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-600 text-white hover:bg-slate-700 rounded-lg font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default LectureDetailsModal;
