import React from "react";
import {
  Calendar,
  GraduationCap,
  Plus,
  Search,
  Clock,
  MapPin,
  Users,
  Edit,
  Trash2,
  AlertTriangle,
  Loader2,
  Info,
} from "lucide-react";
import { Evento, Palestra } from "../../../services/api";
import { Button } from "../ui/Button"; // Corrected imports
import { Badge } from "../ui/Badge";

interface EventsViewProps {
  // Data
  eventos: Evento[];
  palestras: Palestra[];
  loading: boolean;

  // Computed (Filtered) Data
  filteredEventos: Evento[];
  filteredPalestras: Palestra[];

  // State
  eventsTab: "eventos" | "palestras";
  setEventsTab: (tab: "eventos" | "palestras") => void;

  // Filters State
  search: string;
  setSearch: (s: string) => void;
  eventFilter: string;
  setEventFilter: (s: string) => void;
  palestraEventoFilter: string;
  setPalestraEventoFilter: (s: string) => void;
  dateFilter: string;
  setDateFilter: (s: string) => void;
  monthFilter: string;
  setMonthFilter: (s: string) => void;

  // Actions
  onOpenCreateEvento: () => void;
  onOpenEditEvento: (e: Evento) => void;
  onDeleteEvento: (id: string) => void;

  onOpenCreatePalestra: (tipo?: "PALESTRA" | "ATIVIDADE") => void;
  onOpenEditPalestra: (p: Palestra) => void;
  onDeletePalestra: (id: string) => void;

  onManagePresenca: (p: Palestra) => void;
  onViewDetails: (p: Palestra) => void;
}

