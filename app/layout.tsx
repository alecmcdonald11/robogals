import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:"Training Hub | Perth Robogals",description:"Complete Perth Robogals volunteer onboarding and training modules.",icons:{icon:"/robogals-perth-logo.png"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en-AU"><body>{children}</body></html>}
