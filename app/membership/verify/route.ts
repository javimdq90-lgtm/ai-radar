import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { grantAccess, memberByEmail, stripeConfig } from "@/lib/membership";
import { readToken } from "@/lib/subscribe";

/** The link in the sign-in email: signs this browser in when the address still has a membership. */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const config = stripeConfig();
  if (!config) redirect("/membership");
  const email = readToken(token, config.key);
  if (!email) redirect("/membership?status=expired");

  let ok = false;
  try {
    const customer = await memberByEmail(config.stripe, email);
    ok = !!customer && (await grantAccess(customer));
  } catch (err) {
    console.error("membership/verify:", err);
  }
  redirect(ok ? "/membership?status=signed-in" : "/membership?status=no-membership");
}
