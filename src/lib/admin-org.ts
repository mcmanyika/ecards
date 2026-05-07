import { verifyAdminSession } from "@/lib/admin-firebase-session";
import { getDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export type AdminOrgSession =
  | { kind: "legacy"; uid: string; organizationId: string }
  | { kind: "firebase"; uid: string; email?: string; organizationId: string };

const COL_LANDING = "landing_pages";
const COL_ORGS = "organizations";
const COL_ADMINS = "admins";

/** Single-tenant installs can set this so legacy password admin shares an org id with data. */
export function legacyTenantOrganizationId(): string {
  return (
    process.env.TENANT_ORGANIZATION_ID?.trim() || "tenant-legacy"
  );
}

/**
 * Verified admin + Firestore organization id.
 * Firestore admins without an org get a new workspace and (if `main` exists undecorated) it is claimed for that workspace.
 */
export async function getAdminSessionWithOrg(): Promise<AdminOrgSession | null> {
  const session = await verifyAdminSession();
  if (!session) return null;

  if (session.uid === "legacy-admin") {
    return {
      kind: "legacy",
      uid: session.uid,
      organizationId: legacyTenantOrganizationId(),
    };
  }

  const db = getDb();
  const adminRef = db.collection(COL_ADMINS).doc(session.uid);
  const adminSnap = await adminRef.get();
  if (!adminSnap.exists) return null;

  let organizationId = String(
    (adminSnap.data() as { organizationId?: string }).organizationId ?? "",
  ).trim();

  if (!organizationId) {
    const orgRef = db.collection(COL_ORGS).doc();
    organizationId = orgRef.id;

    const wsName =
      session.email?.split("@")[1]?.trim() || "Workspace";

    const batch = db.batch();
    batch.set(orgRef, {
      displayName: wsName,
      ownerUid: session.uid,
      createdAt: FieldValue.serverTimestamp(),
    });
    batch.update(adminRef, {
      organizationId,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const mainRef = db.collection(COL_LANDING).doc("main");
    const mainSnap = await mainRef.get();
    if (
      mainSnap.exists &&
      !(mainSnap.data() as { organizationId?: string })?.organizationId
    ) {
      batch.update(mainRef, {
        organizationId,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
  }

  return {
    kind: "firebase",
    uid: session.uid,
    email: session.email,
    organizationId,
  };
}
