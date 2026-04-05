import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { getGymId, ok, err } from "@/lib/db"
import type { ApiResponse } from "@/lib/db"
import { z } from "zod"

const addCommentSchema = z.object({
  content: z.string().min(1).max(1000),
})

// GET /api/gyms/[gymId]/posts/[postId]/comments
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ gymId: string; postId: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json(err("No autenticado"), { status: 401 })

  const { gymId, postId } = await params
  const callerGymId = await getGymId().catch(() => null)
  if (callerGymId !== gymId) return NextResponse.json(err("Sin acceso"), { status: 403 })

  const post = await db.post.findFirst({
    where: { id: postId, gymId },
    select: { id: true },
  })
  if (!post) return NextResponse.json(err("Post no encontrado"), { status: 404 })

  const comments = await db.postComment.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
    include: {
      // Nota: PostComment no tiene relación directa con Member en el schema.
      // Usamos una query adicional para obtener el nombre del miembro.
    },
  })

  // Obtener los datos de los miembros de los comentarios
  const memberIds = [...new Set(comments.map(c => c.memberId))]
  const members = await db.member.findMany({
    where: { id: { in: memberIds } },
    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
  })
  const memberMap = new Map(members.map(m => [m.id, m]))

  const result = comments.map(c => {
    const m = memberMap.get(c.memberId)
    return {
      id: c.id,
      postId: c.postId,
      memberId: c.memberId,
      memberName: m ? `${m.firstName} ${m.lastName}` : "Socio",
      memberAvatarUrl: m?.avatarUrl ?? null,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
    }
  })

  return NextResponse.json(ok(result))
}

// POST /api/gyms/[gymId]/posts/[postId]/comments
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ gymId: string; postId: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json(err("No autenticado"), { status: 401 })

  const { gymId, postId } = await params
  const callerGymId = await getGymId().catch(() => null)
  if (callerGymId !== gymId) return NextResponse.json(err("Sin acceso"), { status: 403 })

  const member = await db.member.findFirst({
    where: { gymId, clerkUserId: userId },
    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
  })
  if (!member) return NextResponse.json(err("Socio no encontrado"), { status: 404 })

  const post = await db.post.findFirst({
    where: { id: postId, gymId },
    select: { id: true },
  })
  if (!post) return NextResponse.json(err("Post no encontrado"), { status: 404 })

  const body: unknown = await req.json()
  const parsed = addCommentSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json(err("Datos inválidos"), { status: 400 })

  const [comment] = await db.$transaction([
    db.postComment.create({
      data: { postId, memberId: member.id, content: parsed.data.content },
    }),
    db.post.update({
      where: { id: postId },
      data: { commentsCount: { increment: 1 } },
    }),
  ])

  return NextResponse.json(
    ok({
      id: comment.id,
      postId: comment.postId,
      memberId: comment.memberId,
      memberName: `${member.firstName} ${member.lastName}`,
      memberAvatarUrl: member.avatarUrl,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
    }),
    { status: 201 },
  )
}
