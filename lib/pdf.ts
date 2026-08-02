'use client';

export async function extrairTextoPdf(arquivo: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();

  const buffer = await arquivo.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  let textoCompleto = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const textoPagina = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    textoCompleto += textoPagina + '\n';
  }

  return textoCompleto;
}
