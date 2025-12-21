import { z } from 'zod'

// Rules for employee data
export const employeeSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50),
  last_name: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, 'Invalid phone number').optional().or(z.literal('')),
  whatsapp: z.string().regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, 'Invalid WhatsApp number').optional().or(z.literal('')),
  job_title: z.string().max(100).optional().or(z.literal('')),
  department: z.string().max(100).optional().or(z.literal('')),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  is_active: z.boolean().optional(),
})

// Rules for professional links
export const professionalLinkSchema = z.object({
  label: z.string().min(1, 'Label is required').max(50),
  url: z.string().url('Invalid URL'),
  icon_type: z.string().optional(),
  sort_order: z.number().optional(),
  is_active: z.boolean().optional(),
})

// Function to check if employee data is valid
export function validateEmployee(data) {
  try {
    return { 
      success: true, 
      data: employeeSchema.parse(data) 
    }
  } catch (error) {
    return { 
      success: false, 
      errors: error.errors.map(e => ({ field: e.path[0], message: e.message }))
    }
  }
}

// Function to check if link is valid
export function validateProfessionalLink(data) {
  try {
    return { 
      success: true, 
      data: professionalLinkSchema.parse(data) 
    }
  } catch (error) {
    return { 
      success: false, 
      errors: error.errors.map(e => ({ field: e.path[0], message: e.message }))
    }
  }
}

// Clean up URLs to prevent hacking
export function sanitizeUrl(url) {
  if (!url) return ''
  
  // Block dangerous URLs
  const dangerous = /^(javascript|data|vbscript):/i
  if (dangerous.test(url)) {
    return ''
  }
  
  // Add https:// if missing
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`
  }
  
  return url
}