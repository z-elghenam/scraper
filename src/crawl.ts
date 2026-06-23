import { JSDOM } from 'jsdom';
import pLimit from 'p-limit';

/**
 * Interface for extracted page data
 */
export interface ExtractedPageData {
  url: string;
  heading: string;
  first_paragraph: string;
  outgoing_links: string[];
  image_urls: string[];
}

/**
 * Normalizes a URL by removing protocol and trailing slashes
 * @param url - The URL string to normalize
 * @returns The normalized URL string
 */
export function normalizeURL(url: string): string {
  const urlObj = new URL(url);
  // Get hostname + pathname
  let normalized = urlObj.hostname + urlObj.pathname;
  
  // Remove all trailing slashes
  while (normalized.endsWith('/') && normalized.length > urlObj.hostname.length) {
    normalized = normalized.slice(0, -1);
  }
  
  // If we removed the trailing slash and it was just the hostname,
  // make sure we don't remove the last character of the hostname
  // (This handles the case where pathname is "/" or multiple slashes)
  if (normalized === urlObj.hostname) {
    return normalized.toLowerCase();
  }
  
  return normalized.toLowerCase();
}

/**
 * Extracts the heading from HTML, preferring h1 over h2
 * @param html - The HTML string
 * @returns The text content of h1 if found, otherwise h2, otherwise empty string
 */
export function getHeadingFromHTML(html: string): string {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  
  // Try to find h1 first
  const h1 = document.querySelector('h1');
  if (h1) {
    return h1.textContent?.trim() || '';
  }
  
  // Fallback to h2
  const h2 = document.querySelector('h2');
  if (h2) {
    return h2.textContent?.trim() || '';
  }
  
  return '';
}

/**
 * Extracts the first paragraph from HTML, preferring paragraphs inside <main>
 * @param html - The HTML string
 * @returns The text content of the first paragraph in main, or first paragraph overall
 */
export function getFirstParagraphFromHTML(html: string): string {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  
  // Try to find paragraph inside main first
  const main = document.querySelector('main');
  if (main) {
    const mainParagraph = main.querySelector('p');
    if (mainParagraph) {
      return mainParagraph.textContent?.trim() || '';
    }
  }
  
  // Fallback to any paragraph
  const paragraph = document.querySelector('p');
  if (paragraph) {
    return paragraph.textContent?.trim() || '';
  }
  
  return '';
}

/**
 * Extracts all URLs from anchor tags in HTML
 * @param html - The HTML string
 * @param baseURL - The base URL to resolve relative URLs
 * @returns Array of absolute URLs found in the HTML
 */
export function getURLsFromHTML(html: string, baseURL: string): string[] {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const anchorElements = document.querySelectorAll('a');
  const urls: string[] = [];
  
  for (const anchor of anchorElements) {
    const href = anchor.getAttribute('href');
    if (href && href.trim() !== '') {
      try {
        // Resolve relative URLs to absolute
        const absoluteURL = new URL(href, baseURL).toString();
        // Only include http and https URLs
        if (absoluteURL.startsWith('http://') || absoluteURL.startsWith('https://')) {
          urls.push(absoluteURL);
        }
      } catch (error) {
        // Skip invalid URLs
        continue;
      }
    }
  }
  
  return urls;
}

/**
 * Extracts all image URLs from img tags in HTML
 * @param html - The HTML string
 * @param baseURL - The base URL to resolve relative URLs
 * @returns Array of absolute image URLs found in the HTML
 */
export function getImagesFromHTML(html: string, baseURL: string): string[] {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const imgElements = document.querySelectorAll('img');
  const urls: string[] = [];
  
  for (const img of imgElements) {
    const src = img.getAttribute('src');
    if (src && src.trim() !== '') {
      try {
        // Resolve relative URLs to absolute
        const absoluteURL = new URL(src, baseURL).toString();
        // Only include http and https URLs
        if (absoluteURL.startsWith('http://') || absoluteURL.startsWith('https://')) {
          urls.push(absoluteURL);
        }
      } catch (error) {
        // Skip invalid URLs
        continue;
      }
    }
  }
  
  return urls;
}

/**
 * Extracts all data from a page: heading, first paragraph, links, and images
 * @param html - The HTML string
 * @param pageURL - The absolute URL of the page
 * @returns An object containing all extracted data
 */
export function extractPageData(html: string, pageURL: string): ExtractedPageData {
  return {
    url: pageURL,
    heading: getHeadingFromHTML(html),
    first_paragraph: getFirstParagraphFromHTML(html),
    outgoing_links: getURLsFromHTML(html, pageURL),
    image_urls: getImagesFromHTML(html, pageURL),
  };
}

/**
 * Concurrent crawler class for managing parallel web crawling
 */
export class ConcurrentCrawler {
  private baseURL: string;
  private pages: Record<string, ExtractedPageData>;
  private limit: ReturnType<typeof pLimit>;
  private maxPages: number;
  private shouldStop: boolean = false;
  private allTasks: Set<Promise<void>> = new Set();

