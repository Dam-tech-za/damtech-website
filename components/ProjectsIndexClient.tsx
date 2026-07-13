"use client";

import { useMemo, useState } from "react";
import { ProjectCard } from "@/components/ProjectCard";
import type { ProjectCaseStudy } from "@/lib/projects";

export const PROJECT_FILTERS = [
  "All Projects",
  "HDPE Dam Lining",
  "Bitumen / Torch-On",
  "Steel Water Tanks",
  "Earth Dam Lining",
  "Western Cape",
  "North West",
  "Gauteng",
  "Limpopo",
] as const;

type ProjectFilter = (typeof PROJECT_FILTERS)[number];

type ProjectsIndexClientProps = {
  projects: ProjectCaseStudy[];
};

function matchesFilter(project: ProjectCaseStudy, filter: ProjectFilter): boolean {
  if (filter === "All Projects") return true;
  if (project.categories?.includes(filter)) return true;

  const haystack = [
    project.serviceType,
    project.material,
    project.province ?? "",
    project.location,
    project.title,
    ...(project.categories ?? []),
  ]
    .join(" ")
    .toLowerCase();

  switch (filter) {
    case "HDPE Dam Lining":
      return /hdpe/.test(haystack);
    case "Bitumen / Torch-On":
      return /bitumen|torch-on|torch on/.test(haystack);
    case "Steel Water Tanks":
      return /steel|tank/.test(haystack);
    case "Earth Dam Lining":
      return /earth dam|dam lining|geomembrane/.test(haystack);
    case "Western Cape":
      return /western cape/.test(haystack);
    case "North West":
      return /north west/.test(haystack);
    case "Gauteng":
      return /gauteng|centurion|pretoria|johannesburg/.test(haystack);
    case "Limpopo":
      return /limpopo|hoedspruit|tzaneen/.test(haystack);
    default:
      return false;
  }
}

/** Filterable projects grid — crawlable cards; filters are progressive enhancement. */
export function ProjectsIndexClient({ projects }: ProjectsIndexClientProps) {
  const [filter, setFilter] = useState<ProjectFilter>("All Projects");

  const visible = useMemo(
    () => projects.filter((project) => matchesFilter(project, filter)),
    [projects, filter],
  );

  return (
    <div>
      <div
        className="mb-8 flex flex-wrap gap-2"
        role="group"
        aria-label="Filter projects"
      >
        {PROJECT_FILTERS.map((item) => {
          const active = item === filter;
          return (
            <button
              key={item}
              type="button"
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                active
                  ? "border-water bg-water text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-water hover:text-water"
              }`}
              aria-pressed={active}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          );
        })}
      </div>

      {visible.length > 0 ? (
        <ul className="home-process-projects__project-grid">
          {visible.map((project) => (
            <li key={project.slug}>
              <ProjectCard project={project} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-slate-600">
          No published projects match this filter yet.
        </p>
      )}
    </div>
  );
}
