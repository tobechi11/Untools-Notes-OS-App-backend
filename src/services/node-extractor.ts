export type ExtractedNode = {
  id: string;
  nodeType: string;
  content: string;
  position: number;
  tags: string[];
};

export type DerivedMetadata = {
  confidence: string | null;
  reviewDate: Date | null;
  outcome: string | null;
};

type TipTapNode = {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  text?: string;
};

const INLINE_TAG_REGEX = /(?<!\w)#([a-zA-Z0-9_\-]+)/g;

function extractPlainText(node: TipTapNode): string {
  if (node.text) return node.text;
  if (!node.content) return "";
  return node.content.map(extractPlainText).join("");
}

function extractInlineTags(text: string): string[] {
  const tags: string[] = [];
  for (const match of text.matchAll(INLINE_TAG_REGEX)) {
    if (match[1]) tags.push(match[1]);
  }
  return [...new Set(tags)];
}

export function extractNodes(tiptapJson: TipTapNode): ExtractedNode[] {
  const nodes: ExtractedNode[] = [];
  let position = 0;

  function walk(node: TipTapNode) {
    if (node.type === "structuredNode" && node.attrs) {
      const id = node.attrs.id as string;
      const nodeType = node.attrs.nodeType as string;
      if (id && nodeType) {
        const content = extractPlainText(node).trim();
        nodes.push({
          id,
          nodeType,
          content,
          position: position++,
          tags: extractInlineTags(content),
        });
      }
    }
    if (node.content) {
      for (const child of node.content) {
        walk(child);
      }
    }
  }

  walk(tiptapJson);
  return nodes;
}

function parseDate(value: string): Date | null {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  if (!match?.[1]) return null;
  const d = new Date(match[1]);
  return isNaN(d.getTime()) ? null : d;
}

export function deriveMetadata(nodes: ExtractedNode[]): DerivedMetadata {
  let confidence: string | null = null;
  let reviewDate: Date | null = null;
  let outcome: string | null = null;

  for (const node of nodes) {
    switch (node.nodeType) {
      case "Confidence":
        confidence = node.content || null;
        break;
      case "ReviewDate":
        reviewDate = parseDate(node.content) ?? reviewDate;
        break;
      case "Outcome":
        outcome = node.content ? node.content.toLowerCase() : null;
        break;
    }
  }

  return { confidence, reviewDate, outcome };
}
