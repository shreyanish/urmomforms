import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Text Rephraser',
  description: 'Professional text rephrasing tool using GPT',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}

// src/app/api/rephrase/route.ts
import { NextResponse } from 'next/server';
import { GPTWrapper } from '@/utils/gpt-wrapper';

const gpt = new GPTWrapper(process.env.OPENAI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const messages = [
      {
        role: "system",
        content: "You are a helpful assistant that rephrases text while maintaining its meaning. Make the text more clear and professional."
      },
      {
        role: "user",
        content: `Please rephrase the following text: ${text}`
      }
    ];

    const rephrased = await gpt.chat_completion(messages);
    return NextResponse.json({ rephrased });
  } catch (error) {
    console.error('Rephrasing error:', error);
    return NextResponse.json(
      { error: 'Failed to rephrase text' },
      { status: 500 }
    );
  }
}