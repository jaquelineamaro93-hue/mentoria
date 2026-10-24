import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { safeHelpPath } from '@/lib/help-center/types';
import { helpHeadings } from '@/lib/help-center/navigation';

export default function HelpMarkdown({ body }: { body: string }) {
  const headings = new Map(helpHeadings(body).map(heading => [heading.line, heading.id]));
  return <div className="prose prose-sm sm:prose-base max-w-none break-words text-[#213d34] prose-headings:text-[#183f37] prose-a:text-[#24594b] prose-img:rounded-xl prose-img:max-w-full">
    <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={{
      h2: ({ node, children }) => <h2 id={headings.get(node?.position?.start.line ?? 0)} className="scroll-mt-6">{children}</h2>,
      h3: ({ node, children }) => <h3 id={headings.get(node?.position?.start.line ?? 0)} className="scroll-mt-6">{children}</h3>,
      a: ({ href, children }) => {
        const internal = href && (safeHelpPath(href) || /^\/ajuda(?:\/[a-z0-9-]+)?$/.test(href));
        return internal ? <a href={href}>{children}</a> : <span>{children}</span>;
      },
      img: ({ src, alt }) => typeof src === 'string' && /^\/api\/ajuda\/midia\/[0-9a-f-]{36}$/.test(src)
        // Authenticated image endpoint, deliberately never optimized or made public.
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={src} alt={alt || 'Passo a passo da SOMA'} loading="lazy" /> : null,
    }}>{body}</ReactMarkdown>
  </div>;
}
