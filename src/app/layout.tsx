import type { Metadata } from "next";
import { Inter, Chakra_Petch, Caveat, Lora } from "next/font/google";
import { auth } from "@/lib/auth";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const chakraPetch = Chakra_Petch({
  variable: "--font-heading",
  weight: ["400", "600", "700"],
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-handwriting",
  weight: ["400", "700"],
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-serif",
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://savecounterstrike.com"),
  title: {
    default: "Save Counter-Strike — Demand Better Anti-Cheat",
    template: "%s | Save Counter-Strike",
  },
  description:
    "Community petition against Valve's poor anti-cheat in CS2. Sign the petition, share cheater clips, and demand change.",
  keywords: [
    "counter-strike",
    "cs2",
    "anti-cheat",
    "vac",
    "petition",
    "valve",
    "cheaters",
    "savecounterstrike",
  ],
  icons: {
    icon: "/images/spinbot_logo.ico",
    apple: "/images/spinbot_logo.jpeg",
  },
  openGraph: {
    title: "Save Counter-Strike — Demand Better Anti-Cheat",
    description:
      "Join the community petition demanding Valve fix CS2's cheating epidemic.",
    type: "website",
    siteName: "SaveCounterStrike.com",
    images: [
      {
        url: "/images/cheater_strike2.jpeg",
        width: 1200,
        height: 630,
        alt: "Save Counter-Strike — Demand Better Anti-Cheat",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Save Counter-Strike",
    description:
      "Join the community petition demanding Valve fix CS2's cheating epidemic.",
    images: ["/images/cheater_strike2.jpeg"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const sessionUser = session?.user
    ? {
        userId: (session.user as any).userId || "",
        name: session.user.name || "Unknown",
        image: session.user.image || "",
        steamId: (session.user as any).steamId || "",
        role: (session.user as any).role || "USER",
      }
    : null;

  return (
    <html
      lang="en"
      className={`${inter.variable} ${chakraPetch.variable} ${caveat.variable} ${lora.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background">
        <SessionProvider session={sessionUser}>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
