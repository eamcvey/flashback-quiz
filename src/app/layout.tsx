import React from 'react';
import './globals.css';
import type { Metadata } from 'next';
import { Inter, Lato } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });
const lato = Lato({
    weight: ['400', '700'],
    subsets: ['latin'],
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'Flashback Quiz',
    description: 'Test your knowledge of historical events relative to when Grandpa was born!',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
            </head>
            <body className={`${inter.className} ${lato.className} bg-amber-50`}>{children}</body>
        </html>
    );
} 