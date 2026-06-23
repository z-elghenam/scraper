import { crawlSiteAsync } from './src/crawl.js';

async function testConcurrency() {
  const baseURL = 'https://learnwebscraping.dev/practice/ecommerce/';
  
  console.log('🧪 Testing with concurrency 1...');
  console.time('Concurrency 1');
  const pages1 = await crawlSiteAsync(baseURL, 1);
  console.timeEnd('Concurrency 1');
  console.log(`  Pages crawled: ${Object.keys(pages1).length}\n`);
  
  console.log('🧪 Testing with concurrency 5...');
  console.time('Concurrency 5');
  const pages5 = await crawlSiteAsync(baseURL, 5);
  console.timeEnd('Concurrency 5');
  console.log(`  Pages crawled: ${Object.keys(pages5).length}\n`);
  
  console.log('🧪 Testing with concurrency 10...');
  console.time('Concurrency 10');
  const pages10 = await crawlSiteAsync(baseURL, 10);
  console.timeEnd('Concurrency 10');
  console.log(`  Pages crawled: ${Object.keys(pages10).length}\n`);
}

testConcurrency().catch(console.error);
