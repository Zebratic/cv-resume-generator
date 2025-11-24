import { marked } from 'marked';

// Configure marked for safe rendering
marked.setOptions({
  breaks: true,
  gfm: true,
});

// Custom renderer for headers with inline styles
const renderer = new marked.Renderer();

renderer.heading = function({ tokens, depth }: { tokens: any[], depth: number }) {
  // Calculate font size based on level (relative to base)
  // # = 2.0x, ## = 1.6x, ### = 1.3x, #### = 1.1x
  const fontSizes: { [key: number]: string } = {
    1: '2em',
    2: '1.6em',
    3: '1.3em',
    4: '1.1em',
  };
  
  const fontSize = fontSizes[depth] || '1em';
  const tag = `h${depth}`;
  
  // Parse inline tokens to get the text content
  const text = this.parser.parseInline(tokens);
  
  return `<${tag} style="font-size: ${fontSize}; font-weight: bold; margin: 0.5em 0; line-height: 1.2; display: block;">${text}</${tag}>`;
};

marked.use({ renderer });

/**
 * Convert Markdown to HTML for preview
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return '';
  return marked.parse(markdown) as string;
}

/**
 * Strip Markdown formatting to plain text (for PDF generation)
 */
export function markdownToPlainText(markdown: string): string {
  if (!markdown) return '';
  
  // Remove markdown formatting
  let text = markdown
    // Remove bold/italic markers
    .replace(/\*\*\*(.*?)\*\*\*/g, '$1') // Bold italic
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
    .replace(/\*(.*?)\*/g, '$1') // Italic
    .replace(/__(.*?)__/g, '$1') // Bold (underscore)
    .replace(/_(.*?)_/g, '$1') // Italic (underscore)
    // Remove inline code
    .replace(/`(.*?)`/g, '$1')
    // Remove links
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    // Remove images
    .replace(/!\[([^\]]*)\]\([^\)]+\)/g, '$1')
    // Remove headers
    .replace(/^#{1,6}\s+(.*)$/gm, '$1')
    // Remove horizontal rules
    .replace(/^[-*_]{3,}$/gm, '')
    // Remove list markers
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // Remove blockquotes
    .replace(/^>\s+/gm, '')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    // Clean up extra whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  return text;
}

