import { api } from '../api.js?v=__V__';
import { h, ocupado, icone } from '../ui.js?v=__V__';

export const faixaDaIdade = n => n <= 12 ? 'crianca' : n <= 17 ? 'adolescente' : 'adulto';
export const NOMES_PUBLICO = { crianca: 'Crianças', adolescente: 'Adolescentes', adulto: 'Adultos' };
export const REGIOES_BRASIL = { norte: 'Norte', nordeste: 'Nordeste', 'centro-oeste': 'Centro-Oeste', sudeste: 'Sudeste', sul: 'Sul', fora: 'Moro fora do Brasil' };

export function camposPublico({ idade: inicial = '', papel: papelInicial = 'aluno', regiao: regiaoInicial = '', responsavel = false } = {}) {
  const idade = h('input', { id: 'p-idade', type: 'number', inputmode: 'numeric', min: 1, max: 120, step: 1, required: true, value: inicial ?? '' });
  const papel = h('select', { id: 'p-papel' }, h('option', { value: 'aluno', selected: papelInicial === 'aluno' }, 'Aluno(a): estudar e participar de turmas'), h('option', { value: 'professor', selected: papelInicial === 'professor' }, 'Professor(a): criar aulas e acompanhar turmas'), h('option', { value: 'ambos', selected: papelInicial === 'ambos' }, 'Aluno(a) e professor(a): estudar e ensinar'));
  const regiao = h('select', { id: 'p-regiao' }, h('option', { value: '' }, 'Prefiro não informar'), Object.entries(REGIOES_BRASIL).map(([id, nome]) => h('option', { value: id }, nome))); regiao.value = regiaoInicial || '';
  const contexto = h('p', { class: 'publico-previa', 'aria-live': 'polite' });
  const autorizacao = h('input', { id: 'p-responsavel', type: 'checkbox', checked: responsavel });
  const menor = h('div', { class: 'consentimento', hidden: true }, autorizacao, h('label', { for: 'p-responsavel' }, 'O responsável autorizou o estudo nesta conta. Isso não dá ao professor acesso ao estudo privado.'));
  const atualizar = () => {
    const n = Number(idade.value), valido = idade.value !== '' && Number.isInteger(n) && n >= 1 && n <= 120;
    const f = faixaDaIdade(n);
    contexto.textContent = !valido ? 'A idade adapta os temas e a forma de explicar. O nível de inglês é avaliado separadamente.' : f === 'crianca' ? 'Crianças: descobertas, histórias, jogos e instruções curtas.' : f === 'adolescente' ? 'Adolescentes: amizades, projetos, música e tecnologia, sem infantilizar.' : 'Adultos: situações do cotidiano, estudos, viagens e trabalho, com linguagem objetiva.';
    menor.hidden = !valido || n >= 18;
  };
  idade.addEventListener('input', atualizar); atualizar();
  return { elemento: h('div', { class: 'campos-publico' }, h('div', { class: 'campo' }, h('label', { for: 'p-idade' }, 'Idade de quem vai estudar'), idade, contexto), h('div', { class: 'campo' }, h('label', { for: 'p-papel' }, 'Como vai usar a plataforma?'), papel), h('div', { class: 'campo' }, h('label', { for: 'p-regiao' }, 'Sua região do Brasil (opcional)'), regiao, h('small', {}, 'Destaca exemplos e vocabulário da região, sem limitar o acesso aos outros jeitos de falar. Você pode mudar depois.')), menor), ler: () => {
    const n = Number(idade.value);
    if (!idade.value || !Number.isInteger(n) || n < 1 || n > 120) throw new Error('Informe uma idade válida, em anos.');
    if (n < 18 && !autorizacao.checked) throw new Error('Confirme a autorização do responsável.');
    return { idade: n, papel: papel.value, regiao: regiao.value || null, responsavel: autorizacao.checked };
  } };
}

export async function telaPublico(el, { estado, carregarEu, ir }) {
  const p = estado.eu?.perfil || {}, editando = !!estado.eu?.publico?.informado;
  const campos = camposPublico({ idade: p.idade, papel: p.papel, regiao: p.regiao, responsavel: !!p.responsavel_em });
  const msg = h('p', { class: 'erro-campo', 'aria-live': 'polite' });
  const btn = h('button', { type: 'submit', class: 'btn btn-bloco' }, editando ? 'Salvar meu perfil' : 'Continuar');
  el.append(h('section', { class: 'folha onboarding' }, h('span', { class: 'etapa' }, icone('user-circle'), 'Seu espaço de aprendizagem'), h('h1', {}, 'Inglês para a sua fase da vida'), h('p', {}, 'Conte sua idade para receber temas e explicações adequados a você. Um adulto iniciante aprende o básico com exemplos de adulto.'),
    h('form', { novalidate: true, on: { submit: async e => { e.preventDefault(); try { const dados = campos.ler(); ocupado(btn, true); await api('/perfil/publico', { metodo: 'PUT', corpo: dados }); await carregarEu(); ir(dados.papel === 'professor' ? '#/professor' : editando ? '#/conta' : '#/hoje'); } catch (err) { msg.textContent = err.message; ocupado(btn, false); } } } }, campos.elemento, msg, btn)));
}
