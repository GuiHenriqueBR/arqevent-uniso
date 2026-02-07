import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Calendar,
  Users,
  GraduationCap,
  Loader2,
  AlertTriangle,
  TrendingUp,
  Clock,
} from "lucide-react";
import { Lecture } from "../../../types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Badge } from "../ui/Badge";

export interface DashboardStats {
  eventos: { total: number; ativos: number };
  usuarios: { total: number };
  palestras: { total: number };
  certificados: { total: number };
  presencas_hoje: number;
  presencaTurno?: { name: string; manha: number; noite: number }[];
  palestras_sem_inscricao?: number;
  top_palestras?: { titulo: string; inscritos: number; vagas: number }[];
  palestras_hoje?: number;
}

interface DashboardViewProps {
  isLoading: boolean;
  stats: DashboardStats | null;
  recentPalestras: Lecture[];
  onNavigate: (view: any) => void;
}

const getLectureStatus = (lecture: Lecture) => {
  const now = new Date();
  const inicio = new Date(lecture.data_hora_inicio);
  const fim = new Date(lecture.data_hora_fim);

  if (now >= inicio && now <= fim) return "live";
  if (now > fim) return "completed";
  return "upcoming";
};

const DashboardView: React.FC<DashboardViewProps> = ({
  isLoading,
  stats,
  recentPalestras = [],
  onNavigate,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="ml-3 text-slate-600">Carregando dashboard...</span>
      </div>
    );
  }

  const statCards: Array<{
    label: string;
    value: number;
    color: string;
    icon: React.ElementType;
    action?: () => void;
  }> = [
    {
      label: "Eventos Ativos",
      value: stats?.eventos.ativos || 0,
      color: "border-l-4 border-blue-500",
      icon: Calendar,
      action: () => onNavigate("events"),
    },
    {
      label: "Total de Alunos",
      value: stats?.usuarios.total || 0,
      color: "border-l-4 border-emerald-500",
      icon: Users,
      action: () => onNavigate("students"),
    },
    {
      label: "Palestras/Atividades",
      value: stats?.palestras.total || 0,
      color: "border-l-4 border-indigo-500",
      icon: GraduationCap,
      action: () => onNavigate("events"),
    },
  ];

  const presencaChartData = stats?.presencaTurno || [
    { name: "Seg", manha: 0, noite: 0 },
    { name: "Ter", manha: 0, noite: 0 },
    { name: "Qua", manha: 0, noite: 0 },
    { name: "Qui", manha: 0, noite: 0 },
    { name: "Sex", manha: 0, noite: 0 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
          Visão Geral
        </h2>
        <div className="text-sm text-slate-500">
          Atualizado:{" "}
          {new Date().toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
        {statCards.map((stat, i) => (
          <Card
            key={i}
            className={`backdrop-blur-sm bg-white/90 shadow-sm hover:shadow-md transition-all duration-200 ${stat.color} ${
              stat.action ? "cursor-pointer active:scale-95" : ""
            }`}
            onClick={stat.action}
          >
            <CardContent className="p-4 sm:p-6 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-500 text-xs sm:text-sm font-medium uppercase tracking-wide">
                  {stat.label}
                </p>
                <stat.icon className="w-5 h-5 text-slate-400 hidden sm:block" />
              </div>
              <p className="text-xl sm:text-3xl font-bold text-slate-800">
                {stat.value.toLocaleString("pt-BR")}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alertas e Indicadores Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Alerta de palestras sem inscrições */}
        {(stats?.palestras_sem_inscricao ?? 0) > 0 && (
          <Card className="border-l-4 border-amber-500 bg-amber-50/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="bg-amber-100 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-800">Atenção!</p>
                <p className="text-sm text-amber-700">
                  {stats?.palestras_sem_inscricao} palestra
                  {(stats?.palestras_sem_inscricao ?? 0) > 1 ? "s" : ""} sem
                  inscrições
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Palestras hoje */}
        <Card className="border-l-4 border-indigo-500 bg-indigo-50/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-indigo-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="font-semibold text-indigo-800">Hoje</p>
              <p className="text-sm text-indigo-700">
                {stats?.palestras_hoje ?? 0} palestra
                {(stats?.palestras_hoje ?? 0) !== 1 ? "s" : ""} agendada
                {(stats?.palestras_hoje ?? 0) !== 1 ? "s" : ""}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Taxa de presença média */}
        <Card className="border-l-4 border-emerald-500 bg-emerald-50/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-emerald-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-emerald-800">Presenças Hoje</p>
              <p className="text-sm text-emerald-700">
                {stats?.presencas_hoje ?? 0} confirmada
                {(stats?.presencas_hoje ?? 0) !== 1 ? "s" : ""}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Presence Chart */}
        <Card className="backdrop-blur-sm bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-800">
              Presença por Turno
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 sm:h-72 w-full min-h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={presencaChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b" }}
                  />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="manha"
                    name="Manhã"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="noite"
                    name="Noite"
                    fill="#0f172a"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Palestras Populares */}
        <Card className="backdrop-blur-sm bg-white/90 shadow-sm flex flex-col h-full">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              Top Palestras Populares
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <div className="space-y-3">
              {!stats?.top_palestras || stats.top_palestras.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhuma inscrição ainda.</p>
                </div>
              ) : (
                stats.top_palestras.map((palestra, index) => {
                  const percentual =
                    palestra.vagas > 0
                      ? Math.round((palestra.inscritos / palestra.vagas) * 100)
                      : 0;
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-slate-50/50 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                          index === 0
                            ? "bg-amber-500"
                            : index === 1
                              ? "bg-slate-400"
                              : index === 2
                                ? "bg-amber-700"
                                : "bg-slate-300"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 truncate text-sm">
                          {palestra.titulo}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                percentual >= 90
                                  ? "bg-red-500"
                                  : percentual >= 70
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                              }`}
                              style={{ width: `${Math.min(percentual, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500 whitespace-nowrap">
                            {palestra.inscritos}/{palestra.vagas}
                          </span>
                        </div>
                      </div>
                      {percentual >= 90 && (
                        <Badge variant="destructive" className="text-xs">
                          Lotando
                        </Badge>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Lectures */}
        <Card className="backdrop-blur-sm bg-white/90 shadow-sm flex flex-col h-full">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-800">
              Palestras Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <div className="space-y-4">
              {recentPalestras.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhuma palestra cadastrada ainda.</p>
                  <p className="text-sm mt-1">
                    Crie dados de teste em Configurações.
                  </p>
                </div>
              ) : (
                recentPalestras.map((palestra) => {
                  const status = getLectureStatus(palestra);
                  return (
                    <div
                      key={palestra.id}
                      className="flex items-center justify-between p-3 sm:p-4 bg-slate-50/50 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 truncate">
                          {palestra.titulo}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {palestra.palestrante_nome ||
                            "Palestrante não informado"}{" "}
                          • {palestra.sala || "Sala não definida"} •{" "}
                          {new Date(
                            palestra.data_hora_inicio,
                          ).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        {status === "live" ? (
                          <Badge
                            variant="destructive"
                            className="animate-pulse"
                          >
                            AO VIVO
                          </Badge>
                        ) : status === "completed" ? (
                          <Badge variant="success">CONCLUÍDA</Badge>
                        ) : (
                          <Badge variant="secondary">EM BREVE</Badge>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Summary (Footer) */}
      <div className="bg-linear-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white shadow-lg">
        <h3 className="font-bold text-lg mb-4 opacity-90">Resumo do Sistema</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
          <div>
            <p className="opacity-75 mb-1">Total de Eventos</p>
            <p className="text-3xl font-bold tracking-tight">
              {stats?.eventos.total || 0}
            </p>
          </div>
          <div>
            <p className="opacity-75 mb-1">Presenças Hoje</p>
            <p className="text-3xl font-bold tracking-tight">
              {stats?.presencas_hoje || 0}
            </p>
          </div>
          <div>
            <p className="opacity-75 mb-1">Palestras</p>
            <p className="text-3xl font-bold tracking-tight">
              {stats?.palestras.total || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
