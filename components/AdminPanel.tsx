import React, { useState, useEffect, useMemo, Suspense, lazy } from "react";
import { User, Lecture } from "../types";
import {
  eventosApi,
  palestrasApi,
  relatoriosApi,
  presencaApi,
  avisosApi,
  sistemaApi,
  configApi,
  usuariosApi,
  Evento,
  Palestra,
  Aviso,
} from "../services/api";

// Layout
import AdminLayout from "./admin/layout/AdminLayout";

// Lazy load das Views para code-splitting
const DashboardView = lazy(() => import("./admin/views/DashboardView"));
const EventsView = lazy(() => import("./admin/views/EventsView"));
const StudentsView = lazy(() => import("./admin/views/StudentsView"));
const AnnouncementsView = lazy(() => import("./admin/views/AnnouncementsView"));
const SettingsView = lazy(() => import("./admin/views/SettingsView"));
const ProjectorView = lazy(() => import("./admin/views/ProjectorView"));

// Fallback de loading para views
const ViewLoadingFallback = () => (
  <div className="flex items-center justify-center h-64 text-slate-500">
    Carregando...
  </div>
);

// Modals
import EventModal from "./admin/modals/EventModal";
import LectureModal from "./admin/modals/LectureModal";
import PresencaModal from "./admin/modals/PresencaModal";
import LectureDetailsModal from "./admin/modals/LectureDetailsModal";

