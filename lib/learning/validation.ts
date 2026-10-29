export const MODULES = ['autoconhecimento','diagnostico','percepcao-360','curriculo-ats','linkedin','entrevistas','desenvolvimento','networking','vagas'];
export const isId = (v:unknown):v is string => typeof v==='string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
export function safeLink(value:unknown, local=false) {
 const s=typeof value==='string'?value.trim():'';
 if(!s)return '';
 if(local && /^\/(?!\/)[a-zA-Z0-9/_?=.&%-]+$/.test(s)&&!s.includes('..'))return s;
 try { const u=new URL(s); if(u.protocol==='https:'&&!u.username&&!u.password)return u.href; } catch {}
 throw new Error('Informe um endereço HTTPS válido.');
}
export function mediaFor(value:unknown):{kind:'video'|'iframe';url:string}|null {
 if(!value)return null;
 const u=new URL(safeLink(value));
 const host=u.hostname.toLowerCase();
 if(['youtube.com','www.youtube.com','youtu.be','www.youtube-nocookie.com'].includes(host)) {
  const id=host==='youtu.be'?u.pathname.slice(1):u.searchParams.get('v')||u.pathname.split('/').pop();
  if(id&&/^[\w-]{11}$/.test(id))return {kind:'iframe',url:`https://www.youtube-nocookie.com/embed/${id}`};
 } else if(['vimeo.com','www.vimeo.com','player.vimeo.com'].includes(host)) {
  const id=u.pathname.match(/(?:video\/)?(\d+)/)?.[1];
  if(id)return {kind:'iframe',url:`https://player.vimeo.com/video/${id}${u.searchParams.has('h')?'?h='+encodeURIComponent(u.searchParams.get('h')!):''}`};
 } else if(host==='drive.google.com') {
  const id=u.pathname.match(/^\/file\/d\/([\w-]+)/)?.[1];
  if(id)return {kind:'iframe',url:`https://drive.google.com/file/d/${id}/preview`};
 } else if(/\.(mp4|webm)$/i.test(u.pathname))return {kind:'video',url:u.href};
 throw new Error('Use um vídeo individual do YouTube, Vimeo ou Drive, ou um arquivo MP4/WebM HTTPS. Pastas não são vídeos.');
}
function txt(v:unknown,min:number,max:number){if(typeof v!=='string'||v.trim().length<min||v.length>max)throw new Error(`Preencha o texto com ${min} a ${max} caracteres.`);return v.trim();}
function num(v:unknown,min:number,max:number){const n=Number(v);if(!Number.isInteger(n)||n<min||n>max)throw new Error('Número fora do intervalo permitido.');return n;}
export function parseCourse(b:Record<string,unknown>) {
 const requiredModule=typeof b.required_module==='string'&&b.required_module?b.required_module:null;
 if(requiredModule!==null&&!MODULES.includes(String(requiredModule)))throw new Error('Módulo de acesso inválido.');
 return {title:txt(b.title,3,150),description:txt(b.description,10,1500),category:txt(b.category,2,80),cover_url:safeLink(b.cover_url,true),required_module:requiredModule,published:b.published===true,position:num(b.position??0,0,10000)};
}
export function parseLesson(b:Record<string,unknown>) {
 if(!isId(b.course_id))throw new Error('Selecione uma trilha.');
 const options=Array.isArray(b.quiz_options)?b.quiz_options.map(x=>txt(x,1,300)):[];
 if(options.length<2||options.length>5)throw new Error('Cadastre de 2 a 5 alternativas.');
 const answer=num(b.quiz_answer,0,options.length-1);mediaFor(b.media_url);
 return {course_id:b.course_id,title:txt(b.title,3,150),module_title:txt(b.module_title,3,120),summary:txt(b.summary,10,600),body:txt(b.body,30,30000),exercise:txt(b.exercise,10,2000),quiz_question:txt(b.quiz_question,10,1000),quiz_options:options,quiz_answer:answer,media_url:safeLink(b.media_url),material_url:safeLink(b.material_url),duration_minutes:num(b.duration_minutes,1,240),position:num(b.position??0,0,10000),published:b.published===true};
}
