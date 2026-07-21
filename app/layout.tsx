import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:"Volunteer Training | Perth Robogals",description:"View and book Perth Robogals volunteer training and outreach sessions.",icons:{icon:"/robogals-perth-logo.png"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en-AU"><body>{children}</body></html>}
