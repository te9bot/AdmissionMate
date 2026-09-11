import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AdmissionMate",
    short_name: "AdmissionMate",
    description: "Exam countdowns and study planning for HSC, SSC, and admission tests.",
    start_url: "/",
    display: "standalone",
    background_color: "#F3F1FC",
    theme_color: "#756CB3",
    icons: [
      { src: "/icon", sizes: "64x64", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
