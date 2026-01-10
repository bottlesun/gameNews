import { getPublishedPosts } from "@/lib/notion";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { formatDistanceToNow } from "date-fns";
import { Calendar, BookOpen } from "lucide-react";
import Link from "next/link";

export const revalidate = 60; // ISR: Revalidate every 60 seconds

export default async function BlogPage() {
  const posts = await getPublishedPosts();

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <header className="mb-12">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <BookOpen className="h-10 w-10 text-primary" />
              <h1 className="text-4xl font-bold">Tech Blog</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Insights, tutorials, and thoughts on technology and development
            </p>
          </div>
        </header>

        {/* Posts Grid */}
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              No published posts yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.id}`}
                className="group block"
              >
                <article className="h-full border rounded-lg p-6 hover:shadow-lg transition-all duration-300 hover:border-primary bg-card">
                  {/* Title */}
                  <h2 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h2>

                  {/* Date */}
                  {post.createdat && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Calendar className="h-4 w-4" />
                      <time dateTime={post.createdat}>
                        {formatDistanceToNow(new Date(post.createdat), {
                          addSuffix: true,
                        })}
                      </time>
                    </div>
                  )}

                  {/* Info (Markdown Content) */}
                  {post.info && (
                    <div className="line-clamp-4 text-sm">
                      <MarkdownRenderer content={post.info} />
                    </div>
                  )}

                  {/* Read More Link */}
                  <div className="mt-4 pt-4 border-t">
                    <span className="text-primary text-sm font-medium group-hover:underline">
                      Read more →
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
