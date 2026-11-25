import { imageUrl } from '../config/api';

export const toYMD = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Parse "YYYY-MM-DD" as a local date (avoids timezone shifts)
export const parseYMD = (value) => {
  if (!value) return null;
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const formatDate = (value) => {
  const d = parseYMD(value);
  if (!d) return '';
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

export const formatRange = (start, end) => `${formatDate(start)} – ${formatDate(end)}`;

export const daysBetween = (start, end) => {
  const a = parseYMD(start);
  const b = parseYMD(end);
  if (!a || !b) return 0;
  return Math.round((b - a) / 86400000) + 1;
};

export const formatPrice = (item) => {
  if (!item) return '';
  if (item.is_free) return 'Free';
  const rate = Number(item.daily_rate || 0);
  return `$${rate % 1 === 0 ? rate.toFixed(0) : rate.toFixed(2)}/day`;
};

export const primaryImageUrl = (item) => {
  const images = item?.images || [];
  const primary = images.find((img) => img.is_primary) || images[0];
  return primary ? imageUrl(primary.image_path) : null;
};

export const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

export const initials = (name) =>
  (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
