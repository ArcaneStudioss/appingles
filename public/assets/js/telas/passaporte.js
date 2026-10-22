import { api } from '../api.js?v=__V__';
import { h, icone, dataBR } from '../ui.js?v=__V__';

export async function telaPassaporte(el) {
  const { missoes }=await api('/passaporte');
  el.append(h('header',{class:'cabeca c-turquesa'},h('span',{class:'bolha'},icone('airplane')),h('div',{},h('h1',{},'Passaporte Do Brasil pro mundo'),h('p',{},'Aprenda a explicar nossos costumes e jeitos de falar em situações reais. Explore todas as regiões.'))),
    h('p',{class:'ajuda'},'O carimbo registra a conclusão da prática. Demonstrar domínio exige uma tarefa independente. Seus carimbos pessoais ficam no histórico.'),
    h('div',{class:'cultura-grade'},missoes.map(m=>h('section',{class:'folha'},h('span',{class:'chip'},m.nivel),h('h2',{},m.titulo),h('p',{},m.tarefa),h('p',{class:'ajuda'},m.expressoes.map(e=>e.titulo).join(' · ')),
      m.concluida?h('p',{class:'chip chip-ok'},icone('seal-check'),'Carimbado em '+dataBR(m.carimbo)):h('p',{},`${m.feitas} de ${m.total} atividades`),
      h('a',{class:'btn',href:'#/biblioteca/'+m.id},m.concluida?'Rever esta missão':'Começar missão'),
      h('details',{},h('summary',{},'Fontes desta missão'),h('ul',{},[...new Map(m.fontes.map(f=>[f.url,f])).values()].map(f=>h('li',{},h('a',{href:f.url,target:'_blank',rel:'noopener noreferrer'},f.titulo)))))))));
}
