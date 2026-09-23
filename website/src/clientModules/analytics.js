// Jitsu page tracking, mirroring openbox-fe src/lib/analytics.ts.
// Events go to the ion-worker, which injects the writeKey; none ships in this bundle.
import siteConfig from '@generated/docusaurus.config';

const {jitsuHost, jitsuConfigUrl, analyticsCookieDomain} = siteConfig.customFields;
const BOT_UA = /bot|crawler|spider|selenium|phantomjs|headless|webdriver/i;
const CONFIG_TIMEOUT_MS = 500;

let ready = null;

/** GETs the Worker `/config` kill-switch; returns true when analytics is disabled. Fail-open. */
async function isAnalyticsDisabled() {
  if (!jitsuConfigUrl) return false;
  try {
    const res = await fetch(jitsuConfigUrl, {signal: AbortSignal.timeout(CONFIG_TIMEOUT_MS)});
    if (!res.ok) return false;
    const data = await res.json();
    return data.disabled === true;
  } catch {
    return false;
  }
}

/** Runs the gated init once; resolves to the Jitsu instance, or null when analytics is off. */
function ensureAnalyticsReady() {
  ready ??= (async () => {
    if (!jitsuHost) return null;
    if (navigator.webdriver || BOT_UA.test(navigator.userAgent || '')) return null;
    if (await isAnalyticsDisabled()) return null;
    const {jitsuAnalytics} = await import('@jitsu/js');
    return jitsuAnalytics({
      host: jitsuHost,
      ...(analyticsCookieDomain ? {cookieDomain: analyticsCookieDomain} : {}),
    });
  })().catch((err) => {
    console.error('[analytics] init failed; disabled for this session', err);
    return null;
  });
  return ready;
}

export function onRouteDidUpdate({location, previousLocation}) {
  // Hash-only changes (in-page anchors) are not page views.
  if (previousLocation && location.pathname === previousLocation.pathname) return;
  ensureAnalyticsReady().then((jitsu) => jitsu?.page());
}
