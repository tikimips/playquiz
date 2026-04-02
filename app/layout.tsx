import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PlayQuiz — Live Trivia Games',
  description: 'Host live multiplayer quiz games. Players join instantly with a PIN. No app needed.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
