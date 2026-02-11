import React, { useState, useMemo } from "react";
import { User } from "../../types";
import {
  Edit,
  LogOut,
  Award,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Download,
} from "lucide-react";
import ProfileEditModal from "./ProfileEditModal";
import { AnimatedCard } from "../ui/AnimatedCard";
import { TactileButton } from "../ui/TactileButton";
import { getCargaHorariaMinutos } from "../../services/api";

// Helper para formatar minutos em formato legível
const formatMinutos = (minutos: number): string => {
  if (minutos < 60) return `${minutos}min`;
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
};

interface StudentProfileProps {
  user: User;
  minhasInscricoes: { eventos: any[]; palestras: any[] };
  onLogout: () => void;
  onUpdateUser: (updatedUser: Partial<User>) => void;
}

const StudentProfile: React.FC<StudentProfileProps> = ({
  user,
  minhasInscricoes,
  onLogout,
  onUpdateUser,
}) => {
  const [showEditRef, setShowEditRef] = useState(false);
  const [showHistorico, setShowHistorico] = useState(false);

  // Calcular carga horária acumulada (em minutos)
  const cargaHorariaAcumulada = useMemo(() => {
    const totalMinutos = minhasInscricoes.palestras
      .filter((p) => p.presente)
      .reduce(
        (total, p) =>
          total +
          (p.palestras?.carga_horaria_minutos ??
            (p.palestras?.carga_horaria || 1) * 60),
        0,
      );
    return totalMinutos;
  }, [minhasInscricoes.palestras]);

  // Carga horária formatada para exibição
  const cargaHorariaFormatada = useMemo(() => {
    return formatMinutos(cargaHorariaAcumulada);
  }, [cargaHorariaAcumulada]);

  // Palestras com presença confirmada
  const palestrasPresentes = useMemo(() => {
    return minhasInscricoes.palestras.filter((p) => p.presente);
  }, [minhasInscricoes.palestras]);

  return (
    <div className="pb-20 p-4 sm:p-6 space-y-6">
      <AnimatedCard className="p-6 text-center shadow-md">
        <div className="w-24 h-24 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-slate-800 shadow-inner">
          {user.nome.charAt(0)}
        </div>
        <h2 className="text-xl font-bold text-slate-800">{user.nome}</h2>
        <p className="text-slate-500 mb-4">{user.email}</p>

        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {user.ra && (
            <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-600 border border-slate-200">
              RA: {user.ra}
            </span>
          )}
          <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-600 border border-slate-200">
            {user.turno}
          </span>
          {user.semestre && (
            <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-600 border border-slate-200">
              {user.semestre}
            </span>
          )}
        </div>

        <TactileButton
          variant="secondary"
          onClick={() => setShowEditRef(true)}
          className="flex items-center justify-center gap-2 mx-auto bg-slate-100 text-slate-700 hover:bg-slate-200 border-none"
        >
          <Edit className="w-4 h-4" />
          Editar Perfil
        </TactileButton>
      </AnimatedCard>

      <div className="grid grid-cols-3 gap-3">
        <AnimatedCard
          className="p-4 text-center border-none shadow-sm"
          disableHover
        >
          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Calendar className="w-5 h-5 text-slate-700" />
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {minhasInscricoes.eventos.length}
          </p>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
            Eventos
          </p>
        </AnimatedCard>

        <AnimatedCard
          className="p-4 text-center border-none shadow-sm"
          disableHover
        >
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Award className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600">
            {minhasInscricoes.palestras.filter((p) => p.presente).length}
          </p>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
            Presenças
          </p>
        </AnimatedCard>

        <AnimatedCard
          className="p-4 text-center border-none shadow-sm"
          disableHover
        >
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-600">
            {cargaHorariaFormatada}
          </p>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
            Carga Horária
          </p>
        </AnimatedCard>
      </div>

      {/* Histórico de Presenças */}
      <AnimatedCard className="shadow-sm overflow-hidden" disableHover>
        <button
          onClick={() => setShowHistorico(!showHistorico)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">
                Histórico de Presenças
              </h3>
              <p className="text-xs text-slate-500">
                {palestrasPresentes.length} presença
                {palestrasPresentes.length !== 1 ? "s" : ""} confirmada
                {palestrasPresentes.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          {showHistorico ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {showHistorico && (
          <div className="border-t border-slate-100">
            {palestrasPresentes.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                <XCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>Nenhuma presença confirmada ainda.</p>
                <p className="text-sm mt-1">
                  Escaneie QR Codes nas palestras para registrar sua presença.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {palestrasPresentes.map((palestra: any) => (
                  <div
                    key={palestra.id}
                    className="p-4 flex items-center gap-3 hover:bg-slate-50"
                  >
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate text-sm">
                        {palestra.titulo ||
                          palestra.palestras?.titulo ||
                          "Palestra"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {palestra.data_presenca
                          ? new Date(palestra.data_presenca).toLocaleDateString(
                              "pt-BR",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )
                          : "Data não registrada"}
                        {" • "}
                        {formatMinutos(
                          palestra.palestras?.carga_horaria_minutos ??
                            (palestra.palestras?.carga_horaria || 1) * 60,
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </AnimatedCard>

      <TactileButton
        variant="danger"
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 py-3"
      >
        <LogOut className="w-4 h-4" />
        Sair da Conta
      </TactileButton>

      <ProfileEditModal
        isOpen={showEditRef}
        onClose={() => setShowEditRef(false)}
        user={user as any}
        onSave={(updated) => {
          onUpdateUser(updated);
          setShowEditRef(false);
        }}
      />
    </div>
  );
};

export default StudentProfile;
