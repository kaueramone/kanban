import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "KanbanK — Kaueramone",
  description:
    "Acompanhe em tempo real os projetos que Kaueramone está desenvolvendo. Dashboard público de gestão Kanban.",
  openGraph: {
    title: "KanbanK — O que Kaueramone está construindo agora?",
    description:
      "Dashboard público com projetos ativos, feed de atividade e integração GitHub de Kaueramone.",
    url: "https://kanban.kaueramone.dev",
    siteName: "KanbanK",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style>{`
          /* Custom GTranslate Styles */
          .goog-te-gadget-simple {
            background-color: var(--bg-card, #1a1a2e) !important;
            border-left: 1px solid var(--border, #333) !important;
            border-top: 1px solid var(--border, #333) !important;
            border-bottom: none !important;
            border-right: none !important;
            padding: 8px !important;
            border-radius: 8px 0 0 0 !important;
            font-size: 14px !important;
            font-family: inherit !important;
          }
          .goog-te-gadget-simple span { color: var(--text-primary, #fff) !important; }
          .goog-te-gadget-icon { display: none !important; }
          .VIpgJd-ZVi9od-ORHb-OEVmcd { display: none !important; }
          body { top: 0 !important; }
          .skiptranslate iframe { display: none !important; }
        `}</style>
      </head>
      <body>
        <div id="google_translate_element" style={{ position: 'fixed', bottom: 0, right: 0, zIndex: 99999 }}></div>
        <Script id="gtranslate-init" strategy="afterInteractive">
          {`function googleTranslateElementInit() {
            new google.translate.TranslateElement({pageLanguage: 'en', includedLanguages: 'pt,es,en', autoDisplay: false, layout: google.translate.TranslateElement.InlineLayout.SIMPLE}, 'google_translate_element');
          }`}
        </Script>
        <Script src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit" strategy="afterInteractive" />
        {children}
      </body>
    </html>
  );
}
