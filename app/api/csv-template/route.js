import { NextResponse } from 'next/server'

export async function GET() {
  const csvHeader = 'first_name,last_name,email,phone,whatsapp,job_title,department,website,profile_photo_url'
  const csvExample = 'John,Doe,john.doe@example.com,+1234567890,+1234567890,Software Engineer,Engineering,https://example.com,https://example.com/photo.jpg'
  const csvContent = `${csvHeader}\n${csvExample}`
  
  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="employee-import-template.csv"',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    }
  })
}
