# 🕷️ TypeScript Web Crawler

A powerful, concurrent web crawler built with TypeScript that extracts structured data from websites. This crawler is designed to be efficient, configurable, and respectful of target servers.

## ✨ Features

- **Concurrent Crawling**: Uses `p-limit` for controlled parallel requests
- **Configurable Limits**: Set maximum pages to crawl and concurrency levels
- **Data Extraction**: Extracts headings, paragraphs, links, and images
- **Domain Restriction**: Stays within the target domain
- **URL Normalization**: Handles relative URLs and normalizes paths
- **JSON Report Generation**: Exports structured data to JSON
- **TypeScript Support**: Full type safety with TypeScript
- **Error Handling**: Graceful error handling for network issues
- **Rate Limiting**: Respectful to target servers

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/z-elghenam/scraper.git
cd scraper

# Install dependencies
npm install
```

## 🚀 Usage

### Basic Usage

```bash
npm start <BASE_URL>
```

### With Custom Settings

```bash
npm start <BASE_URL> <maxConcurrency> <maxPages>
```

### Examples

```bash
# Crawl with default settings (concurrency=5, maxPages=100)
npm start https://learnwebscraping.dev/practice/ecommerce/

# Crawl with 3 concurrent requests and limit to 10 pages
npm start https://learnwebscraping.dev/practice/ecommerce/ 3 10

# Crawl with 10 concurrent requests and limit to 50 pages
npm start https://example.com 10 50
```

### Parameters

| Parameter        | Description                    | Default  | Validation          |
| ---------------- | ------------------------------ | -------- | ------------------- |
| `BASE_URL`       | The URL to start crawling from | Required | Must be a valid URL |
| `maxConcurrency` | Maximum concurrent requests    | 5        | Must be >= 1        |
| `maxPages`       | Maximum unique pages to crawl  | 100      | Must be >= 1        |

## 📊 Output

### Console Output

The crawler provides real-time feedback:

- 🕷️ Crawling progress with page count
- 🔗 Link discovery counts
- 📊 Summary of crawled pages
- ✅ Completion status

### JSON Report

The crawler generates a `report.json` file with the following structure:

```json
[
  {
    "url": "example.com/page",
    "heading": "Page Title",
    "first_paragraph": "First paragraph text...",
    "outgoing_links": [
      "https://example.com/link1",
      "https://example.com/link2"
    ],
    "image_urls": [
      "https://example.com/image1.jpg",
      "https://example.com/image2.png"
    ]
  }
]
```

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test -- --coverage
```

## 🛠️ Development

### Project Structure

```
scraper/
├── src/
│   ├── index.ts          # Main entry point
│   ├── crawl.ts          # Core crawling logic
│   ├── report.ts         # JSON report generation
│   └── crawl.test.ts     # Unit tests
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── .gitignore           # Git ignore rules
└── README.md            # This file
```

### Key Components

#### 1. **Crawler Class** (`ConcurrentCrawler`)

- Manages crawling state and concurrency
- Tracks visited pages and extracted data
- Handles graceful stopping when limits are reached

#### 2. **Data Extraction**

- **Heading**: Extracts first `<h1>` or fallback to `<h2>`
- **Paragraph**: Prioritizes paragraphs inside `<main>` tag
- **Links**: Extracts all `<a>` tags and resolves relative URLs
- **Images**: Extracts all `<img>` tags and resolves relative URLs

#### 3. **Concurrency Control**

- Uses `p-limit` for controlled parallel requests
- Configurable concurrency level
- Prevents overwhelming target servers

#### 4. **URL Normalization**

- Removes protocols (http://, https://)
- Removes trailing slashes
- Converts to lowercase for consistent matching

## 🛡️ Best Practices

### Respectful Crawling

- **User-Agent**: Identifies as `BootCrawler/1.0`
- **Rate Limiting**: Configurable concurrency to avoid rate limiting
- **Error Handling**: Graceful handling of HTTP errors
- **Content-Type Validation**: Only processes HTML responses

### Performance Tips

1. **Start with low concurrency** (1-3) to test
2. **Increase concurrency** (5-10) for production
3. **Set maxPages** based on your needs
4. **Monitor logs** for any issues

## 🔧 Configuration

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "esnext",
    "module": "esnext",
    "strict": true,
    "moduleResolution": "Node"
  },
  "include": ["./src/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Package Scripts

| Script          | Description                       |
| --------------- | --------------------------------- |
| `npm start`     | Run the crawler                   |
| `npm run test`  | Run tests                         |
| `npm run build` | Build the project (if configured) |

## 📝 Example Output

### Console Output

```
🚀 Starting crawler at: https://learnwebscraping.dev/practice/ecommerce/
📊 Settings: Concurrency=3, MaxPages=10
===========================================
🕷️ Crawling: https://learnwebscraping.dev/practice/ecommerce/ (1/10)
🔗 Found 36 links on https://learnwebscraping.dev/practice/ecommerce/
🕷️ Crawling: https://learnwebscraping.dev/practice/ecommerce/categories/ (2/10)
🔗 Found 10 links on https://learnwebscraping.dev/practice/ecommerce/categories/
...
===========================================
📊 Crawl Results:
Total pages crawled: 10
✅ Finished crawling.
First page record: learnwebscraping.dev/practice/ecommerce - Ecommerce Test Site
📝 Report written to: /path/to/report.json
```

### JSON Report

```json
[
  {
    "url": "learnwebscraping.dev/practice/ecommerce",
    "heading": "Ecommerce Test Site",
    "first_paragraph": "Welcome to our practice ecommerce site...",
    "outgoing_links": [
      "https://learnwebscraping.dev/practice/ecommerce/categories/",
      "https://learnwebscraping.dev/practice/ecommerce/page/2/"
    ],
    "image_urls": ["https://learnwebscraping.dev/static/logo.png"]
  }
]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

| Issue                  | Solution                                  |
| ---------------------- | ----------------------------------------- |
| `MODULE_NOT_FOUND`     | Run `npm install` to install dependencies |
| Connection refused     | Check the URL and internet connection     |
| Rate limited           | Reduce `maxConcurrency` value             |
| Memory issues          | Reduce `maxPages` value                   |
| Invalid JSON in report | Check if pages were successfully crawled  |

### Debugging

Add `console.log` statements or use the `--inspect` flag:

```bash
node --inspect-brk --loader tsx ./src/index.ts https://example.com
```

## 📚 Dependencies

- **[TypeScript](https://www.typescriptlang.org/)**: Type-safe JavaScript
- **[JSDOM](https://github.com/jsdom/jsdom)**: HTML parsing
- **[p-limit](https://github.com/sindresorhus/p-limit)**: Concurrency control
- **[tsx](https://github.com/privatenumber/tsx)**: TypeScript execution
- **[Vitest](https://vitest.dev/)**: Testing framework

## 🔗 Resources

- [URL API Documentation](https://nodejs.org/api/url.html)
- [Fetch API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [JSDOM Documentation](https://github.com/jsdom/jsdom)
- [Web Crawling Best Practices](https://developers.google.com/search/docs/crawling-indexing)

---

**Note**: Always respect website terms of service and `robots.txt` when crawling. This tool is for educational purposes and should be used responsibly.
