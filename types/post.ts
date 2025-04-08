import { PostStatus } from "@prisma/client";

export interface Tag {
  id: string;
  name: string;
}

export interface Post {
  id: string;
  title: string;
  excerpt?: string | null;
  content: any;
  status: PostStatus;
  coverImage?: string | null;
  tags: Tag[];
  views: number;
  slug?: string | null;
  scheduledAt?: Date | null;
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };
}