import type { NextConfig } from "next";

/* Poneglyph ships as a fully static site — every route prerenders, there are
   no API routes, server actions, dynamic segments or middleware. So we export
   to plain HTML and serve it from Cloudflare's edge: no server runtime, no
   cold starts, nothing to keep warm.

   `next start` does not apply to an exported build. Use `npm run dev` for
   local work, or serve ./out statically (`npm run preview`). */

const nextConfig: NextConfig = {
  output: "export",
  images: {
    /* the Cloudflare edge serves the mark as a plain asset; there is no
       Next image optimiser in an exported build */
    unoptimized: true,
  },
  /* emit /dashboard/index.html rather than /dashboard.html so the routes
     resolve identically on the edge and in local static preview */
  trailingSlash: true,
};

export default nextConfig;
