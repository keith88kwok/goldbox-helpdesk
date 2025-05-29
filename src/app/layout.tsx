import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AmplifyConfig } from "@/components/amplify-config";
import { AuthProvider } from "@/contexts/auth-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Kiosk Maintenance Helpdesk",
    description: "Internal helpdesk system for managing kiosk maintenance across multiple client workspaces",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <AmplifyConfig>
                    <AuthProvider>
                        {children}
                    </AuthProvider>
                </AmplifyConfig>
            </body>
        </html>
    );
}
