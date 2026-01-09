import { getPostDetail, getAllPostIds } from "@/lib/notion";
import NotionRendererClient from "@/components/notion-renderer-client";
import { Calendar, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 60; // ISR: Revalidate every 60 seconds
export const dynamicParams = true; // Allow dynamic routes not in generateStaticParams

// Generate static params for all published posts
export async function generateStaticParams() {
  try {
    const postIds = await getAllPostIds();
    console.log("=== generateStaticParams ===");
    console.log("Post IDs:", postIds);
    return postIds.map((id) => ({
      pageId: id,
    }));
  } catch (error) {
    console.error("Error in generateStaticParams:", error);
    return [];
  }
}

interface BlogPostPageProps {
  params: Promise<{
    pageId: string;
  }>;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { pageId } = await params;

  console.log("=== Blog Detail Page ===");
  console.log("Requested pageId:", pageId);

  let post;
  try {
    post = await getPostDetail(pageId);
    console.log("Post loaded successfully:", {
      id: post.id,
      title: post.title,
      status: post.status,
    });
  } catch (error) {
    console.error("Error loading post:", error);
    notFound();
  }

  // Check if post is published
  const isPublished =
    post.status.toLowerCase() === "published" ||
    post.status.toLowerCase() === "publish" ||
    post.status === "완료";

  console.log("Is published?", isPublished, "Status:", post.status);

  if (!isPublished) {
    console.log("Post not published, returning 404");
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-12">
        {/* Back Link */}
        <Link
          href="/blog"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 transition-colors"
        >
          ← Back to Blog
        </Link>

        {/* Article Header */}
        <article>
          <header className="mb-8 pb-8 border-b">
            <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

            {/* Metadata */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {post.createdat && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <time dateTime={post.createdat}>
                    Published{" "}
                    {formatDistanceToNow(new Date(post.createdat), {
                      addSuffix: true,
                    })}
                  </time>
                </div>
              )}

              {post.updatedat && post.updatedat !== post.createdat && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <time dateTime={post.updatedat}>
                    Updated{" "}
                    {formatDistanceToNow(new Date(post.updatedat), {
                      addSuffix: true,
                    })}
                  </time>
                </div>
              )}
            </div>
          </header>

          {/* Notion Content */}
          <div className="notion-container">
            <NotionRendererClient recordMap={post.recordMap} />
          </div>
        </article>

        {/* Footer Navigation */}
        <footer className="mt-12 pt-8 border-t">
          <Link
            href="/blog"
            className="inline-flex items-center text-primary hover:underline"
          >
            ← Back to all posts
          </Link>
        </footer>
      </div>
    </div>
  );
}
