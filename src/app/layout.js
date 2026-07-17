import "./globals.css";
import CustomCursor from "@/components/CustomCursor";
import GrainOverlay from "@/components/GrainOverlay";
import ScrollAnimations from "@/components/ScrollAnimations";
import Preloader from "@/components/Preloader";
import ThemeProvider from "@/components/ThemeProvider";
import SmoothScroll from "@/components/SmoothScroll";

export const metadata = {
  title: "Eduka — O teu assistente académico com IA | Angola",
  description:
    "Estuda melhor, produz mais, vai mais longe. A Eduka ajuda estudantes angolanos a organizar ideias, gerar trabalhos académicos, melhorar textos e compreender temas difíceis com inteligência artificial.",
  keywords: [
    "eduka",
    "IA",
    "angola",
    "estudantes",
    "assistente académico",
    "trabalhos académicos",
    "inteligência artificial",
  ],
  openGraph: {
    title: "Eduka — O teu assistente académico com IA",
    description:
      "Ajuda-te a organizar ideias e produzir trabalhos de qualidade.",
    type: "website",
    locale: "pt_AO",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Outfit:wght@400;600;700;800&family=Sora:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ThemeProvider>
          <Preloader />
          <SmoothScroll />
          <CustomCursor />
          <GrainOverlay />
          <ScrollAnimations />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
