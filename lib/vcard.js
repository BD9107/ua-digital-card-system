import vCard from 'vcards-js'

export function generateVCard(employee) {
  const card = vCard()
  
  // Name
  card.firstName = employee.first_name || ''
  card.lastName = employee.last_name || ''
  
  // Organization (use company field if provided, otherwise default to UA Company)
  card.organization = employee.company || 'UA Company'
  card.title = employee.job_title || ''
  
  // Contact
  card.workPhone = employee.phone || ''
  card.email = employee.email || ''
  card.workUrl = employee.website || ''
  
  // Photo
  if (employee.photo_url) {
    card.photo.attachFromUrl(employee.photo_url, 'JPEG')
  }
  
  // Note
  if (employee.department) {
    card.note = `Department: ${employee.department}`
  }
  
  // WhatsApp is added to the note
  if (employee.whatsapp) {
    card.note = card.note ? `${card.note}\nWhatsApp: ${employee.whatsapp}` : `WhatsApp: ${employee.whatsapp}`
  }
  
  return card.getFormattedString()
}
