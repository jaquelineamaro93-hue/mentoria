'use client';
import { useEffect, useState } from 'react';
import styles from './HelpContentPrivacy.module.css';
/** A manual privacy screen and print deterrent, not screenshot detection or DRM. */
export default function HelpContentPrivacy() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setHidden(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return <>
    <div className={styles.controls}>
      <p>Confidencial · Uso exclusivo desta conta · Reprodução não autorizada.</p>
      <button type="button" aria-pressed={hidden} onClick={() => setHidden(value => !value)}>{hidden ? 'Voltar ao conteúdo' : 'Ocultar conteúdo'}</button>
    </div>
    <div className={`${styles.cover} ${hidden ? styles.active : ''}`} aria-hidden={!hidden}>
      <div><p>SOMA</p><strong>Conteúdo protegido</strong><p>{hidden ? 'Você ocultou este artigo. Use “Voltar ao conteúdo” ou pressione Esc para continuar.' : 'A impressão deste artigo está oculta. Consulte o conteúdo na sua conta SOMA.'}</p></div>
    </div>
  </>;
}
