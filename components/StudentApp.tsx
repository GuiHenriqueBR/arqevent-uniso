import React, { useState, useEffect, useRef } from "react";
import { User } from "../types";
import {
  eventosApi,
  palestrasApi,
  inscricoesApi,
  presencaApi,
  avisosApi,
  comprovantesApi,
  notificacoesApi,
  Evento,
  Palestra,
  Aviso,
  Notificacao,
} from "../services/api";
import {
  Home,
  QrCode,
  User as UserIcon,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  LogOut,
  RefreshCw,
  AlertCircle,
  X,
  Camera,
  Bell,
  Info,
  AlertTriangle,
  Download,
  FileText,
} from "lucide-react";

interface StudentAppProps {
  user: User;
  onLogout: () => void;
}

const StudentApp: React.FC<StudentAppProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<"home" | "scan" | "profile">(
    "home",
  );
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [palestrasEvento, setPalestrasEvento] = useState<Palestra[]>([]);
  const [eventoSelecionado, setEventoSelecionado] = useState<Evento | null>(
    null,
  );
  const [minhasInscricoes, setMinhasInscricoes] = useState<{
    eventos: any[];
    palestras: any[];
  }>({ eventos: [], palestras: [] });
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [dismissedAvisos, setDismissedAvisos] = useState<string[]>([]);

  // Notificações state
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [showNotificacoes, setShowNotificacoes] = useState(false);

  // QR Scanner
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
    loadNotificacoes();
  }, []);

  const loadNotificacoes = async () => {
    try {
      const [lista, count] = await Promise.all([
        notificacoesApi.list(),
        notificacoesApi.contarNaoLidas(),
      ]);
      setNotificacoes(lista);
      setNotificacoesNaoLidas(count);
    } catch (err) {
      console.error("Erro ao carregar notificações:", err);
    }
  };

  const handleMarcarNotificacaoLida = async (id: string) => {
    try {
      await notificacoesApi.marcarComoLida(id);
      setNotificacoes(
        notificacoes.map((n) => (n.id === id ? { ...n, lida: true } : n)),
      );
      setNotificacoesNaoLidas(Math.max(0, notificacoesNaoLidas - 1));
    } catch (err) {
      console.error("Erro ao marcar notificação:", err);
    }
  };

  const handleMarcarTodasLidas = async () => {
    try {
      await notificacoesApi.marcarTodasComoLidas();
      setNotificacoes(notificacoes.map((n) => ({ ...n, lida: true })));
      setNotificacoesNaoLidas(0);
    } catch (err) {
      console.error("Erro ao marcar notificações:", err);
    }
  };

  // Download comprovante PDF
  const handleDownloadComprovanteInscricao = async (palestraId: string) => {
    try {
      setScanResult({ success: true, message: "Gerando comprovante..." });
      const resultado = await comprovantesApi.gerarInscricao(palestraId);

      // Download automático
      const link = document.createElement("a");
      link.href = resultado.url;
      link.download = resultado.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setScanResult({ success: true, message: "📄 Comprovante baixado!" });
      setTimeout(() => setScanResult(null), 2000);
    } catch (err: any) {
      setScanResult({
        success: false,
        message: err.message || "Erro ao gerar comprovante",
      });
      setTimeout(() => setScanResult(null), 3000);
    }
  };

  const handleDownloadComprovantePresenca = async (palestraId: string) => {
    try {
      setScanResult({ success: true, message: "Gerando comprovante..." });
      const resultado = await comprovantesApi.gerarPresenca(palestraId);

      // Download automático
      const link = document.createElement("a");
      link.href = resultado.url;
      link.download = resultado.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setScanResult({
        success: true,
        message: "📄 Comprovante de presença baixado!",
      });
      setTimeout(() => setScanResult(null), 2000);
    } catch (err: any) {
      setScanResult({
        success: false,
        message: err.message || "Erro ao gerar comprovante",
      });
      setTimeout(() => setScanResult(null), 3000);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [eventosData, inscricoesData, avisosData] = await Promise.all([
        eventosApi.list(),
        inscricoesApi.getMinhasInscricoes(),
        avisosApi.list(), // já filtra apenas ativos
      ]);

      setEventos(eventosData);
      setMinhasInscricoes(inscricoesData);
      setAvisos(avisosData);

      // Load palestras for first event
      if (eventosData.length > 0) {
        setEventoSelecionado(eventosData[0]);
        const palestras = await palestrasApi.listByEvento(eventosData[0].id);
        setPalestrasEvento(palestras);
      }
    } catch (err: any) {
      setError(err.message || "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleInscreverEvento = async (eventoId: string) => {
    try {
      await inscricoesApi.inscreverEvento(eventoId);
      setScanResult({
        success: true,
        message: "Inscrição realizada com sucesso!",
      });
      setTimeout(() => setScanResult(null), 3000);
      loadData();
    } catch (err: any) {
      setScanResult({ success: false, message: err.message });
      setTimeout(() => setScanResult(null), 3000);
    }
  };

  const handleInscreverPalestra = async (palestraId: string) => {
    try {
      await inscricoesApi.inscreverPalestra(palestraId);
      setScanResult({
        success: true,
        message: "Inscrição na palestra/atividade realizada!",
      });
      setTimeout(() => setScanResult(null), 3000);
      await handleDownloadComprovanteInscricao(palestraId);
      loadData();
    } catch (err: any) {
      setScanResult({ success: false, message: err.message });
      setTimeout(() => setScanResult(null), 3000);
    }
  };

  // Camera functions
  const startCamera = async () => {
    try {
      setCameraError(null);
      setScanning(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      setCameraError(
        "Não foi possível acessar a câmera. Verifique as permissões.",
      );
      setScanning(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  };

  const handleQrCodeScan = async (qrData: string) => {
    try {
      const parsed = JSON.parse(qrData);

      // Suporta tanto o formato antigo quanto o novo
      if (parsed.type === "PRESENCA_PALESTRA" || parsed.type === "PRESENCA") {
        const palestraId = parsed.palestra_id || parsed.palestraId;

        // Se for o novo formato, usa diretamente a API de presença
        if (parsed.type === "PRESENCA") {
          await presencaApi.registrar(palestraId);
          setScanResult({
            success: true,
            message: `✅ Presença confirmada!\n${parsed.titulo || "Atividade registrada"}`,
          });
          await handleDownloadComprovantePresenca(palestraId);
        } else {
          const result = await presencaApi.validarQrCode(
            parsed.hash,
            palestraId,
          );
          setScanResult({
            success: true,
            message: `✅ Presença confirmada!\n${result.palestra.titulo}\n${result.palestra.carga_horaria}h`,
          });
          await handleDownloadComprovantePresenca(palestraId);
        }
        stopCamera();
        setShowScanner(false);
        loadData();
      } else {
        setScanResult({
          success: false,
          message: "❌ QR Code não reconhecido",
        });
      }
    } catch (err: any) {
      setScanResult({
        success: false,
        message: err.message || "❌ QR Code inválido",
      });
    }
    setTimeout(() => setScanResult(null), 4000);
  };

  // Simulated QR scan for testing
  const handleSimulateScan = async () => {
    if (palestrasEvento.length > 0) {
      // Find a palestra the user is inscribed but not present
      const inscritasPalestras = minhasInscricoes.palestras.filter(
        (p) => !p.presente,
      );

      if (inscritasPalestras.length > 0) {
        const palestra = inscritasPalestras[0];
        try {
          const qrInfo = await palestrasApi.getQrCode(palestra.palestra_id);
          const qrData = JSON.parse(qrInfo.qr_data);
          await handleQrCodeScan(JSON.stringify(qrData));
        } catch (err: any) {
          setScanResult({ success: false, message: err.message });
          setTimeout(() => setScanResult(null), 3000);
        }
      } else {
        setScanResult({
          success: false,
          message: "Inscreva-se em uma palestra/atividade primeiro",
        });
        setTimeout(() => setScanResult(null), 3000);
      }
    }
  };

  const isInscritoEvento = (eventoId: string) => {
    return minhasInscricoes.eventos.some((i) => i.evento_id === eventoId);
  };

  const isInscritoPalestra = (palestraId: string) => {
    return minhasInscricoes.palestras.some((i) => i.palestra_id === palestraId);
  };

  const presencaConfirmada = (palestraId: string) => {
    const inscricao = minhasInscricoes.palestras.find(
      (i) => i.palestra_id === palestraId,
    );
    return inscricao?.presente || false;
  };

  const renderHome = () => {
    if (loading) {
      return (
        <div className="pb-20 p-4 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-slate-500">Carregando eventos...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="pb-20 p-4">
          <div className="bg-red-50 text-red-700 p-4 rounded-xl text-center">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p>{error}</p>
            <button
              onClick={loadData}
              className="mt-4 bg-red-100 px-4 py-2 rounded-lg text-sm font-medium"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="pb-20 p-4 sm:p-6 space-y-4 sm:space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
              Olá, {user.nome.split(" ")[0]} 👋
            </h1>
            <p className="text-sm sm:text-base text-slate-500">
              Arquitetura • {user.semestre || "Aluno"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Botão de Notificações */}
            <button
              onClick={() => setShowNotificacoes(true)}
              className="relative bg-white p-2 rounded-full shadow-sm active:scale-95 transition-transform"
            >
              <Bell className="w-5 h-5 text-slate-400" />
              {notificacoesNaoLidas > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {notificacoesNaoLidas > 9 ? "9+" : notificacoesNaoLidas}
                </span>
              )}
            </button>
            <button
              onClick={loadData}
              className="bg-white p-2 rounded-full shadow-sm active:scale-95 transition-transform"
            >
              <RefreshCw className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Modal de Notificações */}
        {showNotificacoes && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center">
            <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[80vh] overflow-hidden animate-slide-up">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <h3 className="text-lg font-bold text-slate-800">
                  Notificações
                </h3>
                <div className="flex items-center gap-2">
                  {notificacoesNaoLidas > 0 && (
                    <button
                      onClick={handleMarcarTodasLidas}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      Marcar todas como lidas
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotificacoes(false)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto max-h-[60vh] p-4 space-y-3">
                {notificacoes.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">
                      Nenhuma notificação
                    </p>
                  </div>
                ) : (
                  notificacoes.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() =>
                        !notif.lida && handleMarcarNotificacaoLida(notif.id)
                      }
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        notif.lida
                          ? "bg-slate-50 border-slate-100"
                          : "bg-indigo-50 border-indigo-200 hover:bg-indigo-100"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-full ${
                            notif.tipo === "presenca_confirmada"
                              ? "bg-green-100"
                              : notif.tipo === "inscricao_confirmada"
                                ? "bg-blue-100"
                                : notif.tipo === "ausente_notificacao"
                                  ? "bg-orange-100"
                                  : "bg-slate-100"
                          }`}
                        >
                          {notif.tipo === "presenca_confirmada" ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : notif.tipo === "inscricao_confirmada" ? (
                            <Calendar className="w-4 h-4 text-blue-600" />
                          ) : notif.tipo === "ausente_notificacao" ? (
                            <AlertTriangle className="w-4 h-4 text-orange-600" />
                          ) : (
                            <Bell className="w-4 h-4 text-slate-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium ${notif.lida ? "text-slate-600" : "text-slate-800"}`}
                          >
                            {notif.titulo}
                          </p>
                          <p
                            className={`text-xs mt-1 ${notif.lida ? "text-slate-400" : "text-slate-600"}`}
                          >
                            {notif.mensagem}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-2">
                            {new Date(notif.created_at).toLocaleDateString(
                              "pt-BR",
                              {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </p>
                        </div>
                        {!notif.lida && (
                          <div className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Avisos Ativos */}
        {avisos.filter((a) => !dismissedAvisos.includes(a.id)).length > 0 && (
          <div className="space-y-3">
            {avisos
              .filter((a) => !dismissedAvisos.includes(a.id))
              .map((aviso) => {
                const getAvisoStyles = () => {
                  switch (aviso.tipo) {
                    case "success":
                      return {
                        bg: "bg-emerald-50",
                        border: "border-emerald-200",
                        text: "text-emerald-700",
                        icon: <CheckCircle className="w-5 h-5" />,
                      };
                    case "warning":
                      return {
                        bg: "bg-amber-50",
                        border: "border-amber-200",
                        text: "text-amber-700",
                        icon: <AlertTriangle className="w-5 h-5" />,
                      };
                    case "error":
                      return {
                        bg: "bg-red-50",
                        border: "border-red-200",
                        text: "text-red-700",
                        icon: <AlertCircle className="w-5 h-5" />,
                      };
                    default:
                      return {
                        bg: "bg-blue-50",
                        border: "border-blue-200",
                        text: "text-blue-700",
                        icon: <Info className="w-5 h-5" />,
                      };
                  }
                };
                const styles = getAvisoStyles();
                return (
                  <div
                    key={aviso.id}
                    className={`${styles.bg} ${styles.border} border rounded-xl p-4 relative`}
                  >
                    <button
                      onClick={() =>
                        setDismissedAvisos([...dismissedAvisos, aviso.id])
                      }
                      className={`absolute top-2 right-2 ${styles.text} opacity-60 hover:opacity-100`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="flex gap-3">
                      <div className={`${styles.text} flex-shrink-0`}>
                        {styles.icon}
                      </div>
                      <div className="flex-1 pr-6">
                        <h4 className={`font-semibold ${styles.text}`}>
                          {aviso.titulo}
                        </h4>
                        <p className={`text-sm mt-1 ${styles.text} opacity-90`}>
                          {aviso.mensagem}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Featured Event */}
        {eventoSelecionado && (
          <div className="bg-indigo-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-white opacity-10 rounded-full -mr-8 sm:-mr-10 -mt-8 sm:-mt-10"></div>
            <div className="relative z-10">
              <span className="bg-indigo-500/50 text-xs px-2 py-1 rounded-md mb-2 inline-block">
                {new Date(eventoSelecionado.data_inicio).toLocaleDateString(
                  "pt-BR",
                )}
              </span>
              <h2 className="text-lg sm:text-xl font-bold mb-1">
                {eventoSelecionado.titulo}
              </h2>
              <p className="text-indigo-100 text-xs sm:text-sm mb-4">
                {eventoSelecionado.local || "Local a definir"}
              </p>

              {!isInscritoEvento(eventoSelecionado.id) ? (
                <button
                  onClick={() => handleInscreverEvento(eventoSelecionado.id)}
                  className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-semibold text-sm w-full active:scale-[0.98] transition-transform"
                >
                  Inscrever-se no Evento
                </button>
              ) : (
                <div className="bg-white/20 text-white px-4 py-2 rounded-lg font-semibold text-sm w-full text-center flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Inscrito
                </div>
              )}
            </div>
          </div>
        )}

        {/* No events message */}
        {eventos.length === 0 && (
          <div className="bg-slate-100 rounded-xl p-6 text-center">
            <Calendar className="w-10 sm:w-12 h-10 sm:h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm sm:text-base">
              Nenhum evento disponível no momento
            </p>
          </div>
        )}

        {/* Palestras e Atividades */}
        {eventoSelecionado &&
          (() => {
            const palestras = palestrasEvento.filter(
              (p: any) => (p.tipo || "PALESTRA") === "PALESTRA",
            );
            const atividades = palestrasEvento.filter(
              (p: any) => (p.tipo || "PALESTRA") === "ATIVIDADE",
            );

            const renderLista = (lista: any[], titulo: string) => (
              <div className="space-y-3">
                <h3 className="text-base sm:text-lg font-bold text-slate-800">
                  {titulo} ({lista.length})
                </h3>
                {lista.length === 0 && (
                  <div className="bg-slate-50 p-6 rounded-xl text-center">
                    <Calendar className="w-8 sm:w-10 h-8 sm:h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm sm:text-base">
                      Nenhuma {titulo.toLowerCase()} cadastrada ainda
                    </p>
                  </div>
                )}
                {lista.map((palestra: any) => {
                  const inscrito = isInscritoPalestra(palestra.id);
                  const presente = presencaConfirmada(palestra.id);
                  const isPast = new Date(palestra.data_hora_fim) < new Date();

                  return (
                    <div
                      key={palestra.id}
                      className="bg-white p-3 sm:p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-2 sm:gap-3"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-800 text-sm sm:text-base truncate">
                            {palestra.titulo}
                          </h4>
                          <p className="text-xs sm:text-sm text-slate-500 truncate">
                            {palestra.palestrante_nome ||
                              (palestra as any).profiles?.nome ||
                              "Palestrante"}
                          </p>
                        </div>
                        {presente && (
                          <span className="bg-green-100 text-green-700 text-[10px] sm:text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 flex-shrink-0">
                            <CheckCircle className="w-3 h-3" /> Presente
                          </span>
                        )}
                        {inscrito && !presente && !isPast && (
                          <span className="bg-blue-100 text-blue-700 text-[10px] sm:text-xs px-2 py-1 rounded-full font-medium flex-shrink-0">
                            Inscrito
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 sm:gap-3 text-[10px] sm:text-xs text-slate-500 border-t border-slate-50 pt-2 sm:pt-3">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                          {new Date(
                            palestra.data_hora_inicio,
                          ).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                          {palestra.sala || "Sala TBD"}
                        </div>
                        <div className="flex items-center gap-1">
                          <Award className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                          {palestra.carga_horaria}h
                        </div>
                      </div>

                      {!isInscritoEvento(eventoSelecionado.id) ? (
                        <p className="text-[10px] sm:text-xs text-slate-400 text-center py-2 bg-slate-50 rounded-lg">
                          Inscreva-se no evento primeiro
                        </p>
                      ) : !inscrito ? (
                        <button
                          onClick={() => handleInscreverPalestra(palestra.id)}
                          className="w-full bg-indigo-50 text-indigo-600 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium hover:bg-indigo-100 active:scale-[0.98] transition-all"
                        >
                          Inscrever-se na {titulo.slice(0, -1)}
                        </button>
                      ) : !presente && !isPast ? (
                        <div className="flex gap-2">
                          <button
                            className="flex-1 bg-slate-800 text-white py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium hover:bg-slate-900 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            onClick={() => {
                              setActiveTab("scan");
                              setShowScanner(true);
                            }}
                          >
                            <QrCode className="w-4 h-4" />
                            Registrar Presença
                          </button>
                          <button
                            onClick={() =>
                              handleDownloadComprovanteInscricao(palestra.id)
                            }
                            className="bg-blue-50 text-blue-600 p-2 sm:p-2.5 rounded-lg hover:bg-blue-100 active:scale-[0.98] transition-all"
                            title="Baixar comprovante de inscrição"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      ) : presente ? (
                        <div className="flex gap-2">
                          <div className="flex-1 text-[10px] sm:text-xs text-green-600 text-center py-2 bg-green-50 rounded-lg flex items-center justify-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Presença Confirmada
                          </div>
                          <button
                            onClick={() =>
                              handleDownloadComprovantePresenca(palestra.id)
                            }
                            className="bg-green-100 text-green-700 p-2 sm:p-2.5 rounded-lg hover:bg-green-200 active:scale-[0.98] transition-all"
                            title="Baixar comprovante de presença"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </div>
                      ) : isPast && !presente ? (
                        <p className="text-[10px] sm:text-xs text-red-400 text-center py-2 bg-red-50 rounded-lg">
                          {titulo.slice(0, -1)} encerrada - presença não
                          registrada
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            );

            return (
              <div className="space-y-6">
                {renderLista(palestras, "Palestras")}
                {renderLista(atividades, "Atividades")}
              </div>
            );
          })()}
      </div>
    );
  };

  const renderScanner = () => (
    <div className="h-[calc(100vh-80px)] sm:h-[calc(100vh-120px)] flex flex-col bg-black relative">
      {!showScanner ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 text-center bg-slate-50">
          <div className="bg-white p-5 sm:p-6 rounded-full shadow-xl mb-6 sm:mb-8">
            <QrCode className="w-12 sm:w-16 h-12 sm:h-16 text-indigo-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">
            Leitor de Presença
          </h2>
          <p className="text-slate-500 mb-6 sm:mb-8 text-sm sm:text-base max-w-xs">
            Escaneie o QR Code projetado na sala para confirmar sua presença.
          </p>
          <button
            onClick={() => {
              setShowScanner(true);
              startCamera();
            }}
            className="bg-indigo-600 text-white w-full max-w-xs py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg shadow-lg hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Camera className="w-5 h-5" />
            Abrir Câmera
          </button>
        </div>
      ) : (
        <div className="flex-1 relative flex flex-col">
          {/* Camera/Video */}
          <div className="flex-1 bg-slate-800 relative overflow-hidden flex items-center justify-center">
            {cameraError ? (
              <div className="text-center p-4">
                <AlertCircle className="w-10 sm:w-12 h-10 sm:h-12 text-red-400 mx-auto mb-2" />
                <p className="text-white text-sm sm:text-base">{cameraError}</p>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-cover"
                  playsInline
                  muted
                />
                <div className="w-48 sm:w-64 h-48 sm:h-64 border-4 border-white/50 rounded-2xl sm:rounded-3xl relative z-10 flex items-center justify-center">
                  <div className="w-44 sm:w-60 h-44 sm:h-60 border-2 border-dashed border-white/30 rounded-xl sm:rounded-2xl animate-pulse"></div>
                  <div className="absolute -top-1 -left-1 w-6 sm:w-8 h-6 sm:h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl-lg sm:rounded-tl-xl"></div>
                  <div className="absolute -top-1 -right-1 w-6 sm:w-8 h-6 sm:h-8 border-t-4 border-r-4 border-indigo-500 rounded-tr-lg sm:rounded-tr-xl"></div>
                  <div className="absolute -bottom-1 -left-1 w-6 sm:w-8 h-6 sm:h-8 border-b-4 border-l-4 border-indigo-500 rounded-bl-lg sm:rounded-bl-xl"></div>
                  <div className="absolute -bottom-1 -right-1 w-6 sm:w-8 h-6 sm:h-8 border-b-4 border-r-4 border-indigo-500 rounded-br-lg sm:rounded-br-xl"></div>
                </div>
              </>
            )}
            <div className="absolute bottom-6 sm:bottom-10 left-0 right-0 text-center text-white/80 text-sm sm:text-base">
              Alinhe o QR Code dentro da moldura
            </div>
          </div>
          <div className="p-4 sm:p-6 bg-black text-white">
            <button
              onClick={handleSimulateScan}
              className="w-full bg-white text-black font-bold py-2.5 sm:py-3 rounded-xl mb-2 sm:mb-3 active:scale-[0.98] transition-transform"
            >
              ⚡ Simular Leitura (Teste)
            </button>
            <button
              onClick={() => {
                stopCamera();
                setShowScanner(false);
              }}
              className="w-full text-slate-400 py-2 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderProfile = () => (
    <div className="pb-20 p-4 sm:p-6">
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100 text-center mb-4 sm:mb-6">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-indigo-100 rounded-full mx-auto mb-3 sm:mb-4 flex items-center justify-center text-2xl sm:text-3xl font-bold text-indigo-600">
          {user.nome.charAt(0)}
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-800">
          {user.nome}
        </h2>
        <p className="text-slate-500 text-sm sm:text-base">{user.email}</p>
        <div className="mt-3 sm:mt-4 flex flex-wrap justify-center gap-2">
          {user.ra && (
            <span className="px-2 sm:px-3 py-1 bg-slate-100 rounded-full text-[10px] sm:text-xs font-medium text-slate-600">
              RA: {user.ra}
            </span>
          )}
          <span className="px-2 sm:px-3 py-1 bg-slate-100 rounded-full text-[10px] sm:text-xs font-medium text-slate-600">
            {user.turno}
          </span>
          {user.semestre && (
            <span className="px-2 sm:px-3 py-1 bg-slate-100 rounded-full text-[10px] sm:text-xs font-medium text-slate-600">
              {user.semestre}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="bg-white p-3 sm:p-4 rounded-xl text-center border border-slate-100">
          <p className="text-xl sm:text-2xl font-bold text-indigo-600">
            {minhasInscricoes.eventos.length}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-500">Eventos</p>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl text-center border border-slate-100">
          <p className="text-xl sm:text-2xl font-bold text-green-600">
            {minhasInscricoes.palestras.filter((p) => p.presente).length}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-500">Presenças</p>
        </div>
      </div>

      <button
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 py-2.5 sm:py-3 rounded-xl font-medium hover:bg-red-100 active:scale-[0.98] transition-all text-sm sm:text-base"
      >
        <LogOut className="w-4 h-4" />
        Sair da Conta
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans max-w-lg mx-auto shadow-2xl relative sm:rounded-xl sm:my-4 sm:max-h-[calc(100vh-2rem)] sm:overflow-hidden">
      {/* Result Modal */}
      {scanResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <div
            className={`bg-white rounded-2xl p-6 sm:p-8 text-center max-w-xs w-full animate-bounce-in ${
              scanResult.success ? "" : "border-2 border-red-200"
            }`}
          >
            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                scanResult.success ? "bg-green-100" : "bg-red-100"
              }`}
            >
              {scanResult.success ? (
                <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-green-600" />
              ) : (
                <AlertCircle className="w-7 h-7 sm:w-8 sm:h-8 text-red-600" />
              )}
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
              {scanResult.success ? "Sucesso!" : "Ops!"}
            </h3>
            <p className="text-slate-600 whitespace-pre-line text-sm sm:text-base">
              {scanResult.message}
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="min-h-screen sm:h-[calc(100vh-2rem)] sm:overflow-y-auto">
        {activeTab === "home" && renderHome()}
        {activeTab === "scan" && renderScanner()}
        {activeTab === "profile" && renderProfile()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t border-slate-200 px-4 sm:px-6 py-2 flex justify-between items-center z-40 pb-safe sm:rounded-b-xl">
        <button
          onClick={() => {
            setActiveTab("home");
            setShowScanner(false);
            stopCamera();
          }}
          className={`flex flex-col items-center p-2 rounded-lg transition-colors ${activeTab === "home" ? "text-indigo-600" : "text-slate-400"}`}
        >
          <Home className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-[10px] sm:text-xs font-medium mt-1">
            Início
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab("scan");
            setShowScanner(false);
          }}
          className={`flex flex-col items-center p-2 rounded-lg transition-colors ${activeTab === "scan" ? "text-indigo-600" : "text-slate-400"}`}
        >
          <div
            className={`rounded-full p-2.5 sm:p-3 -mt-6 sm:-mt-8 shadow-lg transition-all ${activeTab === "scan" ? "bg-indigo-600 text-white ring-4 ring-indigo-50" : "bg-slate-900 text-white"}`}
          >
            <QrCode className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <span className="text-[10px] sm:text-xs font-medium mt-1">
            Ler QR
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab("profile");
            setShowScanner(false);
            stopCamera();
          }}
          className={`flex flex-col items-center p-2 rounded-lg transition-colors ${activeTab === "profile" ? "text-indigo-600" : "text-slate-400"}`}
        >
          <UserIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-[10px] sm:text-xs font-medium mt-1">
            Perfil
          </span>
        </button>
      </nav>
    </div>
  );
};

export default StudentApp;
