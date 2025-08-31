import { useState, useEffect, useMemo } from 'react'
import { 
  Users, 
  Clock, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Filter, 
  Eye,
  UserCheck,
  UserX,
  Activity,
  BarChart3
} from 'lucide-react'
import { formatDuration, formatDate, formatCurrency, calculateEarnings } from '../utils'
import { useAuth } from '../contexts/AuthContext'
import { timeEntryService } from '../services/timeEntryService'
import { projectService } from '../services/projectService'
import { userService } from '../services/userService'
import { TimeEntry, Project, User, UserRole } from '../types'

interface UserWithStats extends User {
  totalTime: number
  billableTime: number
  earnings: number
  entryCount: number
  lastActivity?: Date
  isOnline: boolean
  todayTime: number
  weekTime: number
  monthTime: number
  projectBreakdown: Record<string, { time: number; entries: number }>
  averageSessionLength: number
  billablePercentage: number
  lastEntryDate?: Date
}

export default function AdminDashboard() {
  const { currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [selectedPeriod, setSelectedPeriod] = useState('week')
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null)
  const [showUserDetails, setShowUserDetails] = useState(false)

  // Load data on component mount
  useEffect(() => {
    if (currentUser && currentUser.role === 'admin') {
      loadData()
    }
  }, [currentUser])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load all users, time entries, and projects
      const [usersData, timeEntriesData, projectsData] = await Promise.all([
        userService.getAllUsers(),
        timeEntryService.getAllTimeEntries(),
        projectService.getProjects()
      ])

      console.log('Admin Dashboard - Loaded data:', {
        users: usersData.length,
        timeEntries: timeEntriesData.length,
        projects: projectsData.length
      })

      // Debug: Log sample data to see structure
      if (usersData.length > 0) {
        console.log('Sample user:', usersData[0])
      }
      if (timeEntriesData.length > 0) {
        console.log('Sample time entry:', timeEntriesData[0])
        console.log('Sample time entry userId:', timeEntriesData[0].userId)
        console.log('Sample time entry keys:', Object.keys(timeEntriesData[0]))
      }

      setUsers(usersData)
      setTimeEntries(timeEntriesData)
      setProjects(projectsData)
    } catch (error) {
      console.error('Error loading admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate user statistics
  const usersWithStats = useMemo(() => {
    console.log('Admin Dashboard - Calculating user stats:', {
      usersCount: users.length,
      timeEntriesCount: timeEntries.length
    })

    // Debug: Log all users and their IDs
    console.log('All users:', users.map(u => ({ id: u.id, name: u.name, email: u.email })))
    
    // Debug: Log all time entries and their userIds
    console.log('All time entries:', timeEntries.map(te => ({ 
      id: te.id, 
      userId: te.userId, 
      description: te.description, 
      duration: te.duration 
    })))

    return users.map(user => {
      console.log(`Processing user: ${user.name} (ID: ${user.id})`)
      
      const userEntries = timeEntries.filter(entry => entry.userId === user.id)
      console.log(`Found ${userEntries.length} entries for user ${user.name}:`, userEntries.map(e => ({ id: e.id, duration: e.duration })))
      
      const totalTime = userEntries.reduce((sum, entry) => {
        console.log(`Adding duration for entry ${entry.id}:`, entry.duration, 'Total so far:', sum + entry.duration)
        return sum + entry.duration
      }, 0)
      const billableTime = userEntries
        .filter(entry => entry.isBillable)
        .reduce((sum, entry) => sum + entry.duration, 0)
      const earnings = calculateEarnings(billableTime, user.hourlyRate || 0)
      
      const lastActivity = userEntries.length > 0 
        ? new Date(Math.max(...userEntries.map(e => new Date(e.startTime).getTime())))
        : undefined

      // Calculate activity by period
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay())
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      // Debug: Log sample entry dates
      if (userEntries.length > 0) {
        console.log(`Sample entry for ${user.name}:`, {
          startTime: userEntries[0].startTime,
          startTimeType: typeof userEntries[0].startTime,
          parsedDate: new Date(userEntries[0].startTime),
          isValid: !isNaN(new Date(userEntries[0].startTime).getTime())
        })
      }

      const todayEntries = userEntries.filter(entry => {
        const entryDate = new Date(entry.startTime)
        if (isNaN(entryDate.getTime())) {
          console.log(`Invalid date for entry ${entry.id}:`, entry.startTime)
          return false
        }
        const entryDay = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate())
        const isToday = entryDay.getTime() === today.getTime()
        console.log(`Entry ${entry.id} date check:`, {
          entryDate: entryDate.toISOString(),
          entryDay: entryDay.toISOString(),
          today: today.toISOString(),
          isToday
        })
        return isToday
      })

      const weekEntries = userEntries.filter(entry => {
        const entryDate = new Date(entry.startTime)
        if (isNaN(entryDate.getTime())) return false
        const entryDay = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate())
        const isInWeek = entryDay >= weekStart && entryDay <= today
        console.log(`Entry ${entry.id} week check:`, {
          entryDay: entryDay.toISOString(),
          weekStart: weekStart.toISOString(),
          today: today.toISOString(),
          isInWeek
        })
        return isInWeek
      })

      const monthEntries = userEntries.filter(entry => {
        const entryDate = new Date(entry.startTime)
        if (isNaN(entryDate.getTime())) return false
        const entryDay = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate())
        const isInMonth = entryDay >= monthStart && entryDay <= today
        console.log(`Entry ${entry.id} month check:`, {
          entryDay: entryDay.toISOString(),
          monthStart: monthStart.toISOString(),
          today: today.toISOString(),
          isInMonth
        })
        return isInMonth
      })

      console.log(`Date filtering results for ${user.name}:`, {
        todayEntries: todayEntries.length,
        weekEntries: weekEntries.length,
        monthEntries: monthEntries.length
      })

      const todayTime = todayEntries.reduce((sum, entry) => sum + entry.duration, 0)
      const weekTime = weekEntries.reduce((sum, entry) => sum + entry.duration, 0)
      const monthTime = monthEntries.reduce((sum, entry) => sum + entry.duration, 0)

      // Calculate project breakdown
      const projectBreakdown = userEntries.reduce((acc, entry) => {
        if (entry.projectId) {
          if (!acc[entry.projectId]) {
            acc[entry.projectId] = { time: 0, entries: 0 }
          }
          acc[entry.projectId].time += entry.duration
          acc[entry.projectId].entries += 1
        }
        return acc
      }, {} as Record<string, { time: number; entries: number }>)

      const userStats = {
        ...user,
        totalTime,
        billableTime,
        earnings,
        entryCount: userEntries.length,
        lastActivity,
        isOnline: lastActivity ? (Date.now() - lastActivity.getTime()) < 5 * 60 * 1000 : false, // 5 minutes
        todayTime,
        weekTime,
        monthTime,
        projectBreakdown,
        // Additional metrics
        averageSessionLength: userEntries.length > 0 ? totalTime / userEntries.length : 0,
        billablePercentage: totalTime > 0 ? (billableTime / totalTime) * 100 : 0,
        lastEntryDate: userEntries.length > 0 ? new Date(Math.max(...userEntries.map(e => new Date(e.startTime).getTime()))) : undefined
      }

      console.log(`User ${user.name} stats:`, {
        totalTime,
        todayTime,
        weekTime,
        monthTime,
        entryCount: userEntries.length
      })

      return userStats
    })
  }, [users, timeEntries])

  // Filter users based on role and period
  const filteredUsers = useMemo(() => {
    let filtered = usersWithStats

    // Filter by role
    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRole)
    }

    console.log('Admin Dashboard - Filtering:', {
      totalUsers: usersWithStats.length,
      selectedRole,
      selectedPeriod,
      filteredCount: filtered.length
    })

    // Filter by period - show all users but highlight activity for the selected period
    // The period filter now only affects the display of activity data, not user visibility
    return filtered
  }, [usersWithStats, selectedRole, selectedPeriod])

  // Calculate overall statistics
  const overallStats = useMemo(() => {
    const totalUsers = users.length
    const activeUsers = users.filter(u => u.isActive).length
    const totalTime = usersWithStats.length > 0 ? usersWithStats.reduce((sum, user) => sum + user.totalTime, 0) : 0
    const totalBillable = usersWithStats.length > 0 ? usersWithStats.reduce((sum, user) => sum + user.billableTime, 0) : 0
    const totalEarnings = usersWithStats.length > 0 ? usersWithStats.reduce((sum, user) => sum + user.earnings, 0) : 0

    return {
      totalUsers,
      activeUsers,
      totalTime,
      totalBillable,
      totalEarnings
    }
  }, [users, usersWithStats])

  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <UserX className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-500">You need admin privileges to view this page.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Monitor all users and team productivity</p>
        </div>
        
        <button 
          onClick={loadData}
          className="btn-secondary flex items-center space-x-2"
        >
          <Filter className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="card text-center">
          <div className="p-4 bg-blue-100 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-blue-600">{overallStats.totalUsers}</p>
          <p className="text-sm text-gray-500">{overallStats.activeUsers} active</p>
        </div>

        <div className="card text-center">
          <div className="p-4 bg-green-100 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <UserCheck className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Online Users</h3>
          <p className="text-3xl font-bold text-green-600">
            {usersWithStats.filter(u => u.isOnline).length}
          </p>
          <p className="text-sm text-gray-500">Currently active</p>
        </div>

        <div className="card text-center">
          <div className="p-4 bg-purple-100 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Clock className="h-8 w-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Time</h3>
          <p className="text-3xl font-bold text-purple-600">{formatDuration(overallStats.totalTime)}</p>
          <p className="text-sm text-gray-500">All users</p>
        </div>

        <div className="card text-center">
          <div className="p-4 bg-orange-100 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <DollarSign className="h-8 w-8 text-orange-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Earnings</h3>
          <p className="text-3xl font-bold text-orange-600">{formatCurrency(overallStats.totalEarnings)}</p>
          <p className="text-sm text-gray-500">Billable hours</p>
        </div>

        <div className="card text-center">
          <div className="p-4 bg-indigo-100 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <BarChart3 className="h-8 w-8 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Avg per User</h3>
          <p className="text-3xl font-bold text-indigo-600">
            {overallStats.totalUsers > 0 ? formatDuration(overallStats.totalTime / overallStats.totalUsers) : '0:00'}
          </p>
          <p className="text-sm text-gray-500">Time per user</p>
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
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="input max-w-xs"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins</option>
            <option value="employee">Employees</option>
          </select>
          
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="input max-w-xs"
          >
            <option value="all">All Time</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">User Activity & Performance</h2>
        {filteredUsers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
            <p className="text-gray-500">No users match the current filters or no users exist yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Today
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  This Week
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  This Month
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Billable %
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Earnings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entries
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-700">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`
                      inline-flex px-2 py-1 text-xs font-semibold rounded-full
                      ${user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-green-100 text-green-800'
                      }
                    `}>
                      {user.role}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${user.isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
                      <span className="text-sm text-gray-900">
                        {user.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="text-center">
                      <div className="font-medium">{formatDuration(user.todayTime)}</div>
                      <div className="text-xs text-gray-500">
                        {user.projectBreakdown && Object.keys(user.projectBreakdown).length > 0 
                          ? `${Object.keys(user.projectBreakdown).length} projects` 
                          : 'No projects'}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="text-center">
                      <div className="font-medium">{formatDuration(user.weekTime)}</div>
                      <div className="text-xs text-gray-500">
                        {user.weekTime > 0 ? `${Math.round(user.weekTime / 3600)}h avg/day` : 'No time'}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="text-center">
                      <div className="font-medium">{formatDuration(user.monthTime)}</div>
                      <div className="text-xs text-gray-500">
                        {user.monthTime > 0 ? `${Math.round(user.monthTime / 3600)}h total` : 'No time'}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="text-center">
                      <div className="font-medium">{formatDuration(user.totalTime)}</div>
                      <div className="text-xs text-gray-500">
                        {user.averageSessionLength > 0 ? `${formatDuration(user.averageSessionLength)} avg` : 'No sessions'}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="text-center">
                      <div className="font-medium">{user.billablePercentage.toFixed(1)}%</div>
                      <div className="text-xs text-gray-500">
                        {formatDuration(user.billableTime)}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                    <div className="text-center">
                      <div className="font-medium">{formatCurrency(user.earnings)}</div>
                      <div className="text-xs text-gray-500">
                        ${user.hourlyRate || 0}/hr
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="text-center">
                      <div className="font-medium">{user.entryCount}</div>
                      <div className="text-xs text-gray-500">
                        {user.entryCount > 0 ? 'entries' : 'No entries'}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="text-center">
                      <div>{user.lastActivity ? formatDate(user.lastActivity) : 'Never'}</div>
                      {user.lastEntryDate && (
                        <div className="text-xs text-gray-400">
                          {formatDate(user.lastEntryDate)}
                        </div>
                      )}
                    </div>
                  </td>
                  
                                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                     <button 
                       onClick={() => {
                         setSelectedUser(user)
                         setShowUserDetails(true)
                       }}
                       className="text-primary-600 hover:text-primary-900 flex items-center space-x-1"
                     >
                       <Eye className="h-4 w-4" />
                       <span>View Details</span>
                     </button>
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Role Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Distribution</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-sm text-gray-700">Admins</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {users.filter(u => u.role === 'admin').length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-700">Employees</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {users.filter(u => u.role === 'employee').length}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Summary</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Active Users Today</span>
              <span className="text-sm font-medium text-gray-900">
                {usersWithStats.filter(u => u.isOnline).length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Total Time Entries</span>
              <span className="text-sm font-medium text-gray-900">
                {timeEntries.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Billable Hours</span>
              <span className="text-sm font-medium text-gray-900">
                {formatDuration(overallStats.totalBillable)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed User Activity Breakdown */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed User Activity Breakdown</h3>
        {filteredUsers.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No User Data</h3>
            <p className="text-gray-500">No users available to display detailed breakdown.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((user) => (
            <div key={user.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-700">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{user.name}</h4>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`
                    inline-flex px-2 py-1 text-xs font-semibold rounded-full
                    ${user.role === 'admin' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-green-100 text-green-800'
                    }
                  `}>
                    {user.role}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">{formatDuration(user.todayTime)}</div>
                  <div className="text-xs text-gray-500">Today</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">{formatDuration(user.weekTime)}</div>
                  <div className="text-xs text-gray-500">This Week</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-purple-600">{formatDuration(user.monthTime)}</div>
                  <div className="text-xs text-gray-500">This Month</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-orange-600">{formatDuration(user.totalTime)}</div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Billable:</span>
                  <span className="ml-2 font-medium">{user.billablePercentage.toFixed(1)}% ({formatDuration(user.billableTime)})</span>
                </div>
                <div>
                  <span className="text-gray-500">Earnings:</span>
                  <span className="ml-2 font-medium text-green-600">{formatCurrency(user.earnings)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Entries:</span>
                  <span className="ml-2 font-medium">{user.entryCount}</span>
                </div>
                <div>
                  <span className="text-gray-500">Avg Session:</span>
                  <span className="ml-2 font-medium">{formatDuration(user.averageSessionLength)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Hourly Rate:</span>
                  <span className="ml-2 font-medium">${user.hourlyRate || 0}/hr</span>
                </div>
                <div>
                  <span className="text-gray-500">Last Activity:</span>
                  <span className="ml-2 font-medium">{user.lastActivity ? formatDate(user.lastActivity) : 'Never'}</span>
                </div>
              </div>
              
              {/* Project Breakdown */}
              {Object.keys(user.projectBreakdown).length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Project Breakdown:</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {Object.entries(user.projectBreakdown).map(([projectId, data]) => {
                      const project = projects.find(p => p.id === projectId)
                      return (
                        <div key={projectId} className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: project?.color || '#6B7280' }}
                            />
                            <span className="text-gray-600">{project?.name || 'Unknown Project'}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-medium">{formatDuration(data.time)}</span>
                            <span className="text-gray-500 ml-1">({data.entries} entries)</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
                         </div>
           ))}
           </div>
         )}
       </div>

      {/* Top Performers & Activity Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="card">
           <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performers This Week</h3>
           <div className="space-y-3">
             {filteredUsers.length > 0 ? (() => {
               const topPerformers = filteredUsers
                 .filter(user => user.weekTime > 0)
                 .sort((a, b) => b.weekTime - a.weekTime)
                 .slice(0, 5)
               
               return topPerformers.length > 0 ? topPerformers.map((user, index) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.role}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{formatDuration(user.weekTime)}</div>
                    <div className="text-xs text-gray-500">{user.entryCount} entries</div>
                  </div>
                                 </div>
               )) : (
                 <div className="text-center py-4 text-gray-500">
                   No activity this week
                 </div>
               )
             })() : (
               <div className="text-center py-4 text-gray-500">
                 No users available
               </div>
             )}
           </div>
         </div>

                 <div className="card">
           <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Trends</h3>
           <div className="space-y-3">
             <div className="flex items-center justify-between">
               <span className="text-sm text-gray-700">Most Active Today</span>
               <span className="text-sm font-medium text-gray-900">
                 {filteredUsers.length > 0 ? filteredUsers.reduce((max, user) => 
                   user.todayTime > max.todayTime ? user : max
                 ).name : 'No users'}
               </span>
             </div>
             <div className="flex items-center justify-between">
               <span className="text-sm text-gray-700">Highest Billable %</span>
               <span className="text-sm font-medium text-gray-900">
                 {filteredUsers.length > 0 ? (() => {
                   const user = filteredUsers.reduce((max, user) => 
                     user.billablePercentage > max.billablePercentage ? user : max
                   )
                   return `${user.name} (${user.billablePercentage.toFixed(1)}%)`
                 })() : 'No users'}
               </span>
             </div>
             <div className="flex items-center justify-between">
               <span className="text-sm text-gray-700">Most Entries</span>
               <span className="text-sm font-medium text-gray-900">
                 {filteredUsers.length > 0 ? (() => {
                   const user = filteredUsers.reduce((max, user) => 
                     user.entryCount > max.entryCount ? user : max
                   )
                   return `${user.name} (${user.entryCount})`
                 })() : 'No users'}
               </span>
             </div>
             <div className="flex items-center justify-between">
               <span className="text-sm text-gray-700">Highest Earnings</span>
               <span className="text-sm font-medium text-gray-900">
                 {filteredUsers.length > 0 ? (() => {
                   const user = filteredUsers.reduce((max, user) => 
                     user.earnings > max.earnings ? user : max
                   )
                   return `${user.name} (${formatCurrency(user.earnings)})`
                 })() : 'No users'}
               </span>
             </div>
           </div>
         </div>
      </div>

      {/* User Management Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="btn-secondary flex items-center justify-center space-x-2 py-3">
            <Users className="h-5 w-5" />
            <span>Add New User</span>
          </button>
          <button className="btn-secondary flex items-center justify-center space-x-2 py-3">
            <Activity className="h-5 w-5" />
            <span>Export User Data</span>
          </button>
          <button className="btn-secondary flex items-center justify-center space-x-2 py-3">
            <BarChart3 className="h-5 w-5" />
            <span>Generate Reports</span>
          </button>
        </div>
      </div>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowUserDetails(false)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary-700">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedUser.name}</h2>
                  <p className="text-gray-600">{selectedUser.email}</p>
                  <span className={`
                    inline-flex px-3 py-1 text-sm font-semibold rounded-full mt-2
                    ${selectedUser.role === 'admin' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-green-100 text-green-800'
                    }
                  `}>
                    {selectedUser.role}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    loadData()
                    setShowUserDetails(false)
                  }}
                  className="text-primary-600 hover:text-primary-800 flex items-center space-x-1 px-3 py-1 rounded-md hover:bg-primary-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh</span>
                </button>
                <button
                  onClick={() => setShowUserDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Activity Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{formatDuration(selectedUser.todayTime)}</div>
                <div className="text-sm text-blue-600">Today</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{formatDuration(selectedUser.weekTime)}</div>
                <div className="text-sm text-green-600">This Week</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">{formatDuration(selectedUser.monthTime)}</div>
                <div className="text-sm text-purple-600">This Month</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-600">{formatDuration(selectedUser.totalTime)}</div>
                <div className="text-sm text-orange-600">Total</div>
              </div>
            </div>

            {/* Quick Insights */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {selectedUser.entryCount > 0 ? Math.round(selectedUser.totalTime / 3600 * 10) / 10 : 0}
                  </div>
                  <div className="text-sm text-gray-600">Hours Tracked</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {selectedUser.entryCount > 0 ? Math.round(selectedUser.weekTime / 3600 * 10) / 10 : 0}
                  </div>
                  <div className="text-sm text-gray-600">Hours This Week</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">
                    {selectedUser.billablePercentage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Billable Rate</div>
                </div>
              </div>
            </div>

            {/* Detailed Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Performance Metrics</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Entries:</span>
                    <span className="font-medium">{selectedUser.entryCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Billable Time:</span>
                    <span className="font-medium">{formatDuration(selectedUser.billableTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Billable %:</span>
                    <span className="font-medium">{selectedUser.billablePercentage.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Session:</span>
                    <span className="font-medium">{formatDuration(selectedUser.averageSessionLength)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hourly Rate:</span>
                    <span className="font-medium">${selectedUser.hourlyRate || 0}/hr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Earnings:</span>
                    <span className="font-medium text-green-600">{formatCurrency(selectedUser.earnings)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Activity Status</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`flex items-center ${selectedUser.isOnline ? 'text-green-600' : 'text-gray-600'}`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${selectedUser.isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
                      {selectedUser.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Activity:</span>
                    <span className="font-medium">{selectedUser.lastActivity ? formatDate(selectedUser.lastActivity) : 'Never'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Entry:</span>
                    <span className="font-medium">{selectedUser.lastEntryDate ? formatDate(selectedUser.lastEntryDate) : 'Never'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Breakdown */}
            {Object.keys(selectedUser.projectBreakdown).length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Project Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(selectedUser.projectBreakdown).map(([projectId, data]) => {
                    const project = projects.find(p => p.id === projectId)
                    return (
                      <div key={projectId} className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: project?.color || '#6B7280' }}
                          />
                          <span className="font-medium text-gray-900">{project?.name || 'Unknown Project'}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">{formatDuration(data.time)}</div>
                          <div className="text-sm text-gray-500">{data.entries} entries</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Recent Time Entries */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Time Entries</h3>
              {selectedUser.entryCount > 0 ? (
                <div className="space-y-2">
                  {timeEntries
                    .filter(entry => entry.userId === selectedUser.id)
                    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                    .slice(0, 5)
                    .map((entry, index) => {
                      const project = projects.find(p => p.id === entry.projectId)
                      return (
                        <div key={entry.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="text-sm text-gray-500">#{index + 1}</div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {project?.name || 'Unknown Project'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {formatDate(new Date(entry.startTime))}
                              </div>
                              {entry.description && (
                                <div className="text-xs text-gray-400 mt-1">
                                  {entry.description}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-gray-900">{formatDuration(entry.duration)}</div>
                            <div className="text-sm text-gray-500">
                              {entry.isBillable ? 'Billable' : 'Non-billable'}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <div className="text-gray-400 mb-2">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p>No time entries found for this user</p>
                  <p className="text-sm text-gray-400 mt-1">Start tracking time to see activity here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
