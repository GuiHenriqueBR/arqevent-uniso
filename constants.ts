import { User, UserType, Turno, Event, Lecture, Certificate } from "./types";

export const MOCK_USERS: User[] = [
  {
    id: "u1",
    ra: "0024001",
    nome: "Sofia Arquiteta",
    email: "sofia.arquiteta@aluno.uniso.br",
    semestre: "5º Semestre",
    turno: Turno.MANHA,
    tipo: UserType.ALUNO,
  },
  {
    id: "a1",
    nome: "Admin Master",
    email: "admin@uniso.br",
    tipo: UserType.ADMIN,
  },
];

// Lista expandida apenas para visualização no Admin
export const MOCK_STUDENTS_LIST = [
  {
    id: "u1",
    ra: "0024001",
    nome: "Sofia Arquiteta",
    email: "sofia.arquiteta@aluno.uniso.br",
    semestre: "5º",
    presenca: 85,
  },
  {
    id: "u2",
    ra: "0024002",
    nome: "João Construção",
    email: "joao.c@aluno.uniso.br",
    semestre: "3º",
    presenca: 92,
  },
  {
    id: "u3",
    ra: "0024003",
    nome: "Maria Urbanista",
    email: "maria.u@aluno.uniso.br",
    semestre: "7º",
    presenca: 60,
  },
  {
    id: "u4",
    ra: "0024004",
    nome: "Pedro Projetos",
    email: "pedro.p@aluno.uniso.br",
    semestre: "1º",
    presenca: 100,
  },
  {
    id: "u5",
    ra: "0024005",
    nome: "Lucas Paisagismo",
    email: "lucas.p@aluno.uniso.br",
    semestre: "5º",
    presenca: 45,
  },
  {
    id: "u6",
    ra: "0024006",
    nome: "Ana Interiores",
    email: "ana.i@aluno.uniso.br",
    semestre: "9º",
    presenca: 78,
  },
];

export const MOCK_EVENTS: Event[] = [
  {
    id: "e1",
    titulo: "Semana de Arquitetura 2024",
    descricao: "Inovação e Sustentabilidade no Urbanismo Moderno.",
    data_inicio: "2024-10-15",
    data_fim: "2024-10-19",
    local: "Cidade Universitária - Bloco F",
    banner_url: "https://picsum.photos/800/300",
    carga_horaria_total: 20,
    ativo: true,
  },
];

export const MOCK_LECTURES: Lecture[] = [
  {
    id: "l1",
    evento_id: "e1",
    titulo: "Arquitetura Bioclimática",
    descricao: "Estratégias para conforto térmico passivo.",
    data_hora_inicio: "2024-10-15T09:00:00",
    data_hora_fim: "2024-10-15T11:00:00",
    sala: "Auditório Central",
    palestrante_nome: "Dr. Roberto Green",
    status: "completed",
  },
  {
    id: "l2",
    evento_id: "e1",
    titulo: "Urbanismo Tático",
    descricao: "Intervenções urbanas de baixo custo.",
    data_hora_inicio: "2024-10-16T19:00:00",
    data_hora_fim: "2024-10-16T21:00:00",
    sala: "Sala 302 - Bloco F",
    palestrante_nome: "Msc. Ana Urban",
    status: "live", // Currently happening
  },
  {
    id: "l3",
    evento_id: "e1",
    titulo: "BIM na Prática",
    descricao: "Fluxos de trabalho com Revit e Archicad.",
    data_hora_inicio: "2024-10-17T14:00:00",
    data_hora_fim: "2024-10-17T16:00:00",
    sala: "Lab Info 1",
    palestrante_nome: "Eng. Carlos Tech",
    status: "upcoming",
  },
];

export const MOCK_CERTIFICATES: Certificate[] = [
  {
    id: "c1",
    codigo_verificacao: "CERT-2023-X92J",
    titulo_evento: "Workshop de Design de Interiores",
    carga_horaria: 8,
    emitido_em: "2023-11-20",
  },
];

// Stats for Admin Dashboard
export const ADMIN_STATS_DATA = [
  { name: "Seg", manha: 0, noite: 0 },
  { name: "Ter", manha: 0, noite: 0 },
  { name: "Qua", manha: 0, noite: 0 },
  { name: "Qui", manha: 0, noite: 0 },
  { name: "Sex", manha: 0, noite: 0 },
];
