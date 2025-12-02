import { NextResponse } from "next/server";

export function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    const webhookUrl = process.env.INTERNAL_WEBHOOK_URL!;
    if (!webhookUrl) {
      return NextResponse.json(
        { error: "INTERNAL_WEBHOOK_URL not set" },
        { status: 500 }
      );
    }

    const internalRes = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!internalRes.ok) {
      throw new Error(`n8n responded with ${internalRes.status}`);
    }

    const data = await internalRes.json();

    const output =
      data.output || data.reply || data.message || "No response";

    return NextResponse.json({
      sessionId: payload.sessionId,
      output
    });
  } catch (err) {
    console.error("Chat API Error:", err);
    return NextResponse.json(
      { error: "Internal AI error" },
      { status: 500 }
    );
  }
}
