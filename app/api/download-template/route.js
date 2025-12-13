import { NextResponse } from 'next/server'

export async function GET() {
  const csvContent = `first_name,last_name,email,phone,whatsapp,job_title,department,website,profile_photo_url,linkedin,twitter,facebook,instagram,github,youtube
John,Doe,john.doe@example.com,+1234567890,+1234567890,Software Engineer,Engineering,https://example.com,https://example.com/photo.jpg,https://linkedin.com/in/johndoe,https://twitter.com/johndoe,https://facebook.com/johndoe,https://instagram.com/johndoe,https://github.com/johndoe,https://youtube.com/@johndoe
Jane,Smith,jane.smith@example.com,+1987654321,+1987654321,IT Manager,Information Technology,https://janesmith.com,,https://linkedin.com/in/janesmith,,,,,`

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="employee-import-template.csv"',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
}
