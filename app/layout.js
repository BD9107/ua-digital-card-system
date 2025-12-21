import { branding } from '@/config/branding'
import './globals.css'

export const metadata = {
  title: branding.productName,
  description: `${branding.productName} - Modern Digital Business Cards`,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
