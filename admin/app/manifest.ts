import type { MetadataRoute } from "next";

// basePath ("/admin") isn't auto-applied to string literals we write here,
// so paths are prefixed manually to match next.config.mjs's basePath.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AdmissionMate Admin",
    short_name: "AM Admin",
    description: "Admin dashboard for managing AdmissionMate exams, users, and activity.",
    start_url: "/admin",
    scope: "/admin",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#6366f1",
    icons: [
      { src: "/admin/icon", sizes: "64x64", type: "image/png" },
      { src: "/admin/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
