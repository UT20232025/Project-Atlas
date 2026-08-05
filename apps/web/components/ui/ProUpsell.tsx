import Link from "next/link";

import Button from "@/components/ui/button";
import Section from "@/components/ui/Section";

type ProUpsellProps = {
  title: string;
  subtitle: string;
  heading: string;
  description: string;
  buttonLabel: string;
  emoji?: string;
};

export default function ProUpsell({
  title,
  subtitle,
  heading,
  description,
  buttonLabel,
  emoji = "💎",
}: ProUpsellProps) {
  return (
    <Section title={title} subtitle={subtitle}>
      <div className="atlas-subcard flex flex-col items-center gap-3 rounded-xl p-8 text-center">
        <span className="text-3xl">{emoji}</span>

        <p className="font-medium text-zinc-200">{heading}</p>

        <p className="mx-auto max-w-md text-sm text-zinc-500">
          {description}
        </p>

        <Link href="/pricing">
          <Button className="mt-2">{buttonLabel}</Button>
        </Link>
      </div>
    </Section>
  );
}