  /**
   * Creates a new ConcurrentCrawler instance
   * @param baseURL - The root URL of the website to crawl
   * @param maxConcurrency - Maximum number of concurrent requests (default: 5)
   * @param maxPages - Maximum number of unique pages to crawl (default: 100)
   */
  constructor(baseURL: string, maxConcurrency: number = 5, maxPages: number = 100) {
    this.baseURL = baseURL;
    this.pages = {};
    this.limit = pLimit(maxConcurrency);
    this.maxPages = maxPages;
  }

  /**
   * Adds a page visit to the pages record
   * @param normalizedURL - The normalized URL of the page
   * @returns True if it's the first visit, false if already visited
   */
  private addPageVisit(normalizedURL: string): boolean {
    // If we should stop, don't add more pages
    if (this.shouldStop) {
      return false;
    }

    // If we've already seen this URL, return false
    if (this.pages[normalizedURL] !== undefined) {
      return false;
    }

    // Check if we've reached the maximum number of pages
    if (Object.keys(this.pages).length >= this.maxPages) {
      this.shouldStop = true;
      console.log(`🛑 Reached maximum number of pages (${this.maxPages}) to crawl.`);
      return false;
    }

    // Add new URL to pages with empty data (will be filled later)
    this.pages[normalizedURL] = {
      url: normalizedURL,
      heading: '',
      first_paragraph: '',
      outgoing_links: [],
      image_urls: []
    };
    return true;
  }

  /**
   * Fetches HTML content from a URL with concurrency control
   * @param currentURL - The URL to fetch
   * @returns The HTML content as a string, or null if an error occurs
   */
  private async getHTML(currentURL: string): Promise<string | null> {
    return await this.limit(async () => {
      try {
        const response = await fetch(currentURL, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; BootCrawler/1.0; +https://boot.dev)'
          },
          redirect: 'follow'
        });

        // Check for HTTP errors (400+)
        if (response.status >= 400) {
          console.error(`❌ HTTP Error: ${response.status} ${response.statusText} for ${currentURL}`);
          return null;
        }

        // Check content type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('text/html')) {
          console.error(`❌ Error: Content-Type is not HTML (${contentType}) for ${currentURL}`);
          return null;
        }

        // Get the HTML as text
        return await response.text();
      } catch (error) {
        console.error(`❌ Error fetching ${currentURL}:`, error);
        return null;
      }
    });
  }

  /**
   * Recursively crawls a single page and its links
   * @param currentURL - The URL to crawl
   */
  private async crawlPage(currentURL: string): Promise<void> {
    // Check if we should stop
    if (this.shouldStop) {
      return;
    }

    // Check if URL is on the same domain
    const baseUrlObj = new URL(this.baseURL);
    const currentUrlObj = new URL(currentURL);
    
    if (baseUrlObj.hostname !== currentUrlObj.hostname) {
      return;
    }

    // Normalize the current URL
    const normalizedURL = normalizeURL(currentURL);

    // Check if we've already visited this page
    const isNewPage = this.addPageVisit(normalizedURL);
    if (!isNewPage) {
      return;
    }

    console.log(`🕷️ Crawling: ${currentURL} (${Object.keys(this.pages).length}/${this.maxPages})`);

    // Fetch the HTML
    const html = await this.getHTML(currentURL);
    if (!html) {
      return;
    }

    // Extract page data
    const data = extractPageData(html, currentURL);
    
    // Save the extracted data to pages
    this.pages[normalizedURL] = data;
    
    console.log(`🔗 Found ${data.outgoing_links.length} links on ${currentURL}`);

    // Create promises for each URL in outgoing_links
    const crawlPromises = data.outgoing_links.map((url) => {
      const task = this.crawlPage(url);
      // Add task to the set
      this.allTasks.add(task);
      // Remove task from set when complete
      task.finally(() => {
        this.allTasks.delete(task);
      });
      return task;
    });
    
    // Wait for all crawls to complete
    await Promise.all(crawlPromises);
  }

  /**
   * Starts the crawling process
   * @returns The pages record with ExtractedPageData
   */
  public async crawl(): Promise<Record<string, ExtractedPageData>> {
    // Start with the base URL
    const initialTask = this.crawlPage(this.baseURL);
    this.allTasks.add(initialTask);
    initialTask.finally(() => {
      this.allTasks.delete(initialTask);
    });

    // Wait for all tasks to complete
    await Promise.all(this.allTasks);
    
    return this.pages;
  }
}

/**
 * High-level function to crawl a site with concurrency
 * @param baseURL - The root URL of the website to crawl
 * @param maxConcurrency - Maximum number of concurrent requests (default: 5)
 * @param maxPages - Maximum number of unique pages to crawl (default: 100)
 * @returns The pages record with ExtractedPageData
 */
export async function crawlSiteAsync(
  baseURL: string,
  maxConcurrency: number = 5,
  maxPages: number = 100
): Promise<Record<string, ExtractedPageData>> {
  const crawler = new ConcurrentCrawler(baseURL, maxConcurrency, maxPages);
  return await crawler.crawl();
}
