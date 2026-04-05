import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-lg",
          },
        }}
        redirectUrl="/dashboard"
      />
    </main>
  )
}
