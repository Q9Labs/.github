// Keeps the stand laptop on the latest release without anyone touching it: poll release.json and,
// when the revision changes, let the new service worker take over, then reload once the page is idle.
const POLL_MS = 2 * 60 * 1000;
const FALLBACK_RELOAD_MS = 30_000;

export function watchForUpdates(whenIdle) {
  const serviceWorker = navigator.serviceWorker;
  const hadController = Boolean(serviceWorker?.controller);
  let baseline = null;
  let timer = 0;
  let reloading = false;

  const reloadWhenIdle = () => {
    if (reloading) return;
    reloading = true;
    whenIdle(() => location.reload());
  };

  // The first install also fires controllerchange; only a replaced worker means new code.
  serviceWorker?.addEventListener('controllerchange', () => { if (hadController) reloadWhenIdle(); });

  async function check() {
    try {
      const response = await fetch('/release.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const { revision } = await response.json();
      baseline ??= revision;
      if (revision === baseline || reloading) return;
      const registration = await serviceWorker?.getRegistration();
      if (!registration) return reloadWhenIdle();
      setTimeout(reloadWhenIdle, FALLBACK_RELOAD_MS);
      await registration.update();
    } catch (error) {
      console.warn('Release check failed; trying again later', error);
    }
  }

  const schedule = () => {
    clearTimeout(timer);
    if (!document.hidden) timer = setTimeout(() => check().finally(schedule), POLL_MS);
  };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return clearTimeout(timer);
    check().finally(schedule);
  });
  check().finally(schedule);
}
