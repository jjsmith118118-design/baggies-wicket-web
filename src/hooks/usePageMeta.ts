import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_URL = "https://www.kingstonbagpuizecc.co.uk";

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/**
 * Sets the browser tab title, Google description, canonical address and
 * share-card text for the current page. Use noIndex for private pages.
 */
export function usePageMeta({ title, description, noIndex = false }: { title: string; description?: string; noIndex?: boolean }) {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = title;
    const url = SITE_URL + (pathname === "/" ? "/" : pathname.replace(/\/$/, ""));

    if (description) {
      setMeta("name", "description", description);
      setMeta("property", "og:description", description);
      setMeta("name", "twitter:description", description);
    }
    setMeta("property", "og:title", title);
    setMeta("name", "twitter:title", title);
    setMeta("property", "og:url", url);
    setMeta("name", "robots", noIndex ? "noindex, nofollow" : "index, follow");

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = url;
  }, [title, description, noIndex, pathname]);
}
