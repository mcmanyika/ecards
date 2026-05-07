import { LandingPageClient } from "@/components/landing/LandingPageClient";
import { getLandingPageConfig } from "@/lib/landing-server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cfg = await getLandingPageConfig(slug);
  if (!cfg?.published) {
    return { title: "Page not found" };
  }
  return {
    title: `${cfg.displayName}`,
    description: cfg.headline.slice(0, 160),
  };
}

export default async function PublicLandingPage({ params }: Props) {
  const { slug } = await params;
  const cfg = await getLandingPageConfig(slug);
  if (!cfg?.published) {
    notFound();
  }
  return <LandingPageClient config={cfg} />;
}
