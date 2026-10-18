// Progresso: separa o que foi FEITO (atividade) do que foi DEMONSTRADO (usou sozinho, com evidência).
import { api } from '../api.js?v=__V__';
import { h, icone, dataBR, toast, plural } from '../ui.js?v=__V__';
import { nomeConquista } from './hoje.js?v=__V__';

const NOMES = { gramatica: 'Gramática', vocabulario: 'Vocabulário', leitura: 'Leitura', escuta: 'Escuta', escrita: 'Escrita', fala: 'Fala' };
const CONF = { baixa: 'confiança baixa', media: 'confiança média', alta: 'confiança alta' };
const STATUS_H = { hipotese: 'hipótese', confirmando: 'as atividades recentes confirmam', melhorando: 'já está melhorando' };

export async function telaProgresso(el) {
  const p = await api('/progresso');
  const c = p.concluido, d = p.demonstrado;
  const hab = Object.entries(p.habilidades).filter(([, v]) => v.n > 0 || v.nivel);

  el.append(
    h('header', { class: 'cabeca' }, h('h1', {}, 'Seu progresso'), p.objetivo ? h('p', { class: 'ajuda' }, icone('target'), ' ', p.objetivo.nome, p.objetivo.prazo ? ` · até ${dataBR(p.objetivo.prazo)}` : '') : null),

    h('div', { class: 'duas' },
      h('section', { class: 'folha' },
        h('p', { class: 'rotulo-pequeno' }, 'O que você fez'),
        h('ul', { class: 'numeros' },
          h('li', {}, h('strong', {}, String(c.licoes)), plural(c.licoes, 'lição', 'lições').replace(/^\d+ /, '')),
          h('li', {}, h('strong', {}, String(c.minutos)), 'minutos'),
          h('li', {}, h('strong', {}, String(c.diasNoMes)), 'dias neste mês'),
          h('li', {}, h('strong', {}, String(c.revisoes)), 'revisões'),
          h('li', {}, h('strong', {}, String(c.conversas)), 'conversas')),
        h('p', { class: 'ajuda' }, 'Atividade mostra constância. Ela não prova, sozinha, que você aprendeu.')),
      h('section', { class: 'folha folha--destaque' },
        h('p', { class: 'rotulo-pequeno' }, 'O que você demonstrou'),
        d.missoes.length ? h('ul', { class: 'demonstrados' }, d.missoes.map(m => h('li', {}, icone('seal-check'), h('span', {}, h('strong', {}, `“${m.podeFazer}”`), h('small', {}, m.status === 'retido' ? `Demonstrado em ${dataBR(m.demonstrado_em)} e mantido em ${dataBR(m.retido_em)}` : `Demonstrado em ${dataBR(m.demonstrado_em)}, numa tarefa feita sem ajuda`)))))
          : h('p', {}, 'Ainda nada por aqui, e é normal no começo. Uma missão entra nesta lista quando você faz a tarefa final dela sozinho.'),
        d.superados.length ? h('p', {}, h('strong', {}, 'Dificuldades superadas: '), d.superados.map(s => s.nome.toLowerCase()).join('; '), '.') : null,
        d.retencao != null ? h('p', { class: 'ajuda' }, `Retenção: você lembrou ${d.retencao}% dos cartões revisados depois de uma semana ou mais.`) : null)),

    hab.length ? h('section', { class: 'folha' },
      h('h2', {}, 'Por habilidade'),
      h('ul', { class: 'barras' }, hab.map(([k, v]) => h('li', {},
        h('span', { class: 'barras-rotulo' }, NOMES[k], v.nivel ? h('small', {}, ` nível de partida ${v.nivel}`) : null),
        h('span', { class: 'barras-trilho', 'aria-hidden': 'true' }, h('span', { style: `transform:scaleX(${((v.pct ?? 0) / 100).toFixed(2)})` })),
        h('strong', {}, v.pct == null ? '-' : `${v.pct}%`)))),
      h('p', { class: 'ajuda' }, 'Porcentagem de acertos nas últimas 20 atividades de cada habilidade.', hab.some(([, v]) => v.tendencia === 'subindo') ? ' Subindo em: ' + hab.filter(([, v]) => v.tendencia === 'subindo').map(([k]) => NOMES[k].toLowerCase()).join(', ') + '.' : '')) : null,

    h('section', { class: 'folha com-margem' },
      h('h2', {}, 'Onde você trava (hipóteses)'),
      p.hipoteses.length ? h('ul', { class: 'hipoteses' }, p.hipoteses.map(x => {
        const li = h('li', {},
          h('strong', {}, x.titulo), h('p', {}, x.texto), h('p', { class: 'bilhete pequeno' }, x.acao),
          h('p', { class: 'ajuda' }, `Base: ${x.evidencia} atividades · ${CONF[x.confianca]} · ${STATUS_H[x.status] || 'hipótese'}`),
          h('button', { type: 'button', class: 'btn btn-texto btn-peq', on: { click: async () => { try { const r = await api('/hipoteses/descartar', { metodo: 'POST', corpo: { id: x.id } }); toast(r.mensagem, { tipo: 'ok' }); li.remove(); } catch (e) { toast(e.message, { tipo: 'erro' }); } } } }, 'Isso não faz sentido para mim'));
        return li;
      })) : h('p', {}, 'Ainda não temos dados suficientes para apontar padrões com segurança. Eles aparecem aqui depois de algumas lições e conversas, sempre como hipótese.'),
      p.melhorar.length ? h('div', {}, h('h3', {}, 'Pontos a melhorar'), h('ul', {}, p.melhorar.map(m => h('li', {}, `${m.nome} (${plural(m.tentativas, 'tentativa', 'tentativas')})`)))) : null,
      d.firmes?.length ? h('p', {}, h('strong', {}, 'Firmes: '), d.firmes.join('; ').toLowerCase(), '.') : null),

    p.comparacao ? h('section', { class: 'folha' },
      h('h2', {}, 'Antes e agora'),
      h('div', { class: 'duas' },
        h('div', {}, h('p', { class: 'rotulo-pequeno' }, `Primeira amostra · ${dataBR(p.comparacao.primeira.em)}`), h('p', { class: 'ajuda' }, p.comparacao.primeira.tarefa), h('p', { lang: 'en', class: 'pautado amostra' }, p.comparacao.primeira.texto)),
        h('div', {}, h('p', { class: 'rotulo-pequeno' }, `Mais recente · ${dataBR(p.comparacao.ultima.em)}`), h('p', { class: 'ajuda' }, p.comparacao.ultima.tarefa), h('p', { lang: 'en', class: 'pautado amostra' }, p.comparacao.ultima.texto))),
      h('p', { class: 'ajuda' }, 'Compare você mesmo: as tarefas podem ser diferentes, então olhe a clareza e a segurança, não só o tamanho.')) : null,

    h('section', { class: 'folha' },
      h('h2', {}, 'Próximas metas'),
      p.proximas.length ? h('ol', {}, p.proximas.map(m => h('li', {}, h('strong', {}, m.titulo), h('p', { class: 'ajuda' }, m.podeFazer)))) : h('p', {}, 'Você passou por todas as missões do plano. Que tal refazer o teste de nível ou ampliar o objetivo?'),
      p.objetivo ? h('p', { class: 'ajuda' }, p.objetivo.compromisso) : null,
      h('a', { class: 'btn btn-sec', href: '#/plano' }, icone('path'), 'Ver a trilha completa')),

    p.conquistas.length ? h('section', {}, h('h2', {}, 'Conquistas'), h('ul', { class: 'conquistas' }, p.conquistas.map(x => h('li', { class: 'chip' }, icone('medal'), nomeConquista(x.codigo))))) : null);
}
