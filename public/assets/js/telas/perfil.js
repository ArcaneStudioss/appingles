// Onboarding: objetivo, prazo, área/interesses e tempo disponível. Uma pergunta por tela.
import { api } from '../api.js?v=__V__';
import { h, ocupado, icone, toast } from '../ui.js?v=__V__';
import { lou, louFala } from '../diversao.js?v=__V__';


// cada objetivo tem ícone e cor: dá para escolher olhando, sem ler tudo
const VISUAL = { entrevista: ['briefcase', 'azul'], trabalho: ['users-three', 'lilas'], clientes: ['storefront', 'menta'], viagem: ['airplane', 'turquesa'], estudar: ['graduation-cap', 'sol'], conversa: ['chats', 'coral'] };
const MINUTOS = { 10: ['lightning', 'sol'], 15: ['clock', 'azul'], 20: ['target', 'coral'] };

const somarMeses = m => { const d = new Date(); d.setMonth(d.getMonth() + m); return d.toISOString().slice(0, 10); };
const somarDias = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

export async function telaPerfil(el, { estado, ir, carregarEu }) {
  const { objetivos, interesses } = await api('/objetivos');
  const p = estado.eu?.perfil || {};
  const dados = { objetivo: p.objetivo || '', objetivo_detalhe: p.objetivo_detalhe || '', prazo: p.prazo || null, area: p.area || '', interesses: p.interesses || [], minutos_dia: p.minutos_dia || 15, dias_semana: p.dias_semana || 5 };
  const editando = estado.eu?.passo === 'app';
  let passo = 0;
  const total = 4;

  const caixa = h('div', { class: 'onboarding' });
  el.append(caixa);

  const barra = () => h('div', { class: 'passos', 'aria-label': `Passo ${passo + 1} de ${total}` }, Array.from({ length: total }, (_, i) => h('span', { class: i <= passo ? 'feito' : '' })));
  const navegacao = (podeAvancar, rotuloAvancar = 'Continuar') => {
    const msg = h('p', { class: 'erro-campo', 'aria-live': 'polite' });
    const voltar = passo > 0 ? h('button', { type: 'button', class: 'btn btn-sec', on: { click: () => { passo--; desenhar(); } } }, icone('caret-left'), 'Voltar') : null;
    const avancar = h('button', { type: 'button', class: 'btn', on: { click: async () => {
      const erro = podeAvancar();
      if (erro) { msg.textContent = erro; return; }
      if (passo < total - 1) { passo++; desenhar(); return; }
      ocupado(avancar, true);
      try {
        dados.fuso = Intl.DateTimeFormat().resolvedOptions().timeZone;
        await api('/perfil', { metodo: 'PUT', corpo: dados });
        await carregarEu();
        if (editando) { toast('Objetivo atualizado. Seu plano foi ajustado.', { tipo: 'ok' }); ir('#/plano'); }
        else ir('#/nivelamento');
      } catch (e) { msg.textContent = e.message; }
      finally { ocupado(avancar, false); }
    } } }, rotuloAvancar, icone('arrow-right'));
    return [msg, h('div', { class: 'onboarding-nav' }, voltar, avancar)];
  };

  function desenhar() {
    caixa.replaceChildren(barra());
    if (passo === 0) {
      caixa.append(
        louFala('oi', h('p', {}, editando ? 'Mudou alguma coisa? Sem problema, o plano se ajusta.' : `Oi, ${estado.eu.usuario.nome.split(' ')[0]}! Eu sou o Lou. Vou montar seu plano em 4 perguntas.`)),
        h('h1', {}, 'Para que você precisa do inglês agora?'),
        h('p', { class: 'ajuda' }, 'Escolha o principal. O curso inteiro vai girar em torno dele, e você pode mudar depois.'),
        h('div', { class: 'opcoes-grandes', role: 'radiogroup' }, objetivos.map(o => { const [ic, cor] = VISUAL[o.id] || ['target', 'azul']; return h('label', { class: `opcao-grande c-${cor}` },
          h('input', { type: 'radio', name: 'objetivo', value: o.id, checked: dados.objetivo === o.id, on: { change: () => { dados.objetivo = o.id; } } }),
          h('span', { class: 'caixa' }, h('span', { class: 'bolha' }, icone(ic)), h('span', {}, h('strong', {}, o.nome), h('small', {}, o.frase)))); })),
        ...navegacao(() => (dados.objetivo ? null : 'Escolha um objetivo para continuar.')));
    }
    if (passo === 1) {
      const detalhe = h('textarea', { id: 'p-detalhe', maxlength: 300, rows: 3, placeholder: 'Ex.: tenho entrevista para analista de dados numa empresa americana em março.' });
      detalhe.value = dados.objetivo_detalhe;
      detalhe.addEventListener('input', () => { dados.objetivo_detalhe = detalhe.value; });
      const data = h('input', { type: 'date', id: 'p-data', min: somarDias(7), max: somarMeses(36) });
      if (dados.prazo) data.value = dados.prazo;
      data.addEventListener('change', () => { dados.prazo = data.value || null; marcar(); });
      const opcoes = [['1 mês', 1], ['3 meses', 3], ['6 meses', 6], ['Sem prazo', 0]];
      const chips = h('div', { class: 'escolhas' }, opcoes.map(([r, m]) => h('label', { class: 'escolha' },
        h('input', { type: 'radio', name: 'prazo', value: String(m), on: { change: () => { dados.prazo = m ? somarMeses(m) : null; data.value = dados.prazo || ''; } } }), h('span', {}, r))));
      const marcar = () => { for (const i of chips.querySelectorAll('input')) i.checked = (i.value === '0' && !dados.prazo); };
      marcar();
      caixa.append(
        h('h1', {}, 'Conte com suas palavras'),
        h('div', { class: 'campo' }, h('label', { for: 'p-detalhe' }, 'Qual é a situação? (opcional)'), detalhe, h('small', {}, 'Quanto mais concreto, mais as lições e conversas ficam parecidas com o que você vai viver.')),
        h('div', { class: 'campo' }, h('span', { class: 'rotulo' }, 'Até quando?'), chips),
        h('div', { class: 'campo' }, h('label', { for: 'p-data' }, 'Ou escolha a data'), data),
        h('p', { class: 'ajuda' }, 'O prazo ajuda a priorizar. Não prometemos fluência em data nenhuma: a meta será o que dá para você conseguir fazer até lá.'),
        ...navegacao(() => null));
    }
    if (passo === 2) {
      const area = h('input', { id: 'p-area', type: 'text', maxlength: 80, placeholder: 'Ex.: enfermagem, vendas, desenvolvimento, direito' });
      area.value = dados.area;
      area.addEventListener('input', () => { dados.area = area.value; });
      caixa.append(
        h('h1', {}, 'Do que você gosta de falar?'),
        h('div', { class: 'campo' }, h('label', { for: 'p-area' }, 'Sua área de trabalho ou estudo'), area, h('small', {}, 'Usamos nos exemplos, nas tarefas e nas conversas.')),
        h('div', { class: 'campo' }, h('span', { class: 'rotulo' }, 'Interesses (até 5)'), h('div', { class: 'escolhas' }, interesses.map(i => h('label', { class: 'escolha' },
          h('input', { type: 'checkbox', value: i, checked: dados.interesses.includes(i), on: { change: e => {
            if (e.target.checked) { if (dados.interesses.length >= 5) { e.target.checked = false; toast('Escolha até 5.'); return; } dados.interesses.push(i); }
            else dados.interesses = dados.interesses.filter(x => x !== i);
          } } }), h('span', {}, i))))),
        ...navegacao(() => null));
    }
    if (passo === 3) {
      const opcoesMin = [10, 15, 20].map(m => h('label', { class: `opcao-grande c-${MINUTOS[m][1]}` },
        h('input', { type: 'radio', name: 'min', checked: dados.minutos_dia === m, on: { change: () => { dados.minutos_dia = m; } } }),
        h('span', { class: 'caixa' }, h('span', { class: 'bolha' }, icone(MINUTOS[m][0])), h('span', {}, h('strong', {}, `${m} minutos por dia`), h('small', {}, m === 10 ? 'Para dias corridos. Progresso real, mais gradual.' : m === 15 ? 'O equilíbrio mais comum.' : 'Para quem tem um prazo apertado.')))));
      const dias = h('input', { type: 'range', id: 'p-dias', min: 1, max: 7, step: 1, value: dados.dias_semana });
      const rot = h('output', { for: 'p-dias', class: 'chip saida-dias' }, `${dados.dias_semana} dias por semana`);
      dias.addEventListener('input', () => { dados.dias_semana = Number(dias.value); rot.textContent = `${dias.value} ${dias.value === '1' ? 'dia' : 'dias'} por semana`; });
      caixa.append(
        h('h1', {}, 'Quanto tempo cabe na sua rotina?'),
        h('div', { class: 'opcoes-grandes' }, opcoesMin),
        h('div', { class: 'campo' }, h('label', { for: 'p-dias' }, 'Em quantos dias da semana?'), dias, rot),
        h('p', { class: 'ajuda' }, 'Perdeu um dia? Nada de punição: o plano se reorganiza e você continua de onde parou.'),
        ...navegacao(() => null, editando ? 'Salvar e ajustar plano' : 'Ir para o teste de nível'));
    }
    caixa.querySelector('h1')?.setAttribute('tabindex', '-1');
    caixa.querySelector('h1')?.focus({ preventScroll: true });
  }
  desenhar();
}
