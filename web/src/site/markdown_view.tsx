import rehypeHighlight from "rehype-highlight";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const MEDIA = import.meta.glob("../../../docs/media/**/*.{svg,png}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

function mediaUrl(src: string | undefined): string | undefined {
  if (!src) return src;
  const name = src.split("/").pop();
  if (!name) return src;
  const match = Object.entries(MEDIA).find(([path]) => path.endsWith(`/${name}`));
  return match ? match[1] : src;
}

const COMPONENTS: Components = {
  img: ({ src, alt }) => <img src={mediaUrl(src)} alt={alt ?? ""} loading="lazy" />,
};

type MarkdownViewProps = {
  markdown: string;
};

export function MarkdownView({ markdown }: MarkdownViewProps) {
  return (
    <div className="md-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={COMPONENTS}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
