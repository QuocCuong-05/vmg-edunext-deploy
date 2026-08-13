import ReactGA from 'react-ga4';

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

let initialized = false;

export function initGa() {
  if (initialized || !MEASUREMENT_ID) return;
  try {
    ReactGA.initialize(MEASUREMENT_ID);
    initialized = true;
  } catch {
    // GA hỏng không được phá app
  }
}

export function trackPage(path) {
  if (!initialized || !MEASUREMENT_ID) return;
  try {
    ReactGA.send({ hitType: 'pageview', page: path });
  } catch {
    // ignore
  }
}

export function trackEvent(category, action, label) {
  if (!initialized || !MEASUREMENT_ID) return;
  try {
    ReactGA.event({ category, action, label });
  } catch {
    // ignore
  }
}
