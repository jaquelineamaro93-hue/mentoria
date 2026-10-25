'use client';
import { useLocale } from '@/components/LocaleProvider';
import manifest from '@/public/cases/video-manifest.json';

type Locale = 'pt-BR' | 'es-419' | 'en';
type CaseVideo = {
  id: string;
  name: string;
  title: Record<Locale, string>;
  src: string;
  poster?: string;
  captions: Partial<Record<Locale, string>>;
  authorized: boolean;
};
const allowedMedia=(v:string,kind:'video'|'poster'|'caption')=>{
  const pattern=kind==='video'?/^\/cases\/videos\/[a-z0-9-]+\.mp4$/:
    kind==='poster'?/^\/cases\/videos\/[a-z0-9-]+\.(?:webp|png|jpg)$/:
    /^\/cases\/videos\/[a-z0-9-]+\.(?:vtt)$/;
  return pattern.test(v);
};
const reviewed=(manifest.videos as CaseVideo[]).filter(video=>
  video.authorized===true && typeof video.id==='string' && typeof video.name==='string' &&
  allowedMedia(video.src,'video') && !!video.title?.['pt-BR'] &&
  !!video.title?.['es-419'] && !!video.title?.en);
export default function CaseVideoShowcase(){
  const {locale}=useLocale();
  if(reviewed.length===0)return null;
  const text=locale==='en'
    ? {heading:'Watch their stories',context:'Original accounts, shared with permission.'}
    : locale==='es-419'
    ? {heading:'Conoce sus historias en video',context:'Relatos originales compartidos con autorización.'}
    : {heading:'Assista às histórias',context:'Relatos originais compartilhados com autorização.'};
  return <section className="border-t border-[#DBE8E0] bg-white px-5 py-14" aria-label={text.heading}>
    <div className="mx-auto max-w-6xl"><h2 className="font-display text-3xl text-[#13211D]">{text.heading}</h2>
      <p className="mt-2 text-sm text-[#55665e]">{text.context}</p>
      <div className="mt-7 grid gap-6 md:grid-cols-2">
      {reviewed.map(video=><figure key={video.id} className="overflow-hidden rounded-2xl border border-[#D8E5DF] bg-[#F6FAF7]">
        <video controls preload="metadata" playsInline poster={allowedMedia(video.poster||'','poster')?video.poster:undefined}
          className="aspect-video w-full bg-[#12221c]" aria-label={video.title[locale]}>
          <source src={video.src} type="video/mp4"/>
          {(Object.entries(video.captions||{}) as [Locale,string][]).filter(([,src])=>allowedMedia(src,'caption')).map(([lang,src])=>
            <track key={lang} kind="subtitles" srcLang={lang} label={lang} src={src} default={lang===locale}/>)}
        </video>
        <figcaption className="px-5 py-4"><strong className="block text-[#13211D]">{video.title[locale]}</strong><span className="text-sm text-[#55665e]">{video.name}</span></figcaption>
      </figure>)}
      </div>
    </div>
  </section>;
}