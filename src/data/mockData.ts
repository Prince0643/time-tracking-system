import { Project, Task, TimeEntry, Client, Tag, User } from '../types'

export const mockUser: User = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  timezone: 'America/New_York',
  hourlyRate: 75,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

export const mockClients: Client[] = [
  {
    id: '1',
    name: 'Acme Corp',
    email: 'contact@acme.com',
    isArchived: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'TechStart Inc',
    email: 'hello@techstart.com',
    isArchived: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '3',
    name: 'Design Studio',
    email: 'info@designstudio.com',
    isArchived: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
]

export const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Website Redesign',
    color: '#3B82F6',
    client: 'Acme Corp',
    description: 'Complete redesign of the company website',
    isArchived: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Mobile App Development',
    color: '#10B981',
    client: 'TechStart Inc',
    description: 'iOS and Android app for the startup',
    isArchived: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '3',
    name: 'Brand Identity',
    color: '#F59E0B',
    client: 'Design Studio',
    description: 'Logo design and brand guidelines',
    isArchived: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '4',
    name: 'E-commerce Platform',
    color: '#8B5CF6',
    client: 'Acme Corp',
    description: 'Online store development',
    isArchived: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
]

export const mockTasks: Task[] = [
  {
    id: '1',
    name: 'UI/UX Design',
    projectId: '1',
    isBillable: true,
    hourlyRate: 75,
    isArchived: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Frontend Development',
    projectId: '1',
    isBillable: true,
    hourlyRate: 75,
    isArchived: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '3',
    name: 'Backend API',
    projectId: '2',
    isBillable: true,
    hourlyRate: 75,
    isArchived: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '4',
    name: 'Logo Design',
    projectId: '3',
    isBillable: true,
    hourlyRate: 75,
    isArchived: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
]

export const mockTags: Tag[] = [
  {
    id: '1',
    name: 'Design',
    color: '#3B82F6',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Development',
    color: '#10B981',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '3',
    name: 'Research',
    color: '#F59E0B',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '4',
    name: 'Meeting',
    color: '#8B5CF6',
    createdAt: new Date('2024-01-01'),
  },
]

export const mockTimeEntries: TimeEntry[] = [
  {
    id: '1',
    description: 'Initial design concepts and wireframes',
    projectId: '1',
    taskId: '1',
    startTime: new Date('2024-01-15T09:00:00'),
    endTime: new Date('2024-01-15T12:00:00'),
    duration: 10800, // 3 hours
    isBillable: true,
    tags: ['1', '3'],
    createdAt: new Date('2024-01-15T09:00:00'),
    updatedAt: new Date('2024-01-15T12:00:00'),
  },
  {
    id: '2',
    description: 'Frontend implementation of homepage',
    projectId: '1',
    taskId: '2',
    startTime: new Date('2024-01-15T13:00:00'),
    endTime: new Date('2024-01-15T17:00:00'),
    duration: 14400, // 4 hours
    isBillable: true,
    tags: ['2'],
    createdAt: new Date('2024-01-15T13:00:00'),
    updatedAt: new Date('2024-01-15T17:00:00'),
  },
  {
    id: '3',
    description: 'Client meeting to discuss requirements',
    projectId: '2',
    taskId: '3',
    startTime: new Date('2024-01-16T10:00:00'),
    endTime: new Date('2024-01-16T11:00:00'),
    duration: 3600, // 1 hour
    isBillable: true,
    tags: ['4'],
    createdAt: new Date('2024-01-16T10:00:00'),
    updatedAt: new Date('2024-01-16T11:00:00'),
  },
  {
    id: '4',
    description: 'Logo design iterations',
    projectId: '3',
    taskId: '4',
    startTime: new Date('2024-01-16T14:00:00'),
    endTime: new Date('2024-01-16T18:00:00'),
    duration: 14400, // 4 hours
    isBillable: true,
    tags: ['1'],
    createdAt: new Date('2024-01-16T14:00:00'),
    updatedAt: new Date('2024-01-16T18:00:00'),
  },
]
