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
import { Calendar, Users, Award, GraduationCap, Loader2 } from "lucide-react";
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

  const statCards = [
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
      label: "Certificados Emitidos",
      value: stats?.certificados.total || 0,
      color: "border-l-4 border-orange-500",
      icon: Award,
      action: undefined,
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm">
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
          <div>
            <p className="opacity-75 mb-1">Certificados</p>
            <p className="text-3xl font-bold tracking-tight">
              {stats?.certificados.total || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
