import { describe, it, expect } from 'vitest';
import { 
  normalizeURL, 
  getHeadingFromHTML, 
  getFirstParagraphFromHTML,
  getURLsFromHTML,
  getImagesFromHTML,
  extractPageData,
  ExtractedPageData
} from './crawl';

describe('normalizeURL', () => {
  it('should remove protocol from URL', () => {
    expect(normalizeURL('https://example.com')).toBe('example.com');
    expect(normalizeURL('http://example.com')).toBe('example.com');
  });

  it('should remove trailing slashes', () => {
    expect(normalizeURL('https://example.com/')).toBe('example.com');
    expect(normalizeURL('https://example.com/path/')).toBe('example.com/path');
  });

  it('should handle URLs with query parameters', () => {
    expect(normalizeURL('https://example.com?query=test')).toBe('example.com');
    expect(normalizeURL('https://example.com/path?query=test')).toBe('example.com/path');
  });

  it('should handle URLs with fragments', () => {
    expect(normalizeURL('https://example.com#section')).toBe('example.com');
    expect(normalizeURL('https://example.com/path#section')).toBe('example.com/path');
  });

  it('should handle subdomains correctly', () => {
    expect(normalizeURL('https://sub.example.com')).toBe('sub.example.com');
    expect(normalizeURL('https://sub.example.com/path/')).toBe('sub.example.com/path');
  });

  it('should handle uppercase and lowercase consistently', () => {
    expect(normalizeURL('HTTPS://EXAMPLE.COM')).toBe('example.com');
    expect(normalizeURL('https://Example.com')).toBe('example.com');
  });

  it('should handle URLs with ports', () => {
    expect(normalizeURL('https://example.com:8080')).toBe('example.com');
    expect(normalizeURL('https://example.com:8080/path/')).toBe('example.com/path');
  });

  it('should handle paths that are just "/" correctly', () => {
    expect(normalizeURL('https://example.com/')).toBe('example.com');
    expect(normalizeURL('http://example.com/')).toBe('example.com');
  });

  it('should handle multiple trailing slashes', () => {
    expect(normalizeURL('https://example.com//')).toBe('example.com');
    expect(normalizeURL('https://example.com/path//')).toBe('example.com/path');
  });
});

describe('getHeadingFromHTML', () => {
  it('should return h1 text when present', () => {
    const html = `<html><body><h1>Test Title</h1></body></html>`;
    expect(getHeadingFromHTML(html)).toBe('Test Title');
  });

  it('should return h2 text when h1 is not present', () => {
    const html = `<html><body><h2>Test Subtitle</h2></body></html>`;
    expect(getHeadingFromHTML(html)).toBe('Test Subtitle');
  });

  it('should prefer h1 over h2 when both are present', () => {
    const html = `<html><body><h1>Main Title</h1><h2>Subtitle</h2></body></html>`;
    expect(getHeadingFromHTML(html)).toBe('Main Title');
  });

  it('should return empty string when no h1 or h2 are present', () => {
    const html = `<html><body><p>Just a paragraph</p></body></html>`;
    expect(getHeadingFromHTML(html)).toBe('');
  });

  it('should handle whitespace in heading text', () => {
    const html = `<html><body><h1>  Title with spaces  </h1></body></html>`;
    expect(getHeadingFromHTML(html)).toBe('Title with spaces');
  });
});

describe('getFirstParagraphFromHTML', () => {
  it('should return text from first paragraph when no main tag', () => {
    const html = `<html><body><p>First paragraph.</p><p>Second paragraph.</p></body></html>`;
    expect(getFirstParagraphFromHTML(html)).toBe('First paragraph.');
  });

  it('should prioritize paragraph inside main tag', () => {
    const html = `
      <html><body>
        <p>Outside paragraph.</p>
        <main>
          <p>Main paragraph.</p>
        </main>
      </body></html>
    `;
    expect(getFirstParagraphFromHTML(html)).toBe('Main paragraph.');
  });

  it('should return empty string when no paragraph exists', () => {
    const html = `<html><body><h1>No paragraphs here</h1></body></html>`;
    expect(getFirstParagraphFromHTML(html)).toBe('');
  });

  it('should handle whitespace in paragraph text', () => {
    const html = `<html><body><p>  Paragraph with spaces  </p></body></html>`;
    expect(getFirstParagraphFromHTML(html)).toBe('Paragraph with spaces');
  });

  it('should handle multiple paragraphs inside main and return first', () => {
    const html = `
      <html><body>
        <main>
          <p>First main paragraph.</p>
          <p>Second main paragraph.</p>
        </main>
      </body></html>
    `;
    expect(getFirstParagraphFromHTML(html)).toBe('First main paragraph.');
  });

  it('should handle nested paragraphs inside main', () => {
    const html = `
      <html><body>
        <main>
          <div>
            <p>Nested paragraph in main.</p>
          </div>
        </main>
      </body></html>
    `;
    expect(getFirstParagraphFromHTML(html)).toBe('Nested paragraph in main.');
  });
});

