import { useState, useEffect } from 'react'
import {
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Search,
  Moon,
  Sun,
  Check,
  CheckCheck,
  Settings
} from 'lucide-react'
import './App.css'

// Custom high-fidelity brand SVGs in Lucide line-art style
const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="-1 -1 18 18"
    {...props}
  >
    {/* Speech bubble outline */}
    <path
      d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
    />
    {/* Solid white phone receiver */}
    <path
      d="M11.609 9.587c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"
      fill="currentColor"
    />
  </svg>
)

const TelegramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </svg>
)

const MessengerIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    fill="currentColor"
    {...props}
  >
    <path d="M0 7.76C0 3.301 3.493 0 8 0s8 3.301 8 7.76-3.493 7.76-8 7.76c-.81 0-1.586-.107-2.316-.307a.64.64 0 0 0-.427.03l-1.588.702a.64.64 0 0 1-.898-.566l-.044-1.423a.64.64 0 0 0-.215-.456C.956 12.108 0 10.092 0 7.76m5.546-1.459-2.35 3.728c-.225.358.214.761.551.506l2.525-1.916a.48.48 0 0 1 .578-.002l1.869 1.402a1.2 1.2 0 0 0 1.735-.32l2.35-3.728c.226-.358-.214-.761-.551-.506L9.728 7.381a.48.48 0 0 1-.578.002L7.281 5.98a1.2 1.2 0 0 0-1.735.32z"/>
  </svg>
)

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
)

const LinkedInIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    fill="currentColor"
    {...props}
  >
    <path d="M4.943 13.394V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.193 2.4 3.901c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.4 5.4 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z"/>
  </svg>
)

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M4 4l16 16M20 4L4 20" />
  </svg>
)

