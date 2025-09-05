import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { ref, set, get } from 'firebase/database'
import { auth, database } from '../config/firebase'
import { AuthUser, LoginCredentials, SignupCredentials } from '../types'

interface AuthContextType {
  currentUser: AuthUser | null
  loading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  signup: (credentials: SignupCredentials) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  async function signup(credentials: SignupCredentials) {
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      )

      const user = userCredential.user

      // Create user profile in Realtime Database
      const userProfile = {
        uid: user.uid,
        name: credentials.name,
        email: credentials.email,
        role: credentials.role,
        timezone: 'America/New_York',
        hourlyRate: credentials.role === 'admin' ? 0 : 25, // Default rates
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await set(ref(database, `users/${user.uid}`), userProfile)

      // Set current user
      setCurrentUser({
        uid: user.uid,
        email: credentials.email,
        role: credentials.role,
        name: credentials.name
      })
    } catch (error) {
      console.error('Error during signup:', error)
      throw error
    }
  }

  async function login(credentials: LoginCredentials) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      )

      const user = userCredential.user

      // Get user profile from database
      const userRef = ref(database, `users/${user.uid}`)
      const snapshot = await get(userRef)

      if (snapshot.exists()) {
        const userData = snapshot.val()
        setCurrentUser({
          uid: user.uid,
          email: userData.email,
          role: userData.role,
          name: userData.name
        })
      } else {
        throw new Error('User profile not found')
      }
    } catch (error) {
      console.error('Error during login:', error)
      throw error
    }
  }

  async function logout() {
    try {
      await signOut(auth)
      setCurrentUser(null)
    } catch (error) {
      console.error('Error during logout:', error)
      throw error
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      if (user) {
        try {
          // Get user profile from database
          const userRef = ref(database, `users/${user.uid}`)
          const snapshot = await get(userRef)

          if (snapshot.exists()) {
            const userData = snapshot.val()
            setCurrentUser({
              uid: user.uid,
              email: userData.email,
              role: userData.role,
              name: userData.name
            })
          }
        } catch (error) {
          console.error('Error fetching user profile:', error)
        }
      } else {
        setCurrentUser(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    loading,
    login,
    signup,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
