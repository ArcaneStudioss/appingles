// Meu nível: onde o aluno está, por que o app mantém, sobe ou desce, e os botões para ajustar na mão.
// O app também ajusta sozinho (ver src/motor/ajuste-nivel.js); aqui fica a explicação e o controle do aluno.
import { api } from '../api.js?v=__V__';
import { h, icone, toast, janela, ocupado, dataBR } from '../ui.js?v=__V__';

export const NIVEIS = ['A1', 'A2', 'B1', 'B2', 'C1'];
export const NOME_NIVEL = { A1: 'Iniciante', A2: 'Básico', B1: 'Intermediário', B2: 'Intermediário avançado', C1: 'Avançado' };
const DESCR = { A1: 'Frases bem simples do dia a dia.', A2: 'Se comunica em situações simples e conhecidas.', B1: 'Se vira na maioria das situações e conta experiências.', B2: 'Discute assuntos com certa naturalidade.', C1: 'Usa o inglês com flexibilidade no trabalho e nos estudos.' };
const MINIMO = 20;
async function comEspera(botao, fn) { ocupado(botao, true); try { await fn(); } catch (e) { toast(e.message, { tipo: 'erro' }); } finally { ocupado(botao, false); } }

// Texto do "como estou indo", sempre com a base da conclusão (nada de rótulo sem número).
export function situacao(av) {
  const pct = av.taxa != null ? `${Math.round(av.taxa * 100)}%` : null;
  if (av.motivo === 'poucos') return { icone: 'clock', texto: `Ainda estou observando seus exercícios (${av.amostra} de ${MINIMO}). Com ${MINIMO} respostas em pelo menos 2 dias eu já sei se o nível está certo.` };
  if (av.motivo === 'poucos-dias') return { icone: 'calendar-plus', texto: 'Já tenho respostas suficientes, mas só de um dia. Estude em outro dia e eu avalio com mais segurança.' };
  if (av.motivo === 'descanso') return { icone: 'clock', texto: 'Seu nível mudou há pouco. Vou esperar uns dias de estudo antes de avaliar de novo.' };
  if (av.reforcar) return { icone: 'target', texto: `Nível certo, mas com espaço para firmar: acerto de ${pct} nos últimos ${av.amostra} exercícios. Vou manter o nível e reforçar o que você erra.` };
  return { icone: 'seal-check', texto: `No ponto certo: acerto de ${pct} nos últimos ${av.amostra} exercícios. Se passar de 88% sem ajuda, eu subo você.` };
}

export async function telaNivel(el, { ir, carregarEu }) {
  const d = await api('/nivel');
  const i = NIVEIS.indexOf(d.atual);
  const desceu = NIVEIS[i - 1], subiu = NIVEIS[i + 1];
  const sit = situacao(d.avaliacao);

  async function trocar(direcao) {
    const para = direcao === 'subir' ? subiu : desceu;
    const sim = h('button', { type: 'button', class: 'btn' }, direcao === 'subir' ? 'Subir de nível' : 'Descer de nível');
    const nao = h('button', { type: 'button', class: 'btn btn-sec' }, 'Cancelar');
    const { fechar } = janela({ titulo: direcao === 'subir' ? 'Está fácil demais?' : 'Está difícil demais?', acoes: [nao, sim], corpo: h('div', {},
      h('p', {}, `Você vai de ${d.atual} (${NOME_NIVEL[d.atual]}) para ${para} (${NOME_NIVEL[para]}).`),
      h('p', { class: 'ajuda' }, 'Seu plano é refeito para o nível novo. O que você já aprendeu e suas figurinhas ficam guardados, e dá para desfazer em seguida.')) });
    nao.addEventListener('click', () => fechar(false));
    sim.addEventListener('click', () => comEspera(sim, async () => {
      await api('/nivel/ajustar', { metodo: 'POST', corpo: { direcao } });
      fechar(true); await carregarEu(); toast(`Pronto! Agora você está no ${para}.`, { tipo: 'ok' }); ir('#/nivel');
    }));
  }
  async function desfazer() {
    await api('/nivel/desfazer', { metodo: 'POST' }); await carregarEu(); toast('Voltei o seu nível para como estava.', { tipo: 'ok' }); ir('#/nivel');
  }

  const a = d.ajuste;
  el.append(
    h('header', { class: 'cabeca c-lilas' }, h('span', { class: 'bolha' }, icone('chart-line-up')),
      h('div', {}, h('h1', {}, 'Meu nível'), h('p', { class: 'ajuda' }, 'O app acompanha seus acertos e ajusta sozinho. Se achar fácil ou difícil demais, você também pode mudar.'))),
    h('section', { class: 'folha nivel-agora' },
      h('p', { class: 'rotulo-pequeno' }, 'Agora você está no'),
      h('h2', {}, `${d.atual} · ${NOME_NIVEL[d.atual]}`), h('p', {}, DESCR[d.atual]),
      h('ol', { class: 'nivel-escada', 'aria-label': 'Níveis de A1 a C1' }, NIVEIS.map((n, k) => h('li', { class: 'nivel-degrau' + (k === i ? ' nivel-degrau--agora' : k < i ? ' nivel-degrau--ja' : ''), 'aria-current': k === i ? 'step' : null }, h('strong', {}, n), k === i ? h('small', {}, NOME_NIVEL[n]) : null))),
      h('p', { class: 'nivel-situacao' }, icone(sit.icone), h('span', {}, sit.texto))),
    h('section', { class: 'folha' },
      h('h2', {}, 'Mudar na mão'),
      h('div', { class: 'nivel-botoes' },
        h('button', { type: 'button', class: 'btn btn-sec', disabled: !desceu, on: { click: () => trocar('descer') } }, icone('caret-down'), desceu ? `Está difícil: descer para ${desceu}` : 'Este já é o nível mais básico'),
        h('button', { type: 'button', class: 'btn', disabled: !subiu, on: { click: () => trocar('subir') } }, icone('caret-right'), subiu ? `Está fácil: subir para ${subiu}` : 'Este já é o nível mais alto')),
      a ? h('p', { class: 'ajuda' }, a.desfez ? `Você desfez um ajuste em ${dataBR(a.em.slice(0, 10))}.` : a.origem === 'auto' ? `Em ${dataBR(a.em.slice(0, 10))} eu ajustei de ${a.de} para ${a.para}, pelos seus acertos recentes.` : `Em ${dataBR(a.em.slice(0, 10))} você mudou de ${a.de} para ${a.para}.`,
        !a.desfez ? [' ', h('button', { type: 'button', class: 'btn btn-texto btn-peq', on: { click: e => comEspera(e.currentTarget, desfazer) } }, 'Desfazer')] : null) : null,
      h('p', { class: 'ajuda' }, 'Prefere medir de novo do zero? ', h('a', { href: '#/nivelamento' }, 'Refazer o teste de nível'), '.')));
}
