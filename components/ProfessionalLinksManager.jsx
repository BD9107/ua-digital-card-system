'use client'

import { useState } from 'react'

const ICON_OPTIONS = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'web', label: 'Website' },
  { value: 'scholar', label: 'Google Scholar' },
  { value: 'orcid', label: 'ORCID' },
  { value: 'linktree', label: 'Linktree' },
  { value: 'github', label: 'GitHub' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'other', label: 'Other' }
]

export default function ProfessionalLinksManager({ initialLinks = [], onChange }) {
  const [links, setLinks] = useState(initialLinks.length > 0 ? initialLinks : [])

  const handleAddLink = () => {
    const newLink = {
      id: `temp_${Date.now()}`,
      label: '',
      url: '',
      icon_type: 'web',
      sort_order: links.length,
      is_active: true
    }
    const updatedLinks = [...links, newLink]
    setLinks(updatedLinks)
    onChange(updatedLinks)
  }

  const handleRemoveLink = (index) => {
    const updatedLinks = links.filter((_, i) => i !== index)
    // Update sort_order
    updatedLinks.forEach((link, i) => {
      link.sort_order = i
    })
    setLinks(updatedLinks)
    onChange(updatedLinks)
  }

  const handleLinkChange = (index, field, value) => {
    const updatedLinks = [...links]
    updatedLinks[index][field] = value
    setLinks(updatedLinks)
    onChange(updatedLinks)
  }

  const handleMoveUp = (index) => {
    if (index === 0) return
    const updatedLinks = [...links]
    const temp = updatedLinks[index]
    updatedLinks[index] = updatedLinks[index - 1]
    updatedLinks[index - 1] = temp
    // Update sort_order
    updatedLinks.forEach((link, i) => {
      link.sort_order = i
    })
    setLinks(updatedLinks)
    onChange(updatedLinks)
  }

  const handleMoveDown = (index) => {
    if (index === links.length - 1) return
    const updatedLinks = [...links]
    const temp = updatedLinks[index]
    updatedLinks[index] = updatedLinks[index + 1]
    updatedLinks[index + 1] = temp
    // Update sort_order
    updatedLinks.forEach((link, i) => {
      link.sort_order = i
    })
    setLinks(updatedLinks)
    onChange(updatedLinks)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Professional Links</h3>
        <button
          type="button"
          onClick={handleAddLink}
          className="bg-[#003366] text-white px-4 py-2 rounded-lg hover:bg-[#004488] transition-colors text-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Link
        </button>
      </div>

      {links.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 text-sm">No professional links yet. Click "Add Link" to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((link, index) => (
            <div key={link.id || index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="grid md:grid-cols-12 gap-3 items-start">
                {/* Sort Order Controls */}
                <div className="md:col-span-1 flex md:flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="p-1 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === links.length - 1}
                    className="p-1 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Label */}
                <div className="md:col-span-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Label</label>
                  <input
                    type="text"
                    value={link.label}
                    onChange={(e) => handleLinkChange(index, 'label', e.target.value)}
                    placeholder="e.g., LinkedIn Profile"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent text-sm"
                    required
                  />
                </div>

                {/* URL */}
                <div className="md:col-span-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">URL</label>
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent text-sm"
                    required
                  />
                </div>

                {/* Icon Type */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Icon</label>
                  <select
                    value={link.icon_type || 'web'}
                    onChange={(e) => handleLinkChange(index, 'icon_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent text-sm"
                  >
                    {ICON_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Remove Button */}
                <div className="md:col-span-1 flex items-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveLink(index)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove link"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {links.length > 0 && (
        <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <strong>Tip:</strong> Use the arrow buttons to reorder links. They will appear in this order on the public profile.
        </div>
      )}
    </div>
  )
}
