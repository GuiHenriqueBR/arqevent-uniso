import React, { useState, useEffect, useCallback, useRef } from "react";
import { X, Clock, MapPin, Award, RefreshCw } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { palestrasApi } from "../../../services/api";

// Tempo padrão de expiração do QR Code em segundos (1 minuto)
const DEFAULT_QR_EXPIRATION_SECONDS = 60;

// Tipo estendido para suportar os campos necessários do projetor
interface ProjectorLecture {
  id: string;
  titulo: string;
  evento_id: string;
  data_hora_inicio: string;
  data_hora_fim: string;
  sala?: string;
  palestrante_nome?: string;
  carga_horaria?: number;
  qr_code_hash?: string;
  qr_expiration_seconds?: number;
}

interface ProjectorViewProps {
  lecture: ProjectorLecture;
  onClose: () => void;
}

const ProjectorView: React.FC<ProjectorViewProps> = ({ lecture, onClose }) => {
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [qrData, setQrData] = useState<string>("");
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrCountdown, setQrCountdown] = useState<number>(
    lecture.qr_expiration_seconds || DEFAULT_QR_EXPIRATION_SECONDS,
  );
  const [isRegenerating, setIsRegenerating] = useState(false);
  const isRegeneratingRef = useRef(false);

  const expirationSeconds =
    lecture.qr_expiration_seconds || DEFAULT_QR_EXPIRATION_SECONDS;

  // Função para carregar o QR Code
  const loadQrCode = useCallback(async () => {
    try {
      setQrError(null);
      const qrInfo = await palestrasApi.getQrCode(lecture.id);
      setQrData(qrInfo.qr_data);
    } catch (err: any) {
      setQrError(err.message || "Erro ao carregar QR Code");
      setQrData(
        JSON.stringify({
          type: "PRESENCA_PALESTRA",
          palestra_id: lecture.id,
          titulo: lecture.titulo,
          hash: lecture.qr_code_hash || "",
        }),
      );
    }
  }, [lecture.id, lecture.titulo, lecture.qr_code_hash]);

  // Função para regenerar o QR Code
  const regenerateQrCode = useCallback(async () => {
    if (isRegeneratingRef.current) return;
    isRegeneratingRef.current = true;
    setIsRegenerating(true);
    try {
      const qrInfo = await palestrasApi.regenerateQrCode(lecture.id);
      setQrData(qrInfo.qr_data);
      setQrCountdown(expirationSeconds);
      setQrError(null);
    } catch (err: any) {
      setQrError("Erro ao regenerar QR Code");
      console.error("Erro regenerando QR:", err);
    } finally {
      isRegeneratingRef.current = false;
      setIsRegenerating(false);
    }
  }, [lecture.id, expirationSeconds]);

  // Carrega o QR Code inicial
  useEffect(() => {
    loadQrCode();
  }, [loadQrCode]);

  // Timer de countdown e regeneração automática
  useEffect(() => {
    const intervalId = setInterval(() => {
      setQrCountdown((prev) => {
        if (prev <= 1) {
          regenerateQrCode();
          return expirationSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [regenerateQrCode, expirationSeconds]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const endTime = new Date(lecture.data_hora_fim);
      const diff = endTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining("Encerrada");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}min`);
      } else {
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, "0")}`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [lecture.data_hora_fim]);

  return (
    <div className="fixed inset-0 bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 z-100 flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-8 sm:right-8 bg-white/10 hover:bg-white/20 text-white p-2 sm:p-3 rounded-full transition-colors backdrop-blur-sm group"
        title="Fechar modo projetor"
      >
        <X className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-90 transition-transform" />
      </button>

      <div className="max-w-5xl w-full flex flex-col items-center text-center space-y-6 sm:space-y-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2.5 bg-emerald-500/20 text-emerald-300 px-5 py-2.5 rounded-full text-sm sm:text-base font-medium mb-2 border border-emerald-500/20 backdrop-blur-md">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            Registro de Presença Ativo
          </div>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight text-balance leading-tight">
            {lecture.titulo}
          </h2>
          <p className="text-xl sm:text-2xl lg:text-3xl text-indigo-200 font-light">
            {lecture.palestrante_nome || "—"}
          </p>
        </div>

        <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-2xl shadow-indigo-500/20 relative mx-auto max-w-sm sm:max-w-md w-full aspect-square flex items-center justify-center group">
          <div className="absolute -inset-1 bg-linear-to-r from-indigo-500 to-purple-500 rounded-[26px] blur opacity-30 group-hover:opacity-60 transition duration-1000"></div>
          <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg shadow-indigo-600/30 whitespace-nowrap z-10">
            📱 Escaneie pelo App ArqEvent
          </div>
          <div className="relative bg-white p-4 rounded-2xl w-full h-full flex items-center justify-center">
            {qrData ? (
              <QRCodeSVG
                value={qrData}
                size={300}
                level="H"
                includeMargin={true}
                className="w-full h-full"
                imageSettings={{
                  src: "/favicon.ico",
                  x: undefined,
                  y: undefined,
                  height: 24,
                  width: 24,
                  excavate: true,
                }}
              />
            ) : (
              <div className="text-slate-400 text-sm">
                Carregando QR Code...
              </div>
            )}
          </div>
          {qrError && (
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-red-400 text-center whitespace-nowrap">
              {qrError}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 w-full max-w-5xl text-white/90 pt-8">
          <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl flex items-center justify-center gap-4 border border-white/10 hover:bg-white/10 transition-colors">
            <div className="bg-amber-500/20 p-3 rounded-xl">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
            <div className="text-left">
              <p className="text-sm text-white/50 font-medium">
                Tempo Restante
              </p>
              <span className="text-xl font-bold font-mono tracking-wide">
                {timeRemaining}
              </span>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl flex items-center justify-center gap-4 border border-white/10 hover:bg-white/10 transition-colors">
            <div className="bg-indigo-500/20 p-3 rounded-xl">
              <MapPin className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-sm text-white/50 font-medium">Localização</p>
              <span className="text-xl font-bold truncate block max-w-37.5">
                {lecture.sala || "Não definido"}
              </span>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl flex items-center justify-center gap-4 border border-white/10 hover:bg-white/10 transition-colors">
            <div className="bg-emerald-500/20 p-3 rounded-xl">
              <Award className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="text-left">
              <p className="text-sm text-white/50 font-medium">Certificação</p>
              <span className="text-xl font-bold">
                {lecture.carga_horaria || 2}h
              </span>
            </div>
          </div>
          <div
            className={`backdrop-blur-md p-5 rounded-2xl flex items-center justify-center gap-4 border transition-colors ${
              qrCountdown <= 10
                ? "bg-orange-500/10 border-orange-500/30"
                : "bg-white/5 border-white/10 hover:bg-white/10"
            }`}
          >
            <div
              className={`p-3 rounded-xl ${qrCountdown <= 10 ? "bg-orange-500/20" : "bg-purple-500/20"}`}
            >
              <RefreshCw
                className={`w-6 h-6 ${qrCountdown <= 10 ? "text-orange-400" : "text-purple-400"} ${isRegenerating ? "animate-spin" : ""}`}
              />
            </div>
            <div className="text-left">
              <p className="text-sm text-white/50 font-medium">Novo QR em</p>
              <span
                className={`text-xl font-bold font-mono tracking-wide ${qrCountdown <= 10 ? "text-orange-400" : ""}`}
              >
                {isRegenerating ? "..." : `${qrCountdown}s`}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-indigo-200/60 text-sm">
          <RefreshCw
            className={`w-4 h-4 ${isRegenerating ? "animate-spin" : ""}`}
          />
          <span>
            QR Code atualiza automaticamente a cada {expirationSeconds}s para
            maior segurança
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProjectorView;
