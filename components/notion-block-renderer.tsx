"use client";

import Image from "next/image";

interface NotionBlock {
  id: string;
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface NotionBlockRendererProps {
  blocks: NotionBlock[];
}

export default function NotionBlockRenderer({
  blocks,
}: NotionBlockRendererProps) {
  if (!blocks || blocks.length === 0) {
    return (
      <div className="text-muted-foreground text-center py-8">
        No content available
      </div>
    );
  }

  return (
    <div className="notion-content space-y-4">
      {blocks.map((block) => (
        <BlockComponent key={block.id} block={block} />
      ))}
    </div>
  );
}

function BlockComponent({ block }: { block: NotionBlock }) {
  switch (block.type) {
    case "paragraph":
      return <ParagraphBlock block={block} />;
    case "heading_1":
      return <Heading1Block block={block} />;
    case "heading_2":
      return <Heading2Block block={block} />;
    case "heading_3":
      return <Heading3Block block={block} />;
    case "bulleted_list_item":
      return <BulletedListBlock block={block} />;
    case "numbered_list_item":
      return <NumberedListBlock block={block} />;
    case "code":
      return <CodeBlock block={block} />;
    case "image":
      return <ImageBlock block={block} />;
    case "quote":
      return <QuoteBlock block={block} />;
    case "divider":
      return <DividerBlock />;
    case "to_do":
      return <TodoBlock block={block} />;
    case "toggle":
      return <ToggleBlock block={block} />;
    case "callout":
      return <CalloutBlock block={block} />;
    default:
      // Unsupported block type - render nothing
      return null;
  }
}

// Helper to render rich text with formatting
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderRichText(richText: any[]) {
  if (!richText || richText.length === 0) return null;

  return richText.map((text, i) => {
    let content: React.ReactNode = text.plain_text;

    // Apply annotations
    if (text.annotations) {
      if (text.annotations.bold) {
        content = <strong key={i}>{content}</strong>;
      }
      if (text.annotations.italic) {
        content = <em key={i}>{content}</em>;
      }
      if (text.annotations.code) {
        content = (
          <code key={i} className="bg-muted px-1.5 py-0.5 rounded text-sm">
            {content}
          </code>
        );
      }
      if (text.annotations.strikethrough) {
        content = <s key={i}>{content}</s>;
      }
      if (text.annotations.underline) {
        content = <u key={i}>{content}</u>;
      }
    }

    // Handle links
    if (text.href) {
      content = (
        <a
          key={i}
          href={text.href}
          className="text-primary underline hover:text-primary/80"
          target="_blank"
          rel="noopener noreferrer"
        >
          {content}
        </a>
      );
    }

    return <span key={i}>{content}</span>;
  });
}

// Individual block components
function ParagraphBlock({ block }: { block: NotionBlock }) {
  const text = block.paragraph?.rich_text || [];
  if (text.length === 0) return <br />;
  return <p className="text-base leading-relaxed">{renderRichText(text)}</p>;
}

function Heading1Block({ block }: { block: NotionBlock }) {
  const text = block.heading_1?.rich_text || [];
  return (
    <h1 className="text-3xl font-bold mt-8 mb-4">{renderRichText(text)}</h1>
  );
}

function Heading2Block({ block }: { block: NotionBlock }) {
  const text = block.heading_2?.rich_text || [];
  return (
    <h2 className="text-2xl font-bold mt-6 mb-3">{renderRichText(text)}</h2>
  );
}

function Heading3Block({ block }: { block: NotionBlock }) {
  const text = block.heading_3?.rich_text || [];
  return (
    <h3 className="text-xl font-semibold mt-4 mb-2">{renderRichText(text)}</h3>
  );
}

function BulletedListBlock({ block }: { block: NotionBlock }) {
  const text = block.bulleted_list_item?.rich_text || [];
  return (
    <ul className="list-disc list-inside">
      <li className="ml-4">{renderRichText(text)}</li>
    </ul>
  );
}

function NumberedListBlock({ block }: { block: NotionBlock }) {
  const text = block.numbered_list_item?.rich_text || [];
  return (
    <ol className="list-decimal list-inside">
      <li className="ml-4">{renderRichText(text)}</li>
    </ol>
  );
}

function CodeBlock({ block }: { block: NotionBlock }) {
  const text = block.code?.rich_text || [];
  const language = block.code?.language || "plain text";
  const code = text.map((t: { plain_text: string }) => t.plain_text).join("");

  return (
    <div className="my-4">
      <div className="bg-muted/50 px-3 py-1 text-xs text-muted-foreground border-b">
        {language}
      </div>
      <pre className="bg-muted p-4 rounded-b-lg overflow-x-auto">
        <code className="text-sm font-mono">{code}</code>
      </pre>
    </div>
  );
}

function ImageBlock({ block }: { block: NotionBlock }) {
  const imageData = block.image;
  let imageUrl = "";

  if (imageData?.type === "external") {
    imageUrl = imageData.external?.url || "";
  } else if (imageData?.type === "file") {
    imageUrl = imageData.file?.url || "";
  }

  if (!imageUrl) return null;

  const caption = imageData.caption
    ? imageData.caption
        .map((t: { plain_text: string }) => t.plain_text)
        .join("")
    : "";

  return (
    <figure className="my-6">
      <div className="relative w-full h-auto">
        <Image
          src={imageUrl}
          alt={caption || "Image"}
          width={800}
          height={600}
          className="rounded-lg w-full h-auto"
        />
      </div>
      {caption && (
        <figcaption className="text-sm text-muted-foreground text-center mt-2">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function QuoteBlock({ block }: { block: NotionBlock }) {
  const text = block.quote?.rich_text || [];
  return (
    <blockquote className="border-l-4 border-primary pl-4 py-2 my-4 italic text-muted-foreground">
      {renderRichText(text)}
    </blockquote>
  );
}

function DividerBlock() {
  return <hr className="my-8 border-border" />;
}

function TodoBlock({ block }: { block: NotionBlock }) {
  const text = block.to_do?.rich_text || [];
  const checked = block.to_do?.checked || false;

  return (
    <div className="flex items-start gap-2 my-2">
      <input
        type="checkbox"
        checked={checked}
        readOnly
        className="mt-1 cursor-default"
      />
      <span className={checked ? "line-through text-muted-foreground" : ""}>
        {renderRichText(text)}
      </span>
    </div>
  );
}

function ToggleBlock({ block }: { block: NotionBlock }) {
  const text = block.toggle?.rich_text || [];
  return (
    <details className="my-2">
      <summary className="cursor-pointer font-medium">
        {renderRichText(text)}
      </summary>
      <div className="ml-4 mt-2">
        {/* Note: Nested blocks would need recursive rendering */}
        <p className="text-sm text-muted-foreground">
          (Nested content not yet supported)
        </p>
      </div>
    </details>
  );
}

function CalloutBlock({ block }: { block: NotionBlock }) {
  const text = block.callout?.rich_text || [];
  const icon = block.callout?.icon?.emoji || "💡";

  return (
    <div className="flex gap-3 p-4 my-4 bg-muted/50 rounded-lg border border-border">
      <span className="text-2xl">{icon}</span>
      <div className="flex-1">{renderRichText(text)}</div>
    </div>
  );
}
