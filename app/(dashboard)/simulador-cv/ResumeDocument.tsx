'use client';

import { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy, Download, FileText, Printer } from 'lucide-react';

function safeFileName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_ ]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase();
}

function cloneWithInlineStyles(source: HTMLElement) {
  const clone = source.cloneNode(true) as HTMLElement;

  clone.style.fontFamily = 'Arial, Helvetica, sans-serif';
  clone.style.fontSize = '10.5pt';
  clone.style.lineHeight = '1.35';
  clone.style.color = '#171717';
  clone.style.background = '#ffffff';

  clone.querySelectorAll('h1').forEach((node) => {
    const el = node as HTMLElement;
    el.style.fontFamily = 'Georgia, Times New Roman, serif';
    el.style.fontSize = '22pt';
    el.style.lineHeight = '1.08';
    el.style.fontWeight = '700';
    el.style.margin = '0 0 7pt 0';
    el.style.color = '#171717';
  });

  clone.querySelectorAll('h2').forEach((node) => {
    const el = node as HTMLElement;
    el.style.fontFamily = 'Georgia, Times New Roman, serif';
    el.style.fontSize = '12.5pt';
    el.style.lineHeight = '1.2';
    el.style.fontWeight = '700';
    el.style.margin = '15pt 0 6pt 0';
    el.style.paddingBottom = '4pt';
    el.style.borderBottom = '1px solid #d9d9d9';
    el.style.color = '#171717';
    el.style.breakAfter = 'avoid';
  });

  clone.querySelectorAll('h3').forEach((node) => {
    const el = node as HTMLElement;
    el.style.fontSize = '10.8pt';
    el.style.lineHeight = '1.25';
    el.style.fontWeight = '700';
    el.style.margin = '10pt 0 2pt 0';
    el.style.color = '#171717';
    el.style.breakAfter = 'avoid';
  });

  clone.querySelectorAll('p').forEach((node) => {
    const el = node as HTMLElement;
    el.style.margin = '0 0 5pt 0';
    el.style.lineHeight = '1.35';
  });

  clone.querySelectorAll('ul').forEach((node) => {
    const el = node as HTMLElement;
    el.style.margin = '3pt 0 7pt 17pt';
    el.style.padding = '0';
  });

  clone.querySelectorAll('ol').forEach((node) => {
    const el = node as HTMLElement;
    el.style.margin = '3pt 0 7pt 19pt';
    el.style.padding = '0';
  });

  clone.querySelectorAll('li').forEach((node) => {
    const el = node as HTMLElement;
    el.style.margin = '0 0 3pt 0';
    el.style.padding = '0';
    el.style.lineHeight = '1.32';
    el.style.breakInside = 'avoid';
  });

  clone.querySelectorAll('strong').forEach((node) => {
    (node as HTMLElement).style.fontWeight = '700';
  });

  clone.querySelectorAll('a').forEach((node) => {
    const el = node as HTMLElement;
    el.style.color = '#171717';
    el.style.textDecoration = 'none';
  });

  clone.querySelectorAll('hr').forEach((node) => {
    const el = node as HTMLElement;
    el.style.border = '0';
    el.style.borderTop = '1px solid #d9d9d9';
    el.style.margin = '9pt 0';
  });

  return clone;
}

function documentHtml(body: string, title: string) {
  return `<!doctype html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
  @page { size: A4; margin: 16mm 17mm; }
  body {
    margin: 0;
    background: #fff;
    color: #171717;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 10.5pt;
    line-height: 1.35;
  }
  .resume {
    width: 176mm;
    margin: 0 auto;
  }
  h1 {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 22pt;
    line-height: 1.08;
    margin: 0 0 7pt;
  }
  h2 {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 12.5pt;
    line-height: 1.2;
    margin: 15pt 0 6pt;
    padding-bottom: 4pt;
    border-bottom: 1px solid #d9d9d9;
    break-after: avoid;
  }
  h3 {
    font-size: 10.8pt;
    line-height: 1.25;
    margin: 10pt 0 2pt;
    break-after: avoid;
  }
  p { margin: 0 0 5pt; }
  ul { margin: 3pt 0 7pt 17pt; padding: 0; }
  ol { margin: 3pt 0 7pt 19pt; padding: 0; }
  li { margin: 0 0 3pt; break-inside: avoid; }
  a { color: #171717; text-decoration: none; }
  hr { border: 0; border-top: 1px solid #d9d9d9; margin: 9pt 0; }
  table { width: 100%; border-collapse: collapse; }
  img { max-width: 100%; }
</style>
</head>
<body><div class="resume">${body}</div></body>
</html>`;
}

