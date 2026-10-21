'use strict';
// Capítulos escritos para públicos diferentes. Idade escolhe contexto, nível escolhe complexidade.
const UNIDADES = [
  {
    id: 'crianca-animais', faixa: 'crianca', nivel: 'A1', tema: 'Animais', titulo: 'Um amigo no jardim', imagem: '🐶',
    explicacao: 'Vamos descobrir palavras de animais e lugares. Leia uma frase por vez. Toque nas palavras sublinhadas se precisar de tradução.',
    vocab: [{ en: 'dog', pt: 'cachorro' }, { en: 'garden', pt: 'jardim' }, { en: 'ball', pt: 'bola' }, { en: 'play', pt: 'brincar ou jogar' }],
    texto: 'Lia has a dog. His name is Max. Max is in the garden. He has a red ball. Lia and Max play together. Max is happy!',
    traducao: 'Lia tem um cachorro. O nome dele é Max. Max está no jardim. Ele tem uma bola vermelha. Lia e Max brincam juntos. Max está feliz!',
    perguntas: [
      ['Onde Max está?', ['No jardim', 'Na escola', 'Na cozinha'], '“In the garden” quer dizer “no jardim”. O texto conta onde Max está.'],
      ['Qual é a cor da bola?', ['Vermelha', 'Azul', 'Verde'], '“A red ball” é uma bola vermelha. Red é vermelho.'],
    ],
    lacuna: { frase: 'Max is in the ___.', resposta: ['garden'], explica: 'Garden é jardim. A frase diz que Max está no jardim.' },
  },
  {
    id: 'crianca-brincadeiras', faixa: 'crianca', nivel: 'A2', tema: 'Brincadeiras', titulo: 'Vamos construir uma cabana?', imagem: '⛺',
    explicacao: 'Uma história tem uma sequência. Before é antes; after é depois. Procure o que cada pessoa faz.',
    vocab: [{ en: 'blanket', pt: 'cobertor' }, { en: 'share', pt: 'compartilhar' }, { en: 'before', pt: 'antes' }, { en: 'after', pt: 'depois' }],
    texto: 'On Saturday, Ana and Ben build a little house with chairs and a blanket. Before they start, they ask an adult for help. Ana brings books and Ben brings a toy. After lunch, they invite their friend Jo. They share the toys and read a story together.',
    traducao: 'No sábado, Ana e Ben constroem uma casinha com cadeiras e um cobertor. Antes de começar, pedem ajuda a um adulto. Ana traz livros e Ben traz um brinquedo. Depois do almoço, convidam a amiga Jo. Eles compartilham os brinquedos e leem uma história juntos.',
    perguntas: [
      ['O que fazem antes de começar?', ['Pedem ajuda a um adulto', 'Convidam Jo', 'Almoçam'], 'O texto diz “Before they start, they ask an adult for help”. Before indica o que vem antes.'],
      ['Quando convidam Jo?', ['Depois do almoço', 'Antes do almoço', 'No domingo'], '“After lunch” quer dizer “depois do almoço”. After indica o que vem depois.'],
    ],
    lacuna: { frase: 'They ___ the toys.', resposta: ['share'], explica: 'Share é compartilhar. Eles compartilham os brinquedos.' },
  },
  {
    id: 'crianca-natureza', faixa: 'crianca', nivel: 'B1', tema: 'Natureza', titulo: 'A horta da escola', imagem: '🌱',
    explicacao: 'Procure causas e resultados na história. Because introduz um motivo. Compare também o que a turma esperava com o que aconteceu.',
    vocab: [{ en: 'seed', pt: 'semente' }, { en: 'soil', pt: 'terra ou solo' }, { en: 'grow', pt: 'crescer ou cultivar' }, { en: 'patient', pt: 'paciente, que sabe esperar' }],
    texto: 'Our class wanted to grow vegetables, so we planted seeds in the school garden. At first, nothing seemed to happen. Some students wanted to add more water every hour, but our teacher explained that too much water can damage the roots. We checked the soil each morning instead. Two weeks later, small green leaves appeared. We learned that caring for plants means paying attention and being patient, not just doing more.',
    traducao: 'Nossa turma queria cultivar verduras, então plantamos sementes na horta da escola. No começo, nada parecia acontecer. Alguns alunos queriam colocar mais água a cada hora, mas a professora explicou que água demais pode danificar as raízes. Em vez disso, verificamos a terra toda manhã. Duas semanas depois, pequenas folhas verdes apareceram. Aprendemos que cuidar das plantas exige atenção e paciência, e não apenas fazer mais.',
    perguntas: [
      ['Por que não regaram a cada hora?', ['Água demais pode danificar as raízes', 'As sementes não precisavam de água', 'A turma queria desistir'], 'A professora explica que “too much water can damage the roots”. O cuidado depende da necessidade da planta.'],
      ['Qual foi a principal descoberta da turma?', ['Observar e ter paciência faz parte do cuidado', 'Toda semente cresce no mesmo dia', 'Quanto mais água, melhor'], 'A última frase resume a descoberta: prestar atenção e ser paciente também são formas de cuidar.'],
    ],
    lacuna: { frase: 'We planted a ___ in the soil.', resposta: ['seed'], explica: 'Seed é semente; soil é terra. A semente foi plantada na terra.' },
  },
  {
    id: 'adolescente-playlist', faixa: 'adolescente', nivel: 'A1', tema: 'Música e amizades', titulo: 'Uma playlist para o fim de semana', imagem: '🎵',
    explicacao: 'Use like para falar do que você gosta. Repare em quem gosta de música e no plano para o fim de semana.',
    vocab: [{ en: 'song', pt: 'canção ou música' }, { en: 'weekend', pt: 'fim de semana' }, { en: 'friend', pt: 'amigo ou amiga' }, { en: 'listen', pt: 'ouvir com atenção' }],
    texto: 'My name is Leo. I like music. My friend Mia likes music too. We have a playlist with ten songs. On Saturday, we listen to music at home. My favorite song is about friendship.',
    traducao: 'Meu nome é Leo. Eu gosto de música. Minha amiga Mia também gosta de música. Temos uma playlist com dez músicas. No sábado, ouvimos música em casa. Minha música favorita é sobre amizade.',
    perguntas: [
      ['Quantas músicas há na playlist?', ['Dez', 'Duas', 'Vinte'], '“Ten songs” são dez músicas. Ten é dez.'],
      ['Onde eles ouvem música no sábado?', ['Em casa', 'Na escola', 'Em um show'], '“At home” quer dizer “em casa”. Essa informação aparece na penúltima frase.'],
    ],
    lacuna: { frase: 'We listen to music on the ___.', resposta: ['weekend'], explica: 'Weekend é fim de semana. On the weekend é no fim de semana.' },
  },
  {
    id: 'adolescente-projeto', faixa: 'adolescente', nivel: 'A2', tema: 'Escola e projetos', titulo: 'Um projeto, várias ideias', imagem: '💡',
    explicacao: 'Ao ler uma conversa sobre um projeto, descubra quem faz cada tarefa e quando ela precisa ficar pronta.',
    vocab: [{ en: 'task', pt: 'tarefa' }, { en: 'deadline', pt: 'prazo final' }, { en: 'research', pt: 'pesquisa' }, { en: 'team', pt: 'equipe' }],
    texto: 'Our team is making a short video about recycling for school. I will research the topic, and Sara will write the script. Alex is going to edit the video. The deadline is Friday, so we are meeting on Wednesday to check our work. We have different ideas, but we listen to each other before making a decision.',
    traducao: 'Nossa equipe está fazendo um vídeo curto sobre reciclagem para a escola. Vou pesquisar o tema e Sara vai escrever o roteiro. Alex vai editar o vídeo. O prazo é sexta-feira, então vamos nos encontrar na quarta para conferir o trabalho. Temos ideias diferentes, mas ouvimos uns aos outros antes de tomar uma decisão.',
    perguntas: [
      ['Qual é a tarefa de Alex?', ['Editar o vídeo', 'Escrever o roteiro', 'Pesquisar o tema'], '“Alex is going to edit the video” conta a tarefa dele.'],
      ['Por que vão se encontrar na quarta?', ['Para conferir o trabalho antes do prazo', 'Porque o prazo já passou', 'Para escolher outra escola'], 'O prazo é sexta. A equipe marca uma revisão na quarta para se preparar.'],
    ],
    lacuna: { frase: 'The ___ is Friday.', resposta: ['deadline'], explica: 'Deadline é o prazo final para entregar uma tarefa.' },
  },
  {
    id: 'adolescente-tecnologia', faixa: 'adolescente', nivel: 'B1', tema: 'Tecnologia', titulo: 'Antes de compartilhar', imagem: '📱',
    explicacao: 'Uma leitura crítica distingue uma afirmação de uma evidência. Procure o que mudou a opinião da personagem.',
    vocab: [{ en: 'source', pt: 'fonte de informação' }, { en: 'reliable', pt: 'confiável' }, { en: 'claim', pt: 'afirmação' }, { en: 'check', pt: 'verificar ou conferir' }],
    texto: 'Nina saw a post claiming that a new app could make anyone fluent in a language in seven days. Several friends had already shared it. Before sharing it herself, she checked the source and looked for independent reviews. The post was an advertisement, and the reviews explained that regular practice was still necessary. Nina decided to send her friends a different message: a useful tool can support learning, but an exciting claim is not the same as evidence.',
    traducao: 'Nina viu uma publicação afirmando que um aplicativo poderia tornar qualquer pessoa fluente em sete dias. Vários amigos já tinham compartilhado. Antes de compartilhar, ela verificou a fonte e procurou avaliações independentes. A publicação era um anúncio e as avaliações explicavam que a prática regular continuava necessária. Nina decidiu enviar outra mensagem aos amigos: uma ferramenta útil pode apoiar a aprendizagem, mas uma afirmação empolgante não é o mesmo que uma evidência.',
    perguntas: [
      ['O que Nina fez antes de compartilhar?', ['Verificou a fonte e buscou avaliações independentes', 'Acreditou no número de compartilhamentos', 'Apagou o aplicativo dos amigos'], 'Nina procurou evidências fora da própria propaganda. O número de compartilhamentos não comprova a afirmação.'],
      ['Que conclusão o texto apoia?', ['Ferramentas ajudam, mas promessas precisam de evidências', 'Todo anúncio é verdadeiro', 'Praticar não faz diferença'], 'A última frase distingue uma promessa atraente de evidências que a sustentem.'],
    ],
    lacuna: { frase: 'Always check the ___ of a claim.', resposta: ['source'], explica: 'Source é a fonte. Verificar a fonte ajuda a avaliar uma informação.' },
  },
  {
    id: 'adulto-rotina', faixa: 'adulto', nivel: 'A1', tema: 'Cotidiano', titulo: 'Rotina e tempo para você', imagem: '☕',
    explicacao: 'Mesmo começando do zero, você pode ler um texto sobre uma rotina real. Procure horários, ações e preferências.',
    vocab: [{ en: 'walk', pt: 'caminhar ou caminhada' }, { en: 'evening', pt: 'começo da noite' }, { en: 'breakfast', pt: 'café da manhã' }, { en: 'busy', pt: 'ocupado ou com muitos compromissos' }],
    texto: 'I am Ana. I have breakfast at seven. My day is busy, but I have time for a short walk. In the evening, I read a book. On Sunday, I meet a friend for coffee.',
    traducao: 'Sou Ana. Tomo café da manhã às sete. Meu dia tem muitos compromissos, mas tenho tempo para uma caminhada curta. No começo da noite, leio um livro. No domingo, encontro uma amiga para tomar café.',
    perguntas: [
      ['A que horas Ana toma café da manhã?', ['Às sete', 'Às nove', 'À noite'], '“At seven” quer dizer “às sete”. Breakfast é café da manhã.'],
      ['O que Ana faz no domingo?', ['Encontra uma amiga para tomar café', 'Trabalha o dia todo', 'Faz uma viagem'], 'A última frase diz “On Sunday, I meet a friend for coffee”.'],
    ],
    lacuna: { frase: 'I read a book in the ___.', resposta: ['evening'], explica: 'Evening é o começo da noite. In the evening indica esse período do dia.' },
  },
  {
    id: 'adulto-viagem', faixa: 'adulto', nivel: 'A2', tema: 'Viagens', titulo: 'Uma reserva sem imprevistos', imagem: '🧳',
    explicacao: 'Em uma mensagem de viagem, procure datas, horários e condições. Algumas informações parecem pequenas, mas mudam o planejamento.',
    vocab: [{ en: 'booking', pt: 'reserva' }, { en: 'luggage', pt: 'bagagem' }, { en: 'departure', pt: 'partida' }, { en: 'available', pt: 'disponível' }],
    texto: 'Dear guest, your booking is confirmed for two nights. Check-in starts at 3 p.m. If you arrive earlier, you can leave your luggage at reception. Breakfast is available from 7 to 10 a.m. On the day of departure, please check out by 11 a.m. Let us know if you need any help with your arrival.',
    traducao: 'Prezado hóspede, sua reserva está confirmada por duas noites. O check-in começa às 15h. Se chegar antes, pode deixar a bagagem na recepção. O café da manhã está disponível das 7h às 10h. No dia da partida, faça o check-out até as 11h. Avise se precisar de ajuda com sua chegada.',
    perguntas: [
      ['O que pode fazer se chegar antes das 15h?', ['Deixar a bagagem na recepção', 'Entrar no quarto com certeza', 'Tomar café da manhã a qualquer hora'], 'A mensagem permite deixar a bagagem. Ela não promete entrada antecipada no quarto.'],
      ['Até que horas deve sair no dia da partida?', ['Até as 11h', 'Até as 15h', 'Até as 10h'], '“Check out by 11 a.m.” significa fazer o check-out até as 11h. By indica o horário limite.'],
    ],
    lacuna: { frase: 'Your ___ is confirmed.', resposta: ['booking'], explica: 'Booking é reserva. A mensagem confirma a reserva do hóspede.' },
  },
  {
    id: 'adulto-comunicacao', faixa: 'adulto', nivel: 'B1', tema: 'Trabalho e comunicação', titulo: 'Negociar prioridades com clareza', imagem: '💬',
    explicacao: 'Procure a diferença entre recusar um pedido e negociar uma solução. Identifique o problema, a proposta e o acordo.',
    vocab: [{ en: 'priority', pt: 'prioridade' }, { en: 'feedback', pt: 'retorno ou avaliação' }, { en: 'workload', pt: 'volume de trabalho' }, { en: 'deadline', pt: 'prazo final' }],
    texto: 'When a colleague asked Julia to finish an additional report by Friday, she did not immediately agree or refuse. She explained her current workload and asked which task was the highest priority. Together, they decided to move one deadline and share part of the research. Julia then sent a short message confirming the agreement. By making the trade-offs clear, she protected the quality of the work and kept the conversation constructive.',
    traducao: 'Quando um colega pediu a Julia que terminasse um relatório extra até sexta, ela não aceitou nem recusou imediatamente. Explicou seu volume de trabalho e perguntou qual tarefa tinha maior prioridade. Juntos, decidiram mudar um prazo e dividir parte da pesquisa. Julia enviou uma mensagem curta confirmando o acordo. Ao esclarecer as escolhas envolvidas, preservou a qualidade do trabalho e manteve a conversa construtiva.',
    perguntas: [
      ['Como Julia respondeu ao novo pedido?', ['Explicou sua carga de trabalho e negociou prioridades', 'Aceitou tudo sem discutir os prazos', 'Recusou falar com o colega'], 'Julia tornou a carga de trabalho visível e buscou um acordo viável.'],
      ['Para que serviu a mensagem final?', ['Para confirmar o acordo', 'Para pedir outro relatório', 'Para cancelar todas as tarefas'], '“Confirming the agreement” indica que a mensagem registra o que decidiram juntos.'],
    ],
    lacuna: { frase: 'We need to agree on the highest ___.', resposta: ['priority'], explica: 'Priority é prioridade: o que precisa vir primeiro.' },
  },
];

