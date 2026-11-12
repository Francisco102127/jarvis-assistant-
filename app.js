const clock=document.querySelector('#clock');
const date=document.querySelector('#date');
const message=document.querySelector('#message');
const micButton=document.querySelector('#mic');
const statusLabel=document.querySelector('#listen-status');
const chatForm=document.querySelector('#chat-form');
const textInput=document.querySelector('#text-input');
const sendButton=document.querySelector('#send');
const history=[];

function tick(){
  const now=new Date();
  if(clock) clock.textContent=now.toLocaleTimeString('es-MX',{hour12:false});
  if(date) date.textContent=now.toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
}
tick();
setInterval(tick,1000);

const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
let recognition=null;
let listening=false;
const MEMORY_KEY='jarvis-local-memory-v1';

function readMemory(){
  try{return JSON.parse(localStorage.getItem(MEMORY_KEY)||'{}');}
  catch{return {};}
}
function saveMemory(data){
  try{localStorage.setItem(MEMORY_KEY,JSON.stringify(data));}
  catch{message.textContent='No pude guardar la memoria en este navegador.';}
}
// Voz futurista inspirada en asistentes de ciencia ficción. No imita la voz exacta de una actriz.
const VOICE_KEY='jarvis-voice-name-v1';
let chosenVoiceName=localStorage.getItem(VOICE_KEY)||'';
function spanishVoices(){
  if(!('speechSynthesis' in window)) return [];
  return window.speechSynthesis.getVoices().filter(v=>/^es(-|_)/i.test(v.lang));
}
function chooseFridayStyleVoice(){
  const voices=spanishVoices();
  return voices.find(v=>v.name===chosenVoiceName)
    || voices.find(v=>/female|femenina|google español|microsoft.*(helena|elvira|sabina)|monica|paulina|lucia|maria/i.test(v.name))
    || voices.find(v=>/es-MX|es-419/i.test(v.lang))
    || voices[0]||null;
}
function populateVoiceChoices(){
  const select=document.querySelector('#voice-select');
  if(!select||!('speechSynthesis' in window)) return;
  const voices=spanishVoices();
  select.innerHTML='';
  if(!voices.length){
    const option=document.createElement('option');
    option.value='';option.textContent='No hay voces en español disponibles';
    select.appendChild(option);return;
  }
  voices.forEach(voice=>{
    const option=document.createElement('option');
    option.value=voice.name;
    option.textContent=voice.name+' ('+voice.lang+')';
    select.appendChild(option);
  });
  const preferred=voices.find(v=>v.name===chosenVoiceName)||chooseFridayStyleVoice();
  if(preferred){chosenVoiceName=preferred.name;select.value=preferred.name;localStorage.setItem(VOICE_KEY,chosenVoiceName);}
}
function speak(text){
  if(!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance=new SpeechSynthesisUtterance(text);
  const voice=chooseFridayStyleVoice();
  if(voice) utterance.voice=voice;
  utterance.lang=voice?.lang||'es-MX';
  utterance.rate=0.92;utterance.pitch=1.12;utterance.volume=1;
  window.speechSynthesis.speak(utterance);
}
if('speechSynthesis' in window){
  window.speechSynthesis.onvoiceschanged=populateVoiceChoices;
  populateVoiceChoices();
}
document.querySelector('#voice-select')?.addEventListener('change',event=>{
  chosenVoiceName=event.target.value;
  localStorage.setItem(VOICE_KEY,chosenVoiceName);
  speak('Voz del asistente actualizada. Estoy a tu servicio.');
});
document.querySelector('#test-voice')?.addEventListener('click',()=>{
  speak('Hola. Soy JARVIS. Todos mis sistemas están listos. ¿En qué puedo ayudarte?');
});
function show(text,who='JARVIS'){
  message.textContent=(who==='TÚ'?'Tú: ':'JARVIS: ')+text;
}
function normalize(text){
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
}
function calculate(q){
  const match=q.match(/(?:cuanto es|calcula|calcular|resuelve)\s+(-?\d+(?:[.,]\d+)?)\s*([+x*\-÷/])\s*(-?\d+(?:[.,]\d+)?)/);
  if(!match)return null;
  const a=Number(match[1].replace(',','.')),b=Number(match[3].replace(',','.'));
  let result;
  switch(match[2]){case '+':result=a+b;break;case '-':result=a-b;break;case 'x':case '*':result=a*b;break;case '/':case '÷':if(b===0)return 'No se puede dividir entre cero.';result=a/b;break;}
  return 'El resultado es '+Number(result.toFixed(8))+'.';
}
const APP_LINKS={
  whatsapp:{names:['whatsapp','watsap','guasap'],package:'com.whatsapp',url:'https://www.whatsapp.com/'},
  youtube:{names:['youtube','you tube'],package:'com.google.android.youtube',url:'https://www.youtube.com/'},
  chrome:{names:['chrome','google chrome'],package:'com.android.chrome',url:'https://www.google.com/chrome/'},
  maps:{names:['maps','google maps','mapas'],package:'com.google.android.apps.maps',url:'https://maps.google.com/'},
  gmail:{names:['gmail','correo'],package:'com.google.android.gm',url:'https://mail.google.com/'},
  instagram:{names:['instagram','insta'],package:'com.instagram.android',url:'https://www.instagram.com/'},
  spotify:{names:['spotify'],package:'com.spotify.music',url:'https://open.spotify.com/'},
  telegram:{names:['telegram'],package:'org.telegram.messenger',url:'https://telegram.org/'},
  facebook:{names:['facebook','face'],package:'com.facebook.katana',url:'https://www.facebook.com/'},
  tiktok:{names:['tiktok','tik tok'],package:'com.zhiliaoapp.musically',url:'https://www.tiktok.com/'}
};
function launchRequestedApp(q){
  const match=q.match(/^(?:jarvis[, ]*)?(?:abre|abrir|inicia|iniciar|ejecuta|ve a)\s+(?:la aplicacion de\s+|la app de\s+)?(.+?)[.! ]*$/);
  if(!match)return false;
  const requested=match[1].trim();
  const app=Object.entries(APP_LINKS).find(([key,item])=>key===requested||item.names.includes(requested));
  if(!app)return false;
  const [name,details]=app;
  const fallback=encodeURIComponent(details.url);
  const intent='intent://#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;package='+details.package+';S.browser_fallback_url='+fallback+';end';
  show('Encontré '+name+'. Toca el botón ABRIR '+name.toUpperCase()+' para que Android intente iniciar la aplicación.');
  let action=document.querySelector('#open-app-action');
  if(!action){
    action=document.createElement('button');
    action.id='open-app-action';
    action.type='button';
    action.className='app-launch-button';
    document.querySelector('.buttons').appendChild(action);
  }
  action.textContent='ABRIR '+name.toUpperCase();
  action.hidden=false;
  action.onclick=()=>{window.location.href=intent;};
  return true;
}

function answerTo(command){
  const q=normalize(command);
  let answer='';
  const memory=readMemory();
  history.push({role:'user',content:command});
  if(launchRequestedApp(q)) return;
  if(q.includes('olvida todo')||q.includes('borra tu memoria')){
    localStorage.removeItem(MEMORY_KEY);
    answer='He borrado los datos que había guardado en este dispositivo.';
  }else if(q.startsWith('recuerda que ')){
    const note=command.slice(command.toLowerCase().indexOf('que')+3).trim();
    memory.notes=memory.notes||[]; memory.notes.push(note); saveMemory(memory);
    answer='Lo guardaré en la memoria de este dispositivo mientras no borres los datos del navegador.';
  }else if(q.includes('que recuerdas')||q.includes('que sabes de mi')){
    const items=[memory.name?'Tu nombre es '+memory.name:null,...(memory.notes||[])];
    answer=items.filter(Boolean).length?'Esto es lo que tengo guardado: '+items.filter(Boolean).join('. '):'Todavía no tengo datos guardados. Puedes decir: recuerda que...';
  }else if(q.startsWith('me llamo ')){
    memory.name=command.slice(command.toLowerCase().indexOf('me llamo ')+9).trim(); saveMemory(memory);
    answer='Mucho gusto, '+memory.name+'. Guardé tu nombre en este dispositivo.';
  }else if(q.includes('como me llamo')||q.includes('mi nombre')){
    answer=memory.name?'Te llamas '+memory.name+'.':'Aún no me has dicho tu nombre. Puedes decir: me llamo...';
  }else if(q.includes('hora')) answer='La hora actual es '+clock.textContent+'.';
  else if(q.includes('fecha')||q.includes('que dia es')||q.includes('dia de hoy')) answer='Hoy es '+date.textContent+'.';
  else if(q.includes('hola')||q.includes('buenos dias')||q.includes('buenas tardes')||q.includes('buenas noches')) answer='Hola'+(memory.name?', '+memory.name:'')+'. Estoy listo para ayudarte.';
  else if(q.includes('tu nombre')||q.includes('quien eres')) answer='Soy JARVIS, tu asistente personal local.';
  else if(q.includes('ayuda')||q.includes('que puedes hacer')) answer='Puedo decirte la hora y fecha, hacer operaciones, guardar notas y recordar datos en este dispositivo. Mis respuestas son funciones locales, no una IA conectada a internet.';
  else if(q.includes('gracias')) answer='A tu servicio.';
  else if(q.includes('como estas')) answer='Todos mis sistemas están funcionando. ¿En qué te ayudo?';
  else if(q.includes('que es la gravedad')) answer='La gravedad es la fuerza de atracción entre los cuerpos que tienen masa. En la Tierra nos mantiene sobre el suelo.';
  else if(q.includes('que es la fotosintesis')) answer='La fotosíntesis es el proceso por el que las plantas usan luz solar, agua y dióxido de carbono para producir alimento y liberar oxígeno.';
  else if(q.includes('capital de mexico')) answer='La capital de México es la Ciudad de México.';
  else if(q.includes('capital de francia')) answer='La capital de Francia es París.';
  else answer=calculate(q)||'Aún no conozco la respuesta a eso. Puedo ayudarte con cálculos, fecha, hora y notas. Para preguntas actuales o muy específicas necesitaría consultar internet.';
  history.push({role:'assistant',content:answer});
  if(history.length>20)history.splice(0,2);
  show(answer); speak(answer);
}

function setIdle(){
  listening=false;
  statusLabel.textContent='ESPERANDO INSTRUCCIONES';
  micButton.innerHTML='🎙 ACTIVAR VOZ<small>TOCA Y HABLA</small>';
}
if(!window.isSecureContext){
  message.textContent='La conexión no es segura. Abre JARVIS desde su dirección https:// para usar el micrófono.';
}else if(!SpeechRecognition){
  message.textContent='El navegador no ofrece reconocimiento de voz. Prueba Google Chrome actualizado.';
}else{
  recognition=new SpeechRecognition();
  recognition.lang='es-MX'; recognition.continuous=false; recognition.interimResults=false; recognition.maxAlternatives=1;
  recognition.onstart=()=>{listening=true;statusLabel.textContent='ESCUCHANDO…';micButton.innerHTML='🎙 ESCUCHANDO<small>HABLA AHORA</small>';message.textContent='Te escucho…';};
  recognition.onresult=event=>{const command=event.results?.[0]?.[0]?.transcript;if(command)answerTo(command);else message.textContent='No pude reconocer las palabras. Inténtalo otra vez.';};
  recognition.onerror=event=>{
    const errors={'not-allowed':'Permiso de micrófono bloqueado. Actívalo en los permisos de Chrome.','service-not-allowed':'El servicio de voz está bloqueado. Revisa los permisos.','audio-capture':'No se encontró un micrófono disponible.','no-speech':'No detecté voz. Inténtalo otra vez.','network':'El reconocimiento de voz necesita conexión a internet.','aborted':'Se canceló la escucha. Vuelve a intentarlo.'};
    message.textContent=errors[event.error]||('Error de voz: '+event.error+'.');
  };
  recognition.onend=setIdle;
}
micButton.addEventListener('click',()=>{
  if(!recognition){message.textContent='El reconocimiento de voz no está disponible aquí. Abre JARVIS en Chrome.';return;}
  if(listening){recognition.stop();return;}
  statusLabel.textContent='INICIANDO MICRÓFONO…';message.textContent='Solicitando acceso al micrófono…';
  try{recognition.start();}catch(error){message.textContent='No se pudo iniciar. Espera unos segundos e inténtalo otra vez.';setIdle();}
});
chatForm.addEventListener('submit',event=>{
  event.preventDefault();const value=textInput.value.trim();if(!value)return;
  show(value,'TÚ');textInput.value='';answerTo(value);
});
document.querySelector('#status').addEventListener('click',()=>{
  const secure=window.isSecureContext?'Conexión segura.':'Conexión no segura.';
  const voice=recognition?'Reconocimiento de voz disponible.':'Reconocimiento de voz no disponible.';
  const speech=('speechSynthesis' in window)?'Voz de respuesta disponible.':'Voz de respuesta no disponible.';
  const info='Diagnóstico: '+secure+' '+voice+' '+speech+' '+spanishVoices().length+' voces en español detectadas. Memoria local disponible.';
  show(info);speak(info);
});
if('serviceWorker' in navigator){
  addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(error=>console.error('Service worker:',error)));
}