export default function ResumeDocument({
  markdown,
  coverLetterMarkdown,
  candidateName,
}: {
  markdown: string;
  coverLetterMarkdown: string;
  candidateName?: string | null;
}) {
  const resumeRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState<'resume' | 'cover' | null>(null);
  const [showCover, setShowCover] = useState(false);

  const baseName = safeFileName(candidateName || 'curriculo-soma') || 'curriculo-soma';

  async function copyRich(ref: React.RefObject<HTMLDivElement | null>, type: 'resume' | 'cover') {
    const source = ref.current;
    if (!source) return;

    const clone = cloneWithInlineStyles(source);
    const html = clone.outerHTML;
    const plain = source.innerText;

    try {
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([plain], { type: 'text/plain' }),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(plain);
      }

      setCopied(type);
      window.setTimeout(() => setCopied(null), 2200);
    } catch {
      await navigator.clipboard.writeText(plain);
      setCopied(type);
      window.setTimeout(() => setCopied(null), 2200);
    }
  }

  function downloadWord() {
    if (!resumeRef.current) return;
    const clone = cloneWithInlineStyles(resumeRef.current);
    const html = documentHtml(clone.innerHTML, candidateName || 'Currículo');
    const blob = new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${baseName}-curriculo.doc`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function printPdf() {
    if (!resumeRef.current) return;
    const clone = cloneWithInlineStyles(resumeRef.current);
    const html = documentHtml(clone.innerHTML, candidateName || 'Currículo');
    const popup = window.open('', '_blank', 'noopener,noreferrer');

    if (!popup) return;

    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    window.setTimeout(() => popup.print(), 350);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-black">Currículo pronto para uso</p>
          <p className="text-xs text-gray-text mt-1">
            Modelo A4, uma coluna, compatível com ATS e pensado para caber em até 2 páginas.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => copyRich(resumeRef, 'resume')}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-faint bg-white px-3.5 py-2.5 text-sm font-medium text-black hover:border-mint-deep transition"
          >
            {copied === 'resume' ? <Check size={16} className="text-mint-deep" /> : <Copy size={16} />}
            {copied === 'resume' ? 'Copiado com formatação' : 'Copiar formatado'}
          </button>

          <button
            type="button"
            onClick={downloadWord}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-faint bg-white px-3.5 py-2.5 text-sm font-medium text-black hover:border-mint-deep transition"
          >
            <Download size={16} />
            Baixar para Word
          </button>

          <button
            type="button"
            onClick={printPdf}
            className="inline-flex items-center gap-2 rounded-lg bg-mint-deep px-3.5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition"
          >
            <Printer size={16} />
            Salvar em PDF
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-faint bg-[#edf1f4] p-3 md:p-6 overflow-x-auto">
        <article
          className="mx-auto bg-white shadow-[0_8px_32px_rgba(15,23,42,0.10)] max-w-full"
          style={{
            width: '210mm',
            minHeight: '297mm',
            padding: '16mm 17mm',
            boxSizing: 'border-box',
          }}
        >
          <div
            ref={resumeRef}
            className={[
              'max-w-none text-[#171717] font-sans text-[10.5pt] leading-[1.35]',
              '[&_h1]:font-serif [&_h1]:not-italic [&_h1]:text-[22pt] [&_h1]:leading-[1.08] [&_h1]:font-bold [&_h1]:m-0 [&_h1]:mb-[7pt]',
              '[&_h2]:font-serif [&_h2]:not-italic [&_h2]:text-[12.5pt] [&_h2]:leading-[1.2] [&_h2]:font-bold [&_h2]:mt-[15pt] [&_h2]:mb-[6pt] [&_h2]:pb-[4pt] [&_h2]:border-b [&_h2]:border-[#d9d9d9]',
              '[&_h3]:text-[10.8pt] [&_h3]:leading-[1.25] [&_h3]:font-bold [&_h3]:mt-[10pt] [&_h3]:mb-[2pt]',
              '[&_p]:my-0 [&_p]:mb-[5pt] [&_p]:leading-[1.35]',
              '[&_ul]:my-[3pt] [&_ul]:mb-[7pt] [&_ul]:pl-[17pt] [&_ul]:list-disc',
              '[&_ol]:my-[3pt] [&_ol]:mb-[7pt] [&_ol]:pl-[19pt] [&_ol]:list-decimal',
              '[&_li]:mb-[3pt] [&_li]:leading-[1.32]',
              '[&_a]:text-[#171717] [&_a]:no-underline',
              '[&_hr]:my-[9pt] [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-[#d9d9d9]',
            ].join(' ')}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
          </div>
        </article>
      </div>

      {coverLetterMarkdown && (
        <div className="rounded-xl border border-gray-faint bg-white overflow-hidden">
          <button
            type="button"
            onClick={() => setShowCover((value) => !value)}
            className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-gray-light transition"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-black">
              <FileText size={16} />
              Carta de apresentação
            </span>
            <span className="text-xs text-gray-text">{showCover ? 'Ocultar' : 'Ver separadamente'}</span>
          </button>

          {showCover && (
            <div className="border-t border-gray-faint p-5">
              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  onClick={() => copyRich(coverRef, 'cover')}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-faint bg-white px-3.5 py-2 text-sm font-medium text-black hover:border-mint-deep transition"
                >
                  {copied === 'cover' ? <Check size={15} className="text-mint-deep" /> : <Copy size={15} />}
                  {copied === 'cover' ? 'Copiada' : 'Copiar carta formatada'}
                </button>
              </div>

              <div
                ref={coverRef}
                className="max-w-3xl mx-auto text-sm leading-relaxed text-black [&_p]:mb-3 [&_h1]:font-serif [&_h1]:text-2xl [&_h2]:font-serif [&_h2]:text-xl"
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{coverLetterMarkdown}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-text">
        Dica: em Word ou Google Docs, use “Copiar formatado” para manter títulos, bullets e espaçamentos. O arquivo Word também preserva o layout A4.
      </p>
    </div>
  );
}
