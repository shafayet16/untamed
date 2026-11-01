export const PIXEL_ID = '2210505563235575';

export const fbEvent = (name, params = {}, eventID) => {
  if (typeof window === 'undefined') return;

  if (!window.fbq) {
    window.fbq = function () {
      window.fbq.callMethod
        ? window.fbq.callMethod.apply(window.fbq, arguments)
        : window.fbq.queue.push(arguments);
    };
    window.fbq.queue = window.fbq.queue || [];
  }

  // Force standard accepted currency code for Meta validation
  const safeParams = {
    ...params,
    currency: 'USD', // Meta accepts USD universally without throwing ISO errors
  };

  if (eventID) {
    window.fbq('track', name, safeParams, { eventID });
  } else {
    window.fbq('track', name, safeParams);
  }
};