// Instalación PWA: muestra el aviso nativo si Chrome lo ofrece.
// Si no aparece el aviso, explica la ruta manual sin bloquear al usuario.
const installButton=document.querySelector('#install-app');
let deferredInstallPrompt=null;
function refreshInstallButton(){
  if(!installButton)return;
  const standalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  installButton.hidden=standalone;
  installButton.textContent=deferredInstallPrompt?'＋ INSTALAR JARVIS':'CÓMO INSTALAR JARVIS';
}
window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();
  deferredInstallPrompt=event;
  refreshInstallButton();
});
window.addEventListener('appinstalled',()=>{
  deferredInstallPrompt=null;
  if(installButton)installButton.hidden=true;
  show('JARVIS se instaló correctamente en este dispositivo.');
});
if(installButton){
  installButton.hidden=false;
  installButton.addEventListener('click',async()=>{
    if(deferredInstallPrompt){
      deferredInstallPrompt.prompt();
      const choice=await deferredInstallPrompt.userChoice;
      deferredInstallPrompt=null;
      if(choice?.outcome==='accepted')show('Instalación aceptada. Revisa tu pantalla de inicio.');
      else show('La instalación no se completó. Puedes intentarlo más tarde.');
      refreshInstallButton();
    }else{
      show('En Chrome, abre el menú ⋮ y selecciona “Instalar aplicación” o “Añadir a pantalla de inicio”, si aparece.');
    }
  });
}
refreshInstallButton();
