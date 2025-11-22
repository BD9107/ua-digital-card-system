import './globals.css'

export const metadata = {
  title: 'UA Digital Card System',
  description: 'Custom Digital Card System for UA Company',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
