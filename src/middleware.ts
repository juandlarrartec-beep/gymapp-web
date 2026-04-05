import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"

const GYMAPP_ROOT_DOMAIN = process.env["NEXT_PUBLIC_ROOT_DOMAIN"] ?? "gymapp.com"

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/(.*)",
  "/api/nfc/validate",
])

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const host = req.headers.get("host") ?? ""
  const requestHeaders = new Headers(req.headers)

  // Detectar subdominio para multi-tenant
  const isSubdomain =
    host.endsWith(`.${GYMAPP_ROOT_DOMAIN}`) &&
    host !== GYMAPP_ROOT_DOMAIN &&
    host !== `www.${GYMAPP_ROOT_DOMAIN}`

  if (isSubdomain) {
    const slug = host.split(".")[0]
    requestHeaders.set("x-gymapp-slug", slug ?? "")
  }

  // Rutas públicas — pasar sin auth
  if (isPublicRoute(req)) {
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // Clerk v5: auth() devuelve el estado, redirectToSignIn() para proteger
  const { userId, orgId } = await auth()

  if (!userId) {
    const signInUrl = new URL("/sign-in", req.url)
    signInUrl.searchParams.set("redirect_url", req.url)
    return NextResponse.redirect(signInUrl)
  }

  // Usuario logueado pero sin gym todavía → onboarding
  const isDashboardRoute = req.nextUrl.pathname.startsWith("/dashboard")
  if (isDashboardRoute && !orgId) {
    return NextResponse.redirect(new URL("/sign-up/gym", req.url))
  }

  if (orgId) {
    requestHeaders.set("x-clerk-org-id", orgId)
  }

  return NextResponse.next({ request: { headers: requestHeaders } })
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
