import type { BlogPost } from "@/lib/posts";
import { scoreTopics } from "@/lib/post-topics";

export type InternalServiceLink = {
  href: string;
  label: string;
  description: string;
};

export type PostCtaConfig = {
  heading: string;
  description: string;
  buttonText: string;
  buttonHref: string;
};

const LEGACY_HOSTS = [
  "dam-tech.co.za",
  "www.dam-tech.co.za",
  "damtech.co.za",
  "www.damtech.co.za",
] as const;

/** Legacy WordPress paths → current site routes (with trailing slash). */
const LEGACY_PATH_REWRITES: Record<string, string> = {
  "/": "/",
  "/linings": "/dam-liners/",
  "/linings/": "/dam-liners/",
  "/hdpe-lining": "/hdpe-dam-lining/",
  "/hdpe-lining/": "/hdpe-dam-lining/",
  "/hdpe-linings": "/hdpe-dam-lining/",
  "/hdpe-linings/": "/hdpe-dam-lining/",
  "/pvc-linings": "/pvc-dam-lining/",
  "/pvc-linings/": "/pvc-dam-lining/",
  "/torch-on-linings": "/torch-on-dam-lining/",
  "/torch-on-linings/": "/torch-on-dam-lining/",
  "/reservoirs": "/steel-water-storage-tanks/",
  "/reservoirs/": "/steel-water-storage-tanks/",
  "/services/dam-linings": "/dam-liners/",
  "/services/dam-linings/": "/dam-liners/",
  "/services/leak-repair": "/dam-repair-services/",
  "/services/leak-repair/": "/dam-repair-services/",
  "/leak-repair-services": "/dam-repair-services/",
  "/leak-repair-services/": "/dam-repair-services/",
  "/contact-us": "/contact/",
  "/contact-us/": "/contact/",
  "/quote": "/quote/",
  "/quote/": "/quote/",
  "/contact": "/contact/",
  "/contact/": "/contact/",
  "/blog": "/blog/",
  "/blog/": "/blog/",
  "/projects": "/projects/",
  "/projects/": "/projects/",
};

const SERVICE_PAGES: readonly InternalServiceLink[] = [
  {
    href: "/hdpe-dam-lining/",
    label: "HDPE Dam Lining",
    description:
      "1 mm–2 mm HDPE geomembrane supply and installation for earth dams and reservoirs.",
  },
  {
    href: "/pvc-dam-lining/",
    label: "PVC Dam Lining",
    description:
      "Flexible PVC liners for ponds, steel tanks and smaller farm reservoirs.",
  },
  {
    href: "/torch-on-dam-lining/",
    label: "Torch-On Dam Lining",
    description:
      "Heat-bonded bitumen membranes for cement dams, canals and rigid reservoirs.",
  },
  {
    href: "/dam-liners/",
    label: "Dam Linings (HDPE, PVC & Torch-On)",
    description:
      "Professional dam lining supply and installation for earth dams, farm dams and reservoirs.",
  },
  {
    href: "/farm-dam-liners/",
    label: "Farm Dam Linings",
    description:
      "HDPE and PVC dam linings for agricultural dams, livestock water and irrigation storage.",
  },
  {
    href: "/steel-water-storage-tanks/",
    label: "Steel Water Storage Tanks",
    description:
      "Corrugated steel reservoirs — supply, installation and leak repair across South Africa.",
  },
  {
    href: "/bitumen-waterproofing/",
    label: "Bitumen Waterproofing",
    description:
      "Torch-on membranes and waterproofing for roofs, reservoirs and leak repair.",
  },
  {
    href: "/agricultural-water-storage/",
    label: "Agricultural Water Storage",
    description:
      "Integrated dam, tank and irrigation storage solutions for farms and game reserves.",
  },
  {
    href: "/projects/",
    label: "Our Projects",
    description:
      "See completed dam lining, steel tank and waterproofing installations nationwide.",
  },
  {
    href: "/quote/",
    label: "Request a Free Quote",
    description:
      "Tell us about your dam, tank or waterproofing project — we respond within one business day.",
  },
] as const;

