import React from 'react';
import clsx from 'clsx';
import {ThemeClassNames} from '@docusaurus/theme-common';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import Heading from '@theme/Heading';
import MDXContent from '@theme/MDXContent';
import LastUpdated from '@theme/LastUpdated';
import TagsListInline from '@theme/TagsListInline';

import DocPageActions from '../../../components/DocPageActions';

function useSyntheticTitle() {
  const {metadata, frontMatter, contentTitle} = useDoc();
  const shouldRender = !frontMatter.hide_title && typeof contentTitle === 'undefined';
  if (!shouldRender) {
    return null;
  }
  return metadata.title;
}

function DocMetaRow() {
  const {metadata} = useDoc();
  const {lastUpdatedAt, lastUpdatedBy, tags} = metadata;

  const hasLastUpdated = !!(lastUpdatedAt || lastUpdatedBy);
  const hasTags = tags.length > 0;

  return (
    <div className="doc-meta-row">
      <div className="doc-meta-row__updated">
        {hasLastUpdated && (
          <LastUpdated
            lastUpdatedAt={lastUpdatedAt}
            lastUpdatedBy={lastUpdatedBy}
          />
        )}
      </div>
      {hasTags && (
        <div className="doc-meta-row__tags">
          <TagsListInline tags={tags} />
        </div>
      )}
      <DocPageActions />
    </div>
  );
}

export default function DocItemContent({children}) {
  const syntheticTitle = useSyntheticTitle();

  return (
    <div className={clsx(ThemeClassNames.docs.docMarkdown, 'markdown', 'doc-content-flex')}>
      {syntheticTitle && (
        <header className="doc-page-title-row">
          <Heading as="h1">{syntheticTitle}</Heading>
        </header>
      )}
      <DocMetaRow />
      <MDXContent>{children}</MDXContent>
    </div>
  );
}
