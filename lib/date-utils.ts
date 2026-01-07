/**
 * Date utility functions for timezone conversion
 * Converts dates to PKT (Pakistan Standard Time) for SEO and logging
 * PKT is UTC+5 (Pakistan Standard Time)
 */

/**
 * Convert a date to PKT timezone and return as ISO string
 * PKT is UTC+5 (Pakistan Standard Time)
 * @param date - Date to convert (defaults to now)
 * @returns ISO string in PKT timezone (UTC+5)
 */
export function toPSTISOString(date: Date = new Date()): string {
  // PKT is UTC+5 (5 hours ahead of UTC)
  const pktOffsetMinutes = 5 * 60; // +5 hours in minutes
  
  // Get the UTC time in milliseconds
  const utcTime = date.getTime();
  
  // Calculate PKT time (add 5 hours)
  const pktTime = utcTime + (pktOffsetMinutes * 60 * 1000);
  
  // Create a new date object for PKT
  const pktDate = new Date(pktTime);
  
  // Format as ISO string
  const year = pktDate.getUTCFullYear();
  const month = String(pktDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(pktDate.getUTCDate()).padStart(2, '0');
  const hours = String(pktDate.getUTCHours()).padStart(2, '0');
  const minutes = String(pktDate.getUTCMinutes()).padStart(2, '0');
  const seconds = String(pktDate.getUTCSeconds()).padStart(2, '0');
  const milliseconds = String(pktDate.getUTCMilliseconds()).padStart(3, '0');
  
  // Return ISO string with PKT offset (+05:00)
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}+05:00`;
}

/**
 * Convert a date to PKT and return formatted for console logs
 * @param date - Date to convert (defaults to now)
 * @returns Formatted PKT timestamp string
 */
export function toPSTTimestamp(date: Date = new Date()): string {
  return toPSTISOString(date);
}

/**
 * Get current date/time in PKT (Pakistan Standard Time)
 * @returns Date object adjusted to PKT (UTC+5)
 */
export function getPSTDate(): Date {
  const pktOffsetMinutes = 5 * 60; // +5 hours in minutes
  return new Date(Date.now() + (pktOffsetMinutes * 60 * 1000));
}

