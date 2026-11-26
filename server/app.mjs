import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import nodemailer from 'nodemailer';

export function createApp({env=process.env,sendMail,now=Date.now}={}){
 const base='/' + (env.SITE_BASE_PATH || '/big-site/').replace(/^\/+|\/+$/g,'') + '/';
 const prefix=base==='//'?'/':base;
 const origins=(env.ALLOWED_ORIGINS||'http://127.0.0.1:4175,http://localhost:4175').split(',').map(s=>s.trim());
 const ready=Boolean(env.SMTP_HOST&&env.MAIL_FROM&&env.LEAD_EMAIL);
 const transport=ready?nodemailer.createTransport({host:env.SMTP_HOST,port:Number(env.SMTP_PORT||465),secure:env.SMTP_SECURE!=='false',requireTLS:env.SMTP_SECURE==='false',auth:env.SMTP_USER?{user:env.SMTP_USER,pass:env.SMTP_PASS}:undefined,connectionTimeout:8000,greetingTimeout:8000,socketTimeout:12000}):null;
 const send=sendMail||(transport?(m=>transport.sendMail(m)):null);
 const rate=new Map(),sent=new Map();
 const root=resolve(fileURLToPath(new URL('../dist/client',import.meta.url)));
 const json=(res,status,body)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(body))};
 const clean=(v,max)=>typeof v==='string'?v.trim().slice(0,max):'';
 return http.createServer(async(req,res)=>{
  try{
   const url=new URL(req.url,'http://local');
   if(url.pathname===`${prefix}api/health`&&req.method==='GET')return json(res,200,{ok:true,mailConfigured:Boolean(send)});
   if(url.pathname===`${prefix}api/leads`){
    if(req.method!=='POST')return json(res,405,{error:'Метод не поддерживается.'});
    if(!origins.includes(req.headers.origin))return json(res,403,{error:'Недопустимый источник запроса.'});
    if(!req.headers['content-type']?.startsWith('application/json'))return json(res,415,{error:'Неверный формат запроса.'});
    const ip=env.TRUST_PROXY==='true'?String(req.headers['x-real-ip']||req.socket.remoteAddress):req.socket.remoteAddress;
    for(const [key,item] of rate)if(item.until<now())rate.delete(key);
    for(const [key,item] of sent)if(item.until<now())sent.delete(key);
    if(rate.size>10000||sent.size>10000)return json(res,503,{error:'Сервис занят. Позвоните: 8 916 098 18 91.'});
    const count=rate.get(ip)||{count:0,until:now()+600000};
    if(count.count>=5)return json(res,429,{error:'Слишком много обращений. Попробуйте позже или позвоните: 8 916 098 18 91.'});
    count.count++;rate.set(ip,count);
    let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>12000)return json(res,413,{error:'Обращение слишком длинное.'});}
    let data;try{data=JSON.parse(raw)}catch{return json(res,400,{error:'Неверный формат обращения.'})}
    if(!data||Array.isArray(data)||typeof data!=='object')return json(res,400,{error:'Неверный формат обращения.'});
    const digits=clean(data.phone,24).replace(/\D/g,'');
    if(!/^[78]\d{10}$/.test(digits)||data.consent!=='yes')return json(res,400,{error:'Укажите телефон и согласие на обработку обращения.'});
    if(data.website||!Number.isFinite(data.started)||now()-data.started<1500)return json(res,400,{error:'Не удалось отправить. Проверьте данные и попробуйте ещё раз.'});
    if(!/^[a-f0-9-]{36}$/i.test(data.id||''))return json(res,400,{error:'Обновите страницу и попробуйте снова.'});
    if(!send)return json(res,503,{error:'Форма временно недоступна. Позвоните нам: 8 916 098 18 91.'});
    if(sent.has(data.id)){const result=await sent.get(data.id).promise;return json(res,result?200:502,result?{ok:true}:{error:'Письмо не отправлено. Позвоните: 8 916 098 18 91.'});}
    const utm=data.utm&&typeof data.utm==='object'?Object.entries(data.utm).filter(([k])=>/^utm_(source|medium|campaign|term|content)$/.test(k)).map(([k,v])=>`${k}: ${clean(v,200)}`).join('\n'):'';
    const text=[`Заявка The Big One Garage`,`Номер: ${data.id}`,`Имя: ${clean(data.name,80)||"Не указано"}`,`Телефон: +7${digits.slice(1)}`,`Автомобиль: ${clean(data.car,120)||'Не указан'}`,`Услуга: ${clean(data.service,120)||'Консультация'}`,`Сообщение: ${clean(data.message,2000)||'Не указано'}`,`Страница: ${clean(data.source,300)}`,utm,`Согласие на обработку обращения: да`,`Дата: ${new Date(now()).toISOString()}`].filter(Boolean).join('\n\n');
    const promise=send({from:env.MAIL_FROM,to:env.LEAD_EMAIL,subject:'Заявка с сайта The Big One Garage',text}).then(result=>{if(result.rejected?.length||!result.accepted?.length)throw new Error('SMTP rejected');return true}).catch(()=>false);
    sent.set(data.id,{until:now()+3600000,promise});const ok=await promise;if(!ok)sent.delete(data.id);
    return json(res,ok?200:502,ok?{ok:true}:{error:'Не удалось отправить письмо. Позвоните: 8 916 098 18 91.'});
   }
   if(!['GET','HEAD'].includes(req.method))return json(res,405,{error:'Метод не поддерживается.'});
   if(prefix!=='/'&&url.pathname===prefix.slice(0,-1)){res.writeHead(308,{Location:prefix});return res.end();}
   if(!url.pathname.startsWith(prefix))return json(res,404,{error:'Страница не найдена.'});
   const relative=decodeURIComponent(url.pathname.slice(prefix.length))||'index.html';const path=resolve(root,relative);
   if(!path.startsWith(root+sep)||relative.split('/').some(p=>p.startsWith('.')))return json(res,404,{error:'Страница не найдена.'});
   const info=await stat(path);if(!info.isFile())return json(res,404,{error:'Страница не найдена.'});
   const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.json':'application/json; charset=utf-8','.woff2':'font/woff2','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8'};
   res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Cache-Control':extname(path)==='.html'?'no-cache':'public, max-age=3600'});res.end(req.method==='HEAD'?undefined:await readFile(path));
  }catch(error){if(!res.headersSent)json(res,error.code==='ENOENT'?404:500,{error:'Не удалось обработать запрос.'});else res.end();}
 });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{process.loadEnvFile?.('.env')}catch(error){if(error.code!=='ENOENT')throw error}
 const server=createApp();server.listen(Number(process.env.PORT||5191),process.env.HOST||'127.0.0.1',()=>console.log(`Big One server: http://${process.env.HOST||'127.0.0.1'}:${process.env.PORT||5191}${process.env.SITE_BASE_PATH||'/big-site/'}`));
}
