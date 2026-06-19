import Link from "next/link";
import { SectionHeading } from "@/components/SectionHeading";
import type { BlogPost } from "@/lib/posts";

type RelatedPostsProps = {
  posts: BlogPost[];
  heading?: string;
};

export function RelatedPosts({
  posts,
  heading = "Related Articles",
}: RelatedPostsProps) {
  if (posts.length === 0) return null;

  return (
    <section className="bg-slate-50">
      <div className="content-wrap">
        <SectionHeading className="!mt-0">{heading}</SectionHeading>
        <ul className="mt-6 content-grid-3">
          {posts.map((post) => (
            <li
              key={post.slug}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <time
                dateTime={post.date}
                className="text-xs font-medium uppercase tracking-wide text-slate-500"
              >
                {new Date(post.date).toLocaleDateString("en-ZA", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </time>
              <h3 className="mt-2 text-base font-semibold leading-snug text-navy">
                <Link href={`/${post.slug}`} className="hover:text-water">
                  {post.title}
                </Link>
              </h3>
              <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                {post.excerpt}
              </p>
              <Link
                href={`/${post.slug}`}
                className="mt-3 inline-flex text-sm font-semibold text-water hover:text-navy"
              >
                Read More →
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
