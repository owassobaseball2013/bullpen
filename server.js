const express=require('express'),http=require('http'),fs=require('fs'),{WebSocketServer}=require('ws');
const KEY=process.env.CONTROL_KEY||'changeme',F=process.env.DATA_FILE||'data.json';
let games={};try{games=JSON.parse(fs.readFileSync(F))}catch{}
const app=express();app.use(express.static('public',{etag:false,lastModified:false,setHeaders:r=>r.setHeader('Cache-Control','no-store')}));app.get('/',(_,r)=>r.redirect('/control.html'));
const srv=http.createServer(app),wss=new WebSocketServer({server:srv,path:'/ws',maxPayload:5e6});
let t;const save=()=>{clearTimeout(t);t=setTimeout(()=>fs.writeFile(F,JSON.stringify(games),()=>{}),500)};
wss.on('connection',(ws,req)=>{
  const u=new URL(req.url,'http://x'),g=(u.searchParams.get('g')||'main').slice(0,40),ctl=u.searchParams.get('key')===KEY;
  ws.g=g;ws.send(JSON.stringify({state:games[g]||null,ctl}));
  ws.on('message',d=>{if(!ctl)return;let m;try{m=JSON.parse(d)}catch{return}
    if(!m.state)return;games[g]=m.state;save();
    wss.clients.forEach(c=>{if(c!==ws&&c.g===g&&c.readyState===1)c.send(JSON.stringify({state:m.state}))})});
});
srv.listen(process.env.PORT||3000,()=>console.log('Bullpen running'));
