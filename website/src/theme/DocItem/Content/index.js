import React from 'react';
import clsx from 'clsx';
import {ThemeClassNames} from '@docusaurus/theme-common';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import Heading from '@theme/Heading';
import MDXContent from '@theme/MDXContent';

import DocPageActions from '../../../components/DocPageActions';

function useSyntheticTitle() {
  const {metadata, frontMatter, contentTitle} = useDoc();
  const shouldRender = !frontMatter.hide_title && typeof contentTitle === 'undefined';
  if (!shouldRender) {
    return null;
  }
  return metadata.title;
}

export default function DocItemContent({children}) {
  const syntheticTitle = useSyntheticTitle();

  return (
    <div className={clsx(ThemeClassNames.docs.docMarkdown, 'markdown')}>
      {syntheticTitle ? (
        <header className="doc-page-title-row">
          <Heading as="h1">{syntheticTitle}</Heading>
          <DocPageActions />
        </header>
      ) : (
        <div className="doc-page-actions-inline">
          <DocPageActions />
        </div>
      )}
      <MDXContent>{children}</MDXContent>
    </div>
  );
}
