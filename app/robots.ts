import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/login", "/registro"],
      disallow: ["/dashboard", "/documentos", "/perfil", "/buscar", "/importar", "/exportar"],
    },
    sitemap: "https://gestion.kunix.dev/sitemap.xml",
  };
}
