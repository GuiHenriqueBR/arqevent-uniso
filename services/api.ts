import { supabase } from "../supabaseClient";

// jsPDF é carregado dinamicamente nas funções que o utilizam para reduzir bundle inicial
type jsPDFType = import("jspdf").jsPDF;
const loadJsPDF = async (): Promise<typeof import("jspdf").jsPDF> => {
  const { jsPDF } = await import("jspdf");
  return jsPDF;
};

// =====================
// HELPER: Timeout para requisições
// =====================
const withTimeout = <T>(
  promise: PromiseLike<T>,
  ms: number = 15000,
): Promise<T> => {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(
      () =>
        reject(
          new Error(
            "Tempo limite excedido. Verifique sua conexão com a internet.",
          ),
        ),
      ms,
    ),
  );
  return Promise.race([Promise.resolve(promise), timeout]);
};

// =====================
// HELPER: Cache de getUser() para evitar chamadas redundantes (~50-150ms cada)
// =====================
let _cachedUser: any = null;
let _cacheTimestamp = 0;
const USER_CACHE_TTL = 60_000; // 1 minuto

const getCachedUser = async (): Promise<any> => {
  const now = Date.now();
  if (_cachedUser && now - _cacheTimestamp < USER_CACHE_TTL) {
    return _cachedUser;
  }
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw new Error("Erro de autenticação: " + error.message);
  if (!user) throw new Error("Usuário não autenticado");
  _cachedUser = user;
  _cacheTimestamp = now;
  return user;
};

// Invalidar cache no logout ou troca de sessão
supabase.auth.onAuthStateChange((event) => {
  if (
    event === "SIGNED_OUT" ||
    event === "TOKEN_REFRESHED" ||
    event === "SIGNED_IN"
  ) {
    _cachedUser = null;
    _cacheTimestamp = 0;
  }
});

// =====================
// TIPOS BASE
// =====================
export type StatusPresenca =
  | "INSCRITO"
  | "PRESENTE"
  | "AUSENTE"
  | "WALK_IN"
  | "ATRASADO"
  | "JUSTIFICADO";

export interface Usuario {
  id: string;
  ra?: string;
  nome: string;
  email: string;
  telefone?: string;
  semestre?: string;
  turno: "MANHA" | "NOITE";
  tipo: "ALUNO" | "ORGANIZADOR" | "PALESTRANTE" | "ADMIN";
  ativo: boolean;
  created_at: string;
}

export interface Evento {
  id: string;
  titulo: string;
  descricao?: string;
  data_inicio: string;
  data_fim: string;
  local?: string;
  banner_url?: string;
  banner_galeria?: string[] | null;
  destaque?: boolean;
  status_manual?: "AUTO" | "ABERTO" | "ENCERRADO" | "AO_VIVO";
  cta_label?: string;
  cta_sec_label?: string;
  cta_sec_url?: string;
  compartilhar_url?: string;
  carga_horaria_total: number;
  turno_permitido: "TODOS" | "MANHA" | "NOITE";
  vagas_totais: number;
  ativo: boolean;
  organizador_id?: string;
  created_at: string;
}

export interface Palestra {
  id: string;
  evento_id: string;
  titulo: string;
  descricao?: string;
  tipo?: "PALESTRA" | "ATIVIDADE";
  data_hora_inicio: string;
  data_hora_fim: string;
  sala?: string;
  vagas: number;
  carga_horaria: number;
  carga_horaria_minutos?: number;
  palestrante_id?: string;
  palestrante_nome?: string;
  qr_code_hash?: string;
  semestres_permitidos?: string | null;
  imagem_url?: string | null;
  created_at: string;
  palestrante?: { nome: string };
}

// Helper para formatar carga horária
export const formatCargaHoraria = (palestra: Palestra): string => {
  const minutos = palestra.carga_horaria_minutos ?? palestra.carga_horaria * 60;
  if (minutos < 60) {
    return `${minutos}min`;
  }
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
};

export const getCargaHorariaMinutos = (palestra: Palestra): number => {
  return palestra.carga_horaria_minutos ?? palestra.carga_horaria * 60;
};

export interface InscricaoEvento {
  id: string;
  usuario_id: string;
  evento_id: string;
  data_inscricao: string;
  status: "PENDENTE" | "CONFIRMADA" | "CANCELADA";
}

export interface InscricaoPalestra {
  id: string;
  usuario_id: string;
  palestra_id: string;
  data_inscricao: string;
  presente: boolean;
  data_presenca?: string;
  status_presenca?: StatusPresenca;
  is_walk_in?: boolean;
  status_fila?: "CONFIRMADO" | "LISTA_ESPERA" | "CANCELADO";
  posicao_fila?: number | null;
}

export interface Notificacao {
  id: string;
  usuario_id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  dados: Record<string, any>;
  created_at: string;
}

export interface TemplateNotificacao {
  id: string;
  tipo: string;
  titulo_template: string;
  mensagem_template: string;
  ativo: boolean;
  updated_at: string;
}

export interface Certificado {
  id: string;
  usuario_id: string;
  palestra_id?: string;
  evento_id?: string;
  codigo_verificacao: string;
  carga_horaria: number;
  pdf_url?: string;
  emitido_em: string;
  tipo: "PARTICIPACAO" | "PALESTRANTE";
}

