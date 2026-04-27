import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { isSafeHref } from '../../lib/utils/url.js';

/** XSS安全な markdown レンダラ。SVG/javascript: 等を rehype-sanitize で除去 */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        rehypePlugins={[rehypeSanitize]}
        components={{
          a: ({ href, children: c, ...rest }) => {
            const safe = href && isSafeHref(href) ? href : undefined;
            return (
              <a href={safe} target="_blank" rel="noopener noreferrer" {...rest}>
                {c}
              </a>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
