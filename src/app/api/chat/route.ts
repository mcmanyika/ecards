import {
  buildChatSystemPrompt,
  contactKnownSoFar,
  OPENAI_MODEL,
} from "@/lib/chat-constants";
import {
  extractContactFromUserMessage,
  inferContactFromMessages,
  type ContactFields,
} from "@/lib/extract-contact";
import { getDb } from "@/lib/firebase/admin";
import OpenAI from "openai";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = "nodejs";

function firestoreUnavailableMessage(err: unknown): string | null {
  const msg = err instanceof Error ? err.message : String(err);
  const code =
    err && typeof err === "object" && "code" in err ? Number(err.code) : NaN;
  if (
    code === 7 ||
    msg.includes("SERVICE_DISABLED") ||
    msg.includes("Cloud Firestore API has not been used") ||
    msg.includes("firestore.googleapis.com/overview")
  ) {
    return (
      "Chat storage is not ready for this project: create a cloud database in your Firebase/Google Cloud console " +
      "(Build → Database → create database) or enable the database API if prompted. " +
      "After enabling, wait a few minutes and retry."
    );
  }
  return null;
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured." },
        { status: 500 },
      );
    }

    const body = (await req.json()) as {
      conversationId?: string;
      message?: string;
    };

    const text = typeof body.message === "string" ? body.message.trim() : "";
    if (!text) {
      return NextResponse.json(
        { error: "message is required." },
        { status: 400 },
      );
    }

    const db = getDb();
    const convRef = body.conversationId
      ? db.collection("conversations").doc(body.conversationId)
      : db.collection("conversations").doc();

    const conversationId = convRef.id;

    const snap = await convRef.get();
    const existing = snap.exists
      ? (snap.data() as {
          messages?: { role: string; content: string }[];
          contact?: ContactFields;
        })
      : undefined;
    const prior = Array.isArray(existing?.messages) ? existing!.messages : [];

    const contactAfterThisTurn = contactKnownSoFar(
      existing?.contact,
      extractContactFromUserMessage(text),
    );

    const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: buildChatSystemPrompt(contactAfterThisTurn) },
      ...prior
        .filter(
          (m) => m.role === "user" || m.role === "assistant",
        )
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      { role: "user", content: text },
    ];

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: openaiMessages,
      temperature: 0.7,
    });

    const reply =
      completion.choices[0]?.message?.content?.trim() ||
      "Sorry, I could not generate a reply. Please try again.";

    const now = Timestamp.now();
    const userEntry = { role: "user" as const, content: text, createdAt: now };
    const assistantEntry = {
      role: "assistant" as const,
      content: reply,
      createdAt: Timestamp.now(),
    };

    const nextMessages = [...prior, userEntry, assistantEntry];

    const extracted = extractContactFromUserMessage(text);
    const prevContact = { ...(existing?.contact ?? {}) } as ContactFields;
    const mergedContact: ContactFields = { ...prevContact };
    for (const key of ["name", "email", "phone"] as const) {
      const v = extracted[key];
      if (typeof v === "string" && v.trim()) {
        mergedContact[key] = v.trim();
      }
    }

    const inferred = inferContactFromMessages(nextMessages);
    for (const key of ["name", "email", "phone"] as const) {
      const v = inferred[key];
      if (typeof v === "string" && v.trim() && !mergedContact[key]?.trim()) {
        mergedContact[key] = v.trim();
      }
    }

    function norm(s?: string) {
      return typeof s === "string" ? s.trim() : "";
    }
    const contactHasAny =
      norm(mergedContact.name) ||
      norm(mergedContact.email) ||
      norm(mergedContact.phone);
    const contactChanged =
      norm(mergedContact.name) !== norm(prevContact.name) ||
      norm(mergedContact.email) !== norm(prevContact.email) ||
      norm(mergedContact.phone) !== norm(prevContact.phone);

    const docPayload: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
      messages: nextMessages,
      ...(snap.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    };

    if (contactChanged && contactHasAny) {
      docPayload.contact = mergedContact;
      docPayload.contactCapturedAt = FieldValue.serverTimestamp();
    }

    await convRef.set(docPayload, { merge: true });

    return NextResponse.json({
      conversationId,
      reply,
    });
  } catch (e) {
    console.error(e);
    const hint = firestoreUnavailableMessage(e);
    const message =
      hint ??
      (e instanceof Error ? e.message : "Chat request failed.");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
