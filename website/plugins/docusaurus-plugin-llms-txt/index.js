const fs = require('fs');
const path = require('path');

/**
 * Remove MDX-specific nodes from an mdast tree, promoting any children
 * of JSX elements back into the parent so text content is preserved.
 */
function cleanMdxNodes(children) {
  return children.flatMap((node) => {
    // Remove import/export statements and JS expressions entirely
    if (
      node.type === 'mdxjsEsm' ||
      node.type === 'mdxFlowExpression' ||
      node.type === 'mdxTextExpression'
    ) {
      return [];
    }

    // For JSX elements, promote their children (keeps text inside components)
    if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
      if (node.children && node.children.length > 0) {
        return cleanMdxNodes(node.children);
      }
      return [];
    }

    // Recurse into children of standard markdown nodes
    if (node.children) {
      node.children = cleanMdxNodes(node.children);
    }

    return [node];
  });
}

/**
 * Resolve a Docusaurus source path (@site/docs/foo.mdx) to absolute path.
 */
function resolveSourcePath(siteDir, source) {
  return path.join(siteDir, source.replace(/^@site\//, ''));
}

/**
 * Convert a permalink to its .md URL (e.g. /docs/foo/ -> /docs/foo.md)
 */
function toMdUrl(siteUrl, permalink) {
  return siteUrl + permalink.replace(/\/$/, '') + '.md';
}

/**
 * Recursively walk resolved sidebar items, producing index lines and full-text sections.
 */
function walkSidebar(items, docsMap, siteUrl, siteDir, depth, indexLines, fullSections, mdFiles, extractContent) {
  for (const item of items) {
    if (item.type === 'doc') {
      const doc = docsMap.get(item.id);
      if (!doc) continue;

      const url = siteUrl + doc.permalink;
      const content = extractContent(resolveSourcePath(siteDir, doc.source));

      // Skip root-level standalone docs from the index (they clutter the intro)
      if (depth > 0) {
        const indent = '  '.repeat(depth);
        indexLines.push(`${indent}- [${doc.title}](${toMdUrl(siteUrl, doc.permalink)})`);
      }

      fullSections.push(`## ${doc.title}\n\nSource: ${url}\n\n${content}`);
      mdFiles.push({ permalink: doc.permalink, title: doc.title, content });
    } else if (item.type === 'category') {
      if (depth === 0) {
        indexLines.push('');
        indexLines.push(`## ${item.label}`);
      }

      // Category linked doc
      if (item.link && item.link.type === 'doc') {
        const linkId = item.link.id || item.link.docId;
        const doc = docsMap.get(linkId);
        if (doc) {
          const url = siteUrl + doc.permalink;
          const indent = '  '.repeat(depth);
          indexLines.push(`${indent}- [${doc.title}](${toMdUrl(siteUrl, doc.permalink)})`);

          const content = extractContent(resolveSourcePath(siteDir, doc.source));
          const heading = depth === 0 ? `# ${doc.title}` : `## ${doc.title}`;
          fullSections.push(`${heading}\n\nSource: ${url}\n\n${content}`);
          mdFiles.push({ permalink: doc.permalink, title: doc.title, content });
        }
      }

      if (item.items) {
        walkSidebar(item.items, docsMap, siteUrl, siteDir, depth + 1, indexLines, fullSections, mdFiles, extractContent);
      }
    }
    // Skip 'link' and 'html' types
  }
}

function pluginLlmsTxt(_context, options) {
  return {
    name: 'docusaurus-plugin-llms-txt',

    async postBuild(props) {
const {outDir, siteDir, siteConfig, plugins} = props;

      // Dynamic imports for ESM-only packages
      const [{unified}, remarkParse, remarkMdx, remarkGfm, {toMarkdown}, {gfmToMarkdown}] =
        await Promise.all([
          import('unified'),
          import('remark-parse'),
          import('remark-mdx'),
          import('remark-gfm'),
          import('mdast-util-to-markdown'),
          import('mdast-util-gfm'),
        ]);

      const processor = unified()
        .use(remarkParse.default)
        .use(remarkMdx.default)
        .use(remarkGfm.default);

      const markdownOptions = {
        bullet: '-',
        rule: '-',
        extensions: [gfmToMarkdown()],
      };

      /**
       * Read an MDX file, parse it to an AST, remove MDX nodes,
       * and serialize back to clean markdown.
       */
      function extractContent(filePath) {
        const text = fs.readFileSync(filePath, 'utf-8');

        // Strip YAML frontmatter
        let body = text;
        if (text.startsWith('---')) {
          const end = text.indexOf('---', 3);
          if (end !== -1) {
            body = text.slice(end + 3).trim();
          }
        }

        // Strip HTML comments (not valid MDX, causes parse errors)
        body = body.replace(/<!--[\s\S]*?-->/g, '');

        const tree = processor.parse(body);
        tree.children = cleanMdxNodes(tree.children);

        let markdown = toMarkdown(tree, markdownOptions).trim();
        // Remove unnecessary backslash escapes (\_  \&  etc.) added by the serializer
        markdown = markdown.replace(/\\([^a-zA-Z0-9\s])/g, '$1');
        // Remove decorative characters that leak from promoted JSX children
        markdown = markdown.replace(/^›$/gm, '');
        markdown = markdown.replace(/^←→$/gm, '');
        // Collapse runs of 3+ blank lines into 2
        markdown = markdown.replace(/\n{3,}/g, '\n\n');
        return markdown;
      }

      // Find docs plugin content
      const docsPlugin = plugins.find(
        (p) => p.name === 'docusaurus-plugin-content-docs',
      );
      if (!docsPlugin) {
        console.warn('[llms-txt] Could not find docs plugin, skipping');
        return;
      }

      const version = docsPlugin.content.loadedVersions[0];
      const {docs, sidebars} = version;

      const docsMap = new Map();
      for (const doc of docs) {
        docsMap.set(doc.id, doc);
      }

      const siteUrl = siteConfig.url.replace(/\/$/, '');


      const indexLines = [];
      const fullSections = [];
      const mdFiles = [];

      walkSidebar(
        sidebars.docs,
        docsMap,
        siteUrl,
        siteDir,
        0,
        indexLines,
        fullSections,
        mdFiles,
        extractContent,
      );

      // llms.txt
      const description = options.description || '';
      const header = [
        '# OpenBox',
        '',
        ...(description ? [description, ''] : []),
      ];
      const footer = options.footer || '';
      const llmsTxt = header.join('\n') + indexLines.join('\n') + '\n' + (footer ? '\n' + footer + '\n' : '');
      fs.writeFileSync(path.join(outDir, 'llms.txt'), llmsTxt);

      // llms-full.txt
      const fullHeader = '# OpenBox Documentation — Full Text\n\n';
      const fullContent = fullHeader + fullSections.join('\n\n---\n\n') + '\n';
      fs.writeFileSync(path.join(outDir, 'llms-full.txt'), fullContent);

      // Individual .md files for each doc (llms.txt spec: append .md to HTML URL)
      for (const { permalink, title, content } of mdFiles) {
        const mdPath = path.join(outDir, permalink.replace(/\/$/, '') + '.md');
        fs.mkdirSync(path.dirname(mdPath), { recursive: true });
        const htmlUrl = siteUrl + permalink;
        fs.writeFileSync(mdPath, `# ${title}\n\nSource: ${htmlUrl}\n\n${content}\n`);
      }

      console.log(
        `[llms-txt] Generated llms.txt, llms-full.txt, and ${mdFiles.length} individual .md files (${fullSections.length} docs)`,
      );
    },
  };
}

module.exports = pluginLlmsTxt;