// Helper to generate unique codes
const generateCode = () => {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CERT-${year}-${random}`;
};

const generateQrHash = () => {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

// Eventos API
export const eventosApi = {
  list: async (options?: { limit?: number; offset?: number }) => {
    const { limit = 50, offset = 0 } = options || {};

    const { data, error } = await supabase
      .from("eventos")
      .select("*, profiles:organizador_id(nome)")
      .eq("ativo", true)
      .order("data_inicio", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);
    return data || [];
  },

  get: async (id: string) => {
    const { data, error } = await supabase
      .from("eventos")
      .select("*, profiles:organizador_id(id, nome, email)")
      .eq("id", id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  create: async (evento: Partial<Evento>) => {
    console.log("[eventosApi.create] Iniciando criação de evento...");

    const user = await getCachedUser();

    console.log("[eventosApi.create] Usuário autenticado:", user.id);

    // Verificar o tipo do usuário no perfil
    const profileQuery = supabase
      .from("profiles")
      .select("tipo, nome")
      .eq("id", user.id)
      .single();
    const { data: profile, error: profileError } = await withTimeout(
      profileQuery,
      30000,
    );

    console.log(
      "[eventosApi.create] Perfil do usuário:",
      profile,
      profileError,
    );

    if (profileError) {
      console.warn(
        "[eventosApi.create] Erro ao buscar perfil (continuando):",
        profileError,
      );
    }

    if (profile && !["ADMIN", "ORGANIZADOR"].includes(profile.tipo)) {
      throw new Error(
        `Usuário sem permissão. Tipo atual: ${profile.tipo}. Necessário: ADMIN ou ORGANIZADOR`,
      );
    }

    console.log("[eventosApi.create] Dados do evento:", evento);

    const insertPromise = supabase
      .from("eventos")
      .insert({
        ...evento,
        organizador_id: user.id,
        ativo: true,
      })
      .select()
      .single();

    const { data, error } = await withTimeout(insertPromise, 45000);

    console.log("[eventosApi.create] Resposta:", { data, error });

    if (error) {
      console.error("[eventosApi.create] Erro ao criar:", error);
      throw new Error(error.message);
    }

    return data;
  },

  update: async (id: string, evento: Partial<Evento>) => {
    const { data, error } = await supabase
      .from("eventos")
      .update(evento)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase.from("eventos").delete().eq("id", id);

    if (error) throw new Error(error.message);
    return { success: true };
  },

  getInscritos: async (eventoId: string) => {
    const { data, error } = await supabase
      .from("inscricoes_evento")
      .select(
        "*, profiles:usuario_id(id, ra, nome, email, telefone, semestre, turno)",
      )
      .eq("evento_id", eventoId)
      .order("data_inscricao", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },
};

// Palestras API
export const palestrasApi = {
  list: async (options?: { limit?: number; offset?: number }) => {
    const { limit = 100, offset = 0 } = options || {};

    const { data, error } = await supabase
      .from("palestras")
      .select("*, profiles:palestrante_id(id, nome), eventos(titulo)")
      .order("data_hora_inicio", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);
    return data || [];
  },

  listByEvento: async (
    eventoId: string,
    options?: { limit?: number; offset?: number },
  ) => {
    const { limit = 100, offset = 0 } = options || {};

    const { data, error } = await supabase
      .from("palestras")
      .select("*, profiles:palestrante_id(id, nome)")
      .eq("evento_id", eventoId)
      .order("data_hora_inicio", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);
    return data || [];
  },

  get: async (id: string) => {
    const { data, error } = await supabase
      .from("palestras")
      .select("*, eventos(*), profiles:palestrante_id(id, nome, email)")
      .eq("id", id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  create: async (eventoId: string, palestra: Partial<Palestra>) => {
    console.log(
      "[API] palestrasApi.create - eventoId:",
      eventoId,
      "palestra:",
      palestra,
    );
    const qr_code_hash = generateQrHash();

    const insertData = {
      titulo: palestra.titulo,
      descricao: palestra.descricao || null,
      tipo: palestra.tipo || "PALESTRA",
      data_hora_inicio: palestra.data_hora_inicio,
      data_hora_fim: palestra.data_hora_fim,
      sala: palestra.sala || null,
      vagas: palestra.vagas || 50,
      carga_horaria: palestra.carga_horaria || 1,
      carga_horaria_minutos: palestra.carga_horaria_minutos || null,
      palestrante_id: palestra.palestrante_id || null,
      palestrante_nome: palestra.palestrante_nome || null,
      semestres_permitidos: palestra.semestres_permitidos || null,
      imagem_url: palestra.imagem_url || null,
      evento_id: eventoId,
      qr_code_hash,
    };
    console.log("[API] Dados para inserção:", insertData);

    const insertPromise = supabase
      .from("palestras")
      .insert(insertData)
      .select()
      .single();

    const { data, error } = await withTimeout(insertPromise, 15000);

    console.log("[API] Resultado do insert - data:", data, "error:", error);

    if (error) throw new Error(error.message);

    // Update evento carga horaria (não bloquear criação)
    updateEventoCargaHoraria(eventoId).catch(() => {});

    return data;
  },

  update: async (id: string, palestra: Partial<Palestra>) => {
    const updatePromise = supabase
      .from("palestras")
      .update(palestra)
      .eq("id", id)
      .select()
      .single();

    const { data, error } = await withTimeout(updatePromise, 15000);

    if (error) throw new Error(error.message);

    if (data?.evento_id) {
      updateEventoCargaHoraria(data.evento_id).catch(() => {});
    }

    return data;
  },

  delete: async (id: string) => {
    // Get evento_id first
    const getPromise = supabase
      .from("palestras")
      .select("evento_id")
      .eq("id", id)
      .single();

    const { data: palestra } = await withTimeout(getPromise, 15000);

    const deletePromise = supabase.from("palestras").delete().eq("id", id);
    const { error } = await withTimeout(deletePromise, 15000);

    if (error) throw new Error(error.message);

    if (palestra?.evento_id) {
      await updateEventoCargaHoraria(palestra.evento_id);
    }

    return { success: true };
  },

  getQrCode: async (id: string) => {
    const { data, error } = await supabase
      .from("palestras")
      .select(
        "id, titulo, evento_id, qr_code_hash, data_hora_inicio, data_hora_fim",
      )
      .eq("id", id)
      .single();

    if (error) throw new Error(error.message);

    const qrData = {
      type: "PRESENCA_PALESTRA",
      palestra_id: data.id,
      evento_id: data.evento_id,
      hash: data.qr_code_hash,
    };

    return {
      palestra_titulo: data.titulo,
      qr_data: JSON.stringify(qrData),
    };
  },

  getInscritos: async (palestraId: string) => {
    const { data, error } = await supabase
      .from("inscricoes_palestra")
      .select(
        "*, profiles:usuario_id(id, ra, nome, email, telefone, semestre, turno)",
      )
      .eq("palestra_id", palestraId)
      .order("data_inscricao", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },
};

// Helper function
async function updateEventoCargaHoraria(eventoId: string) {
  const listPromise = supabase
    .from("palestras")
    .select("carga_horaria, carga_horaria_minutos")
    .eq("evento_id", eventoId);

  const { data: palestras } = await withTimeout(listPromise, 15000);

  const totalMinutos = (palestras || []).reduce(
    (sum, p) => sum + (p.carga_horaria_minutos ?? (p.carga_horaria || 0) * 60),
    0,
  );

  const totalHoras = Math.ceil(totalMinutos / 60);

  const updatePromise = supabase
    .from("eventos")
    .update({ carga_horaria_total: totalHoras })
    .eq("id", eventoId);

  await withTimeout(updatePromise, 15000);
}

// Inscrições API
export const inscricoesApi = {
  inscreverEvento: async (eventoId: string) => {
    const user = await getCachedUser();

    // Check if already inscribed
    const { data: existing } = await supabase
      .from("inscricoes_evento")
      .select("id")
      .eq("usuario_id", user.id)
      .eq("evento_id", eventoId)
      .single();

    if (existing) throw new Error("Você já está inscrito neste evento");

    const { data, error } = await supabase
      .from("inscricoes_evento")
      .insert({
        usuario_id: user.id,
        evento_id: eventoId,
        status: "CONFIRMADA",
      })
      .select("*, eventos(*)")
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  cancelarEvento: async (eventoId: string) => {
    const user = await getCachedUser();

    // Delete event inscription
    const { error } = await supabase
      .from("inscricoes_evento")
      .delete()
      .eq("usuario_id", user.id)
      .eq("evento_id", eventoId);

    if (error) throw new Error(error.message);

    // Also delete all lecture inscriptions for this event
    const { data: palestras } = await supabase
      .from("palestras")
      .select("id")
      .eq("evento_id", eventoId);

    if (palestras && palestras.length > 0) {
      const palestraIds = palestras.map((p) => p.id);
      await supabase
        .from("inscricoes_palestra")
        .delete()
        .eq("usuario_id", user.id)
        .in("palestra_id", palestraIds);
    }

    return { success: true };
  },

  inscreverPalestra: async (palestraId: string) => {
    const user = await getCachedUser();

    // Usar função RPC atômica para evitar race conditions
    const { data, error } = await withTimeout(
      supabase.rpc("inscrever_palestra_atomico", {
        p_usuario_id: user.id,
        p_palestra_id: palestraId,
      }),
      30000, // 30 segundos para operações críticas
    );

    if (error) throw new Error(error.message);

    // A função RPC retorna um objeto JSONB com o resultado
    const resultado = data as {
      success: boolean;
      error?: string;
      inscricao_id?: string;
      status_fila?: string;
      posicao_fila?: number | null;
      palestra?: {
        id: string;
        titulo: string;
        data_hora_inicio: string;
        data_hora_fim: string;
        sala: string;
      };
      message?: string;
    };

    if (!resultado.success) {
      throw new Error(resultado.error || "Erro ao inscrever na palestra");
    }

    // Enviar notificação apropriada
    if (resultado.status_fila === "LISTA_ESPERA" && resultado.palestra) {
      await notificacoesApi
        .enviar(user.id, "lista_espera", {
          palestra_id: palestraId,
          palestra_titulo: resultado.palestra.titulo,
          posicao: resultado.posicao_fila,
          data: formatDate(resultado.palestra.data_hora_inicio),
          hora: formatTime(resultado.palestra.data_hora_inicio),
        })
        .catch(() => {});

      return {
        id: resultado.inscricao_id,
        palestra_id: palestraId,
        usuario_id: user.id,
        status_fila: resultado.status_fila,
        posicao_fila: resultado.posicao_fila,
        na_lista_espera: true,
        mensagem: resultado.message,
        palestras: resultado.palestra,
      };
    }

    if (resultado.palestra) {
      await notificacoesApi
        .enviar(user.id, "inscricao_confirmada", {
          palestra_id: palestraId,
          palestra_titulo: resultado.palestra.titulo,
          data: formatDate(resultado.palestra.data_hora_inicio),
          hora: formatTime(resultado.palestra.data_hora_inicio),
          local: resultado.palestra.sala || "A definir",
        })
        .catch(() => {});
    }

    return {
      id: resultado.inscricao_id,
      palestra_id: palestraId,
      usuario_id: user.id,
      status_fila: resultado.status_fila,
      posicao_fila: null,
      palestras: resultado.palestra,
    };
  },

  cancelarPalestra: async (palestraId: string) => {
    const user = await getCachedUser();

    const { error } = await supabase
      .from("inscricoes_palestra")
      .delete()
      .eq("usuario_id", user.id)
      .eq("palestra_id", palestraId);

    if (error) throw new Error(error.message);
    return { success: true };
  },

  getMinhasInscricoes: async () => {
    const user = await getCachedUser();

    const { data: eventosData } = await supabase
      .from("inscricoes_evento")
      .select("*, eventos(*)")
      .eq("usuario_id", user.id)
      .order("data_inscricao", { ascending: false });

    const { data: palestrasData } = await supabase
      .from("inscricoes_palestra")
      .select("*, palestras(*, profiles:palestrante_id(nome))")
      .eq("usuario_id", user.id)
      .order("data_inscricao", { ascending: false });

    return {
      eventos: eventosData || [],
      palestras: palestrasData || [],
    };
  },
};

// Presença API - Sistema Avançado com 4 Status
// Helper: auto-inscrever no evento se não estiver inscrito
const autoInscreverEvento = async (userId: string, eventoId: string) => {
  const { data: inscricaoEvento } = await supabase
    .from("inscricoes_evento")
    .select("id")
    .eq("usuario_id", userId)
    .eq("evento_id", eventoId)
    .maybeSingle();

  if (!inscricaoEvento) {
    await supabase
      .from("inscricoes_evento")
      .insert({
        usuario_id: userId,
        evento_id: eventoId,
        status: "CONFIRMADA",
      })
      .select()
      .single();
  }
};

export const presencaApi = {
  // Registrar presença via QR do projetor (suporta avulsos)
  registrar: async (palestraId: string, isWalkIn: boolean = false) => {
    const user = await getCachedUser();

    // Get palestra
    const { data: palestra } = await supabase
      .from("palestras")
      .select("*")
      .eq("id", palestraId)
      .single();

    if (!palestra) throw new Error("Palestra/Atividade não encontrada");

    // Check inscription
    let { data: inscricao } = await supabase
      .from("inscricoes_palestra")
      .select("*")
      .eq("usuario_id", user.id)
      .eq("palestra_id", palestraId)
      .single();

    if (!inscricao) {
      // Avulso: não estava inscrito, criar inscrição com status WALK_IN
      const { data: novaInscricao, error: inscricaoError } = await supabase
        .from("inscricoes_palestra")
        .insert({
          usuario_id: user.id,
          palestra_id: palestraId,
          presente: true,
          data_presenca: new Date().toISOString(),
          status_presenca: "WALK_IN",
          is_walk_in: true,
        })
        .select()
        .single();

      if (inscricaoError) throw new Error(inscricaoError.message);

      // Auto-inscrever no evento
      await autoInscreverEvento(user.id, palestra.evento_id).catch(() => {});

      // Enviar notificação de presença confirmada
      await notificacoesApi
        .enviar(user.id, "presenca_confirmada", {
          palestra_id: palestra.id,
          palestra_titulo: palestra.titulo,
          data: formatDate(palestra.data_hora_inicio),
          hora: formatTime(palestra.data_hora_inicio),
          local: palestra.sala || "Não definido",
        })
        .catch(() => {}); // Não falhar se notificação falhar

      return { success: true, palestra, isWalkIn: true, status: "WALK_IN" };
    }

    // Já tinha presença confirmada
    if (
      inscricao.presente ||
      inscricao.status_presenca === "PRESENTE" ||
      inscricao.status_presenca === "WALK_IN"
    ) {
      throw new Error("Presença já registrada anteriormente");
    }

    // Check time window (30 min tolerance)
    const now = new Date();
    const inicio = new Date(palestra.data_hora_inicio);
    const fim = new Date(palestra.data_hora_fim);
    inicio.setMinutes(inicio.getMinutes() - 30);
    fim.setMinutes(fim.getMinutes() + 30);

    if (now < inicio || now > fim) {
      throw new Error(
        "O QR Code só é válido durante o horário da palestra/atividade (30 min de tolerância)",
      );
    }

    // Register presence - alterar status para PRESENTE
    const { error } = await supabase
      .from("inscricoes_palestra")
      .update({
        presente: true,
        data_presenca: new Date().toISOString(),
        status_presenca: "PRESENTE",
      })
      .eq("id", inscricao.id);

    if (error) throw new Error(error.message);

    // Enviar notificação
    await notificacoesApi
      .enviar(user.id, "presenca_confirmada", {
        palestra_id: palestra.id,
        palestra_titulo: palestra.titulo,
        data: formatDate(palestra.data_hora_inicio),
        hora: formatTime(palestra.data_hora_inicio),
        local: palestra.sala || "Não definido",
      })
      .catch(() => {});

    // Auto-inscrever no evento caso não esteja
    await autoInscreverEvento(user.id, palestra.evento_id).catch(() => {});

    return { success: true, palestra, isWalkIn: false, status: "PRESENTE" };
  },

  validarQrCode: async (qr_hash: string, palestra_id: string) => {
    const user = await getCachedUser();

    // Get palestra
    const { data: palestra } = await supabase
      .from("palestras")
      .select("*")
      .eq("id", palestra_id)
      .single();

    if (!palestra) throw new Error("Palestra/Atividade não encontrada");

    // Validate hash
    if (palestra.qr_code_hash !== qr_hash) {
      throw new Error("QR Code inválido");
    }

    // Check inscription
    let { data: inscricao } = await supabase
      .from("inscricoes_palestra")
      .select("*")
      .eq("usuario_id", user.id)
      .eq("palestra_id", palestra_id)
      .single();

    // Se não existe inscrição, criar como avulso
    if (!inscricao) {
      return presencaApi.registrar(palestra_id, true);
    }

    if (
      inscricao.presente ||
      inscricao.status_presenca === "PRESENTE" ||
      inscricao.status_presenca === "WALK_IN"
    ) {
      throw new Error("Presença já registrada anteriormente");
    }

    // Check time window (30 min tolerance)
    const now = new Date();
    const inicio = new Date(palestra.data_hora_inicio);
    const fim = new Date(palestra.data_hora_fim);
    inicio.setMinutes(inicio.getMinutes() - 30);
    fim.setMinutes(fim.getMinutes() + 30);

    if (now < inicio || now > fim) {
      throw new Error(
        "QR Code só é válido durante o horário da palestra/atividade (30 min de tolerância)",
      );
    }

    // Register presence
    const { error } = await supabase
      .from("inscricoes_palestra")
      .update({
        presente: true,
        data_presenca: new Date().toISOString(),
        status_presenca: "PRESENTE",
      })
      .eq("id", inscricao.id);

    if (error) throw new Error(error.message);

    // Enviar notificação
    await notificacoesApi
      .enviar(user.id, "presenca_confirmada", {
        palestra_id: palestra.id,
        palestra_titulo: palestra.titulo,
        data: formatDate(palestra.data_hora_inicio),
        hora: formatTime(palestra.data_hora_inicio),
        local: palestra.sala || "Não definido",
      })
      .catch(() => {});

    // Auto-inscrever no evento caso não esteja
    await autoInscreverEvento(user.id, palestra.evento_id).catch(() => {});

    return {
      success: true,
      message: "Presença registrada com sucesso!",
      palestra: {
        titulo: palestra.titulo,
        carga_horaria: palestra.carga_horaria,
      },
    };
  },

  // Registrar presença manual (admin) para um aluno específico
  registrarPresencaManual: async (palestraId: string, alunoId: string) => {
    const user = await getCachedUser();

    // Buscar palestra
    const { data: palestra } = await supabase
      .from("palestras")
      .select("*")
      .eq("id", palestraId)
      .single();

    if (!palestra) throw new Error("Palestra/Atividade não encontrada");

    // Verificar se já existe inscrição
    const { data: inscricao } = await supabase
      .from("inscricoes_palestra")
      .select("*")
      .eq("usuario_id", alunoId)
      .eq("palestra_id", palestraId)
      .maybeSingle();

    if (inscricao) {
      // Já inscrito — verificar se já presente
      if (
        inscricao.status_presenca === "PRESENTE" ||
        inscricao.status_presenca === "WALK_IN"
      ) {
        throw new Error("Aluno já possui presença registrada nesta palestra");
      }
      // Atualizar para PRESENTE
      const { error } = await supabase
        .from("inscricoes_palestra")
        .update({
          presente: true,
          data_presenca: new Date().toISOString(),
          status_presenca: "PRESENTE",
          qr_validado_por: user.id,
        })
        .eq("id", inscricao.id);

      if (error) throw new Error(error.message);
    } else {
      // Criar inscrição avulsa com presença manual
      const { error } = await supabase.from("inscricoes_palestra").insert({
        usuario_id: alunoId,
        palestra_id: palestraId,
        presente: true,
        data_presenca: new Date().toISOString(),
        status_presenca: "PRESENTE",
        is_walk_in: true,
        qr_validado_por: user.id,
      });

      if (error) throw new Error(error.message);
    }

    // Auto-inscrever no evento
    await autoInscreverEvento(alunoId, palestra.evento_id).catch(() => {});

    // Enviar notificação ao aluno
    await notificacoesApi
      .enviar(alunoId, "presenca_confirmada", {
        palestra_id: palestra.id,
        palestra_titulo: palestra.titulo,
        data: formatDate(palestra.data_hora_inicio),
        hora: formatTime(palestra.data_hora_inicio),
        local: palestra.sala || "Não definido",
      })
      .catch(() => {});

    return { success: true };
  },

  // Obter presenças com estatísticas avançadas
  getPresencasPalestra: async (
    palestraId: string,
    filtroStatus?: StatusPresenca | "TODOS",
  ) => {
    const { data: palestra } = await supabase
      .from("palestras")
      .select("id, titulo, tempo_marcar_ausente")
      .eq("id", palestraId)
      .single();

    let query = supabase
      .from("inscricoes_palestra")
      .select("*, profiles:usuario_id(id, ra, nome, email, semestre, turno)")
      .eq("palestra_id", palestraId);

    // Aplicar filtro de status se especificado
    if (filtroStatus && filtroStatus !== "TODOS") {
      query = query.eq("status_presenca", filtroStatus);
    }

    const { data: inscricoes } = await query.order("data_inscricao", {
      ascending: false,
    });

    const total = inscricoes?.length || 0;
    const inscritos =
      inscricoes?.filter((i) => i.status_presenca === "INSCRITO").length || 0;
    const presentes =
      inscricoes?.filter((i) => i.status_presenca === "PRESENTE").length || 0;
    const ausentes =
      inscricoes?.filter((i) => i.status_presenca === "AUSENTE").length || 0;
    const walkIns =
      inscricoes?.filter((i) => i.status_presenca === "WALK_IN" || i.is_walk_in)
        .length || 0;

    return {
      palestra,
      estatisticas: {
        total_registros: total,
        inscritos_pendentes: inscritos, // Ainda não confirmaram presença
        presentes, // Inscritos que confirmaram presença
        ausentes, // Marcados como ausentes
        walk_ins: walkIns, // Avulsos: compareceram sem inscrição prévia
        total_compareceram: presentes + walkIns,
        percentual_presenca:
          inscritos + presentes + ausentes > 0
            ? Math.round(
                ((presentes + walkIns) /
                  (inscritos + presentes + ausentes + walkIns)) *
                  100,
              )
            : 0,
      },
      inscricoes: inscricoes || [],
    };
  },

  // Atualizar presença manualmente (admin)
  updatePresenca: async (inscricaoId: string, status: StatusPresenca) => {
    const user = await getCachedUser();

    const updateData: any = {
      status_presenca: status,
      qr_validado_por: user.id,
    };

    // Atualizar campo presente também para compatibilidade
    if (status === "PRESENTE" || status === "WALK_IN") {
      updateData.presente = true;
      updateData.data_presenca = new Date().toISOString();
    } else {
      updateData.presente = false;
      updateData.data_presenca = null;
    }

    const { data, error } = await supabase
      .from("inscricoes_palestra")
      .update(updateData)
      .eq("id", inscricaoId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Alias para compatibilidade com componentes antigos
  atualizarStatus: async (inscricaoId: string, status: StatusPresenca) => {
    return presencaApi.updatePresenca(inscricaoId, status);
  },

  // Marcar ausentes automaticamente para uma palestra
  marcarAusentes: async (palestraId: string) => {
    const { data, error } = await supabase.rpc("marcar_ausentes_palestra", {
      p_palestra_id: palestraId,
    });

    if (error) throw new Error(error.message);
    return data;
  },

  // Processar todas as palestras pendentes
  processarTodasAusentes: async () => {
    const { data, error } = await supabase.rpc(
      "processar_ausentes_todas_palestras",
    );

    if (error) throw new Error(error.message);
    return data;
  },

  // Exportar presenças para CSV
  exportarCSV: async (palestraId: string) => {
    const resultado = await presencaApi.getPresencasPalestra(palestraId);

    const headers = [
      "RA",
      "Nome",
      "Email",
      "Semestre",
      "Turno",
      "Status",
      "Data Inscrição",
      "Data Presença",
    ];
    const rows = resultado.inscricoes.map((i: any) => [
      i.profiles?.ra || "-",
      i.profiles?.nome || "-",
      i.profiles?.email || "-",
      i.profiles?.semestre || "-",
      i.profiles?.turno || "-",
      i.status_presenca || (i.presente ? "PRESENTE" : "INSCRITO"),
      formatDate(i.data_inscricao),
      i.data_presenca ? formatDate(i.data_presenca) : "-",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row: any) => row.map((cell: any) => `"${cell}"`).join(",")),
    ].join("\n");

    return {
      filename: `presencas_${resultado.palestra?.titulo?.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`,
      content: csvContent,
      estatisticas: resultado.estatisticas,
    };
  },
};

// Helper functions para formatação
function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("pt-BR");
}

function formatTime(dateStr: string): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Certificados API
export const certificadosApi = {
  list: async () => {
    const user = await getCachedUser();

    const { data, error } = await supabase
      .from("certificados")
      .select("*, palestras(titulo), eventos(titulo)")
      .eq("usuario_id", user.id)
      .order("emitido_em", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  get: async (id: string) => {
    const { data, error } = await supabase
      .from("certificados")
      .select(
        "*, profiles:usuario_id(nome, ra, email, semestre), palestras(titulo, data_hora_inicio), eventos(titulo, data_inicio, data_fim)",
      )
      .eq("id", id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  verificar: async (codigo: string) => {
    const { data } = await supabase
      .from("certificados")
      .select(
        "*, profiles:usuario_id(nome, ra), palestras(titulo), eventos(titulo, data_inicio, data_fim)",
      )
      .eq("codigo_verificacao", codigo)
      .single();

    if (!data) {
      return { valido: false, message: "Certificado não encontrado" };
    }

    return {
      valido: true,
      certificado: {
        codigo: data.codigo_verificacao,
        tipo: data.tipo,
        carga_horaria: data.carga_horaria,
        emitido_em: data.emitido_em,
        participante: data.profiles?.nome,
        ra: data.profiles?.ra,
        evento: data.eventos?.titulo,
        palestra: data.palestras?.titulo,
      },
    };
  },

  gerarPorEvento: async (eventoId: string) => {
    // Get all users who attended lectures
    const { data: presencas } = await supabase
      .from("inscricoes_palestra")
      .select("usuario_id, palestras!inner(id, evento_id, carga_horaria)")
      .eq("palestras.evento_id", eventoId)
      .eq("presente", true);

    if (!presencas || presencas.length === 0) {
      return { total_certificados_gerados: 0, certificados: [] };
    }

    // Group by user
    const userHours = new Map<string, number>();
    for (const p of presencas) {
      const current = userHours.get(p.usuario_id) || 0;
      userHours.set(
        p.usuario_id,
        current + ((p.palestras as any)?.carga_horaria || 0),
      );
    }

    const certificadosGerados = [];

    // Buscar TODOS os certificados existentes para este evento de uma vez (evita N+1)
    const userIds = Array.from(userHours.keys());
    const { data: existingCerts } = await supabase
      .from("certificados")
      .select("usuario_id")
      .eq("evento_id", eventoId)
      .eq("tipo", "PARTICIPACAO")
      .in("usuario_id", userIds);

    const usersWithCert = new Set(
      (existingCerts || []).map((c: any) => c.usuario_id),
    );

    // Gerar certificados apenas para quem ainda não tem
    const inserts = [];
    for (const [usuarioId, cargaHoraria] of userHours) {
      if (usersWithCert.has(usuarioId)) continue;
      inserts.push({
        usuario_id: usuarioId,
        evento_id: eventoId,
        codigo_verificacao: generateCode(),
        carga_horaria: cargaHoraria,
        tipo: "PARTICIPACAO",
      });
    }

    if (inserts.length > 0) {
      const { data: certs, error } = await supabase
        .from("certificados")
        .insert(inserts)
        .select("*, profiles:usuario_id(nome)");

      if (!error && certs) {
        for (const cert of certs) {
          certificadosGerados.push({
            certificado_id: cert.id,
            usuario: (cert as any).profiles?.nome,
            carga_horaria: cert.carga_horaria,
          });
        }
      }
    }

    return {
      total_certificados_gerados: certificadosGerados.length,
      certificados: certificadosGerados,
    };
  },
};

// Relatórios API
export const relatoriosApi = {
  getDashboard: async () => {
    try {
      // Fazer todas as consultas em paralelo
      const [
        eventosResult,
        eventosAtivosResult,
        usuariosResult,
        palestrasResult,
        certificadosResult,
        presencasResult,
      ] = await Promise.all([
        supabase.from("eventos").select("*", { count: "exact", head: true }),
        supabase
          .from("eventos")
          .select("*", { count: "exact", head: true })
          .eq("ativo", true),
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("tipo", "ALUNO"),
        supabase.from("palestras").select("*", { count: "exact", head: true }),
        supabase
          .from("certificados")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("inscricoes_palestra")
          .select("*", { count: "exact", head: true })
          .eq("presente", true),
      ]);

      return {
        eventos: {
          total: eventosResult.count || 0,
          ativos: eventosAtivosResult.count || 0,
        },
        usuarios: { total: usuariosResult.count || 0 },
        palestras: { total: palestrasResult.count || 0 },
        certificados: { total: certificadosResult.count || 0 },
        presencas_hoje: presencasResult.count || 0,
      };
    } catch (error) {
      console.error("Erro em getDashboard:", error);
      return {
        eventos: { total: 0, ativos: 0 },
        usuarios: { total: 0 },
        palestras: { total: 0 },
        certificados: { total: 0 },
        presencas_hoje: 0,
      };
    }
  },

  getEvento: async (eventoId: string) => {
    // Buscar evento, palestras, inscritos e certificados em paralelo
    const [eventoResult, palestrasResult, inscritoResult, certResult] =
      await Promise.all([
        supabase
          .from("eventos")
          .select("*, profiles:organizador_id(nome)")
          .eq("id", eventoId)
          .single(),
        supabase
          .from("palestras")
          .select("*, profiles:palestrante_id(nome)")
          .eq("evento_id", eventoId),
        supabase
          .from("inscricoes_evento")
          .select("*", { count: "exact", head: true })
          .eq("evento_id", eventoId),
        supabase
          .from("certificados")
          .select("*", { count: "exact", head: true })
          .eq("evento_id", eventoId),
      ]);

    const evento = eventoResult.data;
    const palestras = palestrasResult.data || [];
    const totalInscritos = inscritoResult.count;
    const totalCertificados = certResult.count;

    // Buscar TODAS as inscrições das palestras do evento em UMA query (evita N+1)
    const palestraIds = palestras.map((p: any) => p.id);
    let allInscricoes: any[] = [];
    if (palestraIds.length > 0) {
      const { data } = await supabase
        .from("inscricoes_palestra")
        .select("palestra_id, presente")
        .in("palestra_id", palestraIds);
      allInscricoes = data || [];
    }

    // Agrupar por palestra
    const inscricoesByPalestra = new Map<
      string,
      { total: number; presentes: number }
    >();
    for (const insc of allInscricoes) {
      const stats = inscricoesByPalestra.get(insc.palestra_id) || {
        total: 0,
        presentes: 0,
      };
      stats.total++;
      if (insc.presente) stats.presentes++;
      inscricoesByPalestra.set(insc.palestra_id, stats);
    }

    const palestrasStats = palestras.map((palestra: any) => {
      const stats = inscricoesByPalestra.get(palestra.id) || {
        total: 0,
        presentes: 0,
      };
      return {
        id: palestra.id,
        titulo: palestra.titulo,
        palestrante: palestra.profiles?.nome || "Não definido",
        data_hora: palestra.data_hora_inicio,
        sala: palestra.sala,
        vagas: palestra.vagas,
        inscritos: stats.total,
        presentes: stats.presentes,
        percentual_presenca:
          stats.total > 0
            ? Math.round((stats.presentes / stats.total) * 100)
            : 0,
      };
    });

    return {
      evento: {
        id: evento?.id,
        titulo: evento?.titulo,
        data_inicio: evento?.data_inicio,
        data_fim: evento?.data_fim,
        local: evento?.local,
        organizador: evento?.profiles?.nome,
        carga_horaria_total: evento?.carga_horaria_total,
      },
      estatisticas: {
        total_inscritos_evento: totalInscritos || 0,
        total_palestras: palestras?.length || 0,
        certificados_emitidos: totalCertificados || 0,
      },
      palestras: palestrasStats,
    };
  },

  getAluno: async (alunoId: string) => {
    const { data: aluno } = await supabase
      .from("profiles")
      .select("id, ra, nome, email, telefone, semestre, turno")
      .eq("id", alunoId)
      .single();

    const { data: certificados } = await supabase
      .from("certificados")
      .select("*, palestras(titulo), eventos(titulo)")
      .eq("usuario_id", alunoId);

    const { data: inscricoes } = await supabase
      .from("inscricoes_palestra")
      .select(
        "*, palestras(titulo, carga_horaria, profiles:palestrante_id(nome))",
      )
      .eq("usuario_id", alunoId);

    const totalPresente = inscricoes?.filter((i) => i.presente).length || 0;
    const cargaTotal =
      inscricoes
        ?.filter((i) => i.presente)
        .reduce(
          (sum, i) => sum + ((i.palestras as any)?.carga_horaria || 0),
          0,
        ) || 0;

    return {
      aluno,
      certificados: certificados || [],
      inscricoes: inscricoes || [],
      total_geral: {
        palestras_assistidas: totalPresente,
        carga_horaria_total: cargaTotal,
        certificados_emitidos: certificados?.length || 0,
      },
    };
  },

  getPalestra: async (palestraId: string) => {
    return presencaApi.getPresencasPalestra(palestraId);
  },

  // Dados de presença por dia da semana e turno para o gráfico
  getPresencaPorTurno: async () => {
    const defaultData = [
      { name: "Seg", manha: 0, noite: 0 },
      { name: "Ter", manha: 0, noite: 0 },
      { name: "Qua", manha: 0, noite: 0 },
      { name: "Qui", manha: 0, noite: 0 },
      { name: "Sex", manha: 0, noite: 0 },
    ];

    try {
      // Buscar todas as presenças com dados da palestra
      const { data: inscricoes, error } = await supabase
        .from("inscricoes_palestra")
        .select("presente, data_presenca, palestras(data_hora_inicio)")
        .eq("presente", true)
        .limit(1000); // Limitar para evitar timeout

      if (error) {
        console.error("Erro ao buscar presenças:", error);
        return defaultData;
      }

      if (!inscricoes || inscricoes.length === 0) {
        return defaultData;
      }

      // Inicializar contadores por dia da semana
      const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
      const contagem: Record<string, { manha: number; noite: number }> = {};
      diasSemana.forEach((dia) => {
        contagem[dia] = { manha: 0, noite: 0 };
      });

      // Agrupar por dia da semana e turno
      inscricoes.forEach((inscricao) => {
        const dataHora = (inscricao.palestras as any)?.data_hora_inicio;
        if (!dataHora) return;

        const data = new Date(dataHora);
        const diaSemana = diasSemana[data.getDay()];
        const hora = data.getHours();

        // Manhã: 6h às 12h, Noite: 18h às 22h
        if (hora >= 6 && hora < 13) {
          contagem[diaSemana].manha++;
        } else if (hora >= 17 && hora <= 23) {
          contagem[diaSemana].noite++;
        }
      });

      // Converter para array no formato do gráfico (apenas dias úteis)
      return ["Seg", "Ter", "Qua", "Qui", "Sex"].map((dia) => ({
        name: dia,
        manha: contagem[dia].manha,
        noite: contagem[dia].noite,
      }));
    } catch (error) {
      console.error("Erro em getPresencaPorTurno:", error);
      return defaultData;
    }
  },
};

// =====================
// AVISOS API
// =====================
export interface Aviso {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: "info" | "success" | "warning" | "error";
  imagem_url?: string | null;
  link_url?: string | null;
  criado_por?: string;
  ativo: boolean;
  created_at: string;
  profiles?: { nome: string };
}

export const avisosApi = {
  list: async () => {
    const { data, error } = await supabase
      .from("avisos")
      .select("*, profiles:criado_por(nome)")
      .eq("ativo", true)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  listAll: async () => {
    const { data, error } = await supabase
      .from("avisos")
      .select("*, profiles:criado_por(nome)")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  create: async (aviso: {
    titulo: string;
    mensagem: string;
    tipo: "info" | "success" | "warning" | "error";
    imagem_url?: string | null;
    link_url?: string | null;
    ativo?: boolean;
  }) => {
    const user = await getCachedUser();

    const { data, error } = await supabase
      .from("avisos")
      .insert({
        ...aviso,
        criado_por: user.id,
        ativo: true,
      })
      .select("*, profiles:criado_por(nome)")
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  update: async (id: string, aviso: Partial<Aviso>) => {
    const { data, error } = await supabase
      .from("avisos")
      .update(aviso)
      .eq("id", id)
      .select("*, profiles:criado_por(nome)")
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase.from("avisos").delete().eq("id", id);

    if (error) throw new Error(error.message);
    return { success: true };
  },

  toggleActive: async (id: string, ativo: boolean) => {
    const { data, error } = await supabase
      .from("avisos")
      .update({ ativo })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },
};

// =====================
// USUÁRIOS API (para listar alunos no admin)
// =====================
export const usuariosApi = {
  listAlunos: async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("tipo", "ALUNO")
      .order("nome", { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  },

  listPalestrantes: async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .in("tipo", ["PALESTRANTE", "ORGANIZADOR", "ADMIN"])
      .order("nome", { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  },

  listAll: async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("nome", { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  },

  get: async (id: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  update: async (id: string, updates: Partial<Usuario>) => {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  getStats: async (alunoId: string) => {
    const { data: inscricoesPalestra } = await supabase
      .from("inscricoes_palestra")
      .select("presente, status_presenca, palestras(carga_horaria)")
      .eq("usuario_id", alunoId);

    const { data: certificados } = await supabase
      .from("certificados")
      .select("id")
      .eq("usuario_id", alunoId);

    const presencas =
      inscricoesPalestra?.filter(
        (i: any) =>
          i.presente ||
          i.status_presenca === "PRESENTE" ||
          i.status_presenca === "WALK_IN" ||
          i.status_presenca === "ATRASADO",
      ).length || 0;
    const cargaHoraria =
      inscricoesPalestra
        ?.filter(
          (i: any) =>
            i.presente ||
            i.status_presenca === "PRESENTE" ||
            i.status_presenca === "WALK_IN" ||
            i.status_presenca === "ATRASADO",
        )
        .reduce(
          (sum, i) => sum + ((i.palestras as any)?.carga_horaria || 0),
          0,
        ) || 0;

    return {
      palestras_presentes: presencas,
      carga_horaria_total: cargaHoraria,
      certificados: certificados?.length || 0,
    };
  },

  // OTIMIZAÇÃO: Buscar stats de todos os alunos em 2 queries ao invés de N*2
  getStatsBatch: async (alunoIds: string[]) => {
    if (alunoIds.length === 0) return new Map();

    // Buscar todas as inscrições de palestras de uma vez
    const { data: todasInscricoes } = await supabase
      .from("inscricoes_palestra")
      .select("usuario_id, presente, status_presenca, palestras(carga_horaria)")
      .in("usuario_id", alunoIds);

    // Buscar todos os certificados de uma vez
    const { data: todosCertificados } = await supabase
      .from("certificados")
      .select("usuario_id, id")
      .in("usuario_id", alunoIds);

    // Agrupar por usuário em memória
    const statsMap = new Map<
      string,
      {
        palestras_presentes: number;
        total_inscricoes: number;
        carga_horaria_total: number;
        certificados: number;
      }
    >();

    // Inicializar todos os alunos com stats zerados
    for (const id of alunoIds) {
      statsMap.set(id, {
        palestras_presentes: 0,
        total_inscricoes: 0,
        carga_horaria_total: 0,
        certificados: 0,
      });
    }

    // Processar inscrições
    for (const insc of todasInscricoes || []) {
      const stats = statsMap.get(insc.usuario_id);
      if (stats) {
        stats.total_inscricoes++;
        const presente =
          insc.presente ||
          insc.status_presenca === "PRESENTE" ||
          insc.status_presenca === "WALK_IN" ||
          insc.status_presenca === "ATRASADO";

        if (presente) {
          stats.palestras_presentes++;
          stats.carga_horaria_total +=
            (insc.palestras as any)?.carga_horaria || 0;
        }
      }
    }

    // Processar certificados
    for (const cert of todosCertificados || []) {
      const stats = statsMap.get(cert.usuario_id);
      if (stats) {
        stats.certificados++;
      }
    }

    return statsMap;
  },

  getInscricoes: async (alunoId: string) => {
    // Buscar inscrições em eventos
    const { data: inscricoesEvento } = await supabase
      .from("inscricoes_evento")
      .select("*, eventos(id, titulo, data_inicio, data_fim)")
      .eq("usuario_id", alunoId)
      .order("data_inscricao", { ascending: false });

    // Buscar inscrições em palestras/atividades
    const { data: inscricoesPalestra } = await supabase
      .from("inscricoes_palestra")
      .select(
        "*, palestras(id, titulo, tipo, data_hora_inicio, data_hora_fim, sala, evento_id, eventos(titulo))",
      )
      .eq("usuario_id", alunoId)
      .order("data_inscricao", { ascending: false });

    return {
      eventos: inscricoesEvento || [],
      palestras: inscricoesPalestra || [],
    };
  },

  deleteAluno: async (alunoId: string) => {
    const { data, error } = await supabase.rpc("excluir_aluno", {
      p_aluno_id: alunoId,
    });

    if (error) throw new Error(error.message);

    const resultado = data as {
      success: boolean;
      error?: string;
      message?: string;
    };
    if (!resultado.success) {
      throw new Error(resultado.error || "Erro ao excluir aluno");
    }

    return resultado;
  },
};

// =====================
// CONFIGURAÇÕES API
// =====================
export interface Configuracao {
  id: string;
  chave: string;
  valor: string | null;
  descricao: string | null;
  updated_at: string;
}

export const configApi = {
  list: async () => {
    const { data, error } = await supabase
      .from("configuracoes")
      .select("*")
      .order("chave", { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  },

  get: async (chave: string) => {
    const { data, error } = await supabase
      .from("configuracoes")
      .select("*")
      .eq("chave", chave)
      .single();

    if (error) return null;
    return data?.valor;
  },

  set: async (chave: string, valor: string) => {
    const user = await getCachedUser();

    const { data, error } = await supabase
      .from("configuracoes")
      .upsert(
        {
          chave,
          valor,
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        },
        { onConflict: "chave" },
      )
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },
};

// =====================
// SISTEMA API (Reset e Manutenção)
// =====================
export const sistemaApi = {
  reset: async (manterAdmin: boolean = true) => {
    const { data, error } = await supabase.rpc("reset_sistema", {
      manter_admin: manterAdmin,
    });

    if (error) throw new Error(error.message);
    return data;
  },

  criarDadosExemplo: async () => {
    const { data, error } = await supabase.rpc("criar_dados_exemplo");

    if (error) throw new Error(error.message);
    return data;
  },
};

// =====================
// NOTIFICAÇÕES API
// =====================
export const notificacoesApi = {
  // Listar notificações do usuário logado
  list: async (apenasNaoLidas: boolean = false) => {
    const user = await getCachedUser();

    let query = supabase
      .from("notificacoes")
      .select("*")
      .eq("usuario_id", user.id)
      .order("created_at", { ascending: false });

    if (apenasNaoLidas) {
      query = query.eq("lida", false);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  },

  // Contar notificações não lidas
  contarNaoLidas: async () => {
    const user = await getCachedUser();

    const { count, error } = await supabase
      .from("notificacoes")
      .select("*", { count: "exact", head: true })
      .eq("usuario_id", user.id)
      .eq("lida", false);

    if (error) return 0;
    return count || 0;
  },

  // Marcar como lida
  marcarComoLida: async (notificacaoId: string) => {
    const { data, error } = await supabase
      .from("notificacoes")
      .update({ lida: true })
      .eq("id", notificacaoId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Marcar todas como lidas
  marcarTodasComoLidas: async () => {
    const user = await getCachedUser();

    const { error } = await supabase
      .from("notificacoes")
      .update({ lida: true })
      .eq("usuario_id", user.id)
      .eq("lida", false);

    if (error) throw new Error(error.message);
    return { success: true };
  },

  // Deletar notificação
  deletar: async (notificacaoId: string) => {
    const { error } = await supabase
      .from("notificacoes")
      .delete()
      .eq("id", notificacaoId);

    if (error) throw new Error(error.message);
    return { success: true };
  },

  // Limpar todas as notificações lidas
  limparLidas: async () => {
    const user = await getCachedUser();

    const { error } = await supabase
      .from("notificacoes")
      .delete()
      .eq("usuario_id", user.id)
      .eq("lida", true);

    if (error) throw new Error(error.message);
    return { success: true };
  },

  // Enviar notificação (usa template se disponível)
  enviar: async (
    usuarioId: string,
    tipo: string,
    dados: Record<string, any> = {},
  ) => {
    // Tentar usar a função do banco que aplica template
    const { data, error } = await supabase.rpc("enviar_notificacao", {
      p_usuario_id: usuarioId,
      p_tipo: tipo,
      p_dados: dados,
    });

    if (error) {
      // Fallback: inserir diretamente se a função não existir
      const { data: inserted, error: insertError } = await supabase
        .from("notificacoes")
        .insert({
          usuario_id: usuarioId,
          tipo,
          titulo: dados.titulo || tipo,
          mensagem: dados.mensagem || "",
          dados,
        })
        .select()
        .single();

      if (insertError) throw new Error(insertError.message);
      return inserted;
    }

    return data;
  },
};

// =====================
// TEMPLATES DE NOTIFICAÇÃO API (Admin)
// =====================
export const templatesApi = {
  list: async () => {
    const { data, error } = await supabase
      .from("templates_notificacao")
      .select("*")
      .order("tipo", { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  },

  get: async (tipo: string) => {
    const { data, error } = await supabase
      .from("templates_notificacao")
      .select("*")
      .eq("tipo", tipo)
      .single();

    if (error) return null;
    return data;
  },

  update: async (
    tipo: string,
    updates: {
      titulo_template?: string;
      mensagem_template?: string;
      ativo?: boolean;
    },
  ) => {
    const user = await getCachedUser();

    const { data, error } = await supabase
      .from("templates_notificacao")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq("tipo", tipo)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Criar um novo template (se necessário)
  create: async (template: {
    tipo: string;
    titulo_template: string;
    mensagem_template: string;
  }) => {
    const user = await getCachedUser();

    const { data, error } = await supabase
      .from("templates_notificacao")
      .insert({
        ...template,
        ativo: true,
        updated_by: user.id,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Variáveis disponíveis para templates
  getVariaveisDisponiveis: () => [
    {
      variavel: "{{palestra_titulo}}",
      descricao: "Título da palestra/atividade",
    },
    { variavel: "{{data}}", descricao: "Data da palestra/atividade" },
    { variavel: "{{hora}}", descricao: "Horário da palestra/atividade" },
    { variavel: "{{local}}", descricao: "Local/Sala da palestra/atividade" },
    { variavel: "{{aluno_nome}}", descricao: "Nome do aluno" },
  ],
};

// =====================
// COMPROVANTES PDF API
// =====================
export const comprovantesApi = {
  // Gerar comprovante de inscrição
  gerarInscricao: async (palestraId: string) => {
    const user = await getCachedUser();

    // Buscar dados do aluno
    const { data: aluno } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // Buscar dados da palestra
    const { data: palestra } = await supabase
      .from("palestras")
      .select("*, eventos(titulo)")
      .eq("id", palestraId)
      .single();

    // Buscar inscrição
    const { data: inscricao } = await supabase
      .from("inscricoes_palestra")
      .select("*")
      .eq("usuario_id", user.id)
      .eq("palestra_id", palestraId)
      .single();

    if (!inscricao) throw new Error("Inscrição não encontrada");

    // Buscar configurações de logo
    const logoUrl = await configApi.get("logo_principal");
    const nomeInstituicao =
      (await configApi.get("nome_instituicao")) ||
      "Universidade de Sorocaba - UNISO";

    // Gerar PDF (carregado dinamicamente)
    const jsPDF = await loadJsPDF();
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Configurar fonte
    doc.setFont("helvetica");

    // Header com logo placeholder
    doc.setFillColor(52, 73, 94);
    doc.rect(0, 0, 210, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text(nomeInstituicao, 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text("Comprovante de Inscrição", 105, 32, { align: "center" });

    // Conteúdo
    doc.setTextColor(0, 0, 0);

    // Título
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("COMPROVANTE DE INSCRIÇÃO", 105, 60, { align: "center" });

    // Dados do aluno
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    let y = 80;

    doc.setFont("helvetica", "bold");
    doc.text("Dados do Participante:", 20, y);
    doc.setFont("helvetica", "normal");
    y += 8;
    doc.text(`Nome: ${aluno?.nome || "-"}`, 25, y);
    y += 6;
    doc.text(`RA: ${aluno?.ra || "-"}`, 25, y);
    y += 6;
    doc.text(`Email: ${aluno?.email || "-"}`, 25, y);
    y += 6;
    doc.text(`Semestre: ${aluno?.semestre || "-"}`, 25, y);
    y += 6;
    doc.text(`Turno: ${aluno?.turno || "-"}`, 25, y);

    // Dados da palestra/atividade
    y += 15;
    doc.setFont("helvetica", "bold");
    doc.text("Dados da Palestra/Atividade:", 20, y);
    doc.setFont("helvetica", "normal");
    y += 8;
    doc.text(`Evento: ${(palestra as any)?.eventos?.titulo || "-"}`, 25, y);
    y += 6;
    doc.text(`Título: ${palestra?.titulo || "-"}`, 25, y);
    y += 6;
    doc.text(`Data: ${formatDate(palestra?.data_hora_inicio)}`, 25, y);
    y += 6;
    doc.text(
      `Horário: ${formatTime(palestra?.data_hora_inicio)} - ${formatTime(palestra?.data_hora_fim)}`,
      25,
      y,
    );
    y += 6;
    doc.text(`Local: ${palestra?.sala || "-"}`, 25, y);
    y += 6;
    doc.text(`Carga Horária: ${palestra?.carga_horaria || 0} hora(s)`, 25, y);

    // Informações da inscrição
    y += 15;
    doc.setFont("helvetica", "bold");
    doc.text("Informações da Inscrição:", 20, y);
    doc.setFont("helvetica", "normal");
    y += 8;
    doc.text(
      `Data de Inscrição: ${formatDate(inscricao.data_inscricao)} às ${formatTime(inscricao.data_inscricao)}`,
      25,
      y,
    );
    y += 6;
    doc.text(`Status: Inscrito - Aguardando Confirmação de Presença`, 25, y);

    // Aviso
    y += 20;
    doc.setFillColor(255, 243, 205);
    doc.rect(15, y - 5, 180, 25, "F");
    doc.setFontSize(10);
    doc.setTextColor(133, 100, 4);
    doc.text(
      "IMPORTANTE: Lembre-se de confirmar sua presença no dia do evento",
      105,
      y + 3,
      { align: "center" },
    );
    doc.text("escaneando o QR Code disponível no local.", 105, y + 10, {
      align: "center",
    });

    // Rodapé
    doc.setTextColor(128, 128, 128);
    doc.setFontSize(8);
    doc.text(
      `Documento gerado em ${new Date().toLocaleString("pt-BR")}`,
      105,
      280,
      { align: "center" },
    );
    doc.text(
      "Este documento é um comprovante de inscrição e não substitui a confirmação de presença.",
      105,
      285,
      { align: "center" },
    );

    // Retornar PDF como blob
    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);

    return {
      url: pdfUrl,
      filename: `comprovante_inscricao_${palestra?.titulo?.replace(/\s+/g, "_")}.pdf`,
      blob: pdfBlob,
    };
  },

  // Gerar comprovante de presença confirmada
  gerarPresenca: async (palestraId: string) => {
    const user = await getCachedUser();

    // Buscar dados do aluno
    const { data: aluno } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // Buscar dados da palestra
    const { data: palestra } = await supabase
      .from("palestras")
      .select("*, eventos(titulo)")
      .eq("id", palestraId)
      .single();

    // Buscar inscrição com presença
    const { data: inscricao } = await supabase
      .from("inscricoes_palestra")
      .select("*")
      .eq("usuario_id", user.id)
      .eq("palestra_id", palestraId)
      .single();

    if (!inscricao) throw new Error("Inscrição não encontrada");
    if (
      !inscricao.presente &&
      inscricao.status_presenca !== "PRESENTE" &&
      inscricao.status_presenca !== "WALK_IN"
    ) {
      throw new Error("Presença não confirmada");
    }

    // Buscar configurações
    const nomeInstituicao =
      (await configApi.get("nome_instituicao")) ||
      "Universidade de Sorocaba - UNISO";

    // Gerar PDF (carregado dinamicamente)
    const jsPDF = await loadJsPDF();
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Header
    doc.setFillColor(39, 174, 96);
    doc.rect(0, 0, 210, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text(nomeInstituicao, 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text("Comprovante de Participação", 105, 32, { align: "center" });

    // Conteúdo
    doc.setTextColor(0, 0, 0);

    // Título
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("COMPROVANTE DE PARTICIPAÇÃO", 105, 60, { align: "center" });

    // Badge de confirmado
    doc.setFillColor(39, 174, 96);
    doc.roundedRect(70, 65, 70, 12, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text("✓ PRESENÇA CONFIRMADA", 105, 73, { align: "center" });

    // Dados do aluno
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    let y = 95;

    doc.setFont("helvetica", "bold");
    doc.text("Dados do Participante:", 20, y);
    doc.setFont("helvetica", "normal");
    y += 8;
    doc.text(`Nome: ${aluno?.nome || "-"}`, 25, y);
    y += 6;
    doc.text(`RA: ${aluno?.ra || "-"}`, 25, y);
    y += 6;
    doc.text(`Email: ${aluno?.email || "-"}`, 25, y);
    y += 6;
    doc.text(`Semestre: ${aluno?.semestre || "-"}`, 25, y);

    // Dados da palestra/atividade
    y += 15;
    doc.setFont("helvetica", "bold");
    doc.text("Dados da Palestra/Atividade:", 20, y);
    doc.setFont("helvetica", "normal");
    y += 8;
    doc.text(`Evento: ${(palestra as any)?.eventos?.titulo || "-"}`, 25, y);
    y += 6;
    doc.text(`Título: ${palestra?.titulo || "-"}`, 25, y);
    y += 6;
    doc.text(`Data: ${formatDate(palestra?.data_hora_inicio)}`, 25, y);
    y += 6;
    doc.text(
      `Horário: ${formatTime(palestra?.data_hora_inicio)} - ${formatTime(palestra?.data_hora_fim)}`,
      25,
      y,
    );
    y += 6;
    doc.text(`Local: ${palestra?.sala || "-"}`, 25, y);
    y += 6;
    doc.text(`Carga Horária: ${palestra?.carga_horaria || 0} hora(s)`, 25, y);

    // Informações da presença
    y += 15;
    doc.setFont("helvetica", "bold");
    doc.text("Confirmação de Presença:", 20, y);
    doc.setFont("helvetica", "normal");
    y += 8;
    const statusLabel = inscricao.is_walk_in
      ? "Walk-in (Não inscrito previamente)"
      : "Presença Confirmada";
    doc.text(`Status: ${statusLabel}`, 25, y);
    y += 6;
    doc.text(
      `Data/Hora da Confirmação: ${inscricao.data_presenca ? formatDate(inscricao.data_presenca) + " às " + formatTime(inscricao.data_presenca) : "-"}`,
      25,
      y,
    );

    // Box de carga horária
    y += 20;
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(60, y, 90, 25, 3, 3, "F");
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Carga Horária Computada", 105, y + 10, { align: "center" });
    doc.setFontSize(16);
    doc.text(`${palestra?.carga_horaria || 0} hora(s)`, 105, y + 20, {
      align: "center",
    });

    // Rodapé
    doc.setTextColor(128, 128, 128);
    doc.setFontSize(8);
    doc.text(
      `Documento gerado em ${new Date().toLocaleString("pt-BR")}`,
      105,
      275,
      { align: "center" },
    );
    doc.text(
      "Este documento comprova a participação do aluno na atividade acima mencionada.",
      105,
      280,
      { align: "center" },
    );
    doc.text(
      `Código de verificação: ${inscricao.id.substring(0, 8).toUpperCase()}`,
      105,
      285,
      { align: "center" },
    );

    // Retornar PDF
    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);

    return {
      url: pdfUrl,
      filename: `comprovante_presenca_${palestra?.titulo?.replace(/\s+/g, "_")}.pdf`,
      blob: pdfBlob,
    };
  },

  // Gerar QR Code imprimível para uma palestra (Admin)
  gerarQRCodePDF: async (palestraId: string, qrCodeDataUrl: string) => {
    // Buscar dados da palestra
    const { data: palestra } = await supabase
      .from("palestras")
      .select("*, eventos(titulo)")
      .eq("id", palestraId)
      .single();

    if (!palestra) throw new Error("Palestra/Atividade não encontrada");

    // Buscar configurações
    const nomeInstituicao =
      (await configApi.get("nome_instituicao")) ||
      "Universidade de Sorocaba - UNISO";

    // Gerar PDF (carregado dinamicamente)
    const jsPDF = await loadJsPDF();
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Header
    doc.setFillColor(52, 73, 94);
    doc.rect(0, 0, 210, 35, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text(nomeInstituicao, 105, 15, { align: "center" });
    doc.setFontSize(11);
    doc.text("Sistema de Controle de Presença", 105, 27, { align: "center" });

    // Título da palestra
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("CONFIRME SUA PRESENÇA", 105, 50, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`${(palestra as any)?.eventos?.titulo || "Evento"}`, 105, 60, {
      align: "center",
    });

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    const titulo = palestra.titulo || "";
    // Quebrar título se muito longo
    const tituloLines = doc.splitTextToSize(titulo, 170);
    doc.text(tituloLines, 105, 72, { align: "center" });

    // QR Code (centralizado e grande)
    const qrSize = 100;
    const qrX = (210 - qrSize) / 2;
    const qrY = 90;

    if (qrCodeDataUrl) {
      doc.addImage(qrCodeDataUrl, "PNG", qrX, qrY, qrSize, qrSize);
    }

    // Instruções
    const yInstrucoes = qrY + qrSize + 15;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Escaneie o QR Code acima com seu celular", 105, yInstrucoes, {
      align: "center",
    });
    doc.text(
      "para confirmar sua presença na atividade.",
      105,
      yInstrucoes + 7,
      { align: "center" },
    );

    // Informações da palestra
    let y = yInstrucoes + 25;
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(20, y, 170, 40, 3, 3, "F");

    doc.setFontSize(10);
    y += 10;
    doc.text(`📅 Data: ${formatDate(palestra.data_hora_inicio)}`, 30, y);
    y += 8;
    doc.text(
      `🕐 Horário: ${formatTime(palestra.data_hora_inicio)} - ${formatTime(palestra.data_hora_fim)}`,
      30,
      y,
    );
    y += 8;
    doc.text(`📍 Local: ${palestra.sala || "A definir"}`, 30, y);
    y += 8;
    doc.text(`⏱️ Carga Horária: ${palestra.carga_horaria || 0} hora(s)`, 30, y);

    // Rodapé
    doc.setTextColor(128, 128, 128);
    doc.setFontSize(8);
    doc.text(
      "Não está inscrito? Escaneie o QR Code para se inscrever e confirmar presença automaticamente.",
      105,
      280,
      { align: "center" },
    );
    doc.text(`ID: ${palestraId.substring(0, 8).toUpperCase()}`, 105, 287, {
      align: "center",
    });

    // Retornar PDF
    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);

    return {
      url: pdfUrl,
      filename: `qrcode_presenca_${palestra?.titulo?.replace(/\s+/g, "_")}.pdf`,
      blob: pdfBlob,
    };
  },
};
