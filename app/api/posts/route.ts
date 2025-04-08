import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { PostStatus } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      excerpt,
      content,
      status,
      coverImage,
      tags = [], // Array of tag names
      scheduledDate,
    } = body;

    if (!title) {
      return new NextResponse("Title is required", { status: 400 });
    }

    // Create or connect tags
    const tagObjects = await Promise.all(
      tags.map(async (tagName: string) => {
        return await db.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName },
        });
      })
    );

    // Create post with connected tags
    const post = await db.post.create({
      data: {
        title,
        excerpt: excerpt || "",
        content: content,
        status: status as PostStatus,
        coverImage: coverImage || "",
        authorId: session.user.id,
        publishedAt: status === PostStatus.PUBLISHED ? new Date() : null,
        scheduledAt: scheduledDate ? new Date(scheduledDate) : null,
        tags: {
          connect: tagObjects.map(tag => ({ id: tag.id })),
        },
      },
      include: {
        author: {
          select: {
            name: true,
            image: true,
          },
        },
        tags: true,
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("[POSTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where = {
      authorId: session.user.id,
      ...(status === "published"
        ? { status: PostStatus.PUBLISHED }
        : status === "draft"
        ? { status: PostStatus.DRAFT }
        : status === "scheduled"
        ? { status: PostStatus.SCHEDULED }
        : {}),
    };

    const posts = await db.post.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        tags: true,
      },
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("[POSTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}