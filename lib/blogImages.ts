const GENERATED_BLOG_IMAGES: Record<string, string> = {
  "nintendo-switch-kakoy-obem-pamyati-vybrat": "/images/blog/nintendo-switch-memory-guide.webp",
  "nintendo-switch-v-podarok-chto-vybrat": "/images/blog/nintendo-switch-gift-guide.webp",
  "kak-vybrat-nintendo-switch-2026-gayd": "/images/blog/nintendo-switch-2026-guide.webp",
  "nintendo-switch-oled-vs-lite-chto-vybrat-2026": "/images/blog/nintendo-switch-oled-vs-lite-guide.webp",
  "skolko-ekonomit-proshitaya-nintendo-switch": "/images/blog/nintendo-switch-modded-savings-guide.webp",
  "vsyo-chto-nuzhno-znat-o-proshitykh-i-chipovannykh-konsolyakh-nintendo-switch": "/images/blog/nintendo-switch-chipped-guide.webp",
};

const FALLBACK_BLOG_IMAGE = "/images/blog/switch-2-complete-review.webp";

export function getBlogImage(post: { slug: string; image?: string | null }) {
  return post.image || GENERATED_BLOG_IMAGES[post.slug] || FALLBACK_BLOG_IMAGE;
}
