import React, { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  QrCode,
  Camera,
  AlertCircle,
  X,
  Flashlight,
  FlashlightOff,
  CheckCircle2,
  XCircle,
  WifiOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TactileButton } from "../ui/TactileButton";

interface StudentScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  scanResult?: {
    success: boolean;
    message: string;
  } | null;
}

// Cache para modo offline
const OFFLINE_QUEUE_KEY = "arqevent_offline_scans";

const StudentScanner: React.FC<StudentScannerProps> = ({
  onScan,
  onClose,
  scanResult,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);

  // Verificar conexão de internet
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Carregar contagem da fila offline
    const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]");
    setOfflineQueueCount(queue.length);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Mostrar feedback quando scanResult mudar
  useEffect(() => {
    if (scanResult) {
      setShowFeedback(true);
      const timer = setTimeout(() => setShowFeedback(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [scanResult]);

  // Verificar suporte a lanterna
  const checkTorchSupport = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as any;
      const supported = capabilities?.torch === true;
      setTorchSupported(supported);
      videoTrackRef.current = track;
      return { stream, track, supported };
    } catch {
      setTorchSupported(false);
      return { stream: null, track: null, supported: false };
    }
  }, []);

  // Toggle da lanterna
  const toggleTorch = useCallback(async () => {
    if (!videoTrackRef.current) return;
    try {
      await videoTrackRef.current.applyConstraints({
        advanced: [{ torch: !torchOn } as any],
      });
      setTorchOn(!torchOn);
    } catch (err) {
      console.error("Erro ao alternar lanterna:", err);
    }
  }, [torchOn]);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      // Primeiro ativar para renderizar o div qr-reader
      setIsActive(true);
      
      // Aguardar próximo tick para o DOM atualizar
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("qr-reader");
      }

      const qrCodeSuccessCallback = async (decodedText: string) => {
        setIsActive(false);
        await stopCamera();

        // Se offline, salvar na fila
        if (!navigator.onLine) {
          const queue = JSON.parse(
            localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]",
          );
          queue.push({
            data: decodedText,
            timestamp: new Date().toISOString(),
          });
          localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
          setOfflineQueueCount(queue.length);
        }

        onScan(decodedText);
      };

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        config,
        qrCodeSuccessCallback,
        () => {}, // Ignore scan errors
      );

      // Verificar suporte a lanterna após iniciar
      await checkTorchSupport();
    } catch (err: any) {
      console.error("Erro ao iniciar câmera:", err);
      setIsActive(false);
      const errName = err?.name || err?.message || "unknown";
      const isPermission =
        errName === "NotAllowedError" ||
        errName === "PermissionDeniedError" ||
        errName === "NotFoundError";
      setError(
        isPermission
          ? "Permissão de câmera negada. Verifique as configurações."
          : "Erro ao iniciar câmera.",
      );
    }
  }, [onScan, checkTorchSupport]);

  const stopCamera = useCallback(async () => {
    try {
      // Desligar lanterna antes de parar
      if (torchOn && videoTrackRef.current) {
        try {
          await videoTrackRef.current.applyConstraints({
            advanced: [{ torch: false } as any],
          });
        } catch {}
      }
      setTorchOn(false);

      if (html5QrCodeRef.current) {
        const state = html5QrCodeRef.current.getState();
        if (state === 2) {
          // 2 = SCANNING
          await html5QrCodeRef.current.stop();
        }
      }
    } catch (err) {
      console.error("Erro ao parar câmera:", err);
    }
    setIsActive(false);
  }, [torchOn]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // We cannot async await inside cleanup, but we should try to stop if running
      if (html5QrCodeRef.current?.getState() === 2) {
        html5QrCodeRef.current.stop().catch(console.error);
      }
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="h-full flex flex-col bg-black relative rounded-xl overflow-hidden"
    >
      {/* Indicador de modo offline */}
      {!isOnline && (
        <div className="absolute top-4 left-4 right-4 z-20 bg-amber-500/90 text-amber-900 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
          <WifiOff className="w-4 h-4" />
          Modo Offline - Presenças serão sincronizadas depois
          {offlineQueueCount > 0 && (
            <span className="ml-auto bg-amber-600 text-white px-2 py-0.5 rounded-full text-xs">
              {offlineQueueCount} pendente{offlineQueueCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      {/* Feedback visual de sucesso/erro */}
      <AnimatePresence>
        {showFeedback && scanResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`absolute inset-0 z-30 flex flex-col items-center justify-center ${
              scanResult.success ? "bg-emerald-500/95" : "bg-red-500/95"
            }`}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 10, stiffness: 100 }}
            >
              {scanResult.success ? (
                <CheckCircle2 className="w-24 h-24 text-white mb-4" />
              ) : (
                <XCircle className="w-24 h-24 text-white mb-4" />
              )}
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold text-white text-center px-6"
            >
              {scanResult.success ? "Presença Confirmada!" : "Erro"}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-white/80 text-center mt-2 px-6"
            >
              {scanResult.message}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {!isActive ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50 h-full">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="bg-white p-6 rounded-full shadow-xl mb-8"
          >
            <QrCode className="w-16 h-16 text-indigo-600" />
          </motion.div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Leitor de Presença
          </h2>
          <p className="text-slate-500 mb-8 max-w-xs">
            Escaneie o QR Code projetado na sala para confirmar sua presença.
          </p>
          <TactileButton
            onClick={startCamera}
            size="lg"
            className="w-full max-w-xs flex items-center justify-center gap-2"
          >
            <Camera className="w-5 h-5" />
            Abrir Câmera
          </TactileButton>
        </div>
      ) : (
        <div className="flex-1 relative flex flex-col h-full">
          <div className="flex-1 bg-slate-900 relative overflow-hidden flex items-center justify-center">
            {error ? (
              <motion.div
                className="text-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, x: [0, -10, 10, -10, 10, 0] }}
                transition={{ x: { duration: 0.5 } }}
              >
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-2" />
                <p className="text-white">{error}</p>
                <button
                  onClick={startCamera}
                  className="mt-4 text-indigo-400 underline"
                >
                  Tentar novamente
                </button>
              </motion.div>
            ) : (
              <div className="w-full h-full flex items-center justify-center relative">
                <div
                  id="qr-reader"
                  className="w-full max-w-sm rounded-lg overflow-hidden border-2 border-indigo-500/50"
                ></div>

                {/* Botão de lanterna */}
                {torchSupported && (
                  <motion.button
                    onClick={toggleTorch}
                    className={`absolute top-4 right-4 p-3 rounded-full transition-colors ${
                      torchOn
                        ? "bg-yellow-500 text-slate-900"
                        : "bg-slate-700 text-white hover:bg-slate-600"
                    }`}
                    whileTap={{ scale: 0.9 }}
                    title={torchOn ? "Desligar lanterna" : "Ligar lanterna"}
                  >
                    {torchOn ? (
                      <Flashlight className="w-5 h-5" />
                    ) : (
                      <FlashlightOff className="w-5 h-5" />
                    )}
                  </motion.button>
                )}
              </div>
            )}
          </div>

          <div className="p-6 bg-black text-white space-y-3">
            <TactileButton
              variant="ghost"
              onClick={async () => {
                await stopCamera();
                onClose();
              }}
              className="w-full text-slate-400 hover:text-white justify-center"
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </TactileButton>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default StudentScanner;
