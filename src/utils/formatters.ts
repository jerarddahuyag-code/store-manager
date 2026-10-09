/**
 * Formats a numeric value into Philippine Peso (₱) string.
 */
export function formatPHP(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₱0.00';
  }
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats Firestore Timestamp, Date object, or numeric timestamp into human-readable date.
 */
export function formatDate(dateVal: unknown): string {
  if (!dateVal) return '';

  let date: Date;
  if (typeof dateVal === 'object' && dateVal !== null && 'toDate' in dateVal && typeof (dateVal as { toDate: () => Date }).toDate === 'function') {
    date = (dateVal as { toDate: () => Date }).toDate();
  } else if (dateVal instanceof Date) {
    date = dateVal;
  } else if (typeof dateVal === 'number' || typeof dateVal === 'string') {
    date = new Date(dateVal);
  } else {
    return '';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

/**
 * Extracts milliseconds from Firestore Timestamp, Date, or numeric timestamp safely.
 */
export function getTimeMs(dateVal: unknown): number {
  if (!dateVal) return 0;
  if (
    typeof dateVal === 'object' &&
    dateVal !== null &&
    'toMillis' in dateVal &&
    typeof (dateVal as { toMillis: () => number }).toMillis === 'function'
  ) {
    return (dateVal as { toMillis: () => number }).toMillis();
  }
  if (typeof dateVal === 'object' && dateVal !== null && 'seconds' in dateVal) {
    return (dateVal as { seconds: number }).seconds * 1000;
  }
  if (dateVal instanceof Date) {
    return dateVal.getTime();
  }
  if (typeof dateVal === 'number') {
    return dateVal;
  }
  return 0;
}