interface AdminPanelProps {
  user: User;
  onLogout: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ user, onLogout }) => {
  // Navigation State
  const [activeView, setActiveView] = useState<
    | "dashboard"
    | "events"
    | "students"
    | "announcements"
    | "settings"
    | "projector"
  >("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data State
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [palestras, setPalestras] = useState<Palestra[]>([]);
  const [palestrantes, setPalestrantes] = useState<any[]>([]);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [config, setConfig] = useState({
    nome_instituicao: "",
    nome_sistema: "",
    email_contato: "",
    ano_letivo: "",
  });

  // Loading States
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Filter States (Events View)
  const [eventsTab, setEventsTab] = useState<"eventos" | "palestras">(
    "eventos",
  );
  const [eventSearch, setEventSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("Todos");
  const [palestraEventoFilter, setPalestraEventoFilter] = useState("Todos");
  const [dateFilter, setDateFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");

  // Modal States
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isLectureModalOpen, setIsLectureModalOpen] = useState(false);
  const [isPresencaModalOpen, setIsPresencaModalOpen] = useState(false);
  const [isLectureDetailsOpen, setIsLectureDetailsOpen] = useState(false);

  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const [selectedPalestra, setSelectedPalestra] = useState<Palestra | null>(
    null,
  );
  const [defaultTipoPalestra, setDefaultTipoPalestra] = useState<
    "PALESTRA" | "ATIVIDADE"
  >("PALESTRA");
  const [selectedPalestraDetails, setSelectedPalestraDetails] =
    useState<Palestra | null>(null);
  const [projectorPalestra, setProjectorPalestra] = useState<Palestra | null>(
    null,
  );

  const [modalMode, setModalMode] = useState<"create" | "edit">("create");

  // Initial Data Load
  useEffect(() => {
    loadDashboard();
    loadEventsAndLectures();
    loadStudents(); // Can be optimized to load only when view is active, but kept simple
    loadAnnouncements();
    loadConfig();
    loadPalestrantes();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoadingDashboard(true);
      const [stats, presencaTurno] = await Promise.all([
        relatoriosApi.getDashboard(),
        relatoriosApi.getPresencaPorTurno(),
      ]);

      setDashboardStats({
        ...stats,
        presencaTurno,
      });
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoadingDashboard(false);
    }
  };

  const loadEventsAndLectures = async () => {
    try {
      setLoadingEvents(true);
      const [eventsData, lecturesData] = await Promise.all([
        eventosApi.list(),
        palestrasApi.list(),
      ]);
      setEventos(eventsData);
      setPalestras(lecturesData);
      setRecentActivity(lecturesData.slice(0, 5));
    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
    } finally {
      setLoadingEvents(false);
    }
  };

  const loadStudents = async () => {
    const timeoutId = window.setTimeout(() => {
      setLoadingStudents(false);
    }, 15000);

    try {
      setLoadingStudents(true);
      const data = await usuariosApi.listAlunos();

      // OTIMIZAÇÃO: Buscar stats de todos os alunos em UMA chamada batch
      // Antes: N chamadas para N alunos (N+1 problem)
      // Agora: 1 chamada para todos os alunos
      const alunoIds = data.map((aluno: any) => aluno.id);
      const statsMap = await usuariosApi.getStatsBatch(alunoIds);

      const alunosComStats = data.map((aluno: any) => {
        const stats = statsMap.get(aluno.id);
        if (!stats) return aluno;
        return {
          ...aluno,
          presenca: stats.palestras_presentes ? 100 : 0,
          totalPresencas: stats.palestras_presentes || 0,
          cargaHoraria: stats.carga_horaria_total || 0,
          certificados: stats.certificados || 0,
        };
      });

      setAlunos(alunosComStats);
    } catch (error) {
      console.error("Erro ao carregar alunos:", error);
    } finally {
      setLoadingStudents(false);
      window.clearTimeout(timeoutId);
    }
  };

  const loadAnnouncements = async () => {
    try {
      setLoadingAnnouncements(true);
      const data = await avisosApi.listAll();
      setAvisos(data);
    } catch (error) {
      console.error("Erro ao carregar avisos:", error);
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  const loadConfig = async () => {
    try {
      setLoadingConfig(true);
      const data = await configApi.list();
      const configMap: Record<string, string> = {};
      data.forEach((c: any) => {
        configMap[c.chave] = c.valor || "";
      });
      setConfig({
        nome_instituicao: configMap.nome_instituicao || "UNISO",
        nome_sistema: configMap.nome_sistema || "ArqEvent",
        email_contato: configMap.email_contato || "eventos@uniso.br",
        ano_letivo: configMap.ano_letivo || "2026",
      });
    } catch (error) {
      console.error("Erro ao carregar config:", error);
    } finally {
      setLoadingConfig(false);
    }
  };

  const loadPalestrantes = async () => {
    try {
      const data = await usuariosApi.listPalestrantes();
      setPalestrantes(data);
    } catch (error) {
      console.error("Erro ao carregar palestrantes:", error);
    }
  };

  // --- Filtering Logic (Migrated from original) ---

  const filteredEventos = useMemo(() => {
    return eventos.filter((evento) => {
      const matchesSearch =
        evento.titulo.toLowerCase().includes(eventSearch.toLowerCase()) ||
        (evento.local || "").toLowerCase().includes(eventSearch.toLowerCase());

      const matchesFilter =
        eventFilter === "Todos" ||
        (eventFilter === "Ativos" && evento.ativo) ||
        (eventFilter === "Inativos" && !evento.ativo);

      const matchesMonth =
        !monthFilter ||
        new Date(evento.data_inicio).getMonth() === parseInt(monthFilter);

      return matchesSearch && matchesFilter && matchesMonth;
    });
  }, [eventos, eventSearch, eventFilter, monthFilter]);

  const filteredPalestras = useMemo(() => {
    return palestras.filter((palestra) => {
      const matchesSearch =
        palestra.titulo.toLowerCase().includes(eventSearch.toLowerCase()) ||
        (palestra.sala || "").toLowerCase().includes(eventSearch.toLowerCase());

      const matchesEvento =
        palestraEventoFilter === "Todos" ||
        palestra.evento_id === palestraEventoFilter;

      const matchesDate =
        !dateFilter ||
        new Date(palestra.data_hora_inicio).toISOString().split("T")[0] ===
          dateFilter;

      const now = new Date();
      const inicio = new Date(palestra.data_hora_inicio);
      const fim = new Date(palestra.data_hora_fim);
      const status =
        now >= inicio && now <= fim
          ? "live"
          : now > fim
            ? "completed"
            : "upcoming";

      const matchesStatus =
        eventFilter === "Todos" ||
        (eventFilter === "Ao Vivo" && status === "live") ||
        (eventFilter === "Concluídas" && status === "completed") ||
        (eventFilter === "Em Breve" && status === "upcoming");

      // Note: reusing eventFilter for status here as in original code logic

      return matchesSearch && matchesEvento && matchesDate && matchesStatus;
    });
  }, [palestras, eventSearch, palestraEventoFilter, dateFilter, eventFilter]);

  // --- Event Handlers ---

  const handleCreateEvento = async (data: any) => {
    const novo = await eventosApi.create({
      ...data,
      data_inicio: new Date(data.data_inicio).toISOString(),
      data_fim: new Date(data.data_fim).toISOString(),
    });
    setEventos([...eventos, novo]);
  };

  const handleUpdateEvento = async (data: any) => {
    if (!selectedEvento) return;
    const updated = await eventosApi.update(selectedEvento.id, {
      ...data,
      data_inicio: new Date(data.data_inicio).toISOString(),
      data_fim: new Date(data.data_fim).toISOString(),
    });
    setEventos(eventos.map((e) => (e.id === updated.id ? updated : e)));
  };

  const handleDeleteEvento = async (id: string) => {
    if (window.confirm("Excluir evento e todas as palestras associadas?")) {
      await eventosApi.delete(id);
      setEventos(eventos.filter((e) => e.id !== id));
      setPalestras(palestras.filter((p) => p.evento_id !== id));
    }
  };

  const handleCreatePalestra = async (data: any) => {
    console.log("[DEBUG] handleCreatePalestra chamado com:", data);
    try {
      const payload = {
        titulo: data.titulo,
        descricao: data.descricao || null,
        tipo: data.tipo || "PALESTRA",
        data_hora_inicio: new Date(data.data_hora_inicio).toISOString(),
        data_hora_fim: new Date(data.data_hora_fim).toISOString(),
        sala: data.sala || null,
        vagas: data.vagas || 50,
        carga_horaria: data.carga_horaria || 1,
        carga_horaria_minutos: data.carga_horaria_minutos || null,
        palestrante_id: data.palestrante_id || null,
        palestrante_nome: data.palestrante_nome?.trim() || null,
        qr_expiration_seconds: data.qr_expiration_seconds || 60,
      };
      console.log("[DEBUG] Payload formatado:", payload);
      const nova = await palestrasApi.create(data.evento_id, payload);
      console.log("[DEBUG] Palestra criada com sucesso:", nova);
      setPalestras([...palestras, nova]);
    } catch (err: any) {
      console.error("[DEBUG] Erro ao criar palestra:", err);
      throw err;
    }
  };

  const handleUpdatePalestra = async (data: any) => {
    if (!selectedPalestra) return;
    const updated = await palestrasApi.update(selectedPalestra.id, {
      ...data,
      tipo: data.tipo || "PALESTRA",
      data_hora_inicio: new Date(data.data_hora_inicio).toISOString(),
      data_hora_fim: new Date(data.data_hora_fim).toISOString(),
      palestrante_id: data.palestrante_id || null,
      palestrante_nome: data.palestrante_nome?.trim() || null,
      carga_horaria_minutos: data.carga_horaria_minutos || null,
      qr_expiration_seconds: data.qr_expiration_seconds || 60,
    });
    setPalestras(palestras.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleDeletePalestra = async (id: string) => {
    if (window.confirm("Excluir palestra/atividade?")) {
      await palestrasApi.delete(id);
      setPalestras(palestras.filter((p) => p.id !== id));
    }
  };

  // --- Other Handlers ---

  const handleExportStudents = () => {
    // Simply csv export based on 'alunos' state
    const headers = [
      "Nome",
      "Email",
      "RA",
      "Semestre",
      "Turno",
      "Frequência",
      "Carga Horária",
    ];
    const rows = alunos.map((a) => [
      a.nome,
      a.email,
      a.ra,
      a.semestre,
      a.turno,
      `${a.presenca}%`,
      `${a.cargaHoraria}h`,
    ]);
    const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `alunos_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const handleCreateAnnouncement = async (data: any) => {
    const novo = await avisosApi.create(data);
    setAvisos([novo, ...avisos]);
  };

  const handleUpdateAnnouncement = async (id: string, data: any) => {
    const updated = await avisosApi.update(id, data);
    setAvisos(avisos.map((a) => (a.id === updated.id ? updated : a)));
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (window.confirm("Excluir aviso?")) {
      await avisosApi.delete(id);
      setAvisos(avisos.filter((a) => a.id !== id));
    }
  };

  const handleToggleAnnouncement = async (aviso: Aviso) => {
    const updated = await avisosApi.update(aviso.id, { ativo: !aviso.ativo });
    setAvisos(avisos.map((a) => (a.id === updated.id ? updated : a)));
  };

  // --- Render Views ---

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <DashboardView
            stats={dashboardStats}
            recentPalestras={recentActivity || []}
            isLoading={loadingDashboard}
            onNavigate={setActiveView}
          />
        );
      case "events":
        return (
          <EventsView
            eventos={eventos}
            palestras={palestras}
            loading={loadingEvents}
            filteredEventos={filteredEventos}
            filteredPalestras={filteredPalestras}
            eventsTab={eventsTab}
            setEventsTab={setEventsTab}
            search={eventSearch}
            setSearch={setEventSearch}
            eventFilter={eventFilter}
            setEventFilter={setEventFilter}
            palestraEventoFilter={palestraEventoFilter}
            setPalestraEventoFilter={setPalestraEventoFilter}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            monthFilter={monthFilter}
            setMonthFilter={setMonthFilter}
            onOpenCreateEvento={() => {
              setModalMode("create");
              setSelectedEvento(null);
              setIsEventModalOpen(true);
            }}
            onOpenEditEvento={(e) => {
              setModalMode("edit");
              setSelectedEvento(e);
              setIsEventModalOpen(true);
            }}
            onDeleteEvento={handleDeleteEvento}
            onOpenCreatePalestra={(tipo) => {
              setModalMode("create");
              setSelectedPalestra(null);
              setDefaultTipoPalestra(tipo || "PALESTRA");
              setIsLectureModalOpen(true);
            }}
            onOpenEditPalestra={(p) => {
              setModalMode("edit");
              setSelectedPalestra(p);
              setDefaultTipoPalestra(
                (p.tipo as "PALESTRA" | "ATIVIDADE") || "PALESTRA",
              );
              setIsLectureModalOpen(true);
            }}
            onDeletePalestra={handleDeletePalestra}
            onManagePresenca={(p) => {
              setSelectedPalestra(p);
              setIsPresencaModalOpen(true);
            }}
            onViewDetails={(p) => {
              setSelectedPalestraDetails(p);
              setIsLectureDetailsOpen(true);
            }}
            onProjectorView={(p) => {
              setProjectorPalestra(p);
              setActiveView("projector");
            }}
          />
        );
      case "projector":
        return projectorPalestra ? (
          <ProjectorView
            lecture={projectorPalestra}
            onClose={() => {
              setProjectorPalestra(null);
              setActiveView("events");
            }}
          />
        ) : null;
      case "students":
        return (
          <StudentsView
            alunos={alunos}
            loading={loadingStudents}
            onExportCSV={handleExportStudents}
            onRefresh={loadStudents}
          />
        );
      case "announcements":
        return (
          <AnnouncementsView
            avisos={avisos}
            loading={loadingAnnouncements}
            onCreate={handleCreateAnnouncement}
            onUpdate={handleUpdateAnnouncement}
            onDelete={handleDeleteAnnouncement}
            onToggleActive={handleToggleAnnouncement}
          />
        );
      case "settings":
        return (
          <SettingsView
            initialConfig={config}
            loading={loadingConfig}
            onSaveConfig={async (newConfig) => {
              await Promise.all([
                configApi.set("nome_instituicao", newConfig.nome_instituicao),
                configApi.set("nome_sistema", newConfig.nome_sistema),
                configApi.set("email_contato", newConfig.email_contato),
                configApi.set("ano_letivo", newConfig.ano_letivo),
              ]);
              setConfig(newConfig);
            }}
            onCreateTestData={async () => {
              await sistemaApi.criarDadosExemplo();
              window.location.reload(); // Simple reload to refresh everything
            }}
            onResetSystem={async () => {
              await sistemaApi.reset(true);
              window.location.reload();
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <AdminLayout
      user={user}
      activeView={activeView}
      setActiveView={setActiveView}
      onLogout={onLogout}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
      avisos={avisos}
    >
      <Suspense fallback={<ViewLoadingFallback />}>{renderContent()}</Suspense>

      {/* Modals */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onSubmit={
          modalMode === "create" ? handleCreateEvento : handleUpdateEvento
        }
        initialData={selectedEvento}
        mode={modalMode}
      />

      <LectureModal
        isOpen={isLectureModalOpen}
        onClose={() => setIsLectureModalOpen(false)}
        onSubmit={
          modalMode === "create" ? handleCreatePalestra : handleUpdatePalestra
        }
        initialData={selectedPalestra}
        mode={modalMode}
        eventos={eventos}
        palestrantes={palestrantes}
        defaultTipo={defaultTipoPalestra}
      />

      <PresencaModal
        isOpen={isPresencaModalOpen}
        onClose={() => setIsPresencaModalOpen(false)}
        palestra={selectedPalestra}
      />

      <LectureDetailsModal
        isOpen={isLectureDetailsOpen}
        onClose={() => setIsLectureDetailsOpen(false)}
        palestra={selectedPalestraDetails}
        eventos={eventos}
      />
    </AdminLayout>
  );
};

export default AdminPanel;
