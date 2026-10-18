const fs=require('fs'),V='/tmp/claude-0/-home-user/514de742-2b0f-59c3-ad71-ff918c01b019/scratchpad/voz/novos/',D='/home/user/appingles/public/assets/audio/tuiuiu/';
const mapa=JSON.parse(fs.readFileSync(D+'mapa.json','utf8'));let n=0;
for(const f of fs.readdirSync(V).filter(x=>x.endsWith('.json'))){
  const j=JSON.parse(fs.readFileSync(V+f,'utf8')),mp3=V+j.arq;
  if(!fs.existsSync(mp3)) continue;
  fs.copyFileSync(mp3,D+j.arq);mapa[(j.lang==='pt'?'pt:':'')+j.texto]=j.arq;n++;
}
fs.writeFileSync(D+'mapa.json',JSON.stringify(mapa));console.log('integrados',n,'total',Object.keys(mapa).length);
