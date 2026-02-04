import React, { useEffect, useMemo, useState } from "react";
import { UserType, User } from "./types";
import StudentApp from "./components/StudentApp";
import AdminPanel from "./components/AdminPanel";
import AuthScreen from "./components/AuthScreen";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

interface ProfileRow {
  id: string;
  email: string | null;
  nome: string | null;
  ra: string | null;
  semestre: string | null;
  turno: string | null;
  tipo: UserType | null;
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<
    "signIn" | "signUp" | "forgot" | "updatePassword"
  >("signIn");

  const isRecovery = useMemo(() => {
    const hash = window.location.hash;
    return hash.includes("type=recovery");
  }, []);

  const mapProfileToUser = (profile: ProfileRow): User => ({
    id: profile.id,
    email: profile.email ?? "",
    nome: profile.nome ?? "Usuário",
    ra: profile.ra ?? undefined,
    semestre: profile.semestre ?? undefined,
    turno: (profile.turno as any) ?? undefined,
    tipo: profile.tipo ?? UserType.ALUNO,
  });

  const loadProfile = async (userId: string, email?: string | null) => {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id,email,nome,ra,semestre,turno,tipo")
      .eq("id", userId)
      .single();

    if (profile) {
      setCurrentUser(mapProfileToUser(profile as ProfileRow));
      return;
    }

    if (error && error.code !== "PGRST116") {
      console.error(error);
      return;
    }

    const { data: upserted, error: upsertError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: userId,
          email: email ?? null,
          nome: "Usuário",
          tipo: UserType.ALUNO,
        },
        { onConflict: "id" },
      )
      .select("id,email,nome,ra,semestre,turno,tipo")
      .single();

    if (upsertError) {
      console.error(upsertError);
      return;
    }

    if (upserted) {
      setCurrentUser(mapProfileToUser(upserted as ProfileRow));
    }
  };

  useEffect(() => {
    const init = async () => {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (session?.user?.id) {
        await loadProfile(session.user.id, session.user.email);
      }
      setLoading(false);
    };

    init();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isSupabaseConfigured) {
          setCurrentUser(null);
          setLoading(false);
          return;
        }

        setLoading(true);

        if (!session?.user?.id) {
          setCurrentUser(null);
          setLoading(false);
          return;
        }

        await loadProfile(session.user.id, session.user.email);
        setLoading(false);
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isRecovery) {
      setAuthMode("updatePassword");
    }
  }, [isRecovery]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Erro ao sair:", error);
    } finally {
      setCurrentUser(null);
      // Fallback para garantir limpeza de sessão visual
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
        Carregando...
      </div>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-lg text-center bg-white shadow-sm rounded-2xl p-6 border border-slate-200">
          <h1 className="text-lg font-semibold text-slate-800 mb-2">
            Configuração do Supabase ausente
          </h1>
          <p className="text-sm text-slate-600">
            Defina <strong>VITE_SUPABASE_URL</strong> e
            <strong> VITE_SUPABASE_ANON_KEY</strong> no ambiente de implantação
            para habilitar o login.
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen initialMode={authMode} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {currentUser.tipo === UserType.ALUNO ? (
        <StudentApp user={currentUser} onLogout={handleLogout} />
      ) : (
        <AdminPanel user={currentUser} onLogout={handleLogout} />
      )}
    </div>
  );
};

export default App;
