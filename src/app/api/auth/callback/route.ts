import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/google/oauth";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "No authorization code" }, { status: 400 });
  }

  try {
    const { email } = await exchangeCodeForTokens(code);
    // Redirect to dashboard with success message
    return NextResponse.redirect(
      new URL(`/?connected=${encodeURIComponent(email)}`, request.nextUrl.origin)
    );
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/?error=oauth_failed", request.nextUrl.origin)
    );
  }
}
