import React, { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { QrCode, Camera, AlertCircle, X, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TactileButton } from "../ui/TactileButton";

interface StudentScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  onSimulate?: () => void;
}

const StudentScanner: React.FC<StudentScannerProps> = ({
  onScan,
  onClose,
  onSimulate,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);

      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("qr-reader");
      }

      const qrCodeSuccessCallback = async (decodedText: string) => {
        setIsActive(false);
        await stopCamera();
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

      setIsActive(true);
    } catch (err: any) {
      console.error("Erro ao iniciar câmera:", err);
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
  }, [onScan]);

  const stopCamera = useCallback(async () => {
    try {
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
  }, []);

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
              <div className="text-center p-4">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-2" />
                <p className="text-white">{error}</p>
                <button
                  onClick={startCamera}
                  className="mt-4 text-indigo-400 underline"
                >
                  Tentar novamente
                </button>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div
                  id="qr-reader"
                  className="w-full max-w-sm rounded-lg overflow-hidden border-2 border-indigo-500/50"
                ></div>
              </div>
            )}
          </div>

          <div className="p-6 bg-black text-white space-y-3">
            {onSimulate && (
              <TactileButton
                variant="secondary"
                onClick={onSimulate}
                className="w-full bg-slate-800 text-white hover:bg-slate-700 border-none justify-center"
              >
                <Zap className="w-4 h-4 mr-2 text-yellow-400" />
                Simular Leitura
              </TactileButton>
            )}

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
