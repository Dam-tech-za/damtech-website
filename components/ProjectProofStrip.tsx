import Link from "next/link";
import { SectionHeading } from "@/components/SectionHeading";

export type ProjectProofItem = {
  href: string;
  location: string;
  detail: string;
};

type ProjectProofStripProps = {
  title?: string;
  projects: readonly ProjectProofItem[];
};

export function ProjectProofStrip({
  title = "Recent project work",
  projects,
}: ProjectProofStripProps) {
  return (
    <div className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionHeading className="!mt-0">{title}</SectionHeading>
        <Link
          href="/projects"
          className="text-sm font-semibold text-water hover:text-navy"
        >
          View all projects →
        </Link>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Link
            key={project.href}
            href={project.href}
            className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-water/40 hover:shadow-md"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {project.location}
            </p>
            <p className="mt-2 flex-1 text-sm font-medium text-navy group-hover:text-water">
              {project.detail}
            </p>
            <span className="mt-3 text-sm font-semibold text-water">
              Read case study →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
