const DEFAULT_DURATION = 5000;

function ensureToastRegion() {
  let region = document.querySelector('[data-toast-region]');
  if (region) return region;

  region = document.createElement('div');
  region.className = 'toast-region';
  region.dataset.toastRegion = 'true';
  region.setAttribute('aria-live', 'polite');
  region.setAttribute('aria-label', 'Notifications');
  document.body.appendChild(region);
  return region;
}

function removeToast(toast) {
  toast.classList.add('is-leaving');
  window.setTimeout(() => toast.remove(), 160);
}

export function showToast(message, options = {}) {
  if (typeof document === 'undefined' || !message) return null;

  const { type = 'info', duration = DEFAULT_DURATION, title } = options;
  const region = ensureToastRegion();
  const toast = document.createElement('div');
  toast.className = `toast-message toast-${type}`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

  const content = document.createElement('div');
  content.className = 'toast-content';

  if (title) {
    const titleElement = document.createElement('strong');
    titleElement.textContent = title;
    content.appendChild(titleElement);
  }

  const messageElement = document.createElement('span');
  messageElement.textContent = message;
  content.appendChild(messageElement);

  const closeButton = document.createElement('button');
  closeButton.className = 'toast-close';
  closeButton.type = 'button';
  closeButton.setAttribute('aria-label', 'Dismiss notification');
  closeButton.textContent = 'x';
  closeButton.addEventListener('click', () => removeToast(toast));

  toast.append(content, closeButton);
  region.appendChild(toast);

  if (duration > 0) {
    window.setTimeout(() => removeToast(toast), duration);
  }

  return toast;
}

