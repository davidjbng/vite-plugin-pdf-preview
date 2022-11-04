# vite-plugin-pdf-preview

Preview any web page as a PDF

## Getting Started

```sh
npm i vite-plugin-pdf-preview puppeteer
```

## Usage

```ts
import pdfPreview from "vite-plugin-pdf-preview";

export default defineConfig({
  plugins: [
    pdfPreview({
      pages: ["page.html"],
      watch: ["**/*.html", "**/*.css"],
    }),
  ],
});
```

## Viewing PDF Files

Files in the browser do not reload when their content changes.

On Windows use [Sumatra PDF](https://www.sumatrapdfreader.org/free-pdf-reader) to have file content update automatically.

Recommendations for other platforms welcome.
