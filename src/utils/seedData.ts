import { ref, set } from 'firebase/database'
import { database } from '../config/firebase'
import { Tag } from '../types'

// Sample data for testing
const sampleClients = [
  {
    id: 'client-1',
    name: 'Acme Corporation',
    email: 'contact@acme.com',
    phone: '+1 (555) 123-4567',
    address: '123 Business Ave, Suite 100, New York, NY 10001',
    isArchived: false,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: 'client-2',
    name: 'TechStart Inc',
    email: 'hello@techstart.io',
    phone: '+1 (555) 987-6543',
    address: '456 Innovation Blvd, San Francisco, CA 94102',
    isArchived: false,
    createdAt: new Date('2024-01-15').toISOString(),
    updatedAt: new Date('2024-01-15').toISOString()
  },
  {
    id: 'client-3',
    name: 'Global Solutions Ltd',
    email: 'info@globalsolutions.com',
    phone: '+1 (555) 456-7890',
    address: '789 Corporate Plaza, Chicago, IL 60601',
    isArchived: false,
    createdAt: new Date('2024-02-01').toISOString(),
    updatedAt: new Date('2024-02-01').toISOString()
  }
]

const sampleProjects = [
  {
    id: 'project-1',
    name: 'Website Redesign',
    color: '#3B82F6',
    client: 'Acme Corporation',
    description: 'Complete redesign of the company website with modern UI/UX',
    isArchived: false,
    createdAt: new Date('2024-01-05').toISOString(),
    updatedAt: new Date('2024-01-05').toISOString()
  },
  {
    id: 'project-2',
    name: 'Mobile App Development',
    color: '#10B981',
    client: 'TechStart Inc',
    description: 'iOS and Android mobile application for startup platform',
    isArchived: false,
    createdAt: new Date('2024-01-20').toISOString(),
    updatedAt: new Date('2024-01-20').toISOString()
  },
  {
    id: 'project-3',
    name: 'E-commerce Platform',
    color: '#F59E0B',
    client: 'Global Solutions Ltd',
    description: 'Full-stack e-commerce solution with payment integration',
    isArchived: false,
    createdAt: new Date('2024-02-05').toISOString(),
    updatedAt: new Date('2024-02-05').toISOString()
  },
  {
    id: 'project-4',
    name: 'Internal Dashboard',
    color: '#8B5CF6',
    client: 'Acme Corporation',
    description: 'Employee management and analytics dashboard',
    isArchived: false,
    createdAt: new Date('2024-02-10').toISOString(),
    updatedAt: new Date('2024-02-10').toISOString()
  }
]

const sampleTasks = [
  {
    id: 'task-1',
    name: 'Design Homepage',
    projectId: 'project-1',
    isBillable: true,
    hourlyRate: 75,
    isArchived: false,
    createdAt: new Date('2024-01-05').toISOString(),
    updatedAt: new Date('2024-01-05').toISOString()
  },
  {
    id: 'task-2',
    name: 'Implement Navigation',
    projectId: 'project-1',
    isBillable: true,
    hourlyRate: 65,
    isArchived: false,
    createdAt: new Date('2024-01-06').toISOString(),
    updatedAt: new Date('2024-01-06').toISOString()
  },
  {
    id: 'task-3',
    name: 'User Authentication',
    projectId: 'project-2',
    isBillable: true,
    hourlyRate: 80,
    isArchived: false,
    createdAt: new Date('2024-01-20').toISOString(),
    updatedAt: new Date('2024-01-20').toISOString()
  },
  {
    id: 'task-4',
    name: 'API Development',
    projectId: 'project-2',
    isBillable: true,
    hourlyRate: 85,
    isArchived: false,
    createdAt: new Date('2024-01-21').toISOString(),
    updatedAt: new Date('2024-01-21').toISOString()
  },
  {
    id: 'task-5',
    name: 'Database Schema',
    projectId: 'project-3',
    isBillable: true,
    hourlyRate: 90,
    isArchived: false,
    createdAt: new Date('2024-02-05').toISOString(),
    updatedAt: new Date('2024-02-05').toISOString()
  },
  {
    id: 'task-6',
    name: 'Payment Integration',
    projectId: 'project-3',
    isBillable: true,
    hourlyRate: 95,
    isArchived: false,
    createdAt: new Date('2024-02-06').toISOString(),
    updatedAt: new Date('2024-02-06').toISOString()
  },
  {
    id: 'task-7',
    name: 'Requirements Gathering',
    projectId: 'project-4',
    isBillable: false,
    isArchived: false,
    createdAt: new Date('2024-02-10').toISOString(),
    updatedAt: new Date('2024-02-10').toISOString()
  },
  {
    id: 'task-8',
    name: 'UI Components',
    projectId: 'project-4',
    isBillable: true,
    hourlyRate: 70,
    isArchived: false,
    createdAt: new Date('2024-02-11').toISOString(),
    updatedAt: new Date('2024-02-11').toISOString()
  }
]

const sampleTags: Tag[] = [
  {
    id: 'tag-1',
    name: 'Design',
    color: '#3B82F6',
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'tag-2',
    name: 'Development',
    color: '#10B981',
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'tag-3',
    name: 'Research',
    color: '#F59E0B',
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'tag-4',
    name: 'Meeting',
    color: '#8B5CF6',
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'tag-5',
    name: 'Bug Fix',
    color: '#EF4444',
    createdAt: new Date('2024-01-01')
  }
]

export const seedDatabase = async () => {
  try {
    console.log('Seeding database with sample data...')
    
    // Seed clients
    for (const client of sampleClients) {
      await set(ref(database, `clients/${client.id}`), client)
    }
    console.log('✅ Clients seeded')
    
    // Seed projects
    for (const project of sampleProjects) {
      await set(ref(database, `projects/${project.id}`), project)
    }
    console.log('✅ Projects seeded')
    
    // Seed tasks
    for (const task of sampleTasks) {
      await set(ref(database, `tasks/${task.id}`), task)
    }
    console.log('✅ Tasks seeded')
    
    // Seed tags
    for (const tag of sampleTags) {
      await set(ref(database, `tags/${tag.id}`), tag)
    }
    console.log('✅ Tags seeded')
    
    console.log('🎉 Database seeding completed successfully!')
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  }
}

// Function to clear all sample data
export const clearSampleData = async () => {
  try {
    console.log('Clearing sample data...')
    
    // Clear clients
    for (const client of sampleClients) {
      await set(ref(database, `clients/${client.id}`), null)
    }
    
    // Clear projects
    for (const project of sampleProjects) {
      await set(ref(database, `projects/${project.id}`), null)
    }
    
    // Clear tasks
    for (const task of sampleTasks) {
      await set(ref(database, `tasks/${task.id}`), null)
    }
    
    // Clear tags
    for (const tag of sampleTags) {
      await set(ref(database, `tags/${tag.id}`), null)
    }
    
    console.log('✅ Sample data cleared')
  } catch (error) {
    console.error('❌ Error clearing sample data:', error)
    throw error
  }
}

// Export sample data for reference
export { sampleClients, sampleProjects, sampleTasks, sampleTags }
