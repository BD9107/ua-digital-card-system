// All branding in one place - easy to change!
export const branding = {
  // Company Info
  companyName: process.env.NEXT_PUBLIC_COMPANY_NAME || 'UA Company',
  productName: process.env.NEXT_PUBLIC_PRODUCT_NAME || 'UA Digital Card System',
  
  // Colors
  primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR || '#0033AA',
  secondaryColor: process.env.NEXT_PUBLIC_SECONDARY_COLOR || '#FBE122',
  accentColor: process.env.NEXT_PUBLIC_ACCENT_COLOR || '#0052d6',
  
  // URLs
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@ua.aw',
  
  // Features
  features: {
    professionalLinks: true,
    qrCodes: true,
    vcards: true,
    csvImport: true,
  }
}