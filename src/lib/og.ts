import ogCover from "@/assets/og-cover.jpg";

export const SITE_URL = "https://www.andreamuti.com";

// Social crawlers require an absolute URL.
export const OG_IMAGE = ogCover.startsWith("http")
  ? ogCover
  : `${SITE_URL}${ogCover}`;

export function ogImageMeta() {
  return [
    { property: "og:image", content: OG_IMAGE },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { name: "twitter:image", content: OG_IMAGE },
  ];
}
