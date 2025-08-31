import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Clock, 
  BarChart3, 
  FolderOpen, 
  Settings, 
  X,
  Plus,
  ChevronDown,
  ChevronRight,
  Users
} from 'lucide-react'
import { mockProjects } from '../data/mockData'
import { useAuth } from '../contexts/AuthContext'

interface SidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export default function Sidebar({ open, setOpen }: SidebarProps) {
  const location = useLocation()
  const { currentUser } = useAuth()
  const [projectsExpanded, setProjectsExpanded] = useState(true)

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Clock },
    { name: 'Time Tracker', href: '/tracker', icon: Clock },
    { name: 'Projects', href: '/projects', icon: FolderOpen },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    // Admin-only navigation items
    ...(currentUser?.role === 'admin' ? [
      { name: 'Admin Dashboard', href: '/admin', icon: Users }
    ] : []),
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-primary-600">Clockistry</h1>
            <button
              onClick={() => setOpen(false)}
              className="lg:hidden p-1 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setOpen(false)}
                  className={`
                    flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive(item.href)
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Projects Section */}
          <div className="px-4 pb-6">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setProjectsExpanded(!projectsExpanded)}
                className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                {projectsExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span>Projects</span>
              </button>
              <button className="p-1 rounded-lg hover:bg-gray-100">
                <Plus className="h-4 w-4 text-gray-600" />
              </button>
            </div>

            {projectsExpanded && (
              <div className="space-y-1">
                {mockProjects.map((project) => (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  >
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="truncate">{project.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
