import { mergeLandingFromFirestore } from "@/lib/landing-config";
import { getDb } from "@/lib/firebase/admin";
import type { LandingPageConfig } from "@/types/landing";

const COLLECTION = "landing_pages";

export async function getLandingPageConfig(
  slug: string,
): Promise<LandingPageConfig | null> {
  const snap = await getDb().collection(COLLECTION).doc(slug).get();
  if (!snap.exists) return null;
  return mergeLandingFromFirestore(slug, snap.data() as Record<string, unknown>);
}
