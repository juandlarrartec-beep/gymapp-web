import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { getGymId, ok, err } from "@/lib/db"
import type { ApiResponse } from "@/lib/db"

// POST /api/gyms/[gymId]/posts/[postId]/like
// Toggle like — si ya tiene like lo quita, si no lo tiene lo agrega
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ gymId: string; postId: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json(err("No autenticado"), { status: 401 })

  const { gymId, postId } = await params
  const callerGymId = await getGymId().catch(() => null)
  if (callerGymId !== gymId) return NextResponse.json(err("Sin acceso"), { status: 403 })

  const member = await db.member.findFirst({
    where: { gymId, clerkUserId: userId },
    select: { id: true },
  })
  if (!member) return NextResponse.json(err("Socio no encontrado"), { status: 404 })

  const post = await db.post.findFirst({
    where: { id: postId, gymId },
    select: { id: true, likesCount: true },
  })
  if (!post) return NextResponse.json(err("Post no encontrado"), { status: 404 })

  const existingLike = await db.postLike.findUnique({
    where: { postId_memberId: { postId, memberId: member.id } },
  })

  let liked: boolean
  let newCount: number

  if (existingLike) {
    // Quitar like
    await db.$transaction([
      db.postLike.delete({
        where: { postId_memberId: { postId, memberId: member.id } },
      }),
      db.post.update({
        where: { id: postId },
        data: { likesCount: { decrement: 1 } },
      }),
    ])
    liked = false
    newCount = Math.max(0, post.likesCount - 1)
  } else {
    // Agregar like
    await db.$transaction([
      db.postLike.create({
        data: { postId, memberId: member.id },
      }),
      db.post.update({
        where: { id: postId },
        data: { likesCount: { increment: 1 } },
      }),
    ])
    liked = true
    newCount = post.likesCount + 1
  }

  return NextResponse.json(ok({ liked, likesCount: newCount }))
}