describe('getURLsFromHTML', () => {
  it('should convert relative URLs to absolute URLs', () => {
    const baseURL = 'https://crawler-test.com';
    const html = `<html><body><a href="/path/one"><span>Boot.dev</span></a></body></html>`;
    const actual = getURLsFromHTML(html, baseURL);
    const expected = ['https://crawler-test.com/path/one'];
    expect(actual).toEqual(expected);
  });

  it('should handle multiple anchor tags', () => {
    const baseURL = 'https://example.com';
    const html = `
      <html><body>
        <a href="/page1">Page 1</a>
        <a href="/page2">Page 2</a>
        <a href="https://external.com">External</a>
      </body></html>
    `;
    const actual = getURLsFromHTML(html, baseURL);
    const expected = [
      'https://example.com/page1',
      'https://example.com/page2',
      'https://external.com/'
    ];
    expect(actual).toEqual(expected);
  });

  it('should handle empty href attributes', () => {
    const baseURL = 'https://example.com';
    const html = `
      <html><body>
        <a href="/valid">Valid</a>
        <a href="">Empty</a>
        <a>No href</a>
      </body></html>
    `;
    const actual = getURLsFromHTML(html, baseURL);
    const expected = ['https://example.com/valid'];
    expect(actual).toEqual(expected);
  });

  it('should handle invalid URLs gracefully', () => {
    const baseURL = 'https://example.com';
    const html = `
      <html><body>
        <a href="/valid">Valid</a>
        <a href="javascript:void(0)">Invalid</a>
      </body></html>
    `;
    const actual = getURLsFromHTML(html, baseURL);
    const expected = ['https://example.com/valid'];
    expect(actual).toEqual(expected);
  });

  it('should return empty array when no anchors exist', () => {
    const baseURL = 'https://example.com';
    const html = `<html><body><p>No links here</p></body></html>`;
    const actual = getURLsFromHTML(html, baseURL);
    const expected: string[] = [];
    expect(actual).toEqual(expected);
  });
});

describe('getImagesFromHTML', () => {
  it('should convert relative image URLs to absolute URLs', () => {
    const baseURL = 'https://crawler-test.com';
    const html = `<html><body><img src="/logo.png" alt="Logo"></body></html>`;
    const actual = getImagesFromHTML(html, baseURL);
    const expected = ['https://crawler-test.com/logo.png'];
    expect(actual).toEqual(expected);
  });

  it('should handle multiple image tags', () => {
    const baseURL = 'https://example.com';
    const html = `
      <html><body>
        <img src="/image1.jpg">
        <img src="/images/image2.png">
        <img src="https://cdn.example.com/logo.svg">
      </body></html>
    `;
    const actual = getImagesFromHTML(html, baseURL);
    const expected = [
      'https://example.com/image1.jpg',
      'https://example.com/images/image2.png',
      'https://cdn.example.com/logo.svg'
    ];
    expect(actual).toEqual(expected);
  });

  it('should handle missing src attributes', () => {
    const baseURL = 'https://example.com';
    const html = `
      <html><body>
        <img src="/valid.jpg">
        <img alt="No src">
        <img src="">
      </body></html>
    `;
    const actual = getImagesFromHTML(html, baseURL);
    const expected = ['https://example.com/valid.jpg'];
    expect(actual).toEqual(expected);
  });

  it('should handle relative paths with ..', () => {
    const baseURL = 'https://example.com/blog/post/';
    const html = `<html><body><img src="../images/photo.jpg"></body></html>`;
    const actual = getImagesFromHTML(html, baseURL);
    const expected = ['https://example.com/blog/images/photo.jpg'];
    expect(actual).toEqual(expected);
  });

  it('should return empty array when no images exist', () => {
    const baseURL = 'https://example.com';
    const html = `<html><body><p>No images here</p></body></html>`;
    const actual = getImagesFromHTML(html, baseURL);
    const expected: string[] = [];
    expect(actual).toEqual(expected);
  });
});

