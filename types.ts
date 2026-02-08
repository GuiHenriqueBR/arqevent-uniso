export enum UserType {
  ALUNO = "ALUNO",
  ORGANIZADOR = "ORGANIZADOR",
  PALESTRANTE = "PALESTRANTE",
  ADMIN = "ADMIN",
}

export enum Turno {
  MANHA = "MANHA",
  NOITE = "NOITE",
}

export interface User {
  id: string;
  ra?: string;
  nome: string;
  email: string;
  semestre?: string;
  turno?: Turno;
  tipo: UserType;
}

export interface Event {
  id: string;
  titulo: string;
  descricao: string;
  data_inicio: string;
  data_fim: string;
  local: string;
  banner_url: string;
  banner_galeria?: string[] | null;
  destaque?: boolean;
  status_manual?: "AUTO" | "ABERTO" | "ENCERRADO" | "AO_VIVO";
  cta_label?: string;
  cta_sec_label?: string;
  cta_sec_url?: string;
  compartilhar_url?: string;
  carga_horaria_total: number;
  ativo: boolean;
}

export interface Lecture {
  id: string;
  evento_id: string;
  titulo: string;
  descricao: string;
  tipo?: "PALESTRA" | "ATIVIDADE";
  data_hora_inicio: string;
  data_hora_fim: string;
  sala: string;
  palestrante_nome?: string;
  qr_code_hash?: string;
  semestres_permitidos?: string | null;
  status: "upcoming" | "live" | "completed";
}

export interface Certificate {
  id: string;
  codigo_verificacao: string;
  titulo_evento: string;
  carga_horaria: number;
  emitido_em: string;
}

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

export interface Registration {
  id: string;
  lecture_id: string;
  presente: boolean;
}
