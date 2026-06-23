import fs from 'fs';
import path from 'path';
import { ExtractedPageData } from './crawl.js';

/**
 * Writes page data to a JSON report file
 * @param pageData - The page data object returned by the crawler
 * @param filename - The name of the JSON file to create (default: "report.json")
 */
export function writeJSONReport(
  pageData: Record<string, ExtractedPageData>,
  filename: string = 'report.json'
): void {
  // Sort the pages by URL for deterministic output
  const sorted = Object.values(pageData).sort((a, b) => 
    a.url.localeCompare(b.url)
  );
  
  // Serialize with 2-space indentation
  const jsonContent = JSON.stringify(sorted, null, 2);
  
  // Resolve the full path
  const filePath = path.resolve(process.cwd(), filename);
  
  // Write the file to disk
  fs.writeFileSync(filePath, jsonContent, 'utf-8');
  
  console.log(`📝 Report written to: ${filePath}`);
  console.log(`📊 Total pages in report: ${sorted.length}`);
}