describe('extractPageData', () => {
  it('should extract all page data correctly', () => {
    const inputURL = 'https://crawler-test.com';
    const inputBody = `
      <html><body>
        <h1>Test Title</h1>
        <p>This is the first paragraph.</p>
        <a href="/link1">Link 1</a>
        <img src="/image1.jpg" alt="Image 1">
      </body></html>
    `;

    const actual = extractPageData(inputBody, inputURL);
    const expected: ExtractedPageData = {
      url: 'https://crawler-test.com',
      heading: 'Test Title',
      first_paragraph: 'This is the first paragraph.',
      outgoing_links: ['https://crawler-test.com/link1'],
      image_urls: ['https://crawler-test.com/image1.jpg'],
    };

    expect(actual).toEqual(expected);
  });

  it('should handle pages without heading or paragraph', () => {
    const inputURL = 'https://example.com';
    const inputBody = `
      <html><body>
        <a href="/link">Link</a>
        <img src="/image.png">
      </body></html>
    `;

    const actual = extractPageData(inputBody, inputURL);
    const expected: ExtractedPageData = {
      url: 'https://example.com',
      heading: '',
      first_paragraph: '',
      outgoing_links: ['https://example.com/link'],
      image_urls: ['https://example.com/image.png'],
    };

    expect(actual).toEqual(expected);
  });

  it('should prioritize main paragraph over outside paragraphs', () => {
    const inputURL = 'https://example.com';
    const inputBody = `
      <html><body>
        <p>Outside paragraph.</p>
        <main>
          <h1>Main Title</h1>
          <p>Main paragraph.</p>
        </main>
        <a href="/outside">Outside Link</a>
        <img src="/outside.jpg">
      </body></html>
    `;

    const actual = extractPageData(inputBody, inputURL);
    const expected: ExtractedPageData = {
      url: 'https://example.com',
      heading: 'Main Title',
      first_paragraph: 'Main paragraph.',
      outgoing_links: ['https://example.com/outside'],
      image_urls: ['https://example.com/outside.jpg'],
    };

    expect(actual).toEqual(expected);
  });

  it('should handle multiple links and images', () => {
    const inputURL = 'https://example.com';
    const inputBody = `
      <html><body>
        <h1>Page with many links</h1>
        <p>Content here.</p>
        <a href="/link1">Link 1</a>
        <a href="/link2">Link 2</a>
        <a href="https://external.com">External</a>
        <img src="/img1.jpg">
        <img src="/img2.png">
        <img src="https://cdn.com/logo.svg">
      </body></html>
    `;

    const actual = extractPageData(inputBody, inputURL);
    const expected: ExtractedPageData = {
      url: 'https://example.com',
      heading: 'Page with many links',
      first_paragraph: 'Content here.',
      outgoing_links: [
        'https://example.com/link1',
        'https://example.com/link2',
        'https://external.com/'
      ],
      image_urls: [
        'https://example.com/img1.jpg',
        'https://example.com/img2.png',
        'https://cdn.com/logo.svg'
      ],
    };

    expect(actual).toEqual(expected);
  });

  it('should filter out non-http/https URLs', () => {
    const inputURL = 'https://example.com';
    const inputBody = `
      <html><body>
        <h1>Filtering test</h1>
        <p>Content</p>
        <a href="/valid">Valid</a>
        <a href="javascript:void(0)">Invalid JS</a>
        <a href="mailto:test@example.com">Email</a>
        <img src="/valid.jpg">
        <img src="data:image/png;base64,...">
      </body></html>
    `;

    const actual = extractPageData(inputBody, inputURL);
    const expected: ExtractedPageData = {
      url: 'https://example.com',
      heading: 'Filtering test',
      first_paragraph: 'Content',
      outgoing_links: ['https://example.com/valid'],
      image_urls: ['https://example.com/valid.jpg'],
    };

    expect(actual).toEqual(expected);
  });
});
