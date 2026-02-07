import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  Suspense,
  lazy,
} from "react";
import { UserType, User } from "./types";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

// Lazy load dos componentes principais para reduzir bundle inicial
const StudentApp = lazy(() => import("./components/StudentApp"));
const AdminPanel = lazy(() => import("./components/AdminPanel"));
const AuthScreen = lazy(() => import("./components/AuthScreen"));

// Componente de loading para Suspense
const LoadingFallback = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
    Carregando...
  </div>
);

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
  const currentUserRef = useRef<User | null>(null);

  const isRecovery = useMemo(() => {
    const hash = window.location.hash;
    return hash.includes("type=recovery");
  }, []);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

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
    let loadingGuardId: number | null = null;

    const init = async () => {
      if (!isSupabaseConfigured) {
        if (mounted) setLoading(false);
        return;
      }

      // Fallback para evitar loading infinito se a sessao travar
      loadingGuardId = window.setTimeout(() => {
        if (mounted) {
          console.warn("Timeout ao iniciar sessao. Continuando sem loading.");
          setLoading(false);
        }
      }, 12000);

      try {
        const { data } = await withTimeout(supabase.auth.getSession(), 10000);
        const session = data.session;
        if (session?.user?.id && mounted) {
          await loadProfile(session.user.id, session.user.email);
        }
      } catch (err) {
        console.error("Erro ao obter sessão:", err);
      } finally {
        initialLoadDone = true;
        if (loadingGuardId !== null) {
          window.clearTimeout(loadingGuardId);
          loadingGuardId = null;
        }
        if (mounted) setLoading(false);
      }
    };

    init();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Ignorar eventos até init() terminar para evitar race condition
        if (!mounted || !initialLoadDone) return;

        // Ignorar eventos de refresh de token - não precisam recarregar o perfil
        if (event === "TOKEN_REFRESHED") return;

        if (!isSupabaseConfigured) {
          setCurrentUser(null);
          setLoading(false);
          return;
        }

        // Só recarregar perfil em SIGNED_IN ou SIGNED_OUT
        if (event !== "SIGNED_IN" && event !== "SIGNED_OUT") return;

        const existingUser = currentUserRef.current;
        const sessionUserId = session?.user?.id ?? null;

        if (!sessionUserId) {
          setCurrentUser(null);
          setLoading(false);
          return;
        }

        // Se ja temos usuario, atualiza em background sem travar a UI
        if (existingUser && existingUser.id === sessionUserId) {
          loadProfile(sessionUserId, session?.user?.email).catch((err) => {
            console.error("Erro ao atualizar perfil em background:", err);
          });
          return;
        }

        setLoading(true);
        try {
          await loadProfile(sessionUserId, session?.user?.email);
        } finally {
          if (mounted) setLoading(false);
        }
      },
    );

    return () => {
      mounted = false;
      if (loadingGuardId !== null) {
        window.clearTimeout(loadingGuardId);
      }
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
    return (
      <Suspense fallback={<LoadingFallback />}>
        <AuthScreen initialMode={authMode} />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Suspense fallback={<LoadingFallback />}>
        {currentUser.tipo === UserType.ALUNO ? (
          <StudentApp user={currentUser} onLogout={handleLogout} />
        ) : (
          <AdminPanel user={currentUser} onLogout={handleLogout} />
        )}
      </Suspense>
    </div>
  );
};

export default App;
