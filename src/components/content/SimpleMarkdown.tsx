import { Fragment, type ReactNode } from "react";

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${part}-${index}`} className="font-semibold text-[#111111]">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <Fragment key={`${part}-${index}`}>{part}</Fragment>;
  });
}

export default function SimpleMarkdown({
  content,
  className,
}: Readonly<{
  content: string;
  className?: string;
}>) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trimEnd());

  const nodes: ReactNode[] = [];
  let paragraphBuffer: string[] = [];
  let listBuffer: string[] = [];

  function flushParagraph() {
    if (paragraphBuffer.length === 0) {
      return;
    }

    nodes.push(
      <p key={`paragraph-${nodes.length}`} className="text-sm leading-7 text-[#4b5563]">
        {renderInline(paragraphBuffer.join(" "))}
      </p>,
    );
    paragraphBuffer = [];
  }

  function flushList() {
    if (listBuffer.length === 0) {
      return;
    }

    nodes.push(
      <ul
        key={`list-${nodes.length}`}
        className="list-disc space-y-2 pl-5 text-sm leading-7 text-[#4b5563]"
      >
        {listBuffer.map((item, index) => (
          <li key={`${item}-${index}`}>{renderInline(item)}</li>
        ))}
      </ul>,
    );
    listBuffer = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    if (line.startsWith("# ")) {
      flushParagraph();
      flushList();
      nodes.push(
        <h2
          key={`heading-${nodes.length}`}
          className="pt-2 font-display text-2xl uppercase tracking-[0.04em] text-[#111111]"
        >
          {line.slice(2)}
        </h2>,
      );
      continue;
    }

    if (line.startsWith("- ")) {
      flushParagraph();
      listBuffer.push(line.slice(2));
      continue;
    }

    flushList();
    paragraphBuffer.push(line);
  }

  flushParagraph();
  flushList();

  return <div className={className ?? "space-y-4"}>{nodes}</div>;
}
