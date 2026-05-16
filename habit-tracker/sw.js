// The Good Pages — Habit Tracker Service Worker v2

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));

// Basic offline fetch
self.addEventListener('fetch', e => {
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});

// Notification click — open/focus tab
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes('habit-tracker') && 'focus' in c) return c.focus();
      }
      return clients.openWindow(e.notification.data?.url || '/habit-tracker/');
    })
  );
});

// Schedule / cancel reminder
self.addEventListener('message', e => {
  if (e.data?.type === 'SCHEDULE_REMINDER') {
    if (self._rt) clearTimeout(self._rt);
    const { delayMs, incomplete, total } = e.data;
    self._rt = setTimeout(() => {
      let title, body;
      if (incomplete === 0) {
        title = '🏆 All done! Perfect day.';
        body = `All ${total} habits completed. You're crushing it!`;
      } else if (incomplete === total) {
        title = `⏰ You haven't started yet!`;
        body = `${total} habit${total > 1 ? 's' : ''} waiting for you today. Let's go!`;
      } else {
        const pct = Math.round(((total - incomplete) / total) * 100);
        title = `⚡ ${incomplete} item${incomplete > 1 ? 's' : ''} left — you're ${pct}% there!`;
        body = `${total - incomplete}/${total} habits done. Finish strong today!`;
      }
      self.registration.showNotification(title, {
        body,
        tag: 'habit-reminder',
        renotify: true,
        data: { url: '/habit-tracker/' },
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
