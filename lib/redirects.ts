import type { Redirect } from "next/dist/lib/load-custom-routes";

/** Legacy WordPress URLs — permanent 301 redirects. */
export const redirects: Redirect[] = [
  { source: "/linings", destination: "/dam-liners/", permanent: true },
  { source: "/hdpe-linings", destination: "/hdpe-dam-lining/", permanent: true },
  { source: "/torch-on-linings", destination: "/torch-on-dam-lining/", permanent: true },
  { source: "/reservoirs", destination: "/steel-water-storage-tanks/", permanent: true },
  { source: "/services/dam-linings", destination: "/dam-liners/", permanent: true },
  { source: "/services/leak-repair", destination: "/dam-repair-services/", permanent: true },
  { source: "/leak-repair-services", destination: "/dam-repair-services/", permanent: true },
  { source: "/contact-us", destination: "/contact/", permanent: true },
  {
    source: "/bitumen-waterproofing-services-and-more",
    destination: "/bitumen-waterproofing/",
    permanent: true,
  },
  {
    source: "/bitumen-waterproofing-services-and-more/",
    destination: "/bitumen-waterproofing/",
    permanent: true,
  },
  // Short URL aliases
  { source: "/steel-tanks", destination: "/steel-water-storage-tanks/", permanent: true },
  { source: "/steel-tanks/", destination: "/steel-water-storage-tanks/", permanent: true },
  { source: "/waterproofing", destination: "/bitumen-waterproofing/", permanent: true },
  { source: "/waterproofing/", destination: "/bitumen-waterproofing/", permanent: true },
  // Trailing-slash variants
  { source: "/linings/", destination: "/dam-liners/", permanent: true },
  { source: "/hdpe-linings/", destination: "/hdpe-dam-lining/", permanent: true },
  { source: "/torch-on-linings/", destination: "/torch-on-dam-lining/", permanent: true },
  { source: "/hdpe-lining", destination: "/hdpe-dam-lining/", permanent: true },
  { source: "/hdpe-lining/", destination: "/hdpe-dam-lining/", permanent: true },
  { source: "/reservoirs/", destination: "/steel-water-storage-tanks/", permanent: true },
  { source: "/services/dam-linings/", destination: "/dam-liners/", permanent: true },
  { source: "/services/leak-repair/", destination: "/dam-repair-services/", permanent: true },
  { source: "/leak-repair-services/", destination: "/dam-repair-services/", permanent: true },
  { source: "/contact-us/", destination: "/contact/", permanent: true },
];
