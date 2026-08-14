import { SOCIAL_LINKS, type SocialPlatform } from "@/lib/config/social";

const PLATFORMS: Array<{
  key: SocialPlatform;
  label: string;
  emoji: string;
}> = [
  { key: "telegram", label: "Telegram", emoji: "📣" },
  { key: "telegramChat", label: "Community", emoji: "💬" },
  { key: "x", label: "X", emoji: "𝕏" },
  { key: "tiktok", label: "TikTok", emoji: "🎵" },
  { key: "instagram", label: "Instagram", emoji: "📸" },
];

/**
 * Renders a row of "follow us" buttons for every platform that has a URL set
 * in SOCIAL_LINKS — add a link there and it shows up here automatically.
 */
export default function SocialLinks({
  className = "",
}: {
  className?: string;
}) {
  const links = PLATFORMS.filter((platform) => SOCIAL_LINKS[platform.key]);

  if (links.length === 0) {
    return null;
  }

  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-3 ${className}`}
    >
      {links.map((platform) => (
        <a
          key={platform.key}
          href={SOCIAL_LINKS[platform.key]}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-white"
        >
          <span aria-hidden>{platform.emoji}</span>
          <span>{platform.label}</span>
        </a>
      ))}
    </div>
  );
}