interface ChatItemData {
  id: string;
  name: string;
  avatar: string;
  message: string;
  time: string;
  unreadCount?: number;
  isRead?: boolean;
  isDelivered?: boolean;
  isBlueCheck?: boolean;
  platform: 'whatsapp' | 'telegram' | 'messenger' | 'instagram' | 'linkedin' | 'x';
}

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [selectedChatId, setSelectedChatId] = useState<string>('1')
  const [failedAvatars, setFailedAvatars] = useState<Record<string, boolean>>({})

  // Helper to extract name initials
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  // Toggle document root classes for dark/light themes
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'light') {
      root.classList.add('light')
      root.classList.remove('dark')
    } else {
      root.classList.add('dark')
      root.classList.remove('light')
    }
  }, [theme])

  // Custom data mirroring HOME.png
  const mockChats: ChatItemData[] = [
    {
      id: '1',
      name: 'Alex Supra',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      message: 'what kind of music do you prefer to listen and what app do you use?',
      time: '8:31 PM',
      unreadCount: 99,
      platform: 'whatsapp'
    },
    {
      id: '2',
      name: 'Dibyendu',
      avatar: '',
      message: 'Ki korchis',
      time: '2:38 AM',
      unreadCount: 17,
      platform: 'instagram'
    },
    {
      id: '3',
      name: 'Swastik fr',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      message: 'Game khelbi re? Online iiiiii',
      time: '8:31 PM',
      isRead: true,
      isDelivered: true,
      platform: 'whatsapp'
    },
    {
      id: '4',
      name: 'Wb client',
      avatar: '',
      message: 'This is the work you have to do.',
      time: '10 Apr, 25',
      isRead: true,
      isDelivered: true,
      isBlueCheck: true,
      platform: 'whatsapp'
    },
    {
      id: '5',
      name: 'Lokesh Jaishwal',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a47e?auto=format&fit=crop&w=150&q=80',
      message: 'Hey Mintu, We are very glad that you show interest in our posted role of Web development. We are very glad...',
      time: '9 Apr, 25',
      unreadCount: 1,
      platform: 'linkedin'
    }
  ]

  // Render correct SVG per platform in clean white style
  const getPlatformIcon = (platform: ChatItemData['platform'], className = "channel-badge-icon") => {
    switch (platform) {
      case 'whatsapp':
        return <WhatsAppIcon className={className} />
      case 'telegram':
        return <TelegramIcon className={className} />
      case 'messenger':
        return <MessengerIcon className={className} />
      case 'instagram':
        return <InstagramIcon className={className} />
      case 'linkedin':
        return <LinkedInIcon className={className} />
      case 'x':
        return <XIcon className={className} />
    }
  }

  // Filter messages list
  const filteredChats = mockChats.filter((chat) => {
    const matchesCategory = activeCategory === 'all' || chat.platform === activeCategory
    const matchesSearch =
      chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.message.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Nav arrays
  const navItemsChat = [
    { id: 'all', name: 'All Chats', icon: <MessageSquare className="nav-icon" /> },
    { id: 'whatsapp', name: 'WhatsApp', icon: <WhatsAppIcon className="nav-icon" /> },
    { id: 'telegram', name: 'Telegram', icon: <TelegramIcon className="nav-icon" /> },
    { id: 'messenger', name: 'Messenger', icon: <MessengerIcon className="nav-icon" /> }
  ]

  const navItemsSocial = [
    { id: 'instagram', name: 'Instagram', icon: <InstagramIcon className="nav-icon" /> },
    { id: 'linkedin', name: 'LinkedIn', icon: <LinkedInIcon className="nav-icon" /> },
    { id: 'x', name: 'X', icon: <XIcon className="nav-icon" /> }
  ]

  return (
    <div className={`dashboard-container ${theme}`}>
      
      {/* --- SIDEBAR --- */}
      <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        
        {/* Sidebar Toggle Button */}
        <button
          className="sidebar-toggle-btn"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label="Toggle Sidebar"
        >
          {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Brand/Logo Header */}
        <div className="sidebar-logo">
          <img
            src={isSidebarCollapsed ? '/logo-half.svg' : '/logo-full.svg'}
            alt="Ping Logo"
            className="sidebar-logo-img"
          />
        </div>

        {/* Sidebar Nav Items */}
        <nav className="sidebar-nav">
          
          {/* Chat Category */}
          <div className="nav-section">
            <h3 className="nav-section-title">Chat</h3>
            {navItemsChat.map((item) => (
              <div
                key={item.id}
                className={`nav-item ${activeCategory === item.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(item.id)}
                title={item.name}
              >
                {item.icon}
                <span className="nav-text">{item.name}</span>
              </div>
            ))}
          </div>

          {/* Social DMs Category */}
          <div className="nav-section">
            <h3 className="nav-section-title">Social DMs</h3>
            {navItemsSocial.map((item) => (
              <div
                key={item.id}
                className={`nav-item ${activeCategory === item.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(item.id)}
                title={item.name}
              >
                {item.icon}
                <span className="nav-text">{item.name}</span>
              </div>
            ))}
          </div>
        </nav>

        {/* Mintu Singh profile status bar */}
        <div className="sidebar-profile">
          <div className="profile-info">
            <div className="profile-avatar-wrapper">
              {failedAvatars['profile'] ? (
                <div className="chat-avatar-placeholder" style={{ width: '40px', height: '40px' }}>
                  <span style={{ fontSize: '14px' }}>MS</span>
                </div>
              ) : (
                <img
                  src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80"
                  alt="Mintu Singh"
                  className="profile-avatar"
                  onError={() => setFailedAvatars(prev => ({ ...prev, profile: true }))}
                />
              )}
              <span className="status-dot"></span>
            </div>
            <div className="profile-details">
              <span className="profile-name">Mintu Singh</span>
              <span className="profile-username">@znos_67</span>
            </div>
          </div>
          <button className="profile-settings-btn" title="Settings" aria-label="Settings">
            <Settings size={18} />
          </button>
        </div>

        {/* Light/Dark Mode Switcher */}
        <div className="theme-switch-container">
          <div className="theme-switch-pill">
            <button
              className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => setTheme('dark')}
              title="Dark Mode"
              aria-label="Dark Mode"
            >
              <Moon size={14} />
              <span className="theme-btn-text">Dark Mode</span>
            </button>
            <button
              className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
              onClick={() => setTheme('light')}
              title="Light Mode"
              aria-label="Light Mode"
            >
              <Sun size={14} />
              <span className="theme-btn-text">Light Mode</span>
            </button>
          </div>
        </div>

      </aside>

      {/* --- MAIN PANEL --- */}
      <main className="main-panel">
        
        {/* Search header */}
        <header className="search-header">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search user by name"
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="search-icon" />
          </div>
        </header>

        {/* Recent Chats Row */}
        <section className="recent-chats-section">
          <h2 className="section-title">Recent Chats</h2>
          <div className="recent-chats-list">
            {mockChats.map((chat) => (
              <div
                key={`recent-${chat.id}`}
                className="recent-chat-avatar-wrapper"
                onClick={() => setSelectedChatId(chat.id)}
                title={chat.name}
              >
                {chat.avatar && !failedAvatars[chat.id] ? (
                  <img
                    src={chat.avatar}
                    alt={chat.name}
                    className="recent-chat-avatar"
                    onError={() => setFailedAvatars((prev) => ({ ...prev, [chat.id]: true }))}
                  />
                ) : (
                  <div className="chat-avatar-placeholder">
                    <span>{getInitials(chat.name)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Your Messages Section */}
        <section className="messages-section">
          <h2 className="section-title">Your Messages</h2>
          
          <div className="messages-list-wrapper">
            {filteredChats.length > 0 ? (
              filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`chat-item ${selectedChatId === chat.id ? 'active' : ''}`}
                  onClick={() => setSelectedChatId(chat.id)}
                >
                  
                  {/* Chat Avatar Container with Platform Indicator Badge */}
                  <div className="chat-avatar-container">
                    {chat.avatar && !failedAvatars[chat.id] ? (
                      <img
                        src={chat.avatar}
                        alt={chat.name}
                        className="chat-avatar"
                        onError={() => setFailedAvatars((prev) => ({ ...prev, [chat.id]: true }))}
                      />
                    ) : (
                      <div className="chat-avatar-placeholder">
                        <span>{getInitials(chat.name)}</span>
                      </div>
                    )}
                    <div className={`channel-badge ${chat.platform}`}>
                      {getPlatformIcon(chat.platform)}
                    </div>
                  </div>

                  {/* Message details */}
                  <div className="chat-details">
                    <div className="chat-details-header">
                      <span className="chat-user-name">{chat.name}</span>
                      <span className="chat-time">{chat.time}</span>
                    </div>
                    <div className="chat-details-body">
                      <p className="chat-message-preview">{chat.message}</p>
                      
                      {/* Unread count or Checkmarks */}
                      {chat.unreadCount !== undefined ? (
                        <span className="unread-badge">
                          {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                        </span>
                      ) : chat.isDelivered ? (
                        <CheckCheck className={`read-status-icon ${chat.isBlueCheck ? 'blue' : ''}`} />
                      ) : (
                        <Check className="read-status-icon" />
                      )}
                    </div>
                  </div>

                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No messages found matching your criteria.
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  )
}

export default App
