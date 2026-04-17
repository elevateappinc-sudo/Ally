import type { Metadata } from 'next'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'Sofía AI',
  description: 'Tu consultora de marketing 24/7',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <div className="bg-glows">
          <div className="bg-glow bg-glow-1" />
          <div className="bg-glow bg-glow-2" />
          <div className="bg-glow bg-glow-3" />
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </div>
      </body>
    </html>
  )
}
