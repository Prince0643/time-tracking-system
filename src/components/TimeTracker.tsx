import { useState, useEffect } from 'react'
import { Play, Square, Plus, Clock, Tag, DollarSign } from 'lucide-react'
import { formatDuration, calculateDuration } from '../utils'
import { Project, Task, Tag as TagType, TimeEntry } from '../types'

interface TimeTrackerProps {
  onTimeEntrySave: (entry: Partial<TimeEntry>) => void
  projects: Project[]
  tasks: Task[]
  tags: TagType[]
}

export default function TimeTracker({ onTimeEntrySave, projects, tasks, tags }: TimeTrackerProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [description, setDescription] = useState('')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isBillable, setIsBillable] = useState(true)
  const [duration, setDuration] = useState(0)
  const [showError, setShowError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Load timer state from localStorage on component mount
  useEffect(() => {
    const savedState = localStorage.getItem('timeTrackerState')
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState)
        if (parsedState.isRunning && parsedState.startTime) {
          // Check if the saved timer is still valid (not older than 24 hours)
          const savedStartTime = new Date(parsedState.startTime)
          const now = new Date()
          const hoursDiff = (now.getTime() - savedStartTime.getTime()) / (1000 * 60 * 60)
          
          if (hoursDiff < 24) {
            setIsRunning(true)
            setStartTime(savedStartTime)
            setDescription(parsedState.description || '')
            setSelectedProject(parsedState.selectedProject || null)
            setSelectedTask(parsedState.selectedTask || null)
            setSelectedTags(parsedState.selectedTags || [])
            setIsBillable(parsedState.isBillable !== undefined ? parsedState.isBillable : true)
            console.log('Timer state restored from localStorage')
          } else {
            console.log('Saved timer state is too old, clearing localStorage')
            localStorage.removeItem('timeTrackerState')
          }
        }
      } catch (error) {
        console.error('Error parsing saved timer state:', error)
        localStorage.removeItem('timeTrackerState')
      }
    }
  }, [])

  // Save timer state to localStorage whenever it changes
  useEffect(() => {
    const stateToSave = {
      isRunning,
      startTime: startTime?.toISOString(),
      description,
      selectedProject,
      selectedTask,
      selectedTags,
      isBillable
    }
    localStorage.setItem('timeTrackerState', JSON.stringify(stateToSave))
  }, [isRunning, startTime, description, selectedProject, selectedTask, selectedTags, isBillable])

  // Update duration every second when timer is running
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning && startTime) {
      interval = setInterval(() => {
        setDuration(calculateDuration(startTime))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning, startTime])

  const handleStart = () => {
    const now = new Date()
    setStartTime(now)
    setIsRunning(true)
    setDuration(0)
  }

  const handleStop = () => {
    console.log('handleStop called')
    console.log('startTime:', startTime)
    console.log('description:', description)
    console.log('isRunning:', isRunning)
    
    // Validate required fields
    if (!description.trim()) {
      setErrorMessage('Please enter a description of what you are working on')
      setShowError(true)
      // Hide error after 3 seconds
      setTimeout(() => setShowError(false), 3000)
      return
    }
    
    if (!startTime) {
      setErrorMessage('Timer was not started properly')
      setShowError(true)
      setTimeout(() => setShowError(false), 3000)
      return
    }
    
    // Clear any previous errors
    setShowError(false)
    setErrorMessage('')
    
    setIsRunning(false)
    
    const entry: Partial<TimeEntry> = {
      description: description.trim(),
      projectId: selectedProject?.id,
      taskId: selectedTask?.id,
      startTime,
      endTime: new Date(),
      duration: calculateDuration(startTime),
      isBillable,
      tags: selectedTags,
    }
    
    console.log('Saving time entry:', entry)
    onTimeEntrySave(entry)
    
    // Reset form
    setDescription('')
    setSelectedProject(null)
    setSelectedTask(null)
    setSelectedTags([])
    setIsBillable(true)
    setStartTime(null)
    setDuration(0)
    
    // Clear localStorage since timer is stopped
    localStorage.removeItem('timeTrackerState')
  }

  const filteredTasks = selectedProject 
    ? tasks.filter(task => task.projectId === selectedProject.id)
    : []

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  return (
    <div className="card max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Time Tracker</h1>
        <p className="text-gray-600">Track your time and boost productivity</p>
      </div>

      {/* Timer Display */}
      <div className="text-center mb-8">
        <div className="text-6xl font-mono font-bold text-primary-600 mb-4">
          {formatDuration(duration)}
        </div>
        
        <div className="flex justify-center space-x-4">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="btn-primary flex items-center space-x-2 px-8 py-3 text-lg"
            >
              <Play className="h-5 w-5" />
              <span>Start</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleStop}
                className="btn-danger flex items-center space-x-2 px-8 py-3 text-lg"
              >
                <Square className="h-5 w-5" />
                <span>Stop</span>
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to reset the timer? This will clear all current progress.')) {
                    setIsRunning(false)
                    setStartTime(null)
                    setDuration(0)
                    setDescription('')
                    setSelectedProject(null)
                    setSelectedTask(null)
                    setSelectedTags([])
                    setIsBillable(true)
                    localStorage.removeItem('timeTrackerState')
                  }
                }}
                className="btn-secondary flex items-center space-x-2 px-6 py-3 text-lg"
              >
                <span>Reset</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Time Entry Form */}
      <div className="space-y-6">
        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What are you working on? <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value)
              // Clear error when user starts typing
              if (showError) {
                setShowError(false)
                setErrorMessage('')
              }
            }}
            placeholder="Enter a description..."
            className={`input text-lg ${showError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
            required
          />
          {showError && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <span className="mr-1">⚠️</span>
              {errorMessage}
            </p>
          )}
        </div>

        {/* Project Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project
          </label>
          <select
            value={selectedProject?.id || ''}
            onChange={(e) => {
              const project = projects.find(p => p.id === e.target.value)
              setSelectedProject(project || null)
              setSelectedTask(null) // Reset task when project changes
            }}
            className="input"
          >
            <option value="">No project</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* Task Selection */}
        {selectedProject && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task
            </label>
            <select
              value={selectedTask?.id || ''}
              onChange={(e) => {
                const task = filteredTasks.find(t => t.id === e.target.value)
                setSelectedTask(task || null)
              }}
              className="input"
            >
              <option value="">No task</option>
              {filteredTasks.map(task => (
                <option key={task.id} value={task.id}>
                  {task.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={`
                  px-3 py-1 rounded-full text-sm font-medium transition-colors
                  ${selectedTags.includes(tag.id)
                    ? 'bg-primary-100 text-primary-700 border border-primary-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>

        {/* Billable Toggle */}
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="billable"
            checked={isBillable}
            onChange={(e) => setIsBillable(e.target.checked)}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="billable" className="text-sm font-medium text-gray-700">
            Billable
          </label>
          <DollarSign className="h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Current Session Info */}
      {isRunning && startTime && (
        <div className="mt-8 p-4 bg-primary-50 rounded-lg border border-primary-200">
          <div className="flex items-center space-x-2 text-primary-700 mb-2">
            <Clock className="h-4 w-4" />
            <span className="font-medium">Current Session</span>
            {localStorage.getItem('timeTrackerState') && (
              <span className="text-xs bg-primary-200 text-primary-800 px-2 py-1 rounded-full">
                Restored
              </span>
            )}
          </div>
          <div className="text-sm text-primary-600">
            <p>Started at: {startTime.toLocaleTimeString()}</p>
            {selectedProject && <p>Project: {selectedProject.name}</p>}
            {selectedTask && <p>Task: {selectedTask.name}</p>}
            {!description.trim() && (
              <p className="text-amber-600 font-medium mt-2">
                ⚠️ Please enter a description before stopping the timer
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
