// The Good Pages — 30 Day Challenge Service Worker v1

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));

self.addEventListener('fetch', e => {
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes('30-day-challenge') && 'focus' in c) return c.focus();
      }
      return clients.openWindow(e.notification.data?.url || '/30-day-challenge/');
    })
  );
});

self.addEventListener('message', e => {
  if (e.data?.type === 'SCHEDULE_REMINDER') {
    if (self._rt) clearTimeout(self._rt);
    const { delayMs, daysLeft, totalDays, doneDays } = e.data;
    self._rt = setTimeout(() => {
      let title, body;
      if (daysLeft === 0) {
        title = '🏆 Challenge complete! You did it!';
        body = `All ${totalDays} days done. You should be proud!`;
      } else if (doneDays === 0) {
        title = `⏰ Don't forget your challenge today!`;
        body = `${daysLeft} days left — start strong!`;
      } else {
        const pct = Math.round((doneDays / totalDays) * 100);
        title = `⚡ ${daysLeft} day${daysLeft > 1 ? 's' : ''} left — you're ${pct}% there!`;
        body = `${doneDays}/${totalDays} days done. Keep going!`;
      }
      self.registration.showNotification(title, {
        body,
        tag: 'challenge-reminder',
        renotify: true,
        data: { url: '/30-day-challenge/' },
        actions: [
          { action: 'open', title: 'Open Tracker' },
          { action: 'dismiss', title: 'Dismiss' }
        ]
      });
    }, delayMs);
  }
  if (e.data?.type === 'CANCEL_REMINDER') {
    if (self._rt) { clearTimeout(self._rt); self._rt = null; }
  }
});