for (const u of UNIDADES) {
  const base = { nivel: u.nivel, faixa: u.faixa, tema: u.tema, dif: u.nivel === 'A1' ? 1 : 2 };
  u.exercicios = [
    ...u.vocab.slice(0, 2).map((v, i) => ({ ...base, id: `bib:${u.id}:v${i}`, tipo: 'escolha', habilidade: 'vocabulario', enunciado: `No tema desta aula, o que significa “${v.en}”?`, opcoes: [v.pt, u.vocab[(i + 1) % u.vocab.length].pt, u.vocab[(i + 2) % u.vocab.length].pt], resposta: 0, explica: `“${v.en}” significa “${v.pt}”. Releia o texto e observe como a palavra aparece.`, dica: 'Consulte o vocabulário da aula. Aprender o significado faz parte da atividade.' })),
    ...u.perguntas.map(([pergunta, opcoes, explica], i) => ({ ...base, id: `bib:${u.id}:l${i}`, tipo: 'leitura', habilidade: 'leitura', texto: u.texto, pergunta, opcoes, resposta: 0, explica, dica: 'Volte ao texto e procure a frase que ajuda a responder. Você pode tocar nas palavras para traduzir.' })),
    { ...base, ...u.lacuna, id: `bib:${u.id}:p`, tipo: 'lacuna', habilidade: 'vocabulario', dica: 'A palavra que falta está no vocabulário desta aula.' },
  ];
}
const POR_UNIDADE = Object.fromEntries(UNIDADES.map(u => [u.id, u]));
const BANCO_BIBLIOTECA = Object.fromEntries(UNIDADES.flatMap(u => u.exercicios.map(e => [e.id, e])));
const MISSOES_BIBLIOTECA = UNIDADES.map(u => {
  const frases = u.texto.split(/(?<=[.!?])\s+(?=[A-Z])/);
  const frase = frases.find(f => u.vocab.some(v => new RegExp('\\b' + v.en + '\\b', 'i').test(f))) || frases[0];
  const termo = u.vocab.map(v => v.en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  return { id: u.id, titulo: u.titulo, faixa: u.faixa, tema: u.tema, nivel: u.nivel, tags: [], podeFazer: `Consigo entender um texto sobre ${u.tema.toLowerCase()} e usar palavras desse tema.`,
    vocab: u.vocab.map(v => ({ ...v, ex: frases.find(f => f.toLowerCase().includes(v.en.toLowerCase())) || v.en })),
    explicacao: { titulo: u.titulo, texto: u.explicacao, estrutura: [frase] },
    exemplos: [{ en: frases[0], pt: u.traducao.split(/(?<=[.!?])\s+/)[0] }, { en: 'I like English.', pt: 'Eu gosto de inglês.' }],
    exercicios: u.exercicios.map(e => ({ ...e })),
    tarefa: { enunciado: `Escreva uma frase sobre ${u.tema.toLowerCase()} usando uma palavra nova da aula.`, minPalavras: Math.min(8, frase.split(/\s+/).length), elementos: [{ nome: 'usar uma palavra nova do tema', padroes: ['\\b(?:' + termo + ')\\b'] }], tagsChave: [], dicas: u.vocab.map(v => v.en + ' = ' + v.pt), modelo: frase },
    reteste: [`Conte algo sobre ${u.tema.toLowerCase()} com uma frase diferente da que você praticou.`, `Use uma palavra nova sobre ${u.tema.toLowerCase()} para escrever outra frase.`], conversa: 'livro-' + u.id };
});
module.exports = { UNIDADES, POR_UNIDADE, BANCO_BIBLIOTECA, MISSOES_BIBLIOTECA };
