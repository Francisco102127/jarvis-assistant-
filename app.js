const clock=document.querySelector('#clock'),date=document.querySelector('#date'),message=document.querySelector('#message');
function tick(){const now=new Date();clock.textContent=now.toLocaleTimeString('es-MX',{hour12:false});date.textContent=now.toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long',year:'numeric'});}
tick();setInterval(tick,1000);
document.querySelector('#mic').addEventListener('click',()=>{message.textContent='El micrófono se habilitará en la etapa 2. Esta versión contiene la interfaz visual inicial.';});
document.querySelector('#status').addEventListener('click',()=>{message.textContent='Estado: interfaz cargada. Reloj activo. Voz e inteligencia artificial: pendientes de configuración.';});
if('serviceWorker'in navigator){addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(console.error));}