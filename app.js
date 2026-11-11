const clock=document.querySelector('#clock');
const date=document.querySelector('#date');
const message=document.querySelector('#message');
const micButton=document.querySelector('#mic');
const statusLabel=document.querySelector('#listen-status');

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

function speak(text){
  if(!('speechSynthesis' in window)){
    message.textContent=text+' (La voz de respuesta no está disponible en este navegador.)';
    return;
  }
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
  else if(q.includes('ayuda')||q.includes('que puedes hacer')) answer='Por ahora puedo decirte la hora, la fecha y responder algunos comandos básicos.';
  else if(q.includes('gracias')) answer='A tu servicio.';
  else answer='He recibido tu mensaje: '+command+'. Todavía estoy aprendiendo a responder solicitudes más complejas.';
  message.textContent=answer;
  speak(answer);
}

function setIdle(){
  listening=false;
  statusLabel.textContent='ESPERANDO INSTRUCCIONES';
  micButton.innerHTML='🎙 ACTIVAR VOZ<small>TOCA Y HABLA</small>';
}

if(!window.isSecureContext){
  message.textContent='La conexión no es segura. Abre JARVIS desde su dirección https:// para usar el micrófono.';
}else if(!SpeechRecognition){
  message.textContent='Este navegador no ofrece reconocimiento de voz. Abre el enlace en Google Chrome actualizado, no desde el navegador interno de otra aplicación.';
}else{
  recognition=new SpeechRecognition();
  recognition.lang='es-MX';
  recognition.continuous=false;
  recognition.interimResults=false;
  recognition.maxAlternatives=1;

  recognition.onstart=()=>{
    listening=true;
    statusLabel.textContent='ESCUCHANDO…';
    micButton.innerHTML='🎙 ESCUCHANDO<small>HABLA AHORA</small>';
    message.textContent='Te escucho. Di un comando corto.';
  };
  recognition.onresult=(event)=>{
    const command=event.results?.[0]?.[0]?.transcript;
    if(command) answerTo(command);
    else message.textContent='No pude reconocer las palabras. Inténtalo otra vez.';
  };
  recognition.onerror=(event)=>{
    const errors={
      'not-allowed':'Permiso de micrófono bloqueado. Actívalo en los permisos del sitio de Chrome.',
      'service-not-allowed':'El servicio de voz está bloqueado. Revisa los permisos y prueba Chrome.',
      'audio-capture':'No se encontró un micrófono disponible.',
      'no-speech':'No detecté voz. Pulsa el botón e inténtalo otra vez.',
      'network':'El servicio de reconocimiento necesita conexión a internet.',
      'aborted':'Se canceló la escucha. Vuelve a intentarlo.'
    };
    message.textContent=errors[event.error]||('Error de voz: '+event.error+'.');
  };
  recognition.onend=setIdle;
}

micButton.addEventListener('click',()=>{
  if(!recognition){
    message.textContent='El reconocimiento de voz no está disponible aquí. Abre JARVIS en Google Chrome actualizado.';
    return;
  }
  if(listening){
    recognition.stop();
    return;
  }
  statusLabel.textContent='INICIANDO MICRÓFONO…';
  message.textContent='Solicitando acceso al micrófono…';
  try{
    recognition.start();
  }catch(error){
    message.textContent='No se pudo iniciar ('+error.name+'). Espera unos segundos y vuelve a tocar el botón.';
    setIdle();
  }
});

document.querySelector('#status').addEventListener('click',()=>{
  const secure=window.isSecureContext?'Conexión segura.':'Conexión no segura.';
  const voice=recognition?'Reconocimiento de voz disponible.':'Reconocimiento de voz no disponible en este navegador.';
  const speech=('speechSynthesis' in window)?'Voz de respuesta disponible.':'Voz de respuesta no disponible.';
  message.textContent='Diagnóstico: '+secure+' '+voice+' '+speech;
  if('speechSynthesis' in window) speak('Diagnóstico del sistema. '+secure+' '+voice+' '+speech);
});

if('serviceWorker' in navigator){
  addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(error=>console.error('Service worker:',error)));
}
