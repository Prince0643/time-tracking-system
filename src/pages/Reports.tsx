import { useState, useEffect, useMemo } from 'react'
import { Calendar, Download, Filter, TrendingUp, Clock, DollarSign, BarChart3 } from 'lucide-react'
import { formatDuration, formatDate, formatCurrency, calculateEarnings } from '../utils'
import { useAuth } from '../contexts/AuthContext'
import { timeEntryService } from '../services/timeEntryService'
import { projectService } from '../services/projectService'
import { TimeEntry, Project } from '../types'

export default function Reports() {
  const { currentUser } = useAuth()
  const [selectedPeriod, setSelectedPeriod] = useState('week')
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  // Load data on component mount
  useEffect(() => {
    if (currentUser) {
      console.log('Reports: useEffect triggered, currentUser:', currentUser.uid)
      loadData()
    }
  }, [currentUser])

  const loadData = async () => {
    setLoading(true)
    try {
      console.log('Reports: Loading data for user:', currentUser?.uid)
      
      const [timeEntriesData, projectsData] = await Promise.all([
        timeEntryService.getTimeEntries(currentUser!.uid),
        projectService.getProjects()
      ])
      
      console.log('Reports: Loaded time entries:', timeEntriesData)
      console.log('Reports: Loaded projects:', projectsData)
      
      // Debug: Inspect the first time entry's startTime
      if (timeEntriesData.length > 0) {
        const firstEntry = timeEntriesData[0]
        console.log('Reports: First entry details:')
        console.log('- ID:', firstEntry.id)
        console.log('- startTime:', firstEntry.startTime)
        console.log('- startTime type:', typeof firstEntry.startTime)
        console.log('- startTime instanceof Date:', firstEntry.startTime instanceof Date)
        console.log('- startTime JSON:', JSON.stringify(firstEntry.startTime))
        console.log('- new Date(startTime):', new Date(firstEntry.startTime))
        console.log('- isValid:', !isNaN(new Date(firstEntry.startTime).getTime()))
      }
      
      setTimeEntries(timeEntriesData)
      setProjects(projectsData)
    } catch (error) {
      console.error('Error loading reports data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter entries based on selected period and project
  const getFilteredEntries = () => {
    let filtered = timeEntries
    
    if (selectedProject) {
      filtered = filtered.filter(entry => entry.projectId === selectedProject)
    }
    
    // Filter by period with proper date handling
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay()) // Start of week (Sunday)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const yearStart = new Date(now.getFullYear(), 0, 1) // January 1st
    
    console.log('Reports: Date boundaries - today:', today, 'weekStart:', weekStart, 'monthStart:', monthStart, 'yearStart:', yearStart)
    
    switch (selectedPeriod) {
      case 'today':
        filtered = filtered.filter(entry => {
          let entryDate: Date
          if (entry.startTime instanceof Date) {
            entryDate = entry.startTime
          } else {
            entryDate = new Date(entry.startTime)
          }
          
          if (isNaN(entryDate.getTime())) {
            console.warn('Reports: Invalid date for entry:', entry.startTime)
            // TEMPORARY: Include entries with invalid dates so you can see your data
            return true
          }
          
          const entryDay = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate())
          return entryDay.getTime() === today.getTime()
        })
        break
      case 'week':
        filtered = filtered.filter(entry => {
          let entryDate: Date
          if (entry.startTime instanceof Date) {
            entryDate = entry.startTime
          } else {
            entryDate = new Date(entry.startTime)
          }
          
          if (isNaN(entryDate.getTime())) {
            console.warn('Reports: Invalid date for entry:', entry.startTime)
            // TEMPORARY: Include entries with invalid dates so you can see your data
            // TODO: Fix the date format in Firebase
            return true
          }
          
          const entryDay = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate())
          const isInWeek = entryDay >= weekStart && entryDay <= today
          console.log('Reports: Entry date check - entry:', entry.id, 'startTime:', entry.startTime, 'entryDay:', entryDay, 'isInWeek:', isInWeek)
          return isInWeek
        })
        break
      case 'month':
        filtered = filtered.filter(entry => {
          let entryDate: Date
          if (entry.startTime instanceof Date) {
            entryDate = entry.startTime
          } else {
            entryDate = new Date(entry.startTime)
          }
          
          if (isNaN(entryDate.getTime())) {
            console.warn('Reports: Invalid date for entry:', entry.startTime)
            // TEMPORARY: Include entries with invalid dates so you can see your data
            return true
          }
          
          const entryDay = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate())
          return entryDay >= monthStart && entryDay <= today
        })
        break
      case 'year':
        filtered = filtered.filter(entry => {
          let entryDate: Date
          if (entry.startTime instanceof Date) {
            entryDate = entry.startTime
          } else {
            entryDate = new Date(entry.startTime)
          }
          
          if (isNaN(entryDate.getTime())) {
            console.warn('Reports: Invalid date for entry:', entry.startTime)
            // TEMPORARY: Include entries with invalid dates so you can see your data
            return true
          }
          
          const entryDay = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate())
          return entryDay >= yearStart && entryDay <= today
        })
        break
      default:
        break
    }
    
    console.log('Reports: Final filtered entries:', filtered.length)
    return filtered
  }

  const filteredEntries = useMemo(() => {
    console.log('Reports: Filtering entries - total entries:', timeEntries.length)
    console.log('Reports: Selected period:', selectedPeriod)
    console.log('Reports: Selected project:', selectedProject)
    
    const filtered = getFilteredEntries()
    console.log('Reports: Filtered entries count:', filtered.length)
    
    return filtered
  }, [timeEntries, selectedPeriod, selectedProject])
  
  // Calculate statistics with useMemo for reactivity
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
  
  const averageSessionLength = useMemo(() => 
    filteredEntries.length > 0 ? totalDuration / filteredEntries.length : 0, 
    [filteredEntries.length, totalDuration]
  )

  // Group entries by date for chart data
  const entriesByDate = useMemo(() => 
    filteredEntries.reduce((acc, entry) => {
      let entryDate: Date
      if (entry.startTime instanceof Date) {
        entryDate = entry.startTime
      } else {
        entryDate = new Date(entry.startTime)
      }
      
      if (isNaN(entryDate.getTime())) return acc
      
      const date = entryDate.toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = { duration: 0, billable: 0, count: 0 }
      }
      acc[date].duration += entry.duration
      if (entry.isBillable) {
        acc[date].billable += entry.duration
      }
      acc[date].count += 1
      return acc
    }, {} as Record<string, { duration: number; billable: number; count: number }>),
    [filteredEntries]
  )

  // Top projects by time
  const projectStats = useMemo(() => 
    projects.map(project => {
      const projectEntries = filteredEntries.filter(entry => entry.projectId === project.id)
      const totalTime = projectEntries.reduce((sum, entry) => sum + entry.duration, 0)
      const billableTime = projectEntries
        .filter(entry => entry.isBillable)
        .reduce((sum, entry) => sum + entry.duration, 0)
      const earnings = calculateEarnings(billableTime, hourlyRate)
      
      return {
        ...project,
        totalTime,
        billableTime,
        earnings,
        entryCount: projectEntries.length
      }
    }).sort((a, b) => b.totalTime - a.totalTime),
    [projects, filteredEntries, hourlyRate]
  )

  const periods = [
    { id: 'today', name: 'Today' },
    { id: 'week', name: 'This Week' },
    { id: 'month', name: 'This Month' },
    { id: 'year', name: 'This Year' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Analyze your time and productivity</p>
        </div>
        
                 <div className="flex space-x-3">
           <button 
             onClick={() => {
               console.log('Reports: Manual refresh clicked')
               console.log('Reports: Current state - timeEntries:', timeEntries.length, 'projects:', projects.length)
               loadData()
             }}
             className="btn-secondary flex items-center space-x-2"
           >
             <Filter className="h-4 w-4" />
             <span>Refresh</span>
           </button>
          
          <button 
            onClick={() => {
              // TODO: Implement export functionality
              alert('Export functionality coming soon!')
            }}
            className="btn-primary flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

             {/* Debug Info
       <div className="card bg-yellow-50 border-yellow-200">
         <h3 className="text-sm font-medium text-yellow-800 mb-2">Debug Info</h3>
         <div className="text-xs text-yellow-700 space-y-1">
           <p>Total Time Entries: {timeEntries.length}</p>
           <p>Total Projects: {projects.length}</p>
           <p>Filtered Entries: {filteredEntries.length}</p>
           <p>Selected Period: {selectedPeriod}</p>
           <p>Selected Project: {selectedProject || 'All'}</p>
         </div>
       </div> */}

       {/* Filters and Summary */}
       <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            
            <div className="flex space-x-2">
              {periods.map((period) => (
                <button
                  key={period.id}
                  onClick={() => setSelectedPeriod(period.id)}
                  className={`
                    px-3 py-1 rounded-lg text-sm font-medium transition-colors
                    ${selectedPeriod === period.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  {period.name}
                </button>
              ))}
            </div>
            
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="input max-w-xs"
            >
              <option value="">All Projects</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            
            <button 
              onClick={loadData}
              className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
              title="Refresh data"
            >
              ↻
            </button>
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
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card text-center">
          <div className="p-4 bg-blue-100 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Time</h3>
          <p className="text-3xl font-bold text-blue-600">{formatDuration(totalDuration)}</p>
          <p className="text-sm text-gray-500">{filteredEntries.length} entries</p>
        </div>

        <div className="card text-center">
          <div className="p-4 bg-green-100 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Billable Time</h3>
          <p className="text-3xl font-bold text-green-600">{formatDuration(billableDuration)}</p>
          <p className="text-sm text-gray-500">
            {filteredEntries.length > 0 
              ? Math.round((billableDuration / totalDuration) * 100) 
              : 0}% of total
          </p>
        </div>

        <div className="card text-center">
          <div className="p-4 bg-purple-100 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Earnings</h3>
          <p className="text-3xl font-bold text-purple-600">{formatCurrency(earnings)}</p>
          <p className="text-sm text-gray-500">Based on ${hourlyRate}/hr</p>
        </div>

        <div className="card text-center">
          <div className="p-4 bg-orange-100 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <BarChart3 className="h-8 w-8 text-orange-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Avg Session</h3>
          <p className="text-3xl font-bold text-orange-600">{formatDuration(averageSessionLength)}</p>
          <p className="text-sm text-gray-500">Per time entry</p>
        </div>
      </div>

      {/* Time Chart */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Time Tracking Over Time</h2>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-2" />
            <p>Chart visualization would go here</p>
            <p className="text-sm">Showing {Object.keys(entriesByDate).length} days of data</p>
          </div>
        </div>
      </div>

      {/* Top Projects */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Top Projects by Time</h2>
        <div className="space-y-4">
          {projectStats.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No project data</h3>
              <p className="text-gray-500">Start tracking time on projects to see statistics here.</p>
            </div>
          ) : (
            projectStats.slice(0, 5).map((project) => (
              <div key={project.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <div>
                    <h3 className="font-medium text-gray-900">{project.name}</h3>
                    <p className="text-sm text-gray-500">{project.entryCount} entries</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatDuration(project.totalTime)}</p>
                  <p className="text-sm text-green-600">{formatCurrency(project.earnings)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Daily Breakdown */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Daily Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Billable
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entries
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Earnings
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.keys(entriesByDate).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No time data</h3>
                      <p className="text-gray-500">Start tracking time to see daily breakdowns here.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                Object.entries(entriesByDate)
                  .sort(([a], [b]) => b.localeCompare(a))
                  .slice(0, 10)
                  .map(([date, stats]) => (
                    <tr key={date} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatDate(new Date(date))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDuration(stats.duration)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDuration(stats.billable)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stats.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        {formatCurrency(calculateEarnings(stats.billable, hourlyRate))}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
