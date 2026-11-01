export const PIXEL_ID = '2210505563235575';

export const fbEvent = (name, params = {}, eventID) => {
  if (typeof window === 'undefined') return;

  // Initialize queue if window.fbq isn't fully ready yet
  if (!window.fbq) {
    window.fbq = function () {
      window.fbq.callMethod
        ? window.fbq.callMethod.apply(window.fbq, arguments)
        : window.fbq.queue.push(arguments);
    };
    window.fbq.queue = window.fbq.queue || [];
  }

  if (eventID) {
    window.fbq('track', name, params, { eventID });
  } else {
    window.fbq('track', name, params);
  }
};