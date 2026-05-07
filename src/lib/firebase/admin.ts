import type { App, ServiceAccount } from "firebase-admin/app";
import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { isAbsolute, resolve } from "node:path";

function resolveCredentialPath(pathEnv: string): string {
  return isAbsolute(pathEnv)
    ? pathEnv
    : resolve(/* turbopackIgnore: true */ process.cwd(), pathEnv);
}

function initFromCredentialPath(pathEnv: string): App {
  const absolutePath = resolveCredentialPath(pathEnv);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = absolutePath;
  return initializeApp({
    credential: applicationDefault(),
  });
}

function tryInitFromServiceAccountEnv(): App | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;

  const fallbackPath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim() ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();

  if (raw.startsWith("{")) {
    try {
      const credentials = JSON.parse(raw) as ServiceAccount;
      return initializeApp({
        credential: cert(credentials),
      });
    } catch (e) {
      const parseErr = e instanceof Error ? e.message : String(e);
      if (fallbackPath) {
        console.warn(
          `[firebase-admin] FIREBASE_SERVICE_ACCOUNT_JSON is invalid JSON (${parseErr}); using credential file from FIREBASE_SERVICE_ACCOUNT_PATH / GOOGLE_APPLICATION_CREDENTIALS.`,
        );
        return initFromCredentialPath(fallbackPath);
      }
      throw new Error(
        `FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON (${parseErr}). In .env use one line only, or remove this variable and set FIREBASE_SERVICE_ACCOUNT_PATH=chatbot.json.`,
      );
    }
  }

  return initFromCredentialPath(raw);
}

function getFirebaseAdminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  const fromEnvJson = tryInitFromServiceAccountEnv();
  if (fromEnvJson) return fromEnvJson;

  const pathEnv =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim() ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();

  if (pathEnv) {
    return initFromCredentialPath(pathEnv);
  }

  throw new Error(
    "Firebase Admin credentials missing: set FIREBASE_SERVICE_ACCOUNT_JSON (inline JSON or path to .json), or FIREBASE_SERVICE_ACCOUNT_PATH / GOOGLE_APPLICATION_CREDENTIALS.",
  );
}

export function getAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getDb() {
  return getFirestore(getFirebaseAdminApp());
}
