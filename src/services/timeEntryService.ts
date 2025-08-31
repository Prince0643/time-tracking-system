import { ref, set, get, push, remove, update, query, orderByChild, equalTo } from 'firebase/database'
import { database } from '../config/firebase'
import { TimeEntry } from '../types'

export const timeEntryService = {
  // Test database connection
  async testConnection(): Promise<boolean> {
    try {
      // Try to read from timeEntries to test permissions
      const timeEntriesRef = ref(database, 'timeEntries')
      await get(timeEntriesRef)
      console.log('✅ Firebase database connection test successful')
      return true
    } catch (error) {
      console.error('❌ Firebase database connection test failed:', error)
      return false
    }
  },
  // Create a new time entry
  async createTimeEntry(timeEntry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    console.log('Creating time entry:', timeEntry)
    
    // Validate required fields
    if (!timeEntry.userId) {
      throw new Error('userId is required')
    }
    if (!timeEntry.description) {
      throw new Error('description is required')
    }
    if (!timeEntry.startTime) {
      throw new Error('startTime is required')
    }
    
    const timeEntryRef = push(ref(database, 'timeEntries'))
    
    // Filter out undefined values and create clean entry for Firebase
    const cleanTimeEntry = Object.fromEntries(
      Object.entries(timeEntry).filter(([_, value]) => value !== undefined)
    )
    
    const newTimeEntry: TimeEntry = {
      ...cleanTimeEntry,
      id: timeEntryRef.key!,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    console.log('New time entry with ID:', newTimeEntry)
    console.log('Database path:', `timeEntries/${timeEntryRef.key}`)
    
    try {
      await set(timeEntryRef, newTimeEntry)
      console.log('Time entry saved successfully with ID:', timeEntryRef.key)
      
      // Verify the entry was saved by reading it back
      const savedEntry = await this.getTimeEntryById(timeEntryRef.key!)
      console.log('Verified saved entry:', savedEntry)
      
      return timeEntryRef.key!
    } catch (error) {
      console.error('Error saving time entry to Firebase:', error)
      throw error
    }
  },

  // Get all time entries for the current user
  async getTimeEntries(userId: string): Promise<TimeEntry[]> {
    try {
      // Try using indexed query first
      const timeEntriesRef = ref(database, 'timeEntries')
      const timeEntriesQuery = query(timeEntriesRef, orderByChild('userId'), equalTo(userId))
      const snapshot = await get(timeEntriesQuery)
      
      if (snapshot.exists()) {
        const timeEntries = snapshot.val()
        return Object.values(timeEntries).map((entry: any) => ({
          ...entry,
          startTime: new Date(entry.startTime),
          endTime: entry.endTime ? new Date(entry.endTime) : undefined,
          createdAt: new Date(entry.createdAt),
          updatedAt: new Date(entry.updatedAt)
        }))
      }
      
      return []
    } catch (error: any) {
      // If indexed query fails, fall back to getting all entries and filtering client-side
      if (error.message.includes('Index not defined')) {
        console.warn('Index not defined, falling back to client-side filtering')
        const timeEntriesRef = ref(database, 'timeEntries')
        const snapshot = await get(timeEntriesRef)
        
        if (snapshot.exists()) {
          const timeEntries = snapshot.val()
          return Object.values(timeEntries)
            .filter((entry: any) => entry.userId === userId)
            .map((entry: any) => ({
              ...entry,
              startTime: new Date(entry.startTime),
              endTime: entry.endTime ? new Date(entry.endTime) : undefined,
              createdAt: new Date(entry.createdAt),
              updatedAt: new Date(entry.updatedAt)
            }))
        }
      }
      
      throw error
    }
  },

  // Get time entry by ID
  async getTimeEntryById(timeEntryId: string): Promise<TimeEntry | null> {
    const timeEntryRef = ref(database, `timeEntries/${timeEntryId}`)
    const snapshot = await get(timeEntryRef)
    
    if (snapshot.exists()) {
      const entry = snapshot.val()
      return {
        ...entry,
        startTime: new Date(entry.startTime),
        endTime: entry.endTime ? new Date(entry.endTime) : undefined,
        createdAt: new Date(entry.createdAt),
        updatedAt: new Date(entry.updatedAt)
      }
    }
    
    return null
  },

  // Update time entry
  async updateTimeEntry(timeEntryId: string, updates: Partial<TimeEntry>): Promise<void> {
    const timeEntryRef = ref(database, `timeEntries/${timeEntryId}`)
    await update(timeEntryRef, {
      ...updates,
      updatedAt: new Date()
    })
  },

  // Delete time entry
  async deleteTimeEntry(timeEntryId: string): Promise<void> {
    const timeEntryRef = ref(database, `timeEntries/${timeEntryId}`)
    await remove(timeEntryRef)
  },

  // Get time entries by project
  async getTimeEntriesByProject(projectId: string, userId: string): Promise<TimeEntry[]> {
    try {
      // Try using indexed query first
      const timeEntriesRef = ref(database, 'timeEntries')
      const timeEntriesQuery = query(
        timeEntriesRef, 
        orderByChild('projectId'), 
        equalTo(projectId)
      )
      const snapshot = await get(timeEntriesQuery)
      
      if (snapshot.exists()) {
        const timeEntries = snapshot.val()
        return Object.values(timeEntries)
          .filter((entry: any) => entry.userId === userId)
          .map((entry: any) => ({
            ...entry,
            startTime: new Date(entry.startTime),
            endTime: entry.endTime ? new Date(entry.endTime) : undefined,
            createdAt: new Date(entry.createdAt),
            updatedAt: new Date(entry.updatedAt)
          }))
      }
      
      return []
    } catch (error: any) {
      // If indexed query fails, fall back to client-side filtering
      if (error.message.includes('Index not defined')) {
        console.warn('Index not defined, falling back to client-side filtering')
        const timeEntriesRef = ref(database, 'timeEntries')
        const snapshot = await get(timeEntriesRef)
        
        if (snapshot.exists()) {
          const timeEntries = snapshot.val()
          return Object.values(timeEntries)
            .filter((entry: any) => entry.userId === userId && entry.projectId === projectId)
            .map((entry: any) => ({
              ...entry,
              startTime: new Date(entry.startTime),
              endTime: entry.endTime ? new Date(entry.endTime) : undefined,
              createdAt: new Date(entry.createdAt),
              updatedAt: new Date(entry.updatedAt)
            }))
        }
      }
      
      throw error
    }
  },

  // Get time entries by date range
  async getTimeEntriesByDateRange(
    startDate: Date, 
    endDate: Date, 
    userId: string
  ): Promise<TimeEntry[]> {
    const timeEntriesRef = ref(database, 'timeEntries')
    const snapshot = await get(timeEntriesRef)
    
    if (snapshot.exists()) {
      const timeEntries = snapshot.val()
      return Object.values(timeEntries)
        .filter((entry: any) => {
          const entryDate = new Date(entry.startTime)
          return entry.userId === userId && 
                 entryDate >= startDate && 
                 entryDate <= endDate
        })
        .map((entry: any) => ({
          ...entry,
          startTime: new Date(entry.startTime),
          endTime: entry.endTime ? new Date(entry.endTime) : undefined,
          createdAt: new Date(entry.createdAt),
          updatedAt: new Date(entry.updatedAt)
        }))
    }
    
    return []
  },

  // Get all time entries (admin only)
  async getAllTimeEntries(): Promise<TimeEntry[]> {
    const timeEntriesRef = ref(database, 'timeEntries')
    const snapshot = await get(timeEntriesRef)
    
    if (snapshot.exists()) {
      const timeEntries = snapshot.val()
      return Object.values(timeEntries).map((entry: any) => {
        // Debug: Log the raw startTime value from Firebase
        console.log(`Raw startTime for entry ${entry.id}:`, {
          value: entry.startTime,
          type: typeof entry.startTime,
          isDate: entry.startTime instanceof Date,
          isInvalidDate: entry.startTime instanceof Date && isNaN(entry.startTime.getTime())
        })
        
        // Try to parse the startTime safely
        let parsedStartTime: Date
        if (entry.startTime instanceof Date) {
          // If it's already a Date object, use it directly
          parsedStartTime = entry.startTime
        } else if (typeof entry.startTime === 'string' || typeof entry.startTime === 'number') {
          // If it's a string or number, try to parse it
          parsedStartTime = new Date(entry.startTime)
        } else {
          // If it's something else, create a fallback date
          console.warn(`Invalid startTime type for entry ${entry.id}:`, entry.startTime)
          parsedStartTime = new Date()
        }
        
        // Validate the parsed date
        if (isNaN(parsedStartTime.getTime())) {
          console.warn(`Invalid startTime value for entry ${entry.id}:`, entry.startTime)
          // Use current date as fallback
          parsedStartTime = new Date()
        }
        
        return {
          ...entry,
          startTime: parsedStartTime,
          endTime: entry.endTime ? new Date(entry.endTime) : undefined,
          createdAt: new Date(entry.createdAt),
          updatedAt: new Date(entry.updatedAt)
        }
      })
    }
    
    return []
  }
}
