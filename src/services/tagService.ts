import { ref, set, get, push, remove, update } from 'firebase/database'
import { database } from '../config/firebase'
import { Tag } from '../types'

export const tagService = {
  // Create a new tag
  async createTag(tag: Omit<Tag, 'id' | 'createdAt'>): Promise<string> {
    const tagRef = push(ref(database, 'tags'))
    const newTag: Tag = {
      ...tag,
      id: tagRef.key!,
      createdAt: new Date()
    }
    
    await set(tagRef, newTag)
    return tagRef.key!
  },

  // Get all tags
  async getTags(): Promise<Tag[]> {
    const tagsRef = ref(database, 'tags')
    const snapshot = await get(tagsRef)
    
    if (snapshot.exists()) {
      const tags = snapshot.val()
      return Object.values(tags).map((tag: any) => ({
        ...tag,
        createdAt: new Date(tag.createdAt)
      }))
    }
    
    return []
  },

  // Get tag by ID
  async getTagById(tagId: string): Promise<Tag | null> {
    const tagRef = ref(database, `tags/${tagId}`)
    const snapshot = await get(tagRef)
    
    if (snapshot.exists()) {
      const tag = snapshot.val()
      return {
        ...tag,
        createdAt: new Date(tag.createdAt)
      }
    }
    
    return null
  },

  // Update tag
  async updateTag(tagId: string, updates: Partial<Tag>): Promise<void> {
    const tagRef = ref(database, `tags/${tagId}`)
    await update(tagRef, updates)
  },

  // Delete tag
  async deleteTag(tagId: string): Promise<void> {
    const tagRef = ref(database, `tags/${tagId}`)
    await remove(tagRef)
  }
}
