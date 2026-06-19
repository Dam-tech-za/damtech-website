import type { Redirect } from "next/dist/lib/load-custom-routes";

/** Legacy WordPress URLs — permanent 301 redirects. */
export const redirects: Redirect[] = [
  { source: "/linings", destination: "/dam-liners/", permanent: true },
  { source: "/hdpe-linings", destination: "/dam-liners/", permanent: true },
  { source: "/torch-on-linings", destination: "/bitumen-waterproofing/", permanent: true },
  { source: "/reservoirs", destination: "/steel-water-storage-tanks/", permanent: true },
  { source: "/services/dam-linings", destination: "/dam-liners/", permanent: true },
  { source: "/services/leak-repair", destination: "/bitumen-waterproofing/", permanent: true },
  { source: "/leak-repair-services", destination: "/bitumen-waterproofing/", permanent: true },
  { source: "/contact-us", destination: "/contact/", permanent: true },
  // Trailing-slash variants
  { source: "/linings/", destination: "/dam-liners/", permanent: true },
  { source: "/hdpe-linings/", destination: "/dam-liners/", permanent: true },
  { source: "/torch-on-linings/", destination: "/bitumen-waterproofing/", permanent: true },
  { source: "/reservoirs/", destination: "/steel-water-storage-tanks/", permanent: true },
  { source: "/services/dam-linings/", destination: "/dam-liners/", permanent: true },
  { source: "/services/leak-repair/", destination: "/bitumen-waterproofing/", permanent: true },
  { source: "/leak-repair-services/", destination: "/bitumen-waterproofing/", permanent: true },
  { source: "/contact-us/", destination: "/contact/", permanent: true },
];
