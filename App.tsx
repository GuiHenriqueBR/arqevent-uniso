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

  // Timeout wrapper para evitar carregamento infinito
  const withTimeout = <T,>(
    promise: Promise<T>,
    ms: number = 10000,
  ): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), ms),
      ),
    ]);
  };

  const loadProfile = async (userId: string, email?: string | null) => {
    // Fallback user para garantir que sempre haja um usuário definido
    const fallbackUser: User = {
      id: userId,
      email: email ?? "",
      nome: "Usuário",
      tipo: UserType.ALUNO,
    };

    try {
      const { data: profile, error } = await withTimeout(
        supabase
          .from("profiles")
          .select("id,email,nome,ra,semestre,turno,tipo")
          .eq("id", userId)
          .single(),
      );

      if (profile) {
        setCurrentUser(mapProfileToUser(profile as ProfileRow));
        return;
      }

      if (error && error.code !== "PGRST116") {
        console.error("Erro ao carregar perfil:", error);
        setCurrentUser(fallbackUser);
        return;
      }

      // Perfil não existe, criar novo
      const { data: upserted, error: upsertError } = await withTimeout(
        supabase
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
          .single(),
      );

      if (upsertError) {
        console.error("Erro ao criar perfil:", upsertError);
        setCurrentUser(fallbackUser);
        return;
      }

      if (upserted) {
        setCurrentUser(mapProfileToUser(upserted as ProfileRow));
      } else {
        setCurrentUser(fallbackUser);
      }
    } catch (err) {
      console.error("Erro/timeout ao carregar perfil:", err);
      setCurrentUser(fallbackUser);
    }
  };

  useEffect(() => {
    let mounted = true;
    let initialLoadDone = false;

    const init = async () => {
      if (!isSupabaseConfigured) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        const { data } = await supabase.auth.getSession();
        const session = data.session;
        if (session?.user?.id && mounted) {
          await loadProfile(session.user.id, session.user.email);
        }
      } catch (err) {
        console.error("Erro ao obter sessão:", err);
      } finally {
        initialLoadDone = true;
        if (mounted) setLoading(false);
      }
    };

    init();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        // Ignorar eventos até init() terminar para evitar race condition
        if (!mounted || !initialLoadDone) return;

        if (!isSupabaseConfigured) {
          setCurrentUser(null);
          setLoading(false);
          return;
        }

        // Só mostra loading se ainda não temos usuário
        if (!currentUser) {
          setLoading(true);
        }

        if (!session?.user?.id) {
          setCurrentUser(null);
          setLoading(false);
          return;
        }

        await loadProfile(session.user.id, session.user.email);
        if (mounted) setLoading(false);
      },
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isRecovery) {
      setAuthMode("updatePassword");
    }
  }, [isRecovery]);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Erro ao sair:", error);
    } finally {
      setCurrentUser(null);
      setLoading(false);
      // Não fazemos reload - o listener de auth limpa naturalmente
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
