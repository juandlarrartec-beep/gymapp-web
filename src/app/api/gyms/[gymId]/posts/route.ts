import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { getGymId, ok, err } from "@/lib/db"
import type { ApiResponse } from "@/lib/db"
import { z } from "zod"

const createPostSchema = z.object({
  caption: z.string().max(500).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
})

// GET /api/gyms/[gymId]/posts?page=1&limit=10
// Feed paginado del gym
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ gymId: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json(err("No autenticado"), { status: 401 })

  const { gymId } = await params
  const callerGymId = await getGymId().catch(() => null)
  if (callerGymId !== gymId) return NextResponse.json(err("Sin acceso"), { status: 403 })

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)))
  const skip = (page - 1) * limit

  // Obtener el memberId del usuario autenticado para marcar likes
  const member = await db.member.findFirst({
    where: { gymId, clerkUserId: userId },
    select: { id: true },
  })

  const [posts, total] = await Promise.all([
    db.post.findMany({
      where: { gymId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        member: {
          select: { firstName: true, lastName: true, avatarUrl: true },
        },
        likes: member
          ? { where: { memberId: member.id }, select: { id: true } }
          : false,
      },
    }),
    db.post.count({ where: { gymId } }),
  ])

  const items = posts.map(p => ({
    id: p.id,
    gymId: p.gymId,
    memberId: p.memberId,
    memberName: `${p.member.firstName} ${p.member.lastName}`,
    memberAvatarUrl: p.member.avatarUrl,
    imageUrl: p.imageUrl,
    caption: p.caption,
    likesCount: p.likesCount,
    commentsCount: p.commentsCount,
    hasLiked: Array.isArray(p.likes) ? p.likes.length > 0 : false,
    createdAt: p.createdAt.toISOString(),
  }))

  return NextResponse.json(
    ok({
      items,
      total,
      page,
      limit,
      hasMore: skip + limit < total,
    }),
  )
}

// POST /api/gyms/[gymId]/posts
// Crear un post
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ gymId: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json(err("No autenticado"), { status: 401 })

  const { gymId } = await params
  const callerGymId = await getGymId().catch(() => null)
  if (callerGymId !== gymId) return NextResponse.json(err("Sin acceso"), { status: 403 })

  const member = await db.member.findFirst({
    where: { gymId, clerkUserId: userId },
    select: { id: true },
  })
  if (!member) return NextResponse.json(err("Socio no encontrado"), { status: 404 })

  const body: unknown = await req.json()
  const parsed = createPostSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(err("Datos inválidos"), { status: 400 })
  }

  const { caption, imageUrl } = parsed.data
  if (!caption && !imageUrl) {
    return NextResponse.json(err("Se requiere caption o imagen"), { status: 400 })
  }

  const post = await db.post.create({
    data: {
      gymId,
      memberId: member.id,
      caption: caption ?? null,
      imageUrl: imageUrl ?? null,
    },
    include: {
      member: { select: { firstName: true, lastName: true, avatarUrl: true } },
    },
  })

  return NextResponse.json(
    ok({
      id: post.id,
      gymId: post.gymId,
      memberId: post.memberId,
      memberName: `${post.member.firstName} ${post.member.lastName}`,
      memberAvatarUrl: post.member.avatarUrl,
      imageUrl: post.imageUrl,
      caption: post.caption,
      likesCount: 0,
      commentsCount: 0,
      hasLiked: false,
      createdAt: post.createdAt.toISOString(),
    }),
    { status: 201 },
  )
}
