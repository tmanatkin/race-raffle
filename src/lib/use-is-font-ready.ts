"use client";

import { useEffect, useState } from "react";

const FONT_LOAD_TIMEOUT_MS = 3000;

export function useIsFontReady() {
  const [isFontReady, setIsFontReady] = useState(false);

  useEffect(() => {
    async function waitForFont() {
      // document.fonts.ready would resolve immediately here because no visible text uses the font yet,
      // so the page font is loaded explicitly. The timeout keeps a slow connection from blocking the page.
      const fontFamily = window.getComputedStyle(document.documentElement).fontFamily;
      const timeout = new Promise((resolve) => setTimeout(resolve, FONT_LOAD_TIMEOUT_MS));

      try {
        await Promise.race([document.fonts.load(`1em ${fontFamily}`), timeout]);
      } catch (fontError) {
        console.error(fontError);
      } finally {
        setIsFontReady(true);
      }
    }

    void waitForFont();
  }, []);

  return isFontReady;
}
