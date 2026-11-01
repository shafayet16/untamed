export const PIXEL_ID = '2210505563235575';

export const fbEvent = (name, params = {}, eventID) => {
  if (typeof window === 'undefined' || !window.fbq) return;
  if (eventID) {
    window.fbq('track', name, params, { eventID });
  } else {
    window.fbq('track', name, params);
  }
};