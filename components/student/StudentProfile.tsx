import React, { useState } from "react";
import { User } from "../../types";
import { Edit, LogOut, Award, Calendar } from "lucide-react";
import ProfileEditModal from "./ProfileEditModal";
import { AnimatedCard } from "../ui/AnimatedCard";
import { TactileButton } from "../ui/TactileButton";

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

  return (
    <div className="pb-20 p-4 sm:p-6 space-y-6">
      <AnimatedCard className="p-6 text-center shadow-md">
        <div className="w-24 h-24 bg-indigo-100 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-indigo-600 shadow-inner">
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
          className="flex items-center justify-center gap-2 mx-auto bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-none"
        >
          <Edit className="w-4 h-4" />
          Editar Perfil
        </TactileButton>
      </AnimatedCard>

      <div className="grid grid-cols-2 gap-4">
        <AnimatedCard
          className="p-4 text-center border-none shadow-sm"
          disableHover
        >
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-indigo-600">
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
      </div>

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
