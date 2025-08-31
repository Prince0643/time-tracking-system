import { useState, useEffect } from 'react'
import { Plus, Clock, Filter, Download, Edit, Trash2 } from 'lucide-react'
import TimeTracker from '../components/TimeTracker'
import { formatDuration, formatDate, formatTime, formatCurrency, calculateEarnings } from '../utils'
import { TimeEntry, Project, Task, Tag } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { timeEntryService } from '../services/timeEntryService'
import { projectService } from '../services/projectService'
import { taskService } from '../services/projectService'
import { tagService } from '../services/tagService'

export default function TimeTrackerPage() {
  const { currentUser } = useAuth()
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [filterProject, setFilterProject] = useState<string>('')
  const [filterDate, setFilterDate] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)

  // Load data on component mount and refresh periodically
  useEffect(() => {
    if (currentUser) {
      loadData()
      
      // Refresh data every 30 seconds to keep stats current
      const refreshInterval = setInterval(() => {
        loadData()
      }, 30000)
      
      return () => clearInterval(refreshInterval)
    }
  }, [currentUser])

  const loadData = async () => {
    setLoading(true)
    try {
      const [timeEntriesData, projectsData, tasksData, tagsData] = await Promise.all([
        timeEntryService.getTimeEntries(currentUser!.uid),
        projectService.getProjects(),
        taskService.getTasks(),
        tagService.getTags()
      ])
      
      console.log('Loaded time entries:', timeEntriesData)
      console.log('Loaded projects:', projectsData)
      console.log('Loaded tasks:', tasksData)
      console.log('Loaded tags:', tagsData)
      
      setTimeEntries(timeEntriesData)
      setProjects(projectsData)
      setTasks(tasksData)
      setTags(tagsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTimeEntrySave = async (entry: Partial<TimeEntry>) => {
    console.log('handleTimeEntrySave called with:', entry)
    console.log('Current user:', currentUser)
    
    if (!currentUser) {
      console.error('No current user found')
      return
    }

    try {
      const newEntry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: currentUser.uid,
        description: entry.description || '',
        projectId: entry.projectId,
        taskId: entry.taskId,
        startTime: entry.startTime || new Date(),
        endTime: entry.endTime || new Date(),
        duration: entry.duration || 0,
        isBillable: entry.isBillable || false,
        tags: entry.tags || [],
      }
      
      console.log('Prepared new entry:', newEntry)
      
      const entryId = await timeEntryService.createTimeEntry(newEntry)
      console.log('Time entry created with ID:', entryId)
      
      await loadData() // Reload data to get the new entry
      setShowAddForm(false)
    } catch (error) {
      console.error('Error saving time entry:', error)
    }
  }

  const handleDeleteTimeEntry = async (entryId: string) => {
    if (window.confirm('Are you sure you want to delete this time entry?')) {
      try {
        await timeEntryService.deleteTimeEntry(entryId)
        await loadData()
      } catch (error) {
        console.error('Error deleting time entry:', error)
      }
    }
  }

  const filteredEntries = timeEntries.filter((entry: TimeEntry) => {
    if (filterProject && entry.projectId !== filterProject) return false
    if (filterDate) {
      const entryDate = entry.startTime.toISOString().split('T')[0]
      if (entryDate !== filterDate) return false
    }
    return true
  })

  // State for real-time time calculations
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // Update current time every second to keep calculations fresh
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    return () => clearInterval(interval)
  }, [])
  
  // Calculate different time periods (reactive to currentTime)
  const today = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate())
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay()) // Start of week (Sunday)
  
  // Get current running timer duration from localStorage if exists
  const getCurrentTimerDuration = () => {
    try {
      const savedState = localStorage.getItem('timeTrackerState')
      if (savedState) {
        const parsedState = JSON.parse(savedState)
        if (parsedState.isRunning && parsedState.startTime) {
          const startTime = new Date(parsedState.startTime)
          const now = new Date()
          const duration = Math.floor((now.getTime() - startTime.getTime()) / 1000)
          return duration
        }
      }
    } catch (error) {
      console.error('Error parsing timer state:', error)
    }
    return 0
  }
  
  const currentTimerDuration = getCurrentTimerDuration()
  
  // Debug logging for date filtering
  console.log('Current time:', currentTime)
  console.log('Today boundary:', today)
  console.log('Week start boundary:', weekStart)
  console.log('Time entries:', timeEntries.map(entry => ({
    id: entry.id,
    startTime: entry.startTime,
    startTimeType: typeof entry.startTime,
    startTimeIsDate: entry.startTime instanceof Date,
    startTimeValue: entry.startTime?.toString(),
    startTimeJSON: JSON.stringify(entry.startTime),
    duration: entry.duration
  })))
  
  const dailyTotalTime = timeEntries
    .filter((entry: TimeEntry) => {
      // Handle both Date objects and ISO strings from Firebase
      let entryDate: Date
      if (entry.startTime instanceof Date) {
        entryDate = entry.startTime
      } else {
        entryDate = new Date(entry.startTime)
      }
      
      // Check if the date is valid - if not, assume it's from today
      if (isNaN(entryDate.getTime())) {
        console.warn(`Invalid date for entry ${entry.id}:`, entry.startTime, '- Assuming today')
        // For now, include entries with invalid dates in today's total
        // This will help us see the actual time being tracked
        return true
      }
      
      const entryDay = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate())
      const isToday = entryDay.getTime() === today.getTime()
      console.log(`Entry ${entry.id}: startTime=${entry.startTime}, entryDate=${entryDate}, entryDay=${entryDay}, today=${today}, isToday=${isToday}`)
      return isToday
    })
    .reduce((sum: number, entry: TimeEntry) => sum + entry.duration, 0)
  
  const weeklyTotalTime = timeEntries
    .filter((entry: TimeEntry) => {
      // Handle both Date objects and ISO strings from Firebase
      let entryDate: Date
      if (entry.startTime instanceof Date) {
        entryDate = entry.startTime
      } else {
        entryDate = new Date(entry.startTime)
      }
      
      // Check if the date is valid - if not, assume it's from this week
      if (isNaN(entryDate.getTime())) {
        console.warn(`Invalid date for entry ${entry.id}:`, entry.startTime, '- Assuming this week')
        // For now, include entries with invalid dates in this week's total
        // This will help us see the actual time being tracked
        return true
      }
      
      const entryDay = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate())
      const isThisWeek = entryDay >= weekStart && entryDay <= today
      console.log(`Entry ${entry.id}: startTime=${entry.startTime}, entryDate=${entryDate}, entryDay=${entryDay}, weekStart=${weekStart}, today=${today}, isThisWeek=${isThisWeek}`)
      return isThisWeek
    })
    .reduce((sum: number, entry: TimeEntry) => sum + entry.duration, 0)
  
  console.log('Daily total time:', dailyTotalTime)
  console.log('Weekly total time:', weeklyTotalTime)
  
  const totalDuration = timeEntries.reduce((sum: number, entry: TimeEntry) => sum + entry.duration, 0)

  const getProjectName = (projectId?: string) => {
    return projects.find(p => p.id === projectId)?.name || 'No Project'
  }

  const getTaskName = (taskId?: string) => {
    return tasks.find(t => t.id === taskId)?.name || 'No Task'
  }

  const getTagNames = (tagIds: string[] | undefined) => {
    if (!tagIds || !Array.isArray(tagIds)) return []
    return tagIds.map(id => tags.find(t => t.id === id)?.name).filter(Boolean)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading time entries...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Time Tracker</h1>
          <p className="text-gray-600">Track and manage your time entries</p>
        </div>
        
                 <div className="flex space-x-3">
          
          <button
            onClick={async () => {
              try {
                const isConnected = await timeEntryService.testConnection()
                if (isConnected) {
                  alert('✅ Firebase connection successful!')
                } else {
                  alert('❌ Firebase connection failed. Check console for details.')
                }
              } catch (error) {
                console.error('Connection test error:', error)
                alert(`❌ Connection test error: ${error}`)
              }
            }}
            className="btn-secondary flex items-center space-x-2"
          >
            <span>Test DB Connection</span>
          </button>
          
          <button
            onClick={async () => {
              if (!currentUser) {
                alert('❌ No user logged in')
                return
              }
              
                             try {
                 const testEntry = {
                   userId: currentUser.uid,
                   description: 'Test entry - ' + new Date().toLocaleTimeString(),
                   projectId: undefined,
                   taskId: undefined,
                   startTime: new Date(),
                   endTime: new Date(),
                   duration: 60,
                   isBillable: false,
                   tags: [],
                 }
                
                console.log('Creating test entry:', testEntry)
                const entryId = await timeEntryService.createTimeEntry(testEntry)
                alert(`✅ Test entry created with ID: ${entryId}`)
                await loadData() // Reload to show the new entry
              } catch (error) {
                console.error('Error creating test entry:', error)
                alert(`❌ Error creating test entry: ${error}`)
              }
            }}
            className="btn-secondary flex items-center space-x-2"
          >
            <span>Create Test Entry</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="input max-w-xs"
          >
            <option value="">All Projects</option>
            {projects.map((project: Project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="input max-w-xs"
          />
          
          <button
            onClick={() => {
              setFilterProject('')
              setFilterDate('')
            }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        </div>
      </div>

             {/* Summary Stats */}
       <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
         <div className="card text-center">
           <div className="p-4 bg-blue-100 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
             <Clock className="h-8 w-8 text-blue-600" />
           </div>
           <h3 className="text-lg font-semibold text-gray-900 mb-2">Daily Time</h3>
           <p className="text-3xl font-bold text-blue-600">{formatDuration(dailyTotalTime)}</p>
         </div>

         <div className="card text-center">
           <div className="p-4 bg-green-100 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
             <Clock className="h-8 w-8 text-green-600" />
           </div>
           <h3 className="text-lg font-semibold text-gray-900 mb-2">Weekly Time</h3>
           <p className="text-3xl font-bold text-green-600">{formatDuration(weeklyTotalTime)}</p>
         </div>

         <div className="card text-center">
           <div className="p-4 bg-purple-100 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
             <Clock className="h-8 w-8 text-purple-600" />
           </div>
           <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Time</h3>
           <p className="text-3xl font-bold text-purple-600">{formatDuration(totalDuration)}</p>
         </div>

         <div className="card text-center">
           <div className="p-4 bg-orange-100 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
             <Clock className="h-8 w-8 text-orange-600" />
           </div>
           <h3 className="text-lg font-semibold text-gray-900 mb-2">Entries</h3>
           <p className="text-3xl font-bold text-orange-600">{timeEntries.length}</p>
         </div>

         <div className="card text-center">
           <div className="p-4 bg-red-100 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
             <Clock className="h-8 w-8 text-red-600" />
           </div>
           <h3 className="text-lg font-semibold text-gray-900 mb-2">Current Timer</h3>
           <p className="text-3xl font-bold text-red-600">{formatDuration(currentTimerDuration)}</p>
         </div>
       </div>

      {/* Time Tracker Component */}
      <div className="mb-8">
        <TimeTracker 
          onTimeEntrySave={handleTimeEntrySave}
          projects={projects}
          tasks={tasks}
          tags={tags}
        />
      </div>

      {/* Time Entries List */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Time Entries</h2>
          
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-500">
              {filteredEntries.length} entries
            </span>
            <button className="btn-secondary flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No time entries found</h3>
              <p className="text-gray-500">Start tracking your time to see entries here.</p>
            </div>
          ) : (
            filteredEntries.map((entry) => {
              console.log('Processing entry:', entry)
              const project = projects.find((p: Project) => p.id === entry.projectId)
              const task = tasks.find((t: Task) => t.id === entry.taskId)
              const tagNames = getTagNames(entry.tags)
              console.log('Entry tags:', entry.tags, 'Tag names:', tagNames)
              
              return (
                <div key={entry.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-4 flex-1">
                    {project && (
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: project.color }}
                      />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{entry.description || 'No description'}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        {project && <span>{project.name}</span>}
                        {task && <span>• {task.name}</span>}
                        <span>• {formatDate(entry.startTime)}</span>
                        {entry.endTime && <span>• {formatTime(entry.startTime)} - {formatTime(entry.endTime)}</span>}
                        {entry.isBillable && (
                          <span className="flex items-center space-x-1 text-green-600">
                            <span>• Billable</span>
                          </span>
                        )}
                      </div>
                      
                      {tagNames.length > 0 && (
                        <div className="flex items-center space-x-2 mt-2">
                          {tagNames.map((tagName, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full"
                            >
                              {tagName}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right ml-4">
                    <p className="font-mono font-medium text-gray-900 text-lg">
                      {formatDuration(entry.duration || 0)}
                    </p>
                    {entry.isBillable && (
                      <p className="text-sm text-green-600">
                        {formatCurrency(calculateEarnings(entry.duration || 0, 75))}
                      </p>
                    )}
                    <button
                      onClick={() => handleDeleteTimeEntry(entry.id)}
                      className="mt-2 text-red-600 hover:text-red-800 p-1 rounded"
                      title="Delete entry"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
