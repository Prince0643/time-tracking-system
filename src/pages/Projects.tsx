import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Archive, MoreVertical, Clock, DollarSign, Users, FolderOpen } from 'lucide-react'
import { Project, Task, Client } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { projectService, taskService, clientService, timeEntryService } from '../services/projectService'
import { formatDuration, formatCurrency, formatDate } from '../utils'
import { seedDatabase } from '../utils/seedData'
import ProjectModal from '../components/projects/ProjectModal'
import TaskModal from '../components/projects/TaskModal'
import ClientModal from '../components/projects/ClientModal'

export default function Projects() {
  const { currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState<'projects' | 'tasks' | 'clients'>('projects')
  
  // Data state
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  
  // Modal state
  const [projectModal, setProjectModal] = useState({
    isOpen: false,
    mode: 'create' as 'create' | 'edit',
    project: null as Project | null
  })
  
  const [taskModal, setTaskModal] = useState({
    isOpen: false,
    mode: 'create' as 'create' | 'edit',
    task: null as Task | null
  })
  
  const [clientModal, setClientModal] = useState({
    isOpen: false,
    mode: 'create' as 'create' | 'edit',
    client: null as Client | null
  })

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [projectsData, tasksData, clientsData] = await Promise.all([
        projectService.getProjects(),
        taskService.getTasks(),
        clientService.getClients()
      ])
      
      setProjects(projectsData)
      setTasks(tasksData)
      setClients(clientsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Project handlers
  const handleCreateProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await projectService.createProject(projectData)
      await loadData()
    } catch (error) {
      console.error('Error creating project:', error)
      throw error
    }
  }

  const handleUpdateProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!projectModal.project) return
    
    try {
      await projectService.updateProject(projectModal.project.id, projectData)
      await loadData()
    } catch (error) {
      console.error('Error updating project:', error)
      throw error
    }
  }

  const handleArchiveProject = async (projectId: string) => {
    try {
      await projectService.archiveProject(projectId)
      await loadData()
    } catch (error) {
      console.error('Error archiving project:', error)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await projectService.deleteProject(projectId)
        await loadData()
      } catch (error) {
        console.error('Error deleting project:', error)
      }
    }
  }

  // Task handlers
  const handleCreateTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await taskService.createTask(taskData)
      await loadData()
    } catch (error) {
      console.error('Error creating task:', error)
      throw error
    }
  }

  const handleUpdateTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!taskModal.task) return
    
    try {
      await taskService.updateTask(taskModal.task.id, taskData)
      await loadData()
    } catch (error) {
      console.error('Error updating task:', error)
      throw error
    }
  }

  const handleArchiveTask = async (taskId: string) => {
    try {
      await taskService.archiveTask(taskId)
      await loadData()
    } catch (error) {
      console.error('Error archiving task:', error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      try {
        await taskService.deleteTask(taskId)
        await loadData()
      } catch (error) {
        console.error('Error deleting task:', error)
      }
    }
  }

  // Client handlers
  const handleCreateClient = async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await clientService.createClient(clientData)
      await loadData()
    } catch (error) {
      console.error('Error creating client:', error)
      throw error
    }
  }

  const handleUpdateClient = async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!clientModal.client) return
    
    try {
      await clientService.updateClient(clientModal.client.id, clientData)
      await loadData()
    } catch (error) {
      console.error('Error updating client:', error)
      throw error
    }
  }

  const handleArchiveClient = async (clientId: string) => {
    try {
      await clientService.archiveClient(clientId)
      await loadData()
    } catch (error) {
      console.error('Error archiving client:', error)
    }
  }

  const handleDeleteClient = async (clientId: string) => {
    if (window.confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      try {
        await clientService.deleteClient(clientId)
        await loadData()
      } catch (error) {
        console.error('Error deleting client:', error)
      }
    }
  }

  // Seed database with sample data
  const handleSeedDatabase = async () => {
    try {
      await seedDatabase()
      await loadData()
      alert('Sample data has been added to the database!')
    } catch (error) {
      console.error('Error seeding database:', error)
      alert('Failed to seed database. Please try again.')
    }
  }

  // Calculate project statistics
  const getProjectStats = (projectId: string) => {
    const projectTasks = tasks.filter(task => task.projectId === projectId)
    const projectTimeEntries = [] // This would come from timeEntryService.getTimeEntriesByProject(projectId)
    
    const totalTasks = projectTasks.length
    const billableTasks = projectTasks.filter(task => task.isBillable).length
    
    return { totalTasks, billableTasks }
  }

  // Calculate client statistics
  const getClientStats = (clientName: string) => {
    const clientProjects = projects.filter(project => project.client === clientName)
    const totalProjects = clientProjects.length
    
    return { totalProjects }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Projects & Tasks</h1>
          <p className="text-gray-600 text-lg">Manage your projects, tasks, and clients</p>
        </div>
        
        {currentUser?.role === 'admin' && (
          <div className="flex space-x-4">
            <button
              onClick={() => setProjectModal({ isOpen: true, mode: 'create', project: null })}
              className="btn-primary px-6 py-3"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </button>
            <button
              onClick={() => setTaskModal({ isOpen: true, mode: 'create', task: null })}
              className="btn-secondary px-6 py-3"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </button>
            <button
              onClick={() => setClientModal({ isOpen: true, mode: 'create', client: null })}
              className="btn-secondary px-6 py-3"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Client
            </button>
            <button
              onClick={handleSeedDatabase}
              className="btn-secondary px-6 py-3"
            >
              Seed Data
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 pb-2">
        <nav className="-mb-px flex space-x-12">
          {['projects', 'tasks', 'clients'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-3 px-4 border-b-2 font-medium text-base capitalize transition-colors duration-200 ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="space-y-8 pt-4">
        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => {
              const stats = getProjectStats(project.id)
              return (
                <div key={project.id} className="card p-8 hover:shadow-lg transition-shadow duration-200">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div
                        className="w-5 h-5 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      <h3 className="font-semibold text-gray-900 text-lg">{project.name}</h3>
                    </div>
                    
                    {currentUser?.role === 'admin' && (
                      <div className="relative">
                        <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                          <MoreVertical className="h-5 w-5" />
                        </button>
                        {/* Dropdown menu would go here */}
                      </div>
                    )}
                  </div>
                  
                  {project.description && (
                    <p className="text-gray-600 text-sm mb-6 line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>
                  )}
                  
                  {project.client && (
                    <div className="flex items-center text-sm text-gray-500 mb-6">
                      <Users className="h-4 w-4 mr-3" />
                      <span className="font-medium">{project.client}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                    <span className="font-medium">{stats.totalTasks} tasks</span>
                    <span className="font-medium">{stats.billableTasks} billable</span>
                  </div>
                  
                  {currentUser?.role === 'admin' && (
                    <div className="flex space-x-3 pt-6 border-t border-gray-100">
                      <button
                        onClick={() => setProjectModal({ isOpen: true, mode: 'edit', project })}
                        className="btn-secondary text-xs py-2 px-3 hover:bg-gray-100"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleArchiveProject(project.id)}
                        className="btn-secondary text-xs py-2 px-3 hover:bg-gray-100"
                      >
                        <Archive className="h-3 w-3 mr-1" />
                        Archive
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="btn-danger text-xs py-2 px-3 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Task
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Billable
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Rate
                  </th>
                  {currentUser?.role === 'admin' && (
                    <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tasks.map((task) => {
                  const project = projects.find(p => p.id === task.projectId)
                  return (
                    <tr key={task.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{task.name}</div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="flex items-center">
                          <div
                            className="w-4 h-4 rounded-full mr-3"
                            style={{ backgroundColor: project?.color || '#6B7280' }}
                          />
                          <span className="text-sm font-medium text-gray-900">{project?.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1.5 text-xs font-semibold rounded-full ${
                          task.isBillable 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {task.isBillable ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-sm font-medium text-gray-900">
                        {task.isBillable ? formatCurrency(task.hourlyRate || 0) : '-'}
                      </td>
                      {currentUser?.role === 'admin' && (
                        <td className="px-8 py-5 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-3">
                            <button
                              onClick={() => setTaskModal({ isOpen: true, mode: 'edit', task })}
                              className="text-primary-600 hover:text-primary-900 font-medium hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleArchiveTask(task.id)}
                              className="text-gray-600 hover:text-gray-900 font-medium hover:underline"
                            >
                              Archive
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-red-600 hover:text-red-900 font-medium hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Clients Tab */}
        {activeTab === 'clients' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {clients.map((client) => {
              const stats = getClientStats(client.name)
              return (
                <div key={client.id} className="card p-8 hover:shadow-lg transition-shadow duration-200">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{client.name}</h3>
                        {client.email && (
                          <p className="text-sm text-gray-500 mt-1">{client.email}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {client.phone && (
                    <p className="text-sm text-gray-600 mb-3 font-medium">{client.phone}</p>
                  )}
                  
                  {client.address && (
                    <p className="text-sm text-gray-600 mb-6 line-clamp-2 leading-relaxed">{client.address}</p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                    <span className="font-medium">{stats.totalProjects} projects</span>
                  </div>
                  
                  {currentUser?.role === 'admin' && (
                    <div className="flex space-x-3 pt-6 border-t border-gray-100">
                      <button
                        onClick={() => setClientModal({ isOpen: true, mode: 'edit', client })}
                        className="btn-secondary text-xs py-2 px-3 hover:bg-gray-100"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleArchiveClient(client.id)}
                        className="btn-secondary text-xs py-2 px-3 hover:bg-gray-100"
                      >
                        <Archive className="h-3 w-3 mr-1" />
                        Archive
                      </button>
                      <button
                        onClick={() => handleDeleteClient(client.id)}
                        className="btn-danger text-xs py-2 px-3 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <div className="mt-8">
        <ProjectModal
          isOpen={projectModal.isOpen}
          onClose={() => setProjectModal({ isOpen: false, mode: 'create', project: null })}
          onSave={projectModal.mode === 'create' ? handleCreateProject : handleUpdateProject}
          project={projectModal.project}
          clients={clients}
          mode={projectModal.mode}
        />

        <TaskModal
          isOpen={taskModal.isOpen}
          onClose={() => setTaskModal({ isOpen: false, mode: 'create', task: null })}
          onSave={taskModal.mode === 'create' ? handleCreateTask : handleUpdateTask}
          task={taskModal.task}
          projects={projects}
          mode={taskModal.mode}
        />

        <ClientModal
          isOpen={clientModal.isOpen}
          onClose={() => setClientModal({ isOpen: false, mode: 'create', client: null })}
          onSave={clientModal.mode === 'create' ? handleCreateClient : handleUpdateClient}
          client={clientModal.client}
          mode={clientModal.mode}
        />
      </div>
    </div>
  )
}
