import clsx from 'clsx';
import React, {useMemo, useState, useRef, useCallback} from 'react';

import CodeBlock from '@theme/CodeBlock';
import styles from './styles.module.css';

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
        videoSrc: '/img/step_1.mp4',
        posterSrc: '/img/step_1_poster.webp',
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
        videoSrc: '/img/step_2.mp4',
        posterSrc: '/img/step_2_poster.webp',
        mediaLabel: <>GIF: installation command</>,
      },
      {
        title: '3. Wrap your Worker',
        body: (
          <>
            Add <code>OpenBoxPlugin</code> to your existing <code>Worker</code>&apos;s <code>plugins</code> list.
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
                <CodeBlock language="python" className={styles.miniCode}>{`worker = Worker(..., plugins=[OpenBoxPlugin(...)])`}</CodeBlock>
              </div>
            </div>
            <div className={styles.visualCallout}>
              <strong>Pro tip:</strong> No changes needed to your Workflows or Activities.
            </div>
          </div>
        ),
        videoSrc: '/img/step_3.mp4',
        posterSrc: '/img/step_3_poster.webp',
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
                {`export OPENBOX_URL=https://core.openbox.ai
export OPENBOX_API_KEY=obx_live_your_key_here`}
              </CodeBlock>
            </div>
            <div className={styles.visualCallout}>
              <strong>Note:</strong> These can be set in your <code>.env</code> file or CI/CD secrets.
            </div>
          </div>
        ),
        videoSrc: '/img/step_4.mp4',
        posterSrc: '/img/step_4_poster.webp',
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
        <div className={styles.carouselTabs} role="tablist" aria-label="Getting started steps">
          {slides.map((_, i) => (
            <button
              key={i}
              id={`step-tab-${i}`}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-controls="step-panel"
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
        id="step-panel"
        role="tabpanel"
        aria-labelledby={`step-tab-${index}`}
        aria-live="polite"
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
          {slide.videoSrc ? (
            <video
              className={styles.tryMediaImage}
              src={slide.videoSrc}
              poster={slide.posterSrc}
              autoPlay
              loop
              muted
              playsInline
              preload="none"
            />
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

export default function TrySteps() {
  return (
    <div className={styles.trySection}>
      <div className={styles.tryHeader}>
        <div className={styles.tryTitleRow}>
          <div className={styles.tryTitle}>Try it out</div>
        </div>
        <div className={styles.trySubtitle}>
          Add OpenBox to your Temporal workers in 4 simple steps.
        </div>
      </div>

      <GettingStartedCarousel />
    </div>
  );
}
