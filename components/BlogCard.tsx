import Link from "next/link";
import type { BlogPost } from "@/lib/posts";
import { resolvePostExcerpt } from "@/lib/posts";

type BlogCardProps = {
  post: BlogPost;
};

export function BlogCard({ post }: BlogCardProps) {
  return (
    <article className="card flex h-full flex-col">
      <div className="flex items-center justify-between gap-2">
        <time
          dateTime={post.date}
          className="text-xs font-medium uppercase tracking-wide text-subtle"
        >
          {new Date(post.date).toLocaleDateString("en-ZA", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </time>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          {post.category}
        </span>
      </div>
      <h3 className="mt-3 text-[length:var(--text-h4)] font-semibold leading-snug text-navy">
        <Link href={`/${post.slug}`} className="hover:text-water">
          {post.title}
        </Link>
      </h3>
      <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">
        {resolvePostExcerpt(post)}
      </p>
      <Link
        href={`/${post.slug}`}
        className="link-row mt-2"
      >
        Read More →
      </Link>
    </article>
  );
}
