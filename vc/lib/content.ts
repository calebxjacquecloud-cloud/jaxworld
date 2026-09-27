/**
 * Facts and contact routing that the owner must confirm before this page is
 * shared. Kept in one place so nothing unverified hides in a component.
 */

/**
 * Automatic car wash market. Figures as supplied for the concept.
 * `source` is printed under the chart: set it to the report the figures come
 * from (publisher, report title, year) before distributing the page. While it
 * is empty, the page says plainly that the citation is pending rather than
 * inventing one.
 */
export const MARKET = {
  from: { year: '2026', value: 9.6, label: 'Automatic car wash market' },
  to: { year: '2031', value: 12.3, label: 'Projected market' },
  cagr: '~5% CAGR',
  source: '',
};

/**
 * Where "Request the investor brief" and the secondary links go. Leave empty
 * until a real address exists: the page then explains that the brief is
 * shared by introduction instead of showing a placeholder address.
 */
export const CONTACT = {
  email: '',
};
