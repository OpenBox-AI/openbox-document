import React, {useState} from 'react';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

function normalizeText(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function escapeCell(value) {
  return value.replace(/\|/g, '\\|').replace(/\n/g, '<br />').trim();
}

function tableToMarkdown(tableEl) {
  const rows = Array.from(tableEl.querySelectorAll('tr'));
  if (rows.length === 0) {
    return '';
  }

  const toCells = (row) =>
    Array.from(row.querySelectorAll('th,td')).map((cell) => escapeCell(normalizeText(cell.textContent || '')));

  const headerCells = toCells(rows[0]);
  const columnCount = headerCells.length;

  if (!columnCount) {
    return '';
  }

  const normalizeRowLength = (cells) => {
    const next = [...cells];
    while (next.length < columnCount) {
      next.push('');
    }
    return next.slice(0, columnCount);
  };

  const header = `| ${normalizeRowLength(headerCells).join(' | ')} |`;
  const separator = `| ${new Array(columnCount).fill('---').join(' | ')} |`;

  const body = rows
    .slice(1)
    .map((row) => `| ${normalizeRowLength(toCells(row)).join(' | ')} |`)
    .join('\n');

  return [header, separator, body].filter(Boolean).join('\n');
}

function blockToMarkdown(node) {
  const tag = node.tagName;
  const text = normalizeText(node.textContent || '');

  if (!text && tag !== 'TABLE' && tag !== 'PRE') {
    return '';
  }

  if (/^H[1-6]$/.test(tag)) {
    const level = Number(tag[1]);
    return `${'#'.repeat(level)} ${text}`;
  }

  if (tag === 'P') {
    return text;
  }

  if (tag === 'PRE') {
    const code = (node.querySelector('code')?.textContent || node.textContent || '').replace(/\n+$/, '');
    return `\`\`\`\n${code}\n\`\`\``;
  }

  if (tag === 'UL' || tag === 'OL') {
    const items = Array.from(node.children)
      .filter((child) => child.tagName === 'LI')
      .map((li, index) => {
        const itemText = normalizeText(li.textContent || '');
        const prefix = tag === 'OL' ? `${index + 1}.` : '-';
        return `${prefix} ${itemText}`;
      });
    return items.join('\n');
  }

  if (tag === 'TABLE') {
    return tableToMarkdown(node);
  }

  return text;
}

function contentToMarkdown(contentEl) {
  const clone = contentEl.cloneNode(true);
  clone.querySelectorAll('.doc-page-actions-row').forEach((el) => el.remove());
  const blocks = Array.from(clone.children)
    .map((node) => blockToMarkdown(node))
    .filter(Boolean);
  return blocks.join('\n\n');
}

export default function DocPageActions() {
  const {metadata} = useDoc();
  const {siteConfig} = useDocusaurusContext();
  const [copied, setCopied] = useState(false);
  const pageUrl = `${siteConfig.url}${metadata.permalink}`;
  const prompt = `Read and help with this documentation page:\n\nTitle: ${metadata.title}\nURL: ${pageUrl}`;
  const encoded = encodeURIComponent(prompt);

  const chatgptHref = `https://chatgpt.com/?q=${encoded}`;
  const claudeHref = `https://claude.ai/new?q=${encoded}`;

  async function handleCopyPage(event) {
    const contentEl = document.querySelector('.theme-doc-markdown.markdown');
    const contentText = contentEl ? contentToMarkdown(contentEl) : '';
    const markdown = `# ${metadata.title}\n\nSource: ${pageUrl}\n\n${contentText}`;

    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="doc-page-actions-row">
      <details className="doc-page-action-menu">
        <summary aria-label="Options menu">
          <span className="doc-page-action-main">
            <span className="doc-page-action-icon" aria-hidden="true" />
            <span className="doc-page-action-text">{copied ? 'Copied' : 'Options'}</span>
          </span>
          <span className="doc-page-action-caret" aria-hidden="true">
            <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3.5 6L8 10.5L12.5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </summary>
        <div className="doc-page-action-menu-list">
          <a
            className="doc-page-action-link"
            href={chatgptHref}
            target="_blank"
            rel="noopener noreferrer">
            <span className="doc-page-action-link-icon doc-page-action-link-icon--chatgpt" aria-hidden="true">
              <img src="/img/openai.svg" alt="" className="doc-page-action-link-icon-image" />
            </span>
            <span className="doc-page-action-link-body">
              <span className="doc-page-action-link-title">Open in ChatGPT</span>
              <span className="doc-page-action-link-subtitle">Ask ChatGPT about this page</span>
            </span>
            <span className="doc-page-action-link-arrow" aria-hidden="true">
              ↗
            </span>
          </a>
          <a
            className="doc-page-action-link"
            href={claudeHref}
            target="_blank"
            rel="noopener noreferrer">
            <span className="doc-page-action-link-icon doc-page-action-link-icon--claude" aria-hidden="true">
              <img src="/img/claude.svg" alt="" className="doc-page-action-link-icon-image" />
            </span>
            <span className="doc-page-action-link-body">
              <span className="doc-page-action-link-title">Open in Claude</span>
              <span className="doc-page-action-link-subtitle">Ask Claude about this page</span>
            </span>
            <span className="doc-page-action-link-arrow" aria-hidden="true">
              ↗
            </span>
          </a>
          <button type="button" className="doc-page-action-link doc-page-action-button" onClick={handleCopyPage}>
            <span className="doc-page-action-link-icon doc-page-action-link-icon--copy" aria-hidden="true">
              {copied ? (
                <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="doc-page-action-link-icon-image">
                  <path d="M3.5 8.2L6.6 11.3L12.5 5.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="doc-page-action-link-icon-image">
                  <rect x="1.5" y="4.5" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.25" />
                  <rect x="6.5" y="1.5" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.25" />
                </svg>
              )}
            </span>
            <span className="doc-page-action-link-body">
              <span className="doc-page-action-link-title">{copied ? 'Copied' : 'Copy page'}</span>
              <span className="doc-page-action-link-subtitle">Copy page as Markdown for LLMs</span>
            </span>
          </button>
        </div>
      </details>
    </div>
  );
}
