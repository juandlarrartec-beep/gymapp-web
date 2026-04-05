import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/(.*)",
  "/api/nfc/validate",
])

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Rutas públicas — pasar sin auth
  if (isPublicRoute(req)) {
    return NextResponse.next()
  }

  // Solo verificar que el usuario esté logueado
  // NO verificar orgId acá — las páginas manejan su propio scope
  const { userId, orgId } = await auth()

  if (!userId) {
    const signInUrl = new URL("/sign-in", req.url)
    signInUrl.searchParams.set("redirect_url", req.url)
    return NextResponse.redirect(signInUrl)
  }

  // Propagar orgId al header si existe (para server components)
  const requestHeaders = new Headers(req.headers)
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