const DEFAULT_POST_CTA: PostCtaConfig = {
  heading: "Need help with your water storage project?",
  description:
    "Our team installs dam linings, steel tanks and waterproofing nationwide. Request a free quote or site inspection.",
  buttonText: "Request a Quote",
  buttonHref: "/quote/",
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function normaliseLegacyPath(pathname: string): string {
  const decoded = decodeURIComponent(pathname);
  const withLeading = decoded.startsWith("/") ? decoded : `/${decoded}`;
  const noQuery = withLeading.split(/[?#]/)[0] ?? withLeading;
  return LEGACY_PATH_REWRITES[noQuery] ?? LEGACY_PATH_REWRITES[`${noQuery}/`] ?? noQuery;
}

function resolveInternalHref(href: string): string | null {
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("mailto:") || trimmed.startsWith("tel:")) {
    return null;
  }

  if (trimmed.startsWith("/")) {
    const rewritten = normaliseLegacyPath(trimmed);
    return rewritten === trimmed ? trimmed : rewritten;
  }

  try {
    const url = new URL(trimmed);
    if (!LEGACY_HOSTS.includes(url.hostname as (typeof LEGACY_HOSTS)[number])) {
      return null;
    }
    return normaliseLegacyPath(url.pathname);
  } catch {
    return null;
  }
}

function stripExternalLinkAttrs(tag: string): string {
  return tag
    .replace(/\btarget\s*=\s*["'][^"']*["']/gi, "")
    .replace(/\brel\s*=\s*["'][^"']*["']/gi, "")
    .trim();
}

/** Rewrite legacy dam-tech.co.za links in post HTML to current internal routes. */
export function rewriteInternalLinks(html: string): string {
  return html.replace(/<a\b([^>]*?)href\s*=\s*["']([^"']+)["']([^>]*)>/gi, (full, before, href, after) => {
    const internal = resolveInternalHref(href);
    if (!internal) return full;

    const attrs = stripExternalLinkAttrs(`${before} ${after}`);
    return `<a href="${internal}"${attrs ? ` ${attrs}` : ""}>`;
  });
}

/** Contextual service links for the end of a blog post. */
export function getPostServiceLinks(post: BlogPost, limit = 3): InternalServiceLink[] {
  const text = `${post.title} ${post.excerpt} ${stripHtml(post.content)}`;
  const scores = scoreTopics(text);

  const miningLink: InternalServiceLink = {
    href: "/mining-dam-liners/",
    label: "Mining Dam Linings",
    description:
      "Heavy-duty HDPE dam lining for mine water, tailings and process dams.",
  };

  const pages: InternalServiceLink[] = [
    ...SERVICE_PAGES,
    miningLink,
  ];

  const matched = pages
    .filter((page) => (scores.get(page.href) ?? 0) > 0)
    .sort((a, b) => (scores.get(b.href) ?? 0) - (scores.get(a.href) ?? 0))
    .slice(0, limit);

  if (matched.length > 0) return matched;

  return [SERVICE_PAGES[0], SERVICE_PAGES[1], SERVICE_PAGES[2]].slice(0, limit);
}

/** Topic-aware CTA copy for individual blog posts. */
export function getPostCta(post: BlogPost): PostCtaConfig {
  const text = `${post.title} ${stripHtml(post.content)}`;

  if (/\b(corrugated steel|steel reservoir|steel tank)\b/i.test(text)) {
    return {
      heading: "Need help with a steel reservoir or tank?",
      description:
        "We supply, line and repair corrugated steel reservoirs — including bitumen and HDPE lining options.",
      buttonText: "Request a Quote",
      buttonHref: "/quote/",
    };
  }

  if (/\b(torch[- ]on|bitumen|waterproof|leak repair)\b/i.test(text)) {
    return {
      heading: "Need waterproofing or leak repair?",
      description:
        "From torch-on membranes to reservoir leak repair, our team can recommend the right solution for your site.",
      buttonText: "Request a Quote",
      buttonHref: "/quote/",
    };
  }

  if (/\b(hdpe|dam liner|dam lining|farm dam|seepage|lining)\b/i.test(text)) {
    return {
      heading: "Need help choosing a dam lining?",
      description:
        "We install HDPE, PVC and torch-on dam linings across South Africa — with free quotes and site inspections.",
      buttonText: "Request a Quote",
      buttonHref: "/quote/",
    };
  }

  return DEFAULT_POST_CTA;
}
