import { NextResponse } from "next/server";

// Full Google sign-in requires a Google Cloud OAuth client (GOOGLE_CLIENT_ID /
// GOOGLE_CLIENT_SECRET) plus a callback route that links or creates a local
// account. That backend isn't wired up yet — this endpoint reports that
// clearly instead of pretending to redirect somewhere real.
export async function GET() {
  const configured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  if (!configured) {
    return NextResponse.json(
      { error: "Google sign-in isn't configured for this workspace yet." },
      { status: 501 },
    );
  }

  return NextResponse.json(
    { error: "Google sign-in is configured but the callback flow isn't implemented yet." },
    { status: 501 },
  );
}
