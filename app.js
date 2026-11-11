const clock=document.querySelector('#clock');
const date=document.querySelector('#date');
const message=document.querySelector('#message');
const micButton=document.querySelector('#mic');
const statusLabel=document.querySelector('#listen-status');

function tick(){
  const now=new Date();
  clock.textContent=now.toLocaleTimeString('es-MX',{hour12:false});
  date.textContent=now.toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
}
tick();
setInterval(tick,1000);

const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
let recognition=null;
let listening=false;

function speak(text){
  if(!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance=new SpeechSynthesisUtterance(text);
  utterance.lang='es-MX';
  utterance.rate=0.96;
  utterance.pitch=0.88;
  window.speechSynthesis.speak(utterance);
}

function answerTo(command){
  const q=command.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  let answer;
  if(q.includes('hora')) answer='La hora actual es '+clock.textContent+'.';
  else if(q.includes('fecha')||q.includes('dia es')) answer='Hoy es '+date.textContent+'.';
  else if(q.includes('hola')||q.includes('buenos dias')||q.includes('buenas tardes')) answer='Hola. Estoy listo para ayudarte. ¿Qué necesitas?';
  else if(q.includes('tu nombre')||q.includes('quien eres')) answer='Soy JARVIS, tu asistente personal.';
  else if(q.includes('ayuda')||q.includes('que puedes hacer')) answer='Por ahora puedo decirte la hora, la fecha y responder algunos comandos básicos. Mi inteligencia ampliada se conectará en otra etapa.';
  else if(q.includes('gracias')) answer='A tu servicio.';
  else answer='He recibido tu mensaje: '+command+'. Todavía estoy aprendiendo a responder solicitudes más complejas.';
  message.textContent=answer;
  speak(answer);
}

if(SpeechRecognition){
  recognition=new SpeechRecognition();
  recognition.lang='es-MX';
  recognition.continuous=false;
  recognition.interimResults=false;
  recognition.onstart=()=>{
    listening=true;
    statusLabel.textContent='ESCUCHANDO…';
    micButton.innerHTML='🎙 ESCUCHANDO<small>HABLA AHORA</small>';
    message.textContent='Te escucho. Di un comando corto.';
  };
  recognition.onresult=(event)=>{
    const command=event.results[0][0].transcript;
    message.textContent='Tú: '+command;
    answerTo(command);
  };
  recognition.onerror=(event)=>{
    const errors={
      'not-allowed':'No se permitió el micrófono. Revisa los permisos del sitio en Chrome.',
      'audio-capture':'No se encontró un micrófono disponible.',
      'no-speech':'No detecté voz. Pulsa el micrófono e inténtalo otra vez.'
    };
    message.textContent=errors[event.error]||'No pude escuchar. Inténtalo de nuevo.';
  };
  recognition.onend=()=>{
    listening=false;
    statusLabel.textContent='ESPERANDO INSTRUCCIONES';
    micButton.innerHTML='🎙 ACTIVAR VOZ<small>TOCA Y HABLA</small>';
  };
}else{
  micButton.disabled=true;
  message.textContent='Tu navegador no admite reconocimiento de voz. Abre JARVIS con Google Chrome actualizado.';
}

micButton.addEventListener('click',()=>{
  if(!recognition) return;
  if(listening){recognition.stop();return;}
  try{recognition.start();}
  catch(error){message.textContent='Espera un momento y vuelve a tocar el micrófono.';}
});

document.querySelector('#status').addEventListener('click',()=>{
  const voice=recognition?'Reconocimiento de voz disponible.':'Reconocimiento de voz no disponible en este navegador.';
  const speech=('speechSynthesis' in window)?'Voz de respuesta disponible.':'Voz de respuesta no disponible.';
  message.textContent='Estado: interfaz cargada. '+voice+' '+speech;
  speak('Estado del sistema. '+voice+' '+speech);
});

if('serviceWorker' in navigator){
  addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(console.error));
}