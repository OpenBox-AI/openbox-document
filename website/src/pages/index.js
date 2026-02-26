import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import React, {useMemo, useState, useRef, useCallback} from 'react';

import CodeBlock from '@theme/CodeBlock';
import Heading from '@theme/Heading';
import styles from './index.module.css';

const ExploreSections = [
  {
    title: 'Try it out',
    links: [
      {label: 'Introduction', to: '/docs/'},
      {label: 'Run the Demo', to: '/docs/getting-started/run-the-demo'},
      {label: 'Workflow engines', to: '/docs/developer-guide/temporal-integration-guide-python'},
    ],
  },
  {
    title: 'Agents',
    links: [
      {label: 'Overview', to: '/docs/dashboard/agents'},
      {label: 'Registering agents', to: '/docs/dashboard/agents/registering-agents'},
      {label: 'Trust lifecycle', to: '/docs/trust-lifecycle'},
    ],
  },
  {
    title: 'Operations',
    links: [
      {label: 'Dashboard', to: '/docs/dashboard'},
      {label: 'Approvals', to: '/docs/approvals'},
      {label: 'Compliance', to: '/docs/administration/compliance-and-audit'},
    ],
  },
];

function GettingStartedCarousel() {
  const slides = useMemo(
    () => [
      {
        title: '1. Register your Agent',
        body: (
          <>
            Log in to the <strong>OpenBox Dashboard</strong> to create your agent. You'll get an API Key to secure your integration.
          </>
        ),
        visual: (
          <div className={styles.tryStepVisual}>
            <div className={styles.visualCard}>
              <div className={styles.visualCardHeader}>Add Agent</div>
              <div className={styles.visualCardBody}>
                <div className={styles.visualField}>Name: <span>Customer Support Agent</span></div>
                <div className={styles.visualField}>Workflow: <span>Temporal</span></div>
                <div className={styles.visualKey}>API Key: <code>obx_live_••••••••</code></div>
              </div>
            </div>
          </div>
        ),
        media: (
          <video
            className={styles.tryMediaImage}
            src="/img/step_1.mp4"
            autoPlay
            loop
            muted
            playsInline
          />
        ),
        mediaLabel: (
          <>
            GIF: Dashboard walkthrough
          </>
        ),
      },
      {
        title: '2. Install the OpenBox SDK',
        body: <>Add our thin wrapper to your Python environment using pip or uv.</>,
        visual: (
          <div className={styles.tryStepVisual}>
            <div className={styles.visualTerminal}>
              <div className={styles.terminalHeader}>
                <span className={styles.terminalDot} />
                <span className={styles.terminalDot} />
                <span className={styles.terminalDot} />
              </div>
              <div className={styles.terminalBody}>
                <code>$ pip install openbox-temporal-sdk-python</code>
              </div>
            </div>
          </div>
        ),
        media: (
          <video
            className={styles.tryMediaImage}
            src="/img/step_2.mp4"
            autoPlay
            loop
            muted
            playsInline
          />
        ),
        mediaLabel: <>GIF: installation command</>,
      },
      {
        title: '3. Wrap your Worker',
        body: (
          <>
            Replace your existing <code>Worker</code> with our <code>create_openbox_worker</code>. 
            It automatically handles tracing, compliance, and governance.
          </>
        ),
        visual: (
          <div className={styles.tryStepVisual}>
            <div className={styles.codeComparison}>
              <div className={styles.codeCompareItem}>
                <div className={styles.codeCompareLabel}>Before</div>
                <CodeBlock language="python" className={styles.miniCode}>{`worker = Worker(...)`}</CodeBlock>
              </div>
              <div className={styles.codeCompareArrow}>→</div>
              <div className={styles.codeCompareItem}>
                <div className={styles.codeCompareLabel}>After</div>
                <CodeBlock language="python" className={styles.miniCode}>{`worker = create_openbox_worker(...)`}</CodeBlock>
              </div>
            </div>
            <div className={styles.visualCallout}>
              <strong>Pro tip:</strong> No changes needed to your Workflows or Activities.
            </div>
          </div>
        ),
        media: (
          <video
            className={styles.tryMediaImage}
            src="/img/step_3.mp4"
            autoPlay
            loop
            muted
            playsInline
          />
        ),
        mediaLabel: <>GIF: Code change walkthrough</>,
      },
      {
        title: '4. Setup Environment',
        body: (
          <>
            Configure your worker to communicate with the OpenBox platform.
            Use your <code>OPENBOX_API_KEY</code> from Step 1.
          </>
        ),
        visual: (
          <div className={styles.tryStepVisual}>
            <div className={styles.tryStepCode}>
              <CodeBlock language="bash">
                {`OPENBOX_URL=https://core.openbox.ai
OPENBOX_API_KEY=obx_live_your_key_here`}
              </CodeBlock>
            </div>
            <div className={styles.visualCallout}>
              <strong>Note:</strong> These can be set in your <code>.env</code> file or CI/CD secrets.
            </div>
          </div>
        ),
        media: (
          <video
            className={styles.tryMediaImage}
            src="/img/step_4.mp4"
            autoPlay
            loop
            muted
            playsInline
          />
        ),
        mediaLabel: <>GIF: env setup</>,
      },
    ],
    []
  );

  const [index, setIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const pendingIndexRef = useRef(null);

  const handleStepChange = useCallback((newIndex) => {
    if (newIndex === index || pendingIndexRef.current !== null) return;
    pendingIndexRef.current = newIndex;
    setIsTransitioning(true);
  }, [index]);

  const handleTransitionEnd = useCallback((e) => {
    if (e.propertyName === 'opacity' && pendingIndexRef.current !== null) {
      setIndex(pendingIndexRef.current);
      pendingIndexRef.current = null;
      setIsTransitioning(false);
    }
  }, []);

  const goPrev = () => handleStepChange((index - 1 + slides.length) % slides.length);
  const goNext = () => handleStepChange((index + 1) % slides.length);
  const slide = slides[index];

  return (
    <div className={styles.carousel}>
      <div className={styles.carouselTop}>
        <div className={styles.carouselTabs}>
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              className={clsx(
                styles.carouselTab,
                i === index && styles.carouselTabActive
              )}
              onClick={() => handleStepChange(i)}
            >
              Step {i + 1}
            </button>
          ))}
        </div>
        <div className={styles.carouselNav}>
          <button type="button" className={styles.carouselButton} onClick={goPrev} aria-label="Previous step">
            ←
          </button>
          <button type="button" className={styles.carouselButton} onClick={goNext} aria-label="Next step">
            →
          </button>
        </div>
      </div>

      <div
        className={clsx(
          styles.tryStepRow,
          isTransitioning && styles.tryStepRowHidden
        )}
        onTransitionEnd={handleTransitionEnd}
      >
        <div className={styles.tryStepText}>
          <div className={styles.tryStepTitle}>{slide.title}</div>
          <div className={styles.tryStepBody}>{slide.body}</div>
          {slide.visual ? slide.visual : <div className={styles.tryStepCode}>{slide.code}</div>}
        </div>
        <div className={styles.tryStepMedia}>
          {slide.media ? (
            slide.media
          ) : (
            <div className={styles.tryMediaPlaceholder}>
              {slide.mediaLabel}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();

  return (
    <header className={styles.hero}>
      <div className={clsx('container', styles.heroInner)}>
        <div className={styles.heroLeft}>
          <span className={styles.heroLabel}>AI Trust Platform</span>
          <Heading as="h1" className={styles.heroTitle}>
            Verify Every Action
          </Heading>
          <p className={styles.heroSubtitle}>{siteConfig.tagline}</p>
          <div className={styles.heroCtas}>
            <Link className={clsx('button button--primary', styles.ctaPrimary)} to="/docs/getting-started">
              Get started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

const HelpfulLinks = [
  {
    labelPrefix: 'Need help with the docs?',
    labelLink: 'Email support',
    href: 'mailto:support@openbox.ai',
  },
  {
    labelPrefix: 'Talk to us:',
    labelLink: 'Email sales',
    href: 'mailto:sales@openbox.ai',
  },
  {
    labelPrefix: 'For agents:',
    labelLink: 'Docs sitemap (llms.txt)',
    href: '/llms.txt',
  },
];

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="OpenBox Documentation — Enterprise AI governance platform. Attest every agent action so behavior is provable, auditable, and defensible by default."
      wrapperClassName="homepage-no-footer">
      <HomepageHeader />
      <main>
        <section className={styles.exploreSection}>
          <div className="container">
            <div className={styles.exploreGrid}>
              {ExploreSections.map((section) => (
                <div key={section.title} className={styles.exploreColumn}>
                  <div className={styles.exploreTitle}>{section.title}</div>
                  <div className={styles.exploreLinks}>
                    {section.links.map((l) => (
                      <Link key={l.to} className={styles.exploreLink} to={l.to}>
                        {l.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.trySection}>
          <div className="container">
            <div className={styles.tryHeader}>
              <div className={styles.tryTitleRow}>
                <div className={styles.tryTitle}>Try it out</div>
                <Link className={styles.tryLink} to="/docs/getting-started/wrap-an-existing-agent">
                  Wrap an Existing Agent →
                </Link>
              </div>
              <div className={styles.trySubtitle}>
                Add OpenBox to your Temporal workers in 4 simple steps.
              </div>
            </div>

            <GettingStartedCarousel />
          </div>
        </section>

        <section className={styles.helpSection}>
          <div className="container">
            <div className={styles.helpLinks}>
              {HelpfulLinks.map((item) => (
                <div key={item.labelLink} className={styles.helpRow}>
                  <span className={styles.helpIcon} aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        opacity="0.55"
                      />
                      <path
                        d="M7.75 7.75a2.25 2.25 0 1 1 3.59 1.83c-.67.46-1.34.92-1.34 2.17"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M10 14.25h.01"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  <span className={styles.helpText}>
                    <span className={styles.helpPrefix}>{item.labelPrefix} </span>
                    <a className={styles.helpLink} href={item.href}>
                      {item.labelLink}
                    </a>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
