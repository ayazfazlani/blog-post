/**
 * Content Splitter Utility
 * 
 * This utility splits HTML content at specific percentages (33% and 66%)
 * and returns the content parts so we can inject components between them.
 * 
 * STEP-BY-STEP EXPLANATION:
 * 
 * Step 1: Remove HTML tags to get plain text
 * Step 2: Calculate 33% and 66% positions in plain text
 * Step 3: Find the corresponding positions in HTML
 * Step 4: Split HTML at those positions (without breaking tags)
 * Step 5: Return content parts for rendering
 */

/**
 * Split content at 33% and 66% positions
 * @param htmlContent - The HTML content string
 * @returns Object with content parts and insertion positions
 */
export function splitContentAtPercentages(htmlContent: string): {
  before33: string;
  at33: boolean; // Should we insert component here?
  between33and66: string;
  at66: boolean; // Should we insert component here?
  after66: string;
  shouldInsertAt33: boolean;
  shouldInsertAt66: boolean;
} {
  if (!htmlContent || htmlContent.trim().length === 0) {
    return {
      before33: '',
      at33: false,
      between33and66: '',
      at66: false,
      after66: htmlContent,
      shouldInsertAt33: false,
      shouldInsertAt66: false,
    };
  }

  // STEP 1: Remove HTML tags to get plain text length
  const plainText = htmlContent.replace(/<[^>]*>/g, '');
  const totalLength = plainText.length;

  // If content is too short, don't split
  if (totalLength < 500) {
    return {
      before33: htmlContent,
      at33: false,
      between33and66: '',
      at66: false,
      after66: '',
      shouldInsertAt33: false,
      shouldInsertAt66: false,
    };
  }

  // For content >= ~200 words (~1000 chars), show at both 33% and 66%
  // 200 words ≈ 1000-1200 characters (average 5-6 chars per word)
  const shouldShowAtBoth = totalLength >= 1000; // Approximately 200 words

  // STEP 2: Calculate positions (33% and 66% of text)
  const position33 = Math.floor(totalLength * 0.33);
  const position66 = Math.floor(totalLength * 0.66);

  // STEP 3: Find insertion points in HTML (without breaking tags)
  const split33 = findSafeSplitPoint(htmlContent, position33);
  const split66 = findSafeSplitPoint(htmlContent, position66);

  // STEP 4: Split the HTML content
  const before33 = htmlContent.substring(0, split33);
  const between33and66 = htmlContent.substring(split33, split66);
  const after66 = htmlContent.substring(split66);

  // Determine if we should insert components
  // Show at both 33% and 66% if content is >= 2000 chars
  const shouldInsertAt33 = shouldShowAtBoth;
  const shouldInsertAt66 = shouldShowAtBoth;

  return {
    before33,
    at33: shouldInsertAt33,
    between33and66,
    at66: shouldInsertAt66,
    after66,
    shouldInsertAt33,
    shouldInsertAt66,
  };
}

/**
 * Find a safe point to split HTML without breaking tags
 * @param html - HTML content
 * @param targetPosition - Target character position in plain text
 * @returns Safe position in HTML string
 */
function findSafeSplitPoint(html: string, targetPosition: number): number {
  let plainTextCount = 0;
  let inTag = false;
  let lastSafePoint = 0;

  for (let i = 0; i < html.length; i++) {
    const char = html[i];

    if (char === '<') {
      inTag = true;
    } else if (char === '>') {
      inTag = false;
      lastSafePoint = i + 1; // Safe to split after tag closes
    } else if (!inTag) {
      plainTextCount++;
      if (plainTextCount >= targetPosition) {
        // Try to find end of current word/sentence
        const nextSpace = html.indexOf(' ', i);
        const nextPeriod = html.indexOf('.', i);
        const nextTag = html.indexOf('<', i);
        
        // Find the nearest safe break point
        let safeBreak = html.length;
        if (nextSpace > i && nextSpace < safeBreak) safeBreak = nextSpace;
        if (nextPeriod > i && nextPeriod < safeBreak) safeBreak = nextPeriod;
        if (nextTag > i && nextTag < safeBreak) safeBreak = nextTag;
        
        return safeBreak > i ? safeBreak : lastSafePoint;
      }
    }
  }

  return lastSafePoint || html.length;
}

