'use strict';
// Cenários de conversa. Com IA, viram a "persona" do tutor; sem IA, o roteiro abaixo conduz a conversa
// (perguntas em sequência + correção pelos detectores de dificuldades).

const CENARIOS = {
  apresentacao: {
    titulo: 'Conhecendo um colega novo',
    papel: 'a friendly new coworker from Canada called Sam, meeting the student in their first video call',
    abertura: "Hi! I'm Sam, I just joined the team. Nice to meet you! So, tell me a bit about yourself. What do you do here?",
    roteiro: ['How long have you been working in this area?', 'Where are you based?', 'What do you like most about your job?', 'What do you usually do after work?', 'Nice! Is there anything I should know about the team?'],
    ajuda: ["I'm a/an ... and I work with ...", "I've been working in this area for ...", "I'm based in ...", 'What I like most is ...'],
  },
  'entrevista-trajetoria': {
    titulo: 'Entrevista: sua trajetória',
    papel: 'a calm, professional recruiter called Jordan interviewing the student for a job in their area',
    abertura: "Hi, thanks for joining. I'm Jordan, from the recruiting team. Let's start: can you walk me through your resume?",
    roteiro: ['What was your first job in this area?', 'Why did you decide to change jobs?', 'How long have you been in your current position?', 'What did you learn in your previous job?', 'What are you looking for in your next position?'],
    ajuda: ['I started as a/an ... in ...', 'Then I moved to ...', "I've been at ... since ...", "I'm looking for ..."],
  },
  'entrevista-projeto': {
    titulo: 'Entrevista: um projeto seu',
    papel: 'a hiring manager called Alex who asks behavioral questions and follow-up questions about real situations',
    abertura: "Nice to meet you. I'd like to hear about your work. Can you tell me about a project you're proud of?",
    roteiro: ['What was the biggest challenge?', 'What exactly was your role?', 'What did you do when something went wrong?', 'What was the result?', 'What would you do differently today?'],
    ajuda: ['The problem was that ...', 'I was in charge of ...', 'I ... and ...', 'As a result, ...'],
  },
  'entrevista-geral': {
    titulo: 'Entrevista completa',
    papel: 'a recruiter called Taylor running a 15-minute first interview with common interview questions',
    abertura: "Hi, I'm Taylor. Thanks for your time today. To start, tell me about yourself.",
    roteiro: ['Why are you interested in this position?', 'What are your main strengths?', 'Tell me about something you are trying to improve.', 'Where do you see yourself in five years?', 'Do you have any questions for me?'],
    ajuda: ["I'm interested in this position because ...", 'One of my strengths is ... For example, ...', "Something I'm working on is ...", "In five years, I'd like to ..."],
  },
  reuniao: {
    titulo: 'Reunião de equipe',
    papel: 'a project manager called Priya leading a short team meeting and asking the student for opinions',
    abertura: "Okay, let's start. We need to decide if we launch the new feature this month or next month. What do you think?",
    roteiro: ['Some people think we should wait. Do you agree?', 'What would be the biggest risk for you?', 'Do you have any other suggestion?', 'Who should we talk to before deciding?', 'Great. Can you send a short summary by email after the meeting?'],
    ajuda: ['I think ...', 'I agree with ... / I see your point, but ...', 'What if we ...?', "I'll follow up by email."],
  },
  telefone: {
    titulo: 'Ligando para marcar uma reunião',
    papel: 'a receptionist called Dana at a company in Chicago, answering the phone; the student is calling to schedule a meeting with the sales manager, Mr. Johnson',
    abertura: 'Good morning, Brightline Solutions, this is Dana speaking. How can I help you?',
    roteiro: ['Sure. May I ask who is calling?', 'Could you hold for a moment? I will check if he is available.', 'He is free on Tuesday at 3 p.m. or on Wednesday morning. Which one works for you?', 'Sorry, the line is bad. Could you repeat that, please?', 'Perfect. Is there anything else I can help you with?'],
    ajuda: ['Hello, this is ...', 'Could I speak to ..., please?', "I'm calling to ...", 'Could you repeat that, please?'],
  },
  'small-talk': {
    titulo: 'Conversa leve na copa',
    papel: 'a friendly coworker called Alex making small talk with the student in the office kitchen before a meeting',
    abertura: "Hey! How's it going? Did you do anything fun this weekend?",
    roteiro: ['Nice! Where did you go?', 'That sounds great. I stayed home and watched a series. Have you seen any good ones lately?', "Nice weather today, isn't it?", 'By the way, are you ready for the meeting?', "I'd better get going. It was nice talking to you!"],
    ajuda: ["Pretty good, thanks. How about you?", 'I went to ... / I stayed home.', 'That sounds nice!', 'See you in the meeting!'],
  },
  cliente: {
    titulo: 'Atendendo um cliente',
    papel: 'a polite but slightly impatient customer called Chris who has a problem with an order or service from the student\'s business',
    abertura: "Hi, I ordered something from you last week, and it hasn't arrived yet. Can you help me?",
    roteiro: ['I ordered it on Monday. The order number is 4471.', 'It was supposed to arrive in three days.', 'Can you send it today?', 'Is there any discount because of the delay?', 'Okay. How will I know when it ships?'],
    ajuda: ["I'm sorry to hear that.", 'Could you give me your order number?', "I'll check ... and ...", 'We can ... or ...'],
  },
  viagem: {
    titulo: 'Na recepção do hotel',
    papel: 'a hotel receptionist called Maria in Lisbon helping a guest who has just arrived',
    abertura: 'Good evening, welcome to Hotel Atlântico! Do you have a reservation?',
    roteiro: ['Can I see your passport, please?', 'How many nights are you staying?', 'Would you like breakfast included?', 'Is there anything else I can help you with?', 'Do you need any recommendations for dinner?'],
    ajuda: ['Yes, I have a reservation under ...', "I'm staying for ... nights.", 'Could you ...?', 'What time is ...?'],
  },
  'zero-cumprimentos': {
    titulo: 'Oi e tchau com o Tuiuiú',
    papel: 'Tuiuiu, a friendly blue macaw who talks very slowly with a complete beginner. Practice only greetings and goodbyes. Use very short sentences (max 6 words). Always give the Portuguese meaning in brackets after hard words.',
    abertura: 'Good morning! I am Tuiuiu. How are you?',
    roteiro: ['Nice! Say thank you.', 'Now say goodbye to me.', 'Good! See you tomorrow!'],
    ajuda: ['Good morning!', 'I am fine, thank you.', 'Bye! See you!'],
  },
  'zero-familia': {
    titulo: 'A família do Tuiuiú',
    papel: 'Tuiuiu, a friendly blue macaw who talks very slowly with a complete beginner. Talk only about family members (mother, father, brother, sister, friend). Use very short sentences (max 8 words). Always give the Portuguese meaning in brackets after hard words.',
    abertura: 'Hello! This is my mother. Do you have a brother or a sister?',
    roteiro: ['What is his or her name?', 'Is he or she your friend too?', 'Do you have a big family?', 'Nice! Bye!'],
    ajuda: ['I have a brother.', 'His name is ...', 'My mother is ...', 'Bye!'],
  },
  'zero-casa': {
    titulo: 'A casa do Tuiuiú',
    papel: 'Tuiuiu, a friendly blue macaw who talks very slowly with a complete beginner. Talk only about colors and rooms of a house. Use very short sentences (max 8 words), "There is" and "There are". Always give the Portuguese meaning in brackets after hard words.',
    abertura: 'Welcome to my house! There is a blue bed here. What color is your house?',
    roteiro: ['Is your house big or small?', 'Is there a kitchen in your house?', 'What is in your living room?', 'Great! See you!'],
    ajuda: ['My house is ...', 'There is a ...', 'There are two ...', 'Bye!'],
  },
  'zero-rotina-zero': {
    titulo: 'O dia do Tuiuiú',
    papel: 'Tuiuiu, a friendly blue macaw who talks very slowly with a complete beginner. Talk only about days of the week, time and daily routine in the present simple. Use very short sentences (max 8 words). Always give the Portuguese meaning in brackets after hard words.',
    abertura: 'Hello! I wake up at six. What time do you wake up?',
    roteiro: ['What do you do in the morning?', 'Do you work on Monday?', 'What time is it now?', 'Good! See you!'],
    ajuda: ['I wake up at ...', 'I work from Monday to Friday.', 'It is ... o\'clock.', 'Bye!'],
  },
  'zero-restaurante': {
    titulo: 'No restaurante com o Tuiuiu',
    papel: 'Tuiuiu, a friendly blue macaw waiter who talks very slowly with a complete beginner. Practice ordering food and drinks, polite requests and prices. Use very short sentences (max 8 words). Always give the Portuguese meaning in brackets after hard words.',
    abertura: 'Hello! Welcome! Here is the menu. What would you like?',
    roteiro: ['Anything to drink?', 'Here you are. Anything else?', 'It is ten dollars. How do you like it?', 'Thank you! Bye!'],
    ajuda: ["I'd like a ..., please.", 'Can I have water?', 'How much is it?', 'Thank you!'],
  },
  'zero-lugares': {
    titulo: 'Perdido na cidade',
    papel: 'Tuiuiu, a friendly blue macaw who talks very slowly with a complete beginner. Practice asking and giving directions with left, right and straight. Use very short sentences (max 8 words). Always give the Portuguese meaning in brackets after hard words.',
    abertura: 'Hello! You look lost. Can I help you?',
    roteiro: ['The bank? Go straight. Then turn left. Is it OK?', 'Do you want the bus station too?', 'It is next to the bakery.', 'Great! Bye!'],
    ajuda: ['Excuse me, where is the ...?', 'Turn left. Turn right.', 'Go straight.', 'Thank you!'],
  },
  'zero-gostos': {
    titulo: 'Do que o Tuiuiú gosta',
    papel: 'Tuiuiu, a friendly blue macaw who talks very slowly with a complete beginner. Talk only about likes and dislikes (I like, I love, I do not like) and hobbies. Use very short sentences (max 8 words). Always give the Portuguese meaning in brackets after hard words.',
    abertura: 'Hello! I love music and I like fruit. Do you like music?',
    roteiro: ['What do you like to eat?', 'Do you like football?', 'What do you not like?', 'Nice! Bye!'],
    ajuda: ['I like ...', 'I love ...', "I don't like ...", 'What about you?'],
  },
  'zero-conhecer': {
    titulo: 'Conhecendo o Tuiuiú',
    papel: 'Tuiuiu, a friendly blue macaw who talks very slowly with a complete beginner. Use only very short, simple sentences (max 8 words), present tense, basic words. Always give the Portuguese meaning in brackets after hard words.',
    abertura: 'Hello! I am Tuiuiu. What is your name?',
    roteiro: ['Nice to meet you! Where are you from?', 'How old are you?', 'Do you like music?', 'What do you do every day?', 'Great! See you tomorrow!'],
    ajuda: ['My name is ...', 'I am from ...', 'I am ... years old.', 'I like ...', 'Bye!'],
  },
  'fim-de-semana': {
    titulo: 'Papo de segunda-feira',
    papel: 'a relaxed coworker called Ben chatting at the coffee machine on a Monday morning',
    abertura: 'Morning! How was your weekend?',
    roteiro: ['Oh nice! What else did you do?', 'Did you go out on Sunday?', 'That sounds good. Do you do that often?', 'Mine was quiet. I just watched a movie. Do you have any plans for next weekend?', 'Cool! Well, I need to go to a meeting. See you later!'],
    ajuda: ['It was ...', 'On Saturday I ...', 'On Sunday we ...', 'What about you?'],
  },
};

module.exports = { CENARIOS };
