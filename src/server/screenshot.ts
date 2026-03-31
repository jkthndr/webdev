import { chromium, Browser } from "playwright";

const DISABLE_ANIM_CSS = `*, *::before, *::after {
  animation-duration: 0s !important;
  animation-delay: 0s !important;
  transition-duration: 0s !important;
  transition-delay: 0s !important;
}`;

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await chromium.launch();
  }
  return browserInstance;
}

export interface ScreenshotOptions {
  url: string;
  viewport?: { width: number; height: number };
  fullPage?: boolean;
  deviceScaleFactor?: number;
}

export async function takeScreenshot(opts: ScreenshotOptions): Promise<Buffer> {
  const browser = await getBrowser();
  const viewport = opts.viewport ?? { width: 1280, height: 800 };
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: opts.deviceScaleFactor ?? 1,
  });

  const page = await context.newPage();
  await page.goto(opts.url, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: DISABLE_ANIM_CSS });
  await page.evaluate("document.fonts.ready");
  await page.waitForTimeout(300);

  const buffer = await page.screenshot({ fullPage: opts.fullPage ?? true });
  await context.close();
  return buffer;
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}
