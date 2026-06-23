import { crawlSiteAsync, ExtractedPageData } from './crawl.js';
import { writeJSONReport } from './report.js';

/**
 * Main function to run the web crawler
 */
async function main(): Promise<void> {
  // Get command line arguments (skip node and script path)
  const args = process.argv.slice(2);
  
  // Check if we have the minimum required arguments
  if (args.length < 1) {
    console.error('Error: Please provide a base URL to crawl.');
    console.error('Usage: npm start BASE_URL [maxConcurrency] [maxPages]');
    console.error('  BASE_URL: The URL to start crawling from');
    console.error('  maxConcurrency: Maximum concurrent requests (default: 5)');
    console.error('  maxPages: Maximum unique pages to crawl (default: 100)');
    console.error('Example: npm start https://learnwebscraping.dev/practice/ecommerce/ 3 10');
    process.exit(1);
  }
  
  // Parse arguments
  const baseURL = args[0];
  const maxConcurrency = args[1] ? parseInt(args[1], 10) : 5;
  const maxPages = args[2] ? parseInt(args[2], 10) : 100;
  
  // Validate numbers
  if (isNaN(maxConcurrency) || maxConcurrency < 1) {
    console.error('Error: maxConcurrency must be a positive number');
    process.exit(1);
  }
  
  if (isNaN(maxPages) || maxPages < 1) {
    console.error('Error: maxPages must be a positive number');
    process.exit(1);
  }
  
  console.log(`🚀 Starting crawler at: ${baseURL}`);
  console.log(`📊 Settings: Concurrency=${maxConcurrency}, MaxPages=${maxPages}`);
  console.log('===========================================');
  
  // Crawl the website
  const pages = await crawlSiteAsync(baseURL, maxConcurrency, maxPages);
  
  // Display results
  console.log('\n===========================================');
  console.log('📊 Crawl Results:');
  console.log(`Total pages crawled: ${Object.keys(pages).length}`);
  console.log('✅ Finished crawling.');
  
  // Show first page record
  const firstPage = Object.values(pages)[0];
  if (firstPage) {
    console.log(`First page record: ${firstPage.url} - ${firstPage.heading}`);
  }
  
  // Write the JSON report
  writeJSONReport(pages, 'report.json');
  
  console.log('\n📄 Page Summary:');
  
  // Sort pages by URL for display
  const sortedPages = Object.entries(pages).sort((a, b) => 
    a[0].localeCompare(b[0])
  );
  
  // Show first 10 pages for display
  const displayCount = Math.min(10, sortedPages.length);
  for (let i = 0; i < displayCount; i++) {
    const [url, data] = sortedPages[i];
    console.log(`  ${url}:`);
    console.log(`    Heading: ${data.heading || '(none)'}`);
    console.log(`    First Paragraph: ${data.first_paragraph.substring(0, 50) || '(none)'}...`);
    console.log(`    Outgoing Links: ${data.outgoing_links.length}`);
    console.log(`    Images: ${data.image_urls.length}`);
  }
  
  if (sortedPages.length > 10) {
    console.log(`  ... and ${sortedPages.length - 10} more pages`);
  }
  
  process.exit(0);
}

// Call the main function
main();
