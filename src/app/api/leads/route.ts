import { sendQualifiedLeadEmail } from "@/lib/email";
import { getDb } from "@/lib/firebase/admin";
import { isQualifiedLead } from "@/lib/leads";
import type { LeadPayload } from "@/types";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<LeadPayload>;

    const payload: LeadPayload = {
      conversationId:
        typeof body.conversationId === "string"
          ? body.conversationId.trim()
          : undefined,
      name: String(body.name ?? "").trim(),
      email: String(body.email ?? "").trim(),
      phone: String(body.phone ?? "").trim(),
      serviceNeeded: String(body.serviceNeeded ?? "").trim(),
      budget: String(body.budget ?? "").trim(),
      preferredAppointmentDate: String(
        body.preferredAppointmentDate ?? "",
      ).trim(),
    };

    const qualified = isQualifiedLead(payload);

    const db = getDb();
    const cid =
      typeof payload.conversationId === "string"
        ? payload.conversationId.trim()
        : "";
    const docData: Record<string, unknown> = {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      serviceNeeded: payload.serviceNeeded,
      budget: payload.budget,
      preferredAppointmentDate: payload.preferredAppointmentDate,
      qualified,
      createdAt: FieldValue.serverTimestamp(),
    };
    if (cid) {
      docData.conversationId = cid;
    }

    const docRef = await db.collection("leads").add(docData);

    let emailResult: Awaited<ReturnType<typeof sendQualifiedLeadEmail>> | null =
      null;
    if (qualified) {
      emailResult = await sendQualifiedLeadEmail(payload);
      if (!emailResult.ok && emailResult.skippedReason) {
        console.warn(
          "[leads] Qualified lead saved but email skipped:",
          emailResult.skippedReason,
        );
      }
    }

    return NextResponse.json({
      id: docRef.id,
      qualified,
      emailSent: qualified ? Boolean(emailResult?.ok) : false,
    });
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : "Failed to save lead.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
