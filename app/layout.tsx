import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gestión Documental — Sistema de registro de notas",
  description: "Sistema interno de gestión documental para registro, búsqueda y seguimiento de notas recibidas y enviadas. Acceso seguro con autenticación en dos pasos.",
  openGraph: {
    title: "Gestión Documental",
    description: "Sistema interno de gestión documental para registro, búsqueda y seguimiento de notas recibidas y enviadas.",
    url: "https://gestion.kunix.dev",
    siteName: "Gestión Documental",
    images: [
      {
        url: "https://gestion.kunix.dev/login-bg.webp",
        width: 1200,
        height: 630,
        alt: "Gestión Documental",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gestión Documental",
    description: "Sistema interno de gestión documental.",
    images: ["https://gestion.kunix.dev/login-bg.webp"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
