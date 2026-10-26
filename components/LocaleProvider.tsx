'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type SiteLocale = 'pt-BR' | 'es-419' | 'en';
const Context = createContext<{locale:SiteLocale;setLocale:(value:SiteLocale)=>void}>({locale:'pt-BR',setLocale:()=>{}});
const values: SiteLocale[] = ['pt-BR','es-419','en'];
export function localePreference(): SiteLocale {
  if (typeof window === 'undefined') return 'pt-BR';
  try { const v=window.localStorage.getItem('soma:locale'); return values.includes(v as SiteLocale)?v as SiteLocale:'pt-BR'; }
  catch {return 'pt-BR';}
}
export function LocaleProvider({children}:{children:React.ReactNode}) {
  const [locale,setCurrent]=useState<SiteLocale>('pt-BR');
  useEffect(()=>{setCurrent(localePreference());},[]);
  const setLocale=(value:SiteLocale)=>{
    if(!values.includes(value))return;
    setCurrent(value);
    try{localStorage.setItem('soma:locale',value);}catch{}
    document.documentElement.lang=value;
  };
  useEffect(()=>{document.documentElement.lang=locale;},[locale]);
  return <Context.Provider value={{locale,setLocale}}>{children}</Context.Provider>;
}
export function useLocale(){return useContext(Context);}
export const navTranslations: Record<string, [string,string]> = {
  'Visão geral':['Overview','Vista general'],'Administração':['Administration','Administración'],
  'Minha jornada':['My journey','Mi recorrido'],'Primeiros passos':['Getting started','Primeros pasos'],
  'Mapa Quem Sou Eu':['Who I Am map','Mapa Quién Soy'],'Diagnóstico & Perfil':['Assessment & profile','Diagnóstico y perfil'],
  'Percepção 360':['360 feedback','Percepción 360'],'Diário de Bordo':['Career journal','Diario de carrera'],
  'Feedbacks recebidos':['Feedback received','Comentarios recibidos'],'Gravações':['Recordings','Grabaciones'],
  'Íris Copiloto':['Íris Copilot','Íris Copiloto'],'Plano de Ação Íris':['Íris action plan','Plan de acción Íris'],
  'Crescimento na empresa':['Career growth at work','Crecimiento en la empresa'],'Primeiros 90 dias':['First 90 days','Primeros 90 días'],
  'Leitura de cenário':['Situation analysis','Análisis del contexto'],'Plano de desenvolvimento':['Development plan','Plan de desarrollo'],
  'Mercado de trabalho':['Job market','Mercado laboral'],'Analisar currículo':['Review résumé','Revisar currículum'],
  'Gupy & ATS':['Gupy & ATS','Gupy y ATS'],'LinkedIn estratégico':['Strategic LinkedIn','LinkedIn estratégico'],
  'Conteúdo & marca pessoal':['Content & personal brand','Contenido y marca personal'],
  'Vagas & candidaturas':['Jobs & applications','Vacantes y postulaciones'],
  'Rede & oportunidades':['Networking & opportunities','Red y oportunidades'],
  'Entrevistas & simulações':['Interviews & practice','Entrevistas y simulaciones'],
  'Sua experiência na SOMA':['Your SOMA experience','Tu experiencia SOMA'],
  'Avaliar a mentoria':['Review the mentoring','Evaluar la mentoría'],
  'Comunidade':['Community','Comunidad'],'Feedback entre Colegas':['Peer feedback','Comentarios entre colegas'],
  'Votar Encontro':['Vote on meetups','Votar por encuentros'],'Indique um Amigo':['Refer a friend','Recomienda a alguien'],
  'Meu espaço':['My space','Mi espacio'],'Meu Passaporte':['My passport','Mi pasaporte'],
  'Meu Plano':['My plan','Mi plan'],'SOMA Plataforma':['SOMA Platform','Plataforma SOMA'],
  'Central de Ajuda':['Help center','Centro de ayuda'],'Termos da mentoria':['Mentoring terms','Términos de mentoría'],
  'Minha plataforma':['My platform','Mi plataforma'],'Meu perfil':['My profile','Mi perfil'],
  'Mentoria online':['Online mentoring','Mentoría en línea'],'Mentoria presencial':['In-person mentoring','Mentoría presencial'],
  'Portal do mentorado':['Member portal','Portal del participante'],
  'Gestão':['Management','Gestión'],'Novidades':['What is new','Novedades'],
  'Sessão extra':['Extra session','Sesión extra'],'Renovar mentoria':['Renew mentoring','Renovar mentoría'],
};
export function translatedNav(value:string,locale:SiteLocale){
  return locale==='pt-BR'?value:(navTranslations[value]?.[locale==='en'?0:1]||value);
}
export function LanguageSwitcher(){
  const {locale,setLocale}=useLocale();
  return <div className="fixed right-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[55] rounded-xl border border-slate-300/75 bg-white/95 p-1 shadow-sm backdrop-blur-sm sm:right-5 sm:top-[calc(env(safe-area-inset-top)+0.9rem)]" data-testid="soma-language-switcher">
    <label htmlFor="soma-language" className="sr-only">Idioma / Language / Idioma</label>
    <select id="soma-language" aria-label="Idioma / Language" value={locale} onChange={e=>setLocale(e.target.value as SiteLocale)}
      className="max-w-[128px] rounded-lg border-0 bg-transparent px-1.5 py-1 text-xs font-semibold text-slate-900 outline-offset-2 focus-visible:outline-2 focus-visible:outline-teal-700">
      <option value="pt-BR">🇧🇷 Português</option><option value="es-419">🌎 Español</option><option value="en">🇺🇸 English</option>
    </select>
  </div>;
}
