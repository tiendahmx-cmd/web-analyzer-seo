import './globals.css'

export const metadata = {
  title: 'Web Analyzer SEO',
  description: 'Plataforma SaaS de análisis SEO con IA',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