const EventsView: React.FC<EventsViewProps> = ({
  eventos,
  loading,
  filteredEventos,
  filteredPalestras,
  eventsTab,
  setEventsTab,
  search,
  setSearch,
  eventFilter,
  setEventFilter,
  palestraEventoFilter,
  setPalestraEventoFilter,
  dateFilter,
  setDateFilter,
  monthFilter,
  setMonthFilter,
  onOpenCreateEvento,
  onOpenEditEvento,
  onDeleteEvento,
  onOpenCreatePalestra,
  onOpenEditPalestra,
  onDeletePalestra,
  onManagePresenca,
  onViewDetails,
}) => {
  const palestrasOnly = filteredPalestras.filter(
    (p) => (p.tipo || "PALESTRA") === "PALESTRA",
  );
  const atividadesOnly = filteredPalestras.filter(
    (p) => (p.tipo || "PALESTRA") === "ATIVIDADE",
  );

  const sumVagas = (items: Palestra[]) =>
    items.reduce((sum, p) => sum + (p.vagas || 0), 0);
  const sumCarga = (items: Palestra[]) =>
    items.reduce((sum, p) => sum + (p.carga_horaria || 0), 0);
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="ml-3 text-slate-600">
          Carregando eventos e palestras...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with tabs */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
            Gerenciamento de Eventos e Palestras
          </h2>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setEventsTab("eventos")}
            className={`px-4 py-2 rounded-md font-medium transition-all text-sm flex items-center ${
              eventsTab === "eventos"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Eventos
          </button>
          <button
            onClick={() => setEventsTab("palestras")}
            className={`px-4 py-2 rounded-md font-medium transition-all text-sm flex items-center ${
              eventsTab === "palestras"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <GraduationCap className="w-4 h-4 mr-2" />
            Palestras/Atividades
          </button>
        </div>
      </div>

      {/* Events Tab Content */}
      {eventsTab === "eventos" && (
        <div className="space-y-4">
          {/* Actions and Filters */}
          <div className="flex flex-col xl:flex-row gap-4 justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-1 overflow-x-auto pb-2">
              <div className="relative flex-1 min-w-50">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar eventos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm cursor-pointer"
              >
                <option value="Todos">Todos</option>
                <option value="Ativos">Ativos</option>
                <option value="Inativos">Inativos</option>
              </select>
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm cursor-pointer"
              >
                <option value="">Todos os meses</option>
                <option value="0">Janeiro</option>
                <option value="1">Fevereiro</option>
                <option value="2">Março</option>
                <option value="3">Abril</option>
                <option value="4">Maio</option>
                <option value="5">Junho</option>
                <option value="6">Julho</option>
                <option value="7">Agosto</option>
                <option value="8">Setembro</option>
                <option value="9">Outubro</option>
                <option value="10">Novembro</option>
                <option value="11">Dezembro</option>
              </select>
            </div>
            <Button
              onClick={onOpenCreateEvento}
              icon={<Plus className="w-4 h-4" />}
            >
              Novo Evento
            </Button>
          </div>

          {/* Events Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEventos.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-white rounded-xl border border-slate-100">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500">Nenhum evento encontrado.</p>
                <p className="text-sm text-slate-400 mt-1">
                  Crie um novo evento ou ajuste os filtros.
                </p>
              </div>
            ) : (
              filteredEventos.map((evento) => (
                <div
                  key={evento.id}
                  className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group flex flex-col"
                >
                  <div className="h-2 bg-linear-to-r from-indigo-500 to-purple-500" />
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-slate-800 line-clamp-2 text-lg">
                        {evento.titulo}
                      </h3>
                      <Badge variant={evento.ativo ? "success" : "secondary"}>
                        {evento.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-3 mb-4 flex-1">
                      {evento.descricao || "Sem descrição"}
                    </p>
                    <div className="space-y-2 text-xs text-slate-500 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="font-medium">
                          {new Date(evento.data_inicio).toLocaleDateString(
                            "pt-BR",
                          )}{" "}
                          -{" "}
                          {new Date(evento.data_fim).toLocaleDateString(
                            "pt-BR",
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{evento.local || "Local não definido"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-indigo-500" />
                        <span>
                          <strong className="text-slate-700">
                            {evento.vagas_totais}
                          </strong>{" "}
                          vagas • Turno: {evento.turno_permitido}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={() => onOpenEditEvento(evento)}
                        icon={<Edit className="w-3.5 h-3.5" />}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => onDeleteEvento(evento.id)}
                        icon={<Trash2 className="w-3.5 h-3.5" />}
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Palestras Tab Content */}
      {eventsTab === "palestras" && (
        <div className="space-y-4">
          {/* Actions and Filters */}
          <div className="flex flex-col xl:flex-row gap-4 justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-1 overflow-x-auto pb-2 flex-wrap">
              <div className="relative flex-1 min-w-50">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar palestras..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <select
                value={palestraEventoFilter}
                onChange={(e) => setPalestraEventoFilter(e.target.value)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="Todos">Todos os eventos</option>
                {eventos.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.titulo}
                  </option>
                ))}
              </select>
              <select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="Todos">Todos os status</option>
                <option value="Ao Vivo">Ao Vivo</option>
                <option value="Em Breve">Em Breve</option>
                <option value="Concluídas">Concluídas</option>
              </select>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => onOpenCreatePalestra("PALESTRA")}
                disabled={eventos.length === 0}
                icon={<Plus className="w-4 h-4" />}
              >
                Nova Palestra
              </Button>
              <Button
                onClick={() => onOpenCreatePalestra("ATIVIDADE")}
                disabled={eventos.length === 0}
                variant="secondary"
                icon={<Plus className="w-4 h-4" />}
              >
                Nova Atividade
              </Button>
            </div>
          </div>

          {/* Cards de criação detalhados */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-100 p-4 sm:p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Palestras
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Conteúdo expositivo com palestrante principal.
                  </p>
                </div>
                <Badge variant="secondary">{palestrasOnly.length}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <p className="text-xs text-slate-500">Vagas totais</p>
                  <p className="font-semibold">{sumVagas(palestrasOnly)}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <p className="text-xs text-slate-500">Carga horária</p>
                  <p className="font-semibold">{sumCarga(palestrasOnly)}h</p>
                </div>
              </div>
              <Button
                className="mt-4 w-full"
                onClick={() => onOpenCreatePalestra("PALESTRA")}
                disabled={eventos.length === 0}
                icon={<Plus className="w-4 h-4" />}
              >
                Criar Palestra
              </Button>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 p-4 sm:p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Atividades
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Oficinas, workshops e práticas supervisionadas.
                  </p>
                </div>
                <Badge variant="secondary">{atividadesOnly.length}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <p className="text-xs text-slate-500">Vagas totais</p>
                  <p className="font-semibold">{sumVagas(atividadesOnly)}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <p className="text-xs text-slate-500">Carga horária</p>
                  <p className="font-semibold">{sumCarga(atividadesOnly)}h</p>
                </div>
              </div>
              <Button
                className="mt-4 w-full"
                variant="secondary"
                onClick={() => onOpenCreatePalestra("ATIVIDADE")}
                disabled={eventos.length === 0}
                icon={<Plus className="w-4 h-4" />}
              >
                Criar Atividade
              </Button>
            </div>
          </div>

          {eventos.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Para criar palestras/atividades, primeiro você precisa criar um
              evento.
            </div>
          )}

          {/* Palestras Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left min-w-250">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-100 disabled:opacity-50">
                  <tr>
                    <th className="px-6 py-4 font-semibold tracking-wider">
                      Palestra
                    </th>
                    <th className="px-6 py-4 font-semibold tracking-wider">
                      Palestrante
                    </th>
                    <th className="px-6 py-4 font-semibold tracking-wider">
                      Evento
                    </th>
                    <th className="px-6 py-4 font-semibold tracking-wider">
                      Data/Hora
                    </th>
                    <th className="px-6 py-4 font-semibold tracking-wider">
                      Sala
                    </th>
                    <th className="px-6 py-4 font-semibold tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 font-semibold tracking-wider text-right">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPalestras.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-16 text-center text-slate-500"
                      >
                        <div className="flex flex-col items-center justify-center">
                          <Search className="w-8 h-8 opacity-20 mb-2" />
                          <p>
                            Nenhuma palestra encontrada com os filtros atuais.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredPalestras.map((palestra) => {
                      const now = new Date();
                      const inicio = new Date(palestra.data_hora_inicio);
                      const fim = new Date(palestra.data_hora_fim);
                      const status =
                        now >= inicio && now <= fim
                          ? "live"
                          : now > fim
                            ? "completed"
                            : "upcoming";
                      const eventoTitulo =
                        eventos.find((e) => e.id === palestra.evento_id)
                          ?.titulo || "—";
                      const palestranteNome =
                        palestra.palestrante_nome ||
                        (palestra as any).profiles?.nome ||
                        "Sem palestrante";
                      const tipoLabel =
                        (palestra.tipo || "PALESTRA") === "ATIVIDADE"
                          ? "ATIVIDADE"
                          : "PALESTRA";

                      return (
                        <tr
                          key={palestra.id}
                          className="hover:bg-slate-50/80 transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <p
                              className="font-medium text-slate-900 line-clamp-1 max-w-62.5"
                              title={palestra.titulo}
                            >
                              {palestra.titulo}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {palestra.carga_horaria}h de carga horária
                            </p>
                            <Badge
                              variant={
                                tipoLabel === "ATIVIDADE"
                                  ? "success"
                                  : "secondary"
                              }
                              className="mt-2"
                            >
                              {tipoLabel}
                            </Badge>
                          </td>
                          <td
                            className="px-6 py-4 text-slate-600 text-sm max-w-50 truncate"
                            title={palestranteNome}
                          >
                            {palestranteNome}
                          </td>
                          <td
                            className="px-6 py-4 text-slate-600 text-sm max-w-50 truncate"
                            title={eventoTitulo}
                          >
                            {eventoTitulo}
                          </td>
                          <td className="px-6 py-4 text-slate-600 text-sm whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {new Date(
                                  palestra.data_hora_inicio,
                                ).toLocaleDateString("pt-BR")}
                              </span>
                              <span className="text-xs text-slate-400">
                                {new Date(
                                  palestra.data_hora_inicio,
                                ).toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}{" "}
                                -{" "}
                                {new Date(
                                  palestra.data_hora_fim,
                                ).toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-600 text-sm">
                            {palestra.sala || "—"}
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              variant={
                                status === "live"
                                  ? "destructive"
                                  : status === "completed"
                                    ? "success"
                                    : "default"
                              }
                              className={
                                status === "live" ? "animate-pulse" : ""
                              }
                            >
                              {status === "live"
                                ? "AO VIVO"
                                : status === "completed"
                                  ? "CONCLUÍDA"
                                  : "EM BREVE"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => onViewDetails(palestra)}
                                className="text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                                title="Detalhes"
                              >
                                <Info className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onManagePresenca(palestra)}
                                className="text-emerald-600 hover:bg-emerald-50 p-2 rounded-lg transition-colors border border-transparent hover:border-emerald-100"
                                title="Gerenciar Frequência"
                              >
                                <Users className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onOpenEditPalestra(palestra)}
                                className="text-slate-500 hover:text-indigo-600 p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200 hover:shadow-sm"
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onDeletePalestra(palestra.id)}
                                className="text-slate-500 hover:text-red-600 p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-red-100 hover:shadow-sm"
                                title="Excluir"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (Expanded for mobile-first experience) */}
            <div className="block lg:hidden divide-y divide-slate-100">
              {filteredPalestras.length === 0 && (
                <div className="px-6 py-12 text-center text-slate-500">
                  <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhuma palestra encontrada.</p>
                </div>
              )}

              {filteredPalestras.map((palestra) => {
                const status =
                  new Date() >= new Date(palestra.data_hora_inicio) &&
                  new Date() <= new Date(palestra.data_hora_fim)
                    ? "live"
                    : new Date() > new Date(palestra.data_hora_fim)
                      ? "completed"
                      : "upcoming";
                const palestranteNome =
                  palestra.palestrante_nome ||
                  (palestra as any).profiles?.nome ||
                  "Sem palestrante";
                const tipoLabel =
                  (palestra.tipo || "PALESTRA") === "ATIVIDADE"
                    ? "ATIVIDADE"
                    : "PALESTRA";
                return (
                  <div key={palestra.id} className="p-4 bg-white space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="pr-4">
                        <h4 className="font-semibold text-slate-800">
                          {palestra.titulo}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          {palestranteNome}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {palestra.sala || "Sem sala"} •{" "}
                          {palestra.carga_horaria}h
                        </p>
                        <Badge
                          variant={
                            tipoLabel === "ATIVIDADE" ? "success" : "secondary"
                          }
                          className="mt-2"
                        >
                          {tipoLabel}
                        </Badge>
                      </div>
                      <Badge
                        variant={
                          status === "live"
                            ? "destructive"
                            : status === "completed"
                              ? "success"
                              : "default"
                        }
                        className="shrink-0"
                      >
                        {status === "live"
                          ? "AO VIVO"
                          : status === "completed"
                            ? "CONCLUÍDA"
                            : "EM BREVE"}
                      </Badge>
                    </div>
                    <div className="text-sm text-slate-600 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      {new Date(
                        palestra.data_hora_inicio,
                      ).toLocaleDateString()}{" "}
                      •{" "}
                      {new Date(palestra.data_hora_inicio).toLocaleTimeString(
                        [],
                        { hour: "2-digit", minute: "2-digit" },
                      )}
                    </div>
                    <div className="grid grid-cols-5 gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDetails(palestra)}
                        className="text-slate-600 border-slate-200 hover:bg-slate-50"
                      >
                        <Info className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onManagePresenca(palestra)}
                        className="text-emerald-600 border-emerald-100 hover:bg-emerald-50"
                      >
                        <Users className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenEditPalestra(palestra)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-100 hover:bg-red-50"
                        onClick={() => onDeletePalestra(palestra.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsView;
