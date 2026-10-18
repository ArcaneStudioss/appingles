// Meu jeito de aprender: o retrato do aluno por modo (ler, escrever, ouvir), calculado dos acertos reais dele, não de um rótulo.
// Mostra o que o app percebeu (com a base de cada conclusão), as dificuldades em ordem, os erros só dele e a preferência declarada.
import { api } from '../api.js?v=__V__';
import { h, icone, toast, janela, ocupado, dataBR } from '../ui.js?v=__V__';
import { lou, louFala } from '../diversao.js?v=__V__';

const MODOS = [
  { id: 'ler', nome: 'Ler', ic: 'book-open-text', cor: 'azul', ajuda: 'escolher a resposta certa, entender textos' },
  { id: 'escrever', nome: 'Escrever', ic: 'pencil-simple', cor: 'menta', ajuda: 'completar, montar e escrever frases' },
  { id: 'ouvir', nome: 'Ouvir', ic: 'headphones', cor: 'turquesa', ajuda: 'entender e escrever o que ouviu' },
  { id: 'falar', nome: 'Falar', ic: 'microphone', cor: 'coral', ajuda: 'conversar em voz alta' },
];
const CONF = { baixa: 'poucos dados', media: 'dados razoáveis', alta: 'dados firmes' };
const STATUS = { atencao: ['Precisa de atenção', ''], melhorando: ['Melhorando', 'chip-ok'], superada: ['Superada', 'chip-ok'] };

