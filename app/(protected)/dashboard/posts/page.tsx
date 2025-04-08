"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";
import PostList from "@/components/posts/post-list";
import PostListSkeleton from "@/components/posts/post-list-skeleton";
import { Post } from "@/types/post";

// Constants
const CURRENT_USER = "MilkywayRides";
const CURRENT_TIME = "2025-04-08 06:02:34";

export default function PostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/posts?status=${activeTab}`);
        if (!response.ok) throw new Error("Failed to fetch posts");
        const data = await response.json();
        setPosts(data);
      } catch (error) {
        toast.error("Failed to load posts");
        console.error("Error fetching posts:", error);
      } finally {
        setTimeout(() => setIsLoading(false), 300);
      }
    };

    fetchPosts();
  }, [activeTab]);

  const handleCreatePost = () => {
    router.push("/dashboard/posts/create");
  };

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <main className="flex-1 container mx-auto px-4 py-6 flex flex-col">
          {isLoading ? (
            <PostListSkeleton />
          ) : (
            <PostList
              posts={posts}
              activeTab={activeTab}
              searchQuery={searchQuery}
              onSearch={setSearchQuery}
              onCreatePost={handleCreatePost}
              onTabChange={setActiveTab}
              currentUser={CURRENT_USER}
              currentTime={CURRENT_TIME}
            />
          )}
        </main>
        <Footer/>
      </SidebarInset>
    </SidebarProvider>
  );
}