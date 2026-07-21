import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:"Training Sessions | Westland University",description:"View and book university training and induction sessions."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en-AU"><body>{children}</body></html>}
