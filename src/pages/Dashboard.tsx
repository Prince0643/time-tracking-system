import { useState, useEffect, useMemo } from 'react'
import { Clock, TrendingUp, DollarSign, Calendar, Play, Plus, Users } from 'lucide-react'
import { formatDuration, formatDate, formatCurrency, calculateEarnings } from '../utils'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { timeEntryService } from '../services/timeEntryService'
import { projectService } from '../services/projectService'
import { TimeEntry, Project } from '../types'

export default function Dashboard() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [selectedPeriod, setSelectedPeriod] = useState('today')
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  // Load data on component mount and when period changes
  useEffect(() => {
    if (currentUser) {
      loadData()
    }
  }, [currentUser, selectedPeriod])

  // Force re-render when data changes
  useEffect(() => {
    if (timeEntries.length > 0 || projects.length > 0) {
      // This will trigger a re-render when data is loaded
      setLoading(false)
    }
  }, [timeEntries, projects])

  const loadData = async () => {
    setLoading(true)
    try {
      const [timeEntriesData, projectsData] = await Promise.all([
        timeEntryService.getTimeEntries(currentUser!.uid),
        projectService.getProjects()
      ])
      
      console.log('Dashboard: Loaded time entries:', timeEntriesData)
      console.log('Dashboard: Loaded projects:', projectsData)
      
      setTimeEntries(timeEntriesData)
      setProjects(projectsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate statistics based on selected period
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay()) // Start of week (Sunday)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  
  const filteredEntries = useMemo(() => {
    console.log('Dashboard: Filtering entries for period:', selectedPeriod)
    console.log('Dashboard: Total entries to filter:', timeEntries.length)
    
    const filtered = timeEntries.filter(entry => {
      // Handle both Date objects and ISO strings from Firebase
      let entryDate: Date
      if (entry.startTime instanceof Date) {
        entryDate = entry.startTime
      } else {
        entryDate = new Date(entry.startTime)
      }
      
      // Check if the date is valid
      if (isNaN(entryDate.getTime())) {
        console.warn(`Dashboard: Invalid date for entry ${entry.id}:`, entry.startTime)
        // For now, include entries with invalid dates to see what we're working with
        return true
      }
      
      const entryDay = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate())
      
      let isInPeriod = false
      switch (selectedPeriod) {
        case 'today':
          isInPeriod = entryDay.getTime() === today.getTime()
          break
        case 'week':
          isInPeriod = entryDay >= weekStart && entryDay <= today
          break
        case 'month':
          isInPeriod = entryDay >= monthStart && entryDay <= today
          break
        default:
          isInPeriod = entryDay.getTime() === today.getTime()
      }
      
      console.log(`Dashboard: Entry ${entry.id}: startTime=${entry.startTime}, entryDate=${entryDate}, entryDay=${entryDay}, isInPeriod=${isInPeriod}`)
      return isInPeriod
    })
    
    console.log('Dashboard: Filtered entries:', filtered.length)
    return filtered
  }, [timeEntries, selectedPeriod, today, weekStart, monthStart])

  const totalDuration = useMemo(() => 
    filteredEntries.reduce((sum, entry) => sum + entry.duration, 0), 
    [filteredEntries]
  )
  
  const billableDuration = useMemo(() => 
    filteredEntries
      .filter(entry => entry.isBillable)
      .reduce((sum, entry) => sum + entry.duration, 0), 
    [filteredEntries]
  )
  
  const hourlyRate = 75 // Default hourly rate - can be enhanced later to fetch from user profile
  const earnings = useMemo(() => 
    calculateEarnings(billableDuration, hourlyRate), 
    [billableDuration, hourlyRate]
  )

  const recentEntries = useMemo(() => 
    timeEntries
      .filter(entry => {
        // Handle both Date objects and ISO strings from Firebase
        let entryDate: Date
        if (entry.startTime instanceof Date) {
          entryDate = entry.startTime
        } else {
          entryDate = new Date(entry.startTime)
        }
        
        // Check if the date is valid
        if (isNaN(entryDate.getTime())) {
          console.warn(`Dashboard: Invalid date for recent entry ${entry.id}:`, entry.startTime)
          // For now, include entries with invalid dates to see what we're working with
          return true
        }
        
        return true
      })
      .sort((a, b) => {
        // Handle both Date objects and ISO strings from Firebase
        let aDate: Date
        let bDate: Date
        
        if (a.startTime instanceof Date) {
          aDate = a.startTime
        } else {
          aDate = new Date(a.startTime)
        }
        
        if (b.startTime instanceof Date) {
          bDate = b.startTime
        } else {
          bDate = new Date(b.startTime)
        }
        
        return bDate.getTime() - aDate.getTime()
      })
      .slice(0, 5),
    [timeEntries]
  )
  
  console.log('Dashboard: Final calculations:')
  console.log('- Filtered entries:', filteredEntries.length)
  console.log('- Total duration:', totalDuration, 'seconds')
  console.log('- Billable duration:', billableDuration, 'seconds')
  console.log('- Earnings:', earnings, 'cents')
  console.log('- Recent entries count:', recentEntries.length)

  const stats = useMemo(() => [
    {
      name: `Time ${selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)}`,
      value: formatDuration(totalDuration),
      change: `${filteredEntries.length} entries`,
      changeType: 'neutral',
      icon: Clock,
    },
    {
      name: 'Billable Hours',
      value: formatDuration(billableDuration),
      change: `${filteredEntries.filter(e => e.isBillable).length} billable`,
      changeType: 'positive',
      icon: DollarSign,
    },
    {
      name: `Earnings ${selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)}`,
      value: formatCurrency(earnings),
      change: `$${(earnings / 100).toFixed(2)}`,
      changeType: 'positive',
      icon: TrendingUp,
    },
    {
      name: 'Active Projects',
      value: projects.filter(p => !p.isArchived).length.toString(),
      change: `${projects.filter(p => p.isArchived).length} archived`,
      changeType: 'neutral',
      icon: Calendar,
    },
  ], [selectedPeriod, totalDuration, filteredEntries, billableDuration, earnings, projects])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {currentUser?.name}</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/tracker')}
            className="btn-primary flex items-center space-x-2"
          >
            <Play className="h-4 w-4" />
            <span>Start Timer</span>
          </button>
          
          <button 
            onClick={loadData}
            className="btn-secondary flex items-center space-x-2"
          >
            <Clock className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Period Selector and Summary */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          {['today', 'week', 'month'].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${selectedPeriod === period
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
        
        <div className="text-right">
          <p className="text-sm text-gray-600">
            {filteredEntries.length} entries in {selectedPeriod}
          </p>
          <p className="text-lg font-semibold text-gray-900">
            {formatDuration(totalDuration)} total time
          </p>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Icon className="h-6 w-6 text-primary-600" />
                </div>
              </div>
              
              <div className="mt-4 flex items-center">
                <span className={`
                  text-sm font-medium
                  ${stat.changeType === 'positive' ? 'text-green-600' : 
                    stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'}
                `}>
                  {stat.change}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Time Entries */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Recent Time Entries</h2>
          <button 
            onClick={() => navigate('/tracker')}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            View All
          </button>
        </div>

        <div className="space-y-4">
          {recentEntries.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No time entries yet</h3>
              <p className="text-gray-500">Start tracking your time to see entries here.</p>
            </div>
          ) : (
            recentEntries.map((entry) => {
              const project = projects.find((p: Project) => p.id === entry.projectId)
              return (
                <div key={entry.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    {project && (
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{entry.description || 'No description'}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        {project && <span>{project.name}</span>}
                        <span>{formatDate(entry.startTime)}</span>
                        {entry.isBillable && (
                          <span className="flex items-center space-x-1 text-green-600">
                            <DollarSign className="h-3 w-3" />
                            <span>Billable</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-mono font-medium text-gray-900">
                      {formatDuration(entry.duration || 0)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {(() => {
                        try {
                          if (entry.startTime instanceof Date) {
                            return entry.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          } else {
                            const date = new Date(entry.startTime)
                            if (!isNaN(date.getTime())) {
                              return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            }
                            return 'Invalid time'
                          }
                        } catch {
                          return 'Invalid time'
                        }
                      })()}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className={`grid gap-6 ${currentUser?.role === 'admin' ? 'grid-cols-1 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
        <div 
          onClick={() => navigate('/tracker')}
          className="card text-center hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="p-4 bg-primary-100 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Clock className="h-8 w-8 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Start Timer</h3>
          <p className="text-gray-600 text-sm">Begin tracking time for a new task</p>
        </div>

        <div 
          onClick={() => navigate('/projects')}
          className="card text-center hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="p-4 bg-green-100 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Plus className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">New Project</h3>
          <p className="text-gray-600 text-sm">Create a new project to organize work</p>
        </div>

        <div 
          onClick={() => navigate('/reports')}
          className="card text-center hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="p-4 bg-purple-100 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">View Reports</h3>
          <p className="text-gray-600 text-sm">Analyze your time and productivity</p>
        </div>

        {/* Admin-only quick action */}
        {currentUser?.role === 'admin' && (
          <div 
            onClick={() => navigate('/admin')}
            className="card text-center hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="p-4 bg-red-100 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Users className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Admin Dashboard</h3>
            <p className="text-gray-600 text-sm">Monitor team activity and performance</p>
          </div>
        )}
      </div>
    </div>
  )
}
