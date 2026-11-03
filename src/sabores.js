// Conteúdo de cada sabor. O fundo vem de quadros.json (cor medida no vídeo);
// acento e tinta são as cores do botão (fundo claro + texto escuro).
import dados from './quadros.json';

const BASE = import.meta.env.BASE_URL;

const CONTEUDO = [
  {
    id: 'maracuja',
    nome: 'maracujá',
    acento: '#F6BC3E',
    tinta: '#3E1E04',
    notas: 'azedinho · perfumado',
    descricao: 'O azedinho perfumado do maracujá, leve e gaseificado. Refresca do primeiro ao último gole.',
  },
  {
    id: 'limao',
    nome: 'limão',
    acento: '#B8E06A',
    tinta: '#062615',
    notas: 'cítrico · vivo',
    descricao: 'Cítrico e vivo, com aquele toque de casca de limão. Para os dias em que só gelo não basta.',
  },
  {
    id: 'acai',
    nome: 'açaí',
    acento: '#E7A6D2',
    tinta: '#1C0A2A',
    notas: 'encorpado · aveludado',
    descricao: 'Encorpado e aveludado, com o sabor intenso do açaí numa versão leve e cheia de bolhas.',
  },
];

export const FPS = dados.fps;

export const SABORES = CONTEUDO.map((s, i) => ({
  ...s,
  numero: String(i + 1).padStart(2, '0'),
  quadros: dados.sabores[s.id].quadros,
  fundo: dados.sabores[s.id].cores.topo,
  lataCores: dados.sabores[s.id].lata,
  miniatura: `${BASE}assets/${s.id}/web/fruta.webp`,
  lata: `${BASE}assets/${s.id}/web/lata.webp`,
}));

export const urlQuadro = (id, versao, i) =>
  `${BASE}assets/${id}/frames/${versao}/${String(i + 1).padStart(4, '0')}.webp`;
