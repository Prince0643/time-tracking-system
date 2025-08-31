import { ref, get, set, update, remove, push } from 'firebase/database'
import { database } from '../config/firebase'
import { User, UserRole } from '../types'

export const userService = {
  // Get all users (admin only)
  async getAllUsers(): Promise<User[]> {
    const usersRef = ref(database, 'users')
    const snapshot = await get(usersRef)
    
    if (snapshot.exists()) {
      const users = snapshot.val()
      return Object.entries(users).map(([userId, user]: [string, any]) => ({
        ...user,
        id: userId, // Include the Firebase document key as the user ID
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt)
      }))
    }
    
    return []
  },

  // Get user by ID
  async getUserById(userId: string): Promise<User | null> {
    const userRef = ref(database, `users/${userId}`)
    const snapshot = await get(userRef)
    
    if (snapshot.exists()) {
      const user = snapshot.val()
      return {
        ...user,
        id: userId, // Include the user ID
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt)
      }
    }
    
    return null
  },

  // Create new user
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const userRef = push(ref(database, 'users'))
    
    const newUser: User = {
      ...userData,
      id: userRef.key!,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    await set(userRef, newUser)
    return userRef.key!
  },

  // Update user
  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    const userRef = ref(database, `users/${userId}`)
    await update(userRef, {
      ...updates,
      updatedAt: new Date()
    })
  },

  // Delete user
  async deleteUser(userId: string): Promise<void> {
    const userRef = ref(database, `users/${userId}`)
    await remove(userRef)
  },

  // Get users by role
  async getUsersByRole(role: UserRole): Promise<User[]> {
    const users = await this.getAllUsers()
    return users.filter(user => user.role === role)
  },

  // Get active users
  async getActiveUsers(): Promise<User[]> {
    const users = await this.getAllUsers()
    return users.filter(user => user.isActive)
  },

  // Update user status
  async updateUserStatus(userId: string, isActive: boolean): Promise<void> {
    await this.updateUser(userId, { isActive })
  },

  // Update user role
  async updateUserRole(userId: string, role: UserRole): Promise<void> {
    await this.updateUser(userId, { role })
  }
}
