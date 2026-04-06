/**
 * Minimal markdown-to-HTML renderer.
 * Handles headings, bold, italic, inline code, code blocks, lists, and paragraphs.
 * No external dependencies.
 */
export function renderMarkdown(md: string): string {
  // Normalize line endings
  const input = md.replace(/\r\n/g, '\n');

  let html = '';
  const lines = input.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code blocks
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      const escaped = escapeHtml(codeLines.join('\n'));
      html += lang
        ? `<pre><code class="language-${escapeHtml(lang)}">${escaped}</code></pre>\n`
        : `<pre><code>${escaped}</code></pre>\n`;
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      html += `<h${level}>${inlineFormat(headingMatch[2])}</h${level}>\n`;
      i++;
      continue;
    }

    // Unordered list
    if (line.match(/^\s*[-*]\s+/)) {
      html += '<ul>\n';
      while (i < lines.length && lines[i].match(/^\s*[-*]\s+/)) {
        const content = lines[i].replace(/^\s*[-*]\s+/, '');
        html += `<li>${inlineFormat(content)}</li>\n`;
        i++;
      }
      html += '</ul>\n';
      continue;
    }

    // Ordered list
    if (line.match(/^\s*\d+\.\s+/)) {
      html += '<ol>\n';
      while (i < lines.length && lines[i].match(/^\s*\d+\.\s+/)) {
        const content = lines[i].replace(/^\s*\d+\.\s+/, '');
        html += `<li>${inlineFormat(content)}</li>\n`;
        i++;
      }
      html += '</ol>\n';
      continue;
    }

    // Blank line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Paragraph — collect consecutive non-empty, non-special lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].startsWith('```') &&
      !lines[i].match(/^#{1,3}\s+/) &&
      !lines[i].match(/^\s*[-*]\s+/) &&
      !lines[i].match(/^\s*\d+\.\s+/)
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      html += `<p>${inlineFormat(paraLines.join(' '))}</p>\n`;
    }
  }

  return html;
}

function inlineFormat(text: string): string {
  let result = escapeHtml(text);

  // Inline code (must come before bold/italic to avoid conflicts)
  result = result.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic
  result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');

  return result;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
