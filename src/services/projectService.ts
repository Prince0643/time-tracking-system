import { ref, set, get, push, remove, update, query, orderByChild, equalTo } from 'firebase/database'
import { database } from '../config/firebase'
import { Project, Task, Client, UserRole } from '../types'

// Project operations
export const projectService = {
  // Create a new project
  async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const projectRef = push(ref(database, 'projects'))
    const newProject: Project = {
      ...project,
      id: projectRef.key!,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    await set(projectRef, newProject)
    return projectRef.key!
  },

  // Get all projects
  async getProjects(): Promise<Project[]> {
    const projectsRef = ref(database, 'projects')
    const snapshot = await get(projectsRef)
    
    if (snapshot.exists()) {
      const projects = snapshot.val()
      return Object.values(projects).filter((project: any) => !project.isArchived)
    }
    
    return []
  },

  // Get project by ID
  async getProjectById(projectId: string): Promise<Project | null> {
    const projectRef = ref(database, `projects/${projectId}`)
    const snapshot = await get(projectRef)
    
    if (snapshot.exists()) {
      return snapshot.val()
    }
    
    return null
  },

  // Update project
  async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
    const projectRef = ref(database, `projects/${projectId}`)
    await update(projectRef, {
      ...updates,
      updatedAt: new Date()
    })
  },

  // Archive project
  async archiveProject(projectId: string): Promise<void> {
    await this.updateProject(projectId, { isArchived: true })
  },

  // Delete project
  async deleteProject(projectId: string): Promise<void> {
    const projectRef = ref(database, `projects/${projectId}`)
    await remove(projectRef)
  }
}

// Task operations
export const taskService = {
  // Create a new task
  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const taskRef = push(ref(database, 'tasks'))
    const newTask: Task = {
      ...task,
      id: taskRef.key!,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    await set(taskRef, newTask)
    return taskRef.key!
  },

  // Get all tasks
  async getTasks(): Promise<Task[]> {
    const tasksRef = ref(database, 'tasks')
    const snapshot = await get(tasksRef)
    
    if (snapshot.exists()) {
      const tasks = snapshot.val()
      return Object.values(tasks).filter((task: any) => !task.isArchived)
    }
    
    return []
  },

  // Get tasks by project
  async getTasksByProject(projectId: string): Promise<Task[]> {
    const tasksRef = ref(database, 'tasks')
    const tasksQuery = query(tasksRef, orderByChild('projectId'), equalTo(projectId))
    const snapshot = await get(tasksQuery)
    
    if (snapshot.exists()) {
      const tasks = snapshot.val()
      return Object.values(tasks).filter((task: any) => !task.isArchived)
    }
    
    return []
  },

  // Update task
  async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    const taskRef = ref(database, `tasks/${taskId}`)
    await update(taskRef, {
      ...updates,
      updatedAt: new Date()
    })
  },

  // Archive task
  async archiveTask(taskId: string): Promise<void> {
    await this.updateTask(taskId, { isArchived: true })
  },

  // Delete task
  async deleteTask(taskId: string): Promise<void> {
    const taskRef = ref(database, `tasks/${taskId}`)
    await remove(taskRef)
  }
}

// Client operations
export const clientService = {
  // Create a new client
  async createClient(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const clientRef = push(ref(database, 'clients'))
    const newClient: Client = {
      ...client,
      id: clientRef.key!,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    await set(clientRef, newClient)
    return clientRef.key!
  },

  // Get all clients
  async getClients(): Promise<Client[]> {
    const clientsRef = ref(database, 'clients')
    const snapshot = await get(clientsRef)
    
    if (snapshot.exists()) {
      const clients = snapshot.val()
      return Object.values(clients).filter((client: any) => !client.isArchived)
    }
    
    return []
  },

  // Update client
  async updateClient(clientId: string, updates: Partial<Client>): Promise<void> {
    const clientRef = ref(database, `clients/${clientId}`)
    await update(clientRef, {
      ...updates,
      updatedAt: new Date()
    })
  },

  // Archive client
  async archiveClient(clientId: string): Promise<void> {
    await this.updateClient(clientId, { isArchived: true })
  },

  // Delete client
  async deleteClient(clientId: string): Promise<void> {
    const clientRef = ref(database, `clients/${clientId}`)
    await remove(clientRef)
  }
}

// Time entry operations for project statistics
export const timeEntryService = {
  // Get time entries by project
  async getTimeEntriesByProject(projectId: string): Promise<any[]> {
    const timeEntriesRef = ref(database, 'timeEntries')
    const timeEntriesQuery = query(timeEntriesRef, orderByChild('projectId'), equalTo(projectId))
    const snapshot = await get(timeEntriesQuery)
    
    if (snapshot.exists()) {
      const timeEntries = snapshot.val()
      return Object.values(timeEntries)
    }
    
    return []
  },

  // Get time entries by client (through projects)
  async getTimeEntriesByClient(clientName: string): Promise<any[]> {
    const projectsRef = ref(database, 'projects')
    const projectsQuery = query(projectsRef, orderByChild('client'), equalTo(clientName))
    const projectsSnapshot = await get(projectsQuery)
    
    if (!projectsSnapshot.exists()) {
      return []
    }

    const projects = projectsSnapshot.val()
    const projectIds = Object.keys(projects)
    
    let allTimeEntries: any[] = []
    
    for (const projectId of projectIds) {
      const projectTimeEntries = await this.getTimeEntriesByProject(projectId)
      allTimeEntries = [...allTimeEntries, ...projectTimeEntries]
    }
    
    return allTimeEntries
  }
}
