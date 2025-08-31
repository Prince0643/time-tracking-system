import React, { useState, useEffect } from 'react'
import { X, Clock, DollarSign, FolderOpen } from 'lucide-react'
import { Task, Project } from '../../types'

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  task?: Task | null
  projects: Project[]
  mode: 'create' | 'edit'
}

export default function TaskModal({ 
  isOpen, 
  onClose, 
  onSave, 
  task, 
  projects, 
  mode 
}: TaskModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    projectId: '',
    isBillable: true,
    hourlyRate: 0
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (task && mode === 'edit') {
      setFormData({
        name: task.name,
        projectId: task.projectId,
        isBillable: task.isBillable,
        hourlyRate: task.hourlyRate || 0
      })
    } else {
      setFormData({
        name: '',
        projectId: '',
        isBillable: true,
        hourlyRate: 0
      })
    }
    setErrors({})
  }, [task, mode])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Task name is required'
    }

    if (formData.name.length > 100) {
      newErrors.name = 'Task name must be less than 100 characters'
    }

    if (!formData.projectId) {
      newErrors.projectId = 'Please select a project'
    }

    if (formData.isBillable && formData.hourlyRate <= 0) {
      newErrors.hourlyRate = 'Hourly rate must be greater than 0 for billable tasks'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      await onSave({
        name: formData.name.trim(),
        projectId: formData.projectId,
        isBillable: formData.isBillable,
        hourlyRate: formData.isBillable ? formData.hourlyRate : undefined,
        isArchived: false
      })
      onClose()
    } catch (error) {
      console.error('Error saving task:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
                    type === 'number' ? parseFloat(value) || 0 : value
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'create' ? 'Create New Task' : 'Edit Task'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Task Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Task Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`input ${errors.name ? 'border-red-500' : ''}`}
              placeholder="Enter task name"
              disabled={loading}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Project Selection */}
          <div>
            <label htmlFor="projectId" className="block text-sm font-medium text-gray-700 mb-2">
              Project *
            </label>
            <div className="relative">
              <select
                id="projectId"
                name="projectId"
                value={formData.projectId}
                onChange={handleInputChange}
                className={`input ${errors.projectId ? 'border-red-500' : ''}`}
                disabled={loading}
              >
                <option value="">Select a project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <FolderOpen className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            {errors.projectId && (
              <p className="mt-1 text-sm text-red-600">{errors.projectId}</p>
            )}
          </div>

          {/* Billable Toggle */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="isBillable"
              name="isBillable"
              checked={formData.isBillable}
              onChange={handleCheckboxChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              disabled={loading}
            />
            <label htmlFor="isBillable" className="text-sm font-medium text-gray-700">
              Billable task
            </label>
            <Clock className="h-4 w-4 text-gray-400" />
          </div>

          {/* Hourly Rate */}
          {formData.isBillable && (
            <div>
              <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700 mb-2">
                Hourly Rate *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  id="hourlyRate"
                  name="hourlyRate"
                  value={formData.hourlyRate}
                  onChange={handleInputChange}
                  className={`input pl-8 ${errors.hourlyRate ? 'border-red-500' : ''}`}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  disabled={loading}
                />
                <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
              {errors.hourlyRate && (
                <p className="mt-1 text-sm text-red-600">{errors.hourlyRate}</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : mode === 'create' ? 'Create Task' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
