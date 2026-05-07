export type LandingLinkAction = "external" | "chat";

export interface LandingGridLink {
  id: string;
  label: string;
  imageUrl: string;
  action: LandingLinkAction;
  /** Required when action is "external". */
  href?: string;
}

export interface LandingPageConfig {
  slug: string;
  published: boolean;
  bannerUrl: string;
  avatarUrl: string;
  badgeUrl: string;
  displayName: string;
  headline: string;
  subheadline: string;
  location: string;
  bio: string;
  hashtags: string;
  primaryCtaLabel: string;
  /** Profile URL; https:// added automatically when missing. Shows branded LinkedIn tile. */
  linkedinUrl: string;
  links: LandingGridLink[];
}