export async function telaAprender(el, { ir }) {
  const d = await api('/aprendizagem');
  const r = d.retrato, gosta = d.preferencias.estilos;

  async function preferencias() {
    const marcados = new Set(gosta);
    const caixas = MODOS.map(m => h('label', { class: `escolha-modo c-${m.cor}` }, h('input', { type: 'checkbox', checked: marcados.has(m.id), on: { change: e => { if (e.target.checked) marcados.add(m.id); else marcados.delete(m.id); } } }),
      h('span', {}, h('span', { class: 'bolha' }, icone(m.ic)), h('span', {}, h('strong', {}, m.nome), h('small', {}, m.ajuda)))));
    const salvar = h('button', { type: 'button', class: 'btn' }, 'Salvar');
    const j = janela({ titulo: 'Como você gosta de estudar?', corpo: h('div', {},
      h('p', {}, 'Marque o que você gosta de fazer (pode ser mais de um, ou nenhum). Isso muda um pouco a mistura do treino.'),
      h('div', { class: 'escolhas-modo' }, caixas),
      h('p', { class: 'ajuda' }, 'Combinado: gostar de um jeito ajuda a continuar estudando, então eu levo em conta. Mas o que decide o que você treina mais são os seus acertos de verdade, não um rótulo. Quem se diz "de ouvir" muitas vezes precisa treinar a escuta justamente porque ainda erra mais nela.')), acoes: [salvar] });
    salvar.addEventListener('click', async () => {
      ocupado(salvar, true);
      try { await api('/aprendizagem/preferencias', { metodo: 'PUT', corpo: { estilos: [...marcados] } }); j.fechar(true); toast('Preferência salva. O próximo treino já considera.', { tipo: 'ok' }); ir('#/aprender'); }
      catch (e) { toast(e.message, { tipo: 'erro' }); ocupado(salvar, false); }
    });
  }

  const linhaModo = m => {
    if (m.id === 'falar') return h('li', { class: `modo c-${m.cor}` }, h('span', { class: 'bolha bolha--peq' }, icone(m.ic)), h('div', { class: 'modo__txt' }, h('strong', {}, m.nome), h('small', {}, r.nivel.falar ? `Nível de partida: ${r.nivel.falar}. Ainda não medimos a fala nos treinos.` : 'Ainda não medimos a fala. Use o microfone nas conversas e no teste de nível.')), h('span', { class: 'modo__pct modo__pct--vazio' }, '-'));
    const x = r.modos[m.id], pct = x.pct;
    return h('li', { class: `modo c-${m.cor}` },
      h('span', { class: 'bolha bolha--peq' }, icone(m.ic)),
      h('div', { class: 'modo__txt' },
        h('div', { class: 'modo__topo' }, h('strong', {}, m.nome), gosta.includes(m.id) ? h('span', { class: 'chip c-sol' }, icone('sparkle'), 'você gosta') : null, h('span', { class: 'chip chip-neutro' }, CONF[x.confianca])),
        h('span', { class: 'estudo-barra', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': pct ?? 0, 'aria-label': `Acertos ${m.nome}` }, h('span', { style: `transform:scaleX(${((pct ?? 0) / 100).toFixed(3)})` })),
        h('small', {}, x.n ? `${x.certos} certas de ${x.n} respostas${x.tempo ? ` · tempo típico ${x.tempo}s` : ''}${r.nivel[m.id] ? ` · nível de partida ${r.nivel[m.id]}` : ''}` : r.nivel[m.id] ? `Nível de partida: ${r.nivel[m.id]}. Ainda sem respostas nos treinos.` : 'Ainda sem respostas.')),
      h('span', { class: 'modo__pct' }, pct == null ? '-' : `${pct}%`));
  };

  const t = d.treino;
  el.append(
    h('header', { class: 'cabeca c-limao' }, h('span', { class: 'bolha' }, icone('compass')), h('div', {}, h('h1', {}, 'Meu jeito de aprender'), h('p', { class: 'ajuda' }, 'Eu olho como você realmente vai, não um rótulo. O retrato muda conforme você evolui.'))),
    h('a', { class: 'treino-card c-limao', href: '#/treino' }, h('span', { class: 'bolha' }, icone('target')), h('span', { class: 'treino-card__txt' }, h('strong', {}, t.concluido ? 'Treino de hoje feito' : t.pronto ? 'Seu treino de hoje está pronto' : 'Treino focado nas suas dificuldades'),
      h('small', {}, t.tags.length ? `Foco: ${t.tags.join('; ').toLowerCase()}` : 'Cada resposta sua me ajuda a montar o seu.')), h('span', { class: 'radio-card__play', 'aria-hidden': 'true' }, icone(t.concluido ? 'check' : 'play'))),

    h('section', { class: 'folha c-limao' }, h('h2', {}, 'Como você vai em cada jeito'),
      h('p', { class: 'ajuda' }, `Acertos dos últimos 60 dias (${r.total} respostas).`),
      h('ul', { class: 'modos' }, MODOS.map(linhaModo)),
      h('p', { class: 'ajuda' }, 'Ler = escolher entre opções. Escrever = montar ou digitar sozinho. Ouvir = tudo que usa áudio.')),

    d.percepcoes.length ? h('section', { class: 'tela' }, h('h2', {}, 'O que eu percebi'), d.percepcoes.map(p => h('article', { class: 'folha com-margem c-limao percepcao' },
      h('strong', {}, p.titulo), h('p', {}, p.texto), h('p', { class: 'bilhete pequeno' }, p.acao), h('p', { class: 'ajuda' }, `Base: ${CONF[p.confianca]}. Se não faz sentido para você, o treino se ajusta com as próximas respostas.`)))) : null,

    h('section', { class: 'folha c-coral' }, h('h2', {}, 'Suas dificuldades'),
      d.dificuldades.length ? h('ol', { class: 'dificuldades' }, d.dificuldades.map(x => {
        const [rot, cls] = STATUS[x.status];
        return h('li', { class: 'dificuldade' + (x.status === 'superada' ? ' dificuldade--ok' : '') },
          h('div', { class: 'dificuldade__topo' }, h('strong', {}, x.nome), h('span', { class: `chip ${cls}` }, rot)),
          h('p', { class: 'ajuda' }, x.regra),
          h('div', { class: 'estudo-barra', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': x.dominio, 'aria-label': 'Domínio' }, h('span', { style: `transform:scaleX(${(x.dominio / 100).toFixed(3)})` })),
          h('small', {}, `Domínio ${x.dominio}% · ${x.erros} erros em ${x.total} respostas${x.ultimoErro ? ` · último erro em ${dataBR(x.ultimoErro)}` : ''}`),
          x.seu ? h('div', { class: 'correcao' }, h('span', { class: 'riscado', lang: 'en' }, x.seu), x.correcao ? h('span', { class: 'nova', lang: 'en' }, x.correcao) : null) : null);
      })) : h('div', { class: 'vazio' }, louFala('oi', h('p', {}, 'Ainda não achei dificuldades suas. É bom sinal, ou só falta eu te ver errar um pouco. Faça uma conversa ou uma aula e eu volto aqui.')))),

    d.pessoais.length ? h('section', { class: 'folha c-sol' }, h('h2', {}, 'Erros só seus'),
      h('p', { class: 'ajuda' }, 'Não estão na lista comum, mas apareceram nas suas conversas e textos. Eles viram cartões de revisão e frases para você corrigir no treino.'),
      h('ul', { class: 'pessoais' }, d.pessoais.map(p => h('li', {}, h('div', { class: 'correcao' }, h('span', { class: 'riscado', lang: 'en' }, p.trecho), h('span', { class: 'nova', lang: 'en' }, p.sugestao), p.explicacao ? h('small', {}, p.explicacao) : null))))) : null,

    h('section', { class: 'folha cartao-conta c-limao' }, h('div', { class: 'cartao-conta__info' }, h('span', { class: 'bolha' }, icone('sparkle')), h('div', {}, h('h2', {}, 'Como você gosta de estudar'), h('p', { class: 'ajuda' }, gosta.length ? gosta.map(g => MODOS.find(m => m.id === g)?.nome.toLowerCase()).join(', ') : 'Nenhuma preferência marcada. Tudo bem: eu uso só os seus acertos.'))),
      h('div', { class: 'linha-acoes' }, h('button', { type: 'button', class: 'btn btn-sec btn-peq', on: { click: preferencias } }, icone('pencil-simple'), gosta.length ? 'Alterar' : 'Escolher'))));
}
