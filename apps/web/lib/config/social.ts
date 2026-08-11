// Public social / community links. Central place so the sidebar, landing page,
// and the "follow us" row all point at the same URLs. Leave a value empty to
// hide that platform until a link is available.
export const SOCIAL_LINKS = {
  telegram: "https://t.me/GenwelthAiSignals",
  x: "https://x.com/Genwelth",
  tiktok: "https://www.tiktok.com/@genwelth.ai.trading",
  instagram: "https://www.instagram.com/genwelth.ai.trading",
} as const;

export type SocialPlatform = keyof typeof SOCIAL_LINKS;
