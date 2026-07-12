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
  LogOut,
  Mail,
  Lock,
  User,
  Globe,
  QrCode,
  KeyRound,
  Settings
} from 'lucide-react'
import { generateDpopKey, saveKeysToDb, getKeysFromDb, clearKeysFromDb } from './utils/crypto'
import { fetchWithDpop } from './utils/api'
import config from './config'
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
  timestamp?: number;
  isOnline?: boolean;
  lastSeen?: string;
}

// Custom data mirroring HOME.png (defined as module level constants with timestamps)
const mockChats: ChatItemData[] = [
  {
    id: '1',
    name: 'Alex Supra',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    message: 'what kind of music do you prefer to listen and what app do you use?',
    time: '8:31 PM',
    unreadCount: 99,
    platform: 'whatsapp',
    timestamp: Math.floor(Date.now() / 1000 - 3600)
  },
  {
    id: '2',
    name: 'Dibyendu',
    avatar: '',
    message: 'Ki korchis',
    time: '2:38 AM',
    unreadCount: 17,
    platform: 'instagram',
    timestamp: Math.floor(Date.now() / 1000 - 3600 * 5)
  },
  {
    id: '3',
    name: 'Swastik fr',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    message: 'Game khelbi re? Online iiiiii',
    time: '8:31 PM',
    isRead: true,
    isDelivered: true,
    platform: 'whatsapp',
    timestamp: Math.floor(Date.now() / 1000 - 3600 * 12)
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
    platform: 'whatsapp',
    timestamp: Math.floor(Date.now() / 1000 - 3600 * 24)
  },
  {
    id: '5',
    name: 'Lokesh Jaishwal',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a47e?auto=format&fit=crop&w=150&q=80',
    message: 'Hey Mintu, We are very glad that you show interest in our posted role of Web development. We are very glad...',
    time: '9 Apr, 25',
    unreadCount: 1,
    platform: 'linkedin',
    timestamp: Math.floor(Date.now() / 1000 - 3600 * 48)
  }
]

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [selectedChatId, setSelectedChatId] = useState<string>('1')
  const [failedAvatars, setFailedAvatars] = useState<Record<string, boolean>>({})

  interface UserProfile {
    id: string;
    name: string;
    username: string;
    email: string;
    avatar?: string;
    integrations?: {
      whatsapp?: { connected: boolean; phoneNumber?: string; pushName?: string };
      telegram?: { connected: boolean; phoneNumber?: string; username?: string };
      linkedin?: { connected: boolean; name?: string; email?: string };
      gmail?: { connected: boolean; email?: string; name?: string };
    };
  }

  // --- AUTH STATES ---
  const [user, setUser] = useState<UserProfile | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [authScreen, setAuthScreen] = useState<'login' | 'register' | 'otp'>('login')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [simulatedOtp, setSimulatedOtp] = useState<string | null>(null)
  const [authEmail, setAuthEmail] = useState('')
  const [showConnectionPageOverride, setShowConnectionPageOverride] = useState(false)

  // --- WHATSAPP CONNECTION STATES ---
  const [currentTab, setCurrentTab] = useState<'chats' | 'settings'>('chats')
  const [activePlatformView, setActivePlatformView] = useState<'whatsapp' | null>(null)
  const [whatsappOption, setWhatsappOption] = useState<'qr-direct' | 'qr-companion' | 'pair-direct' | 'pair-voip' | null>(null)
  const [whatsappQr, setWhatsappQr] = useState<string | null>(null)
  const [whatsappPairCode, setWhatsappPairCode] = useState<string | null>(null)
  const [whatsappLoading, setWhatsappLoading] = useState(false)
  const [whatsappPhoneNumber, setWhatsappPhoneNumber] = useState('')
  const [whatsappError, setWhatsappError] = useState('')

  // Form Inputs
  const [regName, setRegName] = useState('')
  const [regUsername, setRegUsername] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')

  const [loginId, setLoginId] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  const [otpCode, setOtpCode] = useState('')
  
  const CHATS_CACHE_KEY = 'ping_chats_cache'

  const [chats, setChats] = useState<ChatItemData[]>(() => {
    try {
      const cached = localStorage.getItem(CHATS_CACHE_KEY)
      if (cached) return JSON.parse(cached) as ChatItemData[]
    } catch {
      // Corrupted cache — ignore
    }
    return mockChats
  })

  // Fetch real WhatsApp chats from backend
  const fetchRealChats = async () => {
    try {
      const activeToken = localStorage.getItem('ping_token')
      if (!activeToken) return

      const res = await fetchWithDpop('/whatsapp/chat')
      if (!res.ok) {
        console.warn('[chats] API responded with', res.status, res.statusText)
        return
      }
      const data = await res.json()
      if (data.success && data.chats) {
        const realChats: ChatItemData[] = data.chats.map((c: any) => {
          let timeDisplay = ''
          if (c.lastMessage && c.lastMessage.timestamp) {
            const date = new Date(c.lastMessage.timestamp * 1000)
            timeDisplay = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          } else if (c.timestamp) {
            const date = new Date(c.timestamp * 1000)
            timeDisplay = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }

          const msgTimestamp = c.lastMessage?.timestamp || c.timestamp || 0

          let contactLastSeen = undefined
          if (c.lastSeen) {
            const lastSeenDate = new Date(c.lastSeen * 1000)
            contactLastSeen = lastSeenDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }

          return {
            id: c.id,
            name: c.name || c.id.split('@')[0],
            avatar: c.avatar || '',
            message: c.lastMessage ? c.lastMessage.body : 'No messages yet',
            time: timeDisplay,
            unreadCount: c.unreadCount || 0,
            platform: 'whatsapp',
            isRead: c.unreadCount === 0,
            isDelivered: true,
            timestamp: msgTimestamp,
            isOnline: c.isOnline || false,
            lastSeen: contactLastSeen
          }
        })

        const nonWhatsappMock = mockChats.filter(mc => mc.platform !== 'whatsapp')
        const combined = [...realChats, ...nonWhatsappMock]

        combined.sort((a, b) => {
          const timeA = a.timestamp || 0
          const timeB = b.timestamp || 0
          return timeB - timeA
        })

        setChats(combined)
        try {
          localStorage.setItem(CHATS_CACHE_KEY, JSON.stringify(combined))
        } catch {
          // Quota exceeded — skip caching
        }
      }
    } catch (e) {
      console.error('Failed to fetch real WhatsApp chats:', e)
    }
  }

  // Poll chats if WhatsApp connected
  useEffect(() => {
    if (user?.integrations?.whatsapp?.connected && token) {
      fetchRealChats()
      const interval = setInterval(fetchRealChats, 10000)
      return () => clearInterval(interval)
    } else {
      // Restore cached chats if available, else fall back to mocks
      try {
        const cached = localStorage.getItem(CHATS_CACHE_KEY)
        if (cached) {
          setChats(JSON.parse(cached) as ChatItemData[])
        } else {
          setChats(mockChats)
        }
      } catch {
        setChats(mockChats)
      }
    }
  }, [user?.integrations?.whatsapp?.connected, token])

  // Keep user.integrations.whatsapp.connected fresh so the chats poller
  // reacts immediately after reconnection or backend restart
  useEffect(() => {
    if (!token) return
    const profileInterval = setInterval(() => {
      fetchUserProfile(token)
    }, 15000)
    return () => clearInterval(profileInterval)
  }, [token])

  // Sync user profile background details to check integration status
  const fetchUserProfile = async (authToken: string) => {
    try {
      const res = await fetchWithDpop('/ping/auth/me', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      const data = await res.json()
      if (data.success) {
        localStorage.setItem('ping_user', JSON.stringify(data.user))
        setUser(data.user)

        // Clear setup wizard sub-views if connected
        const hasConnected =
          data.user?.integrations?.whatsapp?.connected ||
          data.user?.integrations?.telegram?.connected ||
          data.user?.integrations?.linkedin?.connected ||
          data.user?.integrations?.gmail?.connected;

        if (hasConnected) {
          setActivePlatformView(null);
          setWhatsappOption(null);
          setWhatsappQr(null);
          setWhatsappPairCode(null);
          setWhatsappPhoneNumber('');
        }
      } else {
        localStorage.removeItem('ping_token')
        localStorage.removeItem('ping_user')
        setUser(null)
        setToken(null)
      }
    } catch (e) {
      console.error('Failed to fetch user profile:', e)
      localStorage.removeItem('ping_token')
      localStorage.removeItem('ping_user')
      setUser(null)
      setToken(null)
    }
  }

  // Auto-restore session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('ping_token')
    const storedUser = localStorage.getItem('ping_user')
    if (storedToken && storedUser) {
      setToken(storedToken)
      try {
        setUser(JSON.parse(storedUser))
        fetchUserProfile(storedToken)
      } catch (e) {
        localStorage.removeItem('ping_token')
        localStorage.removeItem('ping_user')
      }
    }
  }, [])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!regName || !regUsername || !regEmail || !regPassword) {
      setAuthError('All fields are required.')
      return
    }
    setAuthLoading(true)
    setAuthError('')
    setSimulatedOtp(null)
    try {
      const res = await fetch(`${config.apiBaseUrl}/ping/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          username: regUsername,
          email: regEmail,
          password: regPassword
        }),
        credentials: 'include'
      })
      const data = await res.json()
      if (!data.success) {
        setAuthError(data.message || 'Registration failed.')
        return
      }
      setAuthEmail(regEmail)
      setAuthScreen('otp')
      if (data.otp) {
        setSimulatedOtp(data.otp)
      }
    } catch (err) {
      setAuthError('Connection error. Is backend server running?')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginId || !loginPassword) {
      setAuthError('Credentials are required.')
      return
    }
    setAuthLoading(true)
    setAuthError('')
    setSimulatedOtp(null)
    try {
      const keys = await generateDpopKey()
      await saveKeysToDb(keys.privateKey, keys.publicKeyJwk)

      const res = await fetch(`${config.apiBaseUrl}/ping/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginId,
          password: loginPassword,
          clientPublicKey: keys.publicKeyJwk
        }),
        credentials: 'include'
      })
      const data = await res.json()

      if (res.status === 403 && data.pendingVerification) {
        setAuthEmail(data.email || loginId)
        setAuthScreen('otp')
        if (data.otp) {
          setSimulatedOtp(data.otp)
        }
        return
      }

      if (!data.success) {
        setAuthError(data.message || 'Invalid credentials.')
        return
      }

      localStorage.setItem('ping_token', data.token)
      setToken(data.token)
      await fetchUserProfile(data.token)
    } catch (err) {
      setAuthError('Connection error. Is backend server running?')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otpCode) {
      setAuthError('OTP code is required.')
      return
    }
    setAuthLoading(true)
    setAuthError('')
    try {
      let keys = await getKeysFromDb()
      if (!keys) {
        keys = await generateDpopKey()
        await saveKeysToDb(keys.privateKey, keys.publicKeyJwk)
      }

      const res = await fetch(`${config.apiBaseUrl}/ping/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmail,
          otp: otpCode,
          clientPublicKey: keys.publicKeyJwk
        }),
        credentials: 'include'
      })
      const data = await res.json()
      if (!data.success) {
        setAuthError(data.message || 'OTP verification failed.')
        return
      }

      localStorage.setItem('ping_token', data.token)
      setToken(data.token)
      await fetchUserProfile(data.token)
      setOtpCode('')
    } catch (err) {
      setAuthError('Connection error during verification.')
    } finally {
      setAuthLoading(false)
    }
  }

  // --- WhatsApp Connection Action Handlers ---
  const handleFetchWhatsAppQr = async () => {
    setWhatsappLoading(true)
    setWhatsappError('')
    setWhatsappQr(null)
    try {
      const res = await fetchWithDpop('/whatsapp/auth/login/whatsapp/qr')
      const data = await res.json()
      if (data.success) {
        if (data.qr) {
          setWhatsappQr(data.qr)
        } else if (data.authenticated) {
          // Already connected! Fetch latest profile.
          if (token) await fetchUserProfile(token);
        }
      } else {
        setWhatsappError(data.message || 'Failed to fetch WhatsApp QR code.')
      }
    } catch (err) {
      setWhatsappError('Failed to communicate with WhatsApp service.')
    } finally {
      setWhatsappLoading(false)
    }
  }

  const handleGenerateWhatsAppPairCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!whatsappPhoneNumber) {
      setWhatsappError('Phone number is required.')
      return
    }
    setWhatsappLoading(true)
    setWhatsappError('')
    setWhatsappPairCode(null)
    try {
      const res = await fetchWithDpop('/whatsapp/auth/login/whatsapp/pair-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: whatsappPhoneNumber })
      })
      const data = await res.json()
      if (data.success && data.pairingCode) {
        setWhatsappPairCode(data.pairingCode)
      } else {
        setWhatsappError(data.message || 'Failed to generate pairing code. Check country code.')
      }
    } catch (err) {
      setWhatsappError('Failed to communicate with WhatsApp service.')
    } finally {
      setWhatsappLoading(false)
    }
  }

  // Poll user profile background state during active WhatsApp pairing to auto-detect connection
  useEffect(() => {
    if (activePlatformView !== 'whatsapp') return
    const interval = setInterval(() => {
      const activeToken = localStorage.getItem('ping_token')
      if (activeToken) {
        fetchUserProfile(activeToken)
      }
    }, 4000)
    return () => clearInterval(interval)
  }, [activePlatformView])

  // Poll WhatsApp QR code every 6 seconds when the direct QR view is active
  useEffect(() => {
    if (activePlatformView !== 'whatsapp' || whatsappOption !== 'qr-direct') return
    
    // Initial fetch
    handleFetchWhatsAppQr()

    const interval = setInterval(() => {
      handleFetchWhatsAppQr()
    }, 6000)

    return () => clearInterval(interval)
  }, [activePlatformView, whatsappOption])

  const handleLogout = async () => {
    try {
      await fetchWithDpop('/ping/auth/logout', { method: 'POST' })
    } catch (err) {
      console.error('Logout request failed:', err)
    } finally {
      localStorage.removeItem('ping_token')
      localStorage.removeItem('ping_user')
      await clearKeysFromDb()
      setToken(null)
      setUser(null)
      setAuthScreen('login')
      setLoginId('')
      setLoginPassword('')
      setRegName('')
      setRegUsername('')
      setRegEmail('')
      setRegPassword('')
      setSimulatedOtp(null)
      setAuthError('')
    }
  }

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

  // Render correct SVG per platform in clean white style

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
  const filteredChats = chats.filter((chat) => {
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

  if (!user || !token) {
    return (
      <div className={`auth-container ${theme}`}>
        <div className="auth-background">
          <div className="auth-glow-sphere sphere-1"></div>
          <div className="auth-glow-sphere sphere-2"></div>
        </div>

        {simulatedOtp && (
          <div className="simulated-otp-banner">
            <div className="simulated-otp-content">
              <strong>Simulated Email Verification OTP:</strong>
              <span className="otp-badge">{simulatedOtp}</span>
            </div>
            <button className="close-banner-btn" onClick={() => setSimulatedOtp(null)}>×</button>
          </div>
        )}

        <div className="auth-card">
          <div className="auth-logo-header">
            <img src="/logo-full.svg" alt="Ping Logo" className="auth-logo" />
            <p className="auth-subtitle">Secure, End-to-End Encrypted Messaging</p>
          </div>

          {authError && <div className="auth-error-box">{authError}</div>}

          {authScreen === 'login' && (
            <form onSubmit={handleLogin} className="auth-form">
              <h2 className="auth-title">Welcome Back</h2>
              <p className="auth-desc">Enter your credentials to access your secure keys.</p>

              <div className="input-group">
                <label htmlFor="loginId">Email or Username</label>
                <div className="input-wrapper">
                  <Mail className="input-icon" size={16} />
                  <input
                    type="text"
                    id="loginId"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="name@example.com or username"
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="loginPassword">Password</label>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={16} />
                  <input
                    type="password"
                    id="loginPassword"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={authLoading}>
                {authLoading ? 'Signing in securely...' : 'Sign In'}
              </button>

              <p className="auth-switch-text">
                Don't have an account?{' '}
                <button type="button" className="auth-switch-btn" onClick={() => { setAuthScreen('register'); setAuthError(''); setSimulatedOtp(null); }}>
                  Create Account
                </button>
              </p>
            </form>
          )}

          {authScreen === 'register' && (
            <form onSubmit={handleRegister} className="auth-form">
              <h2 className="auth-title">Create Account</h2>
              <p className="auth-desc">Get started with a cryptographically bound session.</p>

              <div className="input-group">
                <label htmlFor="regName">Name</label>
                <div className="input-wrapper">
                  <User className="input-icon" size={16} />
                  <input
                    type="text"
                    id="regName"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Your Full Name"
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="regUsername">Username</label>
                <div className="input-wrapper">
                  <Globe className="input-icon" size={16} />
                  <input
                    type="text"
                    id="regUsername"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="unique_username"
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="regEmail">Email Address</label>
                <div className="input-wrapper">
                  <Mail className="input-icon" size={16} />
                  <input
                    type="email"
                    id="regEmail"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="regPassword">Password</label>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={16} />
                  <input
                    type="password"
                    id="regPassword"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create a strong password"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={authLoading}>
                {authLoading ? 'Creating account...' : 'Create Account'}
              </button>

              <p className="auth-switch-text">
                Already have an account?{' '}
                <button type="button" className="auth-switch-btn" onClick={() => { setAuthScreen('login'); setAuthError(''); setSimulatedOtp(null); }}>
                  Sign In
                </button>
              </p>
            </form>
          )}

          {authScreen === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="auth-form">
              <h2 className="auth-title">Verify Email</h2>
              <p className="auth-desc">We sent a 6-digit OTP code to <strong>{authEmail}</strong>.</p>

              <div className="input-group">
                <label htmlFor="otpCode">One-Time Password (OTP)</label>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={16} />
                  <input
                    type="text"
                    id="otpCode"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    required
                    style={{ letterSpacing: '4px', textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}
                  />
                </div>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={authLoading}>
                {authLoading ? 'Verifying OTP...' : 'Verify Code & Sign In'}
              </button>

              <p className="auth-switch-text">
                Entered the wrong email?{' '}
                <button type="button" className="auth-switch-btn" onClick={() => { setAuthScreen('register'); setAuthError(''); setSimulatedOtp(null); }}>
                  Change Email
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    )
  }

  // Check if no integrations are connected AND the override is false
  const hasConnectedIntegrations = !!(
    user?.integrations?.whatsapp?.connected ||
    user?.integrations?.telegram?.connected ||
    user?.integrations?.linkedin?.connected ||
    user?.integrations?.gmail?.connected
  );

  if (!hasConnectedIntegrations && !showConnectionPageOverride) {
    return (
      <div className={`connection-page-container ${theme}`}>
        <div className="connection-background">
          <div className="connection-glow-sphere sphere-1"></div>
          <div className="connection-glow-sphere sphere-2"></div>
          <div className="connection-glow-sphere sphere-3"></div>
        </div>

        {/* Top Header Row with Logout & Skip Actions */}
        <header className="connection-page-header">
          <button className="nav-action-btn logout" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
          <button className="nav-action-btn skip" onClick={() => setShowConnectionPageOverride(true)}>
            <span>Go to Inbox</span>
            <ChevronRight size={16} />
          </button>
        </header>

        <div className="connection-content">
          {activePlatformView === 'whatsapp' ? (
            <div className="whatsapp-portal-content">
              {/* Back button logic */}
              {whatsappOption !== null ? (
                <button
                  className="back-to-options-btn"
                  onClick={() => {
                    setWhatsappOption(null);
                    setWhatsappError('');
                    setWhatsappQr(null);
                    setWhatsappPairCode(null);
                    setWhatsappPhoneNumber('');
                  }}
                >
                  <ChevronLeft size={14} />
                  <span>Change Method</span>
                </button>
              ) : (
                <button
                  className="back-to-channels-btn"
                  onClick={() => {
                    setActivePlatformView(null);
                  }}
                >
                  <ChevronLeft size={16} />
                  <span>Back to Channels</span>
                </button>
              )}

              {whatsappOption === null ? (
                // --- STEP 1: LINK YOUR WHATSAPP (2 CARDS) ---
                <>
                  <div className="connection-text-header">
                    <h1 className="connection-title">Link Your WhatsApp</h1>
                    <p className="connection-subtitle">
                      Choose a secure method to bind your WhatsApp account to the Ping dashboard.
                    </p>
                  </div>

                  <div className="whatsapp-main-selection-grid">
                    {/* Card 1: QR Connection */}
                    <div className="main-method-card qr-card" onClick={() => { setWhatsappOption('qr-direct'); handleFetchWhatsAppQr(); }}>
                      <div className="card-brand-glow"></div>
                      <div className="card-border-highlight"></div>
                      <div className="card-content">
                        <div className="card-icon-wrapper">
                          <QrCode className="card-icon" size={36} />
                        </div>
                        <h3 className="card-name">Connect with QR Code</h3>
                        <p className="card-desc">
                          Scan a dynamically generated secure QR code directly using your phone's WhatsApp Linked Devices camera.
                        </p>
                        <div className="card-status-badge">
                          <span>Select Method</span>
                          <ChevronRight size={14} className="badge-arrow" />
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Pairing Code Connection */}
                    <div className="main-method-card pair-card" onClick={() => setWhatsappOption('pair-direct')}>
                      <div className="card-brand-glow"></div>
                      <div className="card-border-highlight"></div>
                      <div className="card-content">
                        <div className="card-icon-wrapper">
                          <KeyRound className="card-icon" size={36} />
                        </div>
                        <h3 className="card-name">Connect with Pairing Code</h3>
                        <p className="card-desc">
                          Enter your phone number to generate an 8-character verification key code to link manually.
                        </p>
                        <div className="card-status-badge">
                          <span>Select Method</span>
                          <ChevronRight size={14} className="badge-arrow" />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                // --- STEP 2: ACTUAL PAIRING FLOW DETAILS VIEW ---
                <div className="whatsapp-option-detail-container">
                  {/* Back to WhatsApp options */}
                  <button
                    className="back-to-options-btn"
                    onClick={() => {
                      setWhatsappOption(null);
                      setWhatsappError('');
                      setWhatsappQr(null);
                      setWhatsappPairCode(null);
                      setWhatsappPhoneNumber('');
                    }}
                  >
                    <ChevronLeft size={14} />
                    <span>Change Method</span>
                  </button>

                  {whatsappError && <div className="auth-error-box">{whatsappError}</div>}

                  {whatsappOption === 'qr-direct' && (
                    <div className="detail-panel qr-direct">
                      <h2 className="detail-title">Direct Screen Scan</h2>
                      <p className="detail-desc">Scan this code from your phone's WhatsApp Linked Devices screen.</p>
                      
                      <div className="qr-box-wrapper">
                        {whatsappLoading ? (
                          <div className="qr-loader">
                            <div className="spinner"></div>
                            <span>Initializing WhatsApp driver...</span>
                          </div>
                        ) : whatsappQr ? (
                          <div className="qr-image-frame">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(whatsappQr)}&size=200x200`}
                              alt="WhatsApp Auth QR Code"
                              className="qr-code-img"
                            />
                          </div>
                        ) : (
                          <div className="qr-error-placeholder">
                            <span>No QR code returned. Verify backend is running.</span>
                            <button className="retry-btn" onClick={handleFetchWhatsAppQr}>Retry</button>
                          </div>
                        )}
                      </div>

                      <div className="pairing-instructions">
                        <ol>
                          <li>Open <strong>WhatsApp</strong> on your mobile phone</li>
                          <li>Go to <strong>Settings</strong> &gt; <strong>Linked Devices</strong></li>
                          <li>Tap <strong>Link a Device</strong> and point your camera at the code</li>
                        </ol>
                      </div>
                    </div>
                  )}

                  {whatsappOption === 'qr-companion' && (
                    <div className="detail-panel qr-companion">
                      <h2 className="detail-title">Companion Screen Link</h2>
                      <p className="detail-desc">Generate a temporary pairing link for external tablets or remote operators.</p>
                      
                      <div className="link-generation-box">
                        <input
                          type="text"
                          className="generated-link-input"
                          value={`${window.location.origin}/connect/whatsapp-qr?session=${user?.id}`}
                          readOnly
                        />
                        <button
                          className="copy-link-btn"
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/connect/whatsapp-qr?session=${user?.id}`);
                            alert('Link copied to clipboard!');
                          }}
                        >
                          Copy Link
                        </button>
                      </div>

                      <div className="pairing-instructions font-small">
                        <p>💡 Share this secure link with your team member. The link will display the active pairing QR code for this account.</p>
                      </div>
                    </div>
                  )}

                  {whatsappOption === 'pair-direct' && (
                    <div className="detail-panel pair-direct">
                      <h2 className="detail-title">Direct Phone Pairing</h2>
                      <p className="detail-desc">Link your account manually by receiving a standard verification key code.</p>

                      {!whatsappPairCode ? (
                        <form onSubmit={handleGenerateWhatsAppPairCode} className="phone-input-form">
                          <div className="input-group">
                            <label htmlFor="waPhone">Phone Number</label>
                            <div className="input-wrapper">
                              <Globe className="input-icon" size={16} />
                              <input
                                type="text"
                                id="waPhone"
                                value={whatsappPhoneNumber}
                                onChange={(e) => setWhatsappPhoneNumber(e.target.value)}
                                placeholder="e.g. +14155552671 (with country code)"
                                required
                              />
                            </div>
                          </div>

                          <button type="submit" className="auth-submit-btn" disabled={whatsappLoading}>
                            {whatsappLoading ? 'Requesting pairing code...' : 'Generate Pairing Code'}
                          </button>
                        </form>
                      ) : (
                        <div className="pair-code-result-panel">
                          <div className="pairing-code-display">{whatsappPairCode}</div>
                          <p className="pairing-code-success-label">🔑 Link Code Generated Successfully</p>
                          
                          <div className="pairing-instructions">
                            <ol>
                              <li>Open <strong>WhatsApp</strong> on your mobile phone</li>
                              <li>Go to <strong>Settings</strong> &gt; <strong>Linked Devices</strong></li>
                              <li>Tap <strong>Link with phone number</strong> instead</li>
                              <li>Enter this 8-character pairing code: <strong>{whatsappPairCode}</strong></li>
                            </ol>
                          </div>

                          <button
                            className="retry-btn text-link"
                            onClick={() => {
                              setWhatsappPairCode(null);
                              setWhatsappPhoneNumber('');
                            }}
                          >
                            Use a different phone number
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {whatsappOption === 'pair-voip' && (
                    <div className="detail-panel pair-voip">
                      <h2 className="detail-title">VoIP & Virtual Numbers</h2>
                      <p className="detail-desc">Custom pairing request configuration designed for VoIP numbers or API ports.</p>
                      
                      <div className="voip-mock-config">
                        <p className="warning-text">⚠️ Twilio, Plivo, or Virtual VOIP lines require manual API configurations. Please generate a code through our custom virtual port below.</p>
                        
                        <form onSubmit={handleGenerateWhatsAppPairCode} className="phone-input-form">
                          <div className="input-group">
                            <label htmlFor="waVoipPhone">Virtual VoIP Line Number</label>
                            <div className="input-wrapper">
                              <Globe className="input-icon" size={16} />
                              <input
                                type="text"
                                id="waVoipPhone"
                                value={whatsappPhoneNumber}
                                onChange={(e) => setWhatsappPhoneNumber(e.target.value)}
                                placeholder="e.g. +18880001111 (with country code)"
                                required
                              />
                            </div>
                          </div>

                          <button type="submit" className="auth-submit-btn" disabled={whatsappLoading}>
                            {whatsappLoading ? 'Linking VoIP Tunnel...' : 'Get VoIP Pairing Code'}
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            // --- MAIN CHANNEL GRID VIEW ---
            <>
              <div className="connection-text-header">
                <h1 className="connection-title">Connect Your Channels</h1>
                <p className="connection-subtitle">
                  Link your social accounts to unify your messaging dashboard.
                </p>
              </div>

              <div className="connection-grid">
                {/* WhatsApp Card */}
                <div
                  className="connection-card whatsapp"
                  onClick={() => {
                    setActivePlatformView('whatsapp');
                    setWhatsappOption(null);
                    setWhatsappError('');
                    setWhatsappQr(null);
                    setWhatsappPairCode(null);
                    setWhatsappPhoneNumber('');
                  }}
                >
                  <div className="card-brand-glow"></div>
                  <div className="card-border-highlight"></div>
                  <div className="card-content">
                    <div className="card-icon-wrapper">
                      <WhatsAppIcon className="card-icon" />
                    </div>
                    <h3 className="card-name">WhatsApp</h3>
                    <p className="card-desc">Sync your conversations, media, and auto-replies instantly.</p>
                    <div className="card-status-badge">
                      <span>Connect</span>
                      <ChevronRight size={14} className="badge-arrow" />
                    </div>
                  </div>
                </div>

                {/* Telegram Card */}
                <div
                  className="connection-card telegram"
                  onClick={() => alert('Telegram auth configuration wizard will open here. Login code pairing instructions will follow.')}
                >
                  <div className="card-brand-glow"></div>
                  <div className="card-border-highlight"></div>
                  <div className="card-content">
                    <div className="card-icon-wrapper">
                      <TelegramIcon className="card-icon" />
                    </div>
                    <h3 className="card-name">Telegram</h3>
                    <p className="card-desc">Link your active groups, channels, and direct messages.</p>
                    <div className="card-status-badge">
                      <span>Connect</span>
                      <ChevronRight size={14} className="badge-arrow" />
                    </div>
                  </div>
                </div>

                {/* LinkedIn Card */}
                <div
                  className="connection-card linkedin"
                  onClick={() => alert('LinkedIn OAuth login integration will open here.')}
                >
                  <div className="card-brand-glow"></div>
                  <div className="card-border-highlight"></div>
                  <div className="card-content">
                    <div className="card-icon-wrapper">
                      <LinkedInIcon className="card-icon" />
                    </div>
                    <h3 className="card-name">LinkedIn</h3>
                    <p className="card-desc">Unify business DMs and company page replies in one place.</p>
                    <div className="card-status-badge">
                      <span>Connect</span>
                      <ChevronRight size={14} className="badge-arrow" />
                    </div>
                  </div>
                </div>

                {/* Instagram Card */}
                <div
                  className="connection-card instagram"
                  onClick={() => alert('Instagram Direct Message configuration details will open here.')}
                >
                  <div className="card-brand-glow"></div>
                  <div className="card-border-highlight"></div>
                  <div className="card-content">
                    <div className="card-icon-wrapper">
                      <InstagramIcon className="card-icon" />
                    </div>
                    <h3 className="card-name">Instagram</h3>
                    <p className="card-desc">Manage story replies, DMs, comments, and customer interactions.</p>
                    <div className="card-status-badge">
                      <span>Connect</span>
                      <ChevronRight size={14} className="badge-arrow" />
                    </div>
                  </div>
                </div>

                {/* X Card */}
                <div
                  className="connection-card x-platform"
                  onClick={() => alert('X (Twitter) Developer API authentication will open here.')}
                >
                  <div className="card-brand-glow"></div>
                  <div className="card-border-highlight"></div>
                  <div className="card-content">
                    <div className="card-icon-wrapper">
                      <XIcon className="card-icon" />
                    </div>
                    <h3 className="card-name">X (Twitter)</h3>
                    <p className="card-desc">Track brand mentions, direct messages, and real-time posts.</p>
                    <div className="card-status-badge">
                      <span>Connect</span>
                      <ChevronRight size={14} className="badge-arrow" />
                    </div>
                  </div>
                </div>

                {/* Gmail Card */}
                <div
                  className="connection-card gmail"
                  onClick={() => alert('Google Gmail OAuth flow will open here.')}
                >
                  <div className="card-brand-glow"></div>
                  <div className="card-border-highlight"></div>
                  <div className="card-content">
                    <div className="card-icon-wrapper">
                      <svg className="card-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                      </svg>
                    </div>
                    <h3 className="card-name">Gmail</h3>
                    <p className="card-desc">Access emails, threads, and trigger automated follow-ups.</p>
                    <div className="card-status-badge">
                      <span>Connect</span>
                      <ChevronRight size={14} className="badge-arrow" />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

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
                className={`nav-item ${currentTab === 'chats' && activeCategory === item.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveCategory(item.id)
                  setCurrentTab('chats')
                }}
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
                className={`nav-item ${currentTab === 'chats' && activeCategory === item.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveCategory(item.id)
                  setCurrentTab('chats')
                }}
                title={item.name}
              >
                {item.icon}
                <span className="nav-text">{item.name}</span>
              </div>
            ))}
          </div>
        </nav>

        {/* User profile status bar */}
        <div className="sidebar-profile">
          <div className="profile-info">
            <div className="profile-avatar-wrapper">
              {failedAvatars['profile'] || !user?.avatar ? (
                <div className="chat-avatar-placeholder" style={{ width: '40px', height: '40px' }}>
                  <span style={{ fontSize: '14px' }}>{getInitials(user?.name || 'Ping')}</span>
                </div>
              ) : (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="profile-avatar"
                  onError={() => setFailedAvatars(prev => ({ ...prev, profile: true }))}
                />
              )}
              <span className="status-dot"></span>
            </div>
            <div className="profile-details">
              <span className="profile-name">{user?.name || 'Guest'}</span>
              <span className="profile-username">@{user?.username || 'user'}</span>
            </div>
          </div>
          <button
            className={`profile-settings-btn ${currentTab === 'settings' ? 'active' : ''}`}
            onClick={() => setCurrentTab('settings')}
            title="Settings"
            aria-label="Settings"
          >
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
      {currentTab === 'settings' ? (
        <main className="main-panel settings-panel">
          <div className="settings-header">
            <h1 className="settings-title">Account Settings</h1>
            <p className="settings-subtitle">Manage your profile configurations and linked social channels.</p>
          </div>

          <div className="settings-content-card">
            {/* Social channels connect section */}
            <div className="connection-text-header" style={{ marginTop: '0', textAlign: 'left' }}>
              <h2 className="section-title-large" style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)' }}>Linked Channels</h2>
              <p className="section-subtitle-small" style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginBottom: '24px' }}>Unify your conversations by linking your messaging accounts.</p>
            </div>

            <div className="connection-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', maxWidth: '100%' }}>
              {/* WhatsApp Card */}
              <div
                className={`connection-card whatsapp ${user?.integrations?.whatsapp?.connected ? 'connected' : ''}`}
                onClick={() => {
                  setActivePlatformView('whatsapp');
                  setWhatsappOption(null);
                  setWhatsappError('');
                  setWhatsappQr(null);
                  setWhatsappPairCode(null);
                  setWhatsappPhoneNumber('');
                  // Take user to fullscreen connection view overlay
                  setShowConnectionPageOverride(false);
                }}
              >
                <div className="card-brand-glow"></div>
                <div className="card-border-highlight"></div>
                <div className="card-content">
                  <div className="card-icon-wrapper">
                    <svg className="card-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.012 2c-5.506 0-9.988 4.482-9.988 9.988 0 1.76.459 3.413 1.263 4.86L2 22l5.312-1.393c1.403.765 3.011 1.205 4.7 1.205 5.507 0 9.988-4.482 9.988-9.988S17.519 2 12.012 2zm6.208 14.153c-.253.712-1.262 1.307-1.741 1.353-.478.046-.948.221-3.047-.6-2.522-1.042-4.149-3.613-4.275-3.782-.126-.168-.992-1.321-.992-2.52 0-1.2.622-1.787.844-2.028.222-.24.478-.301.637-.301.16 0 .32.001.459.008.146.007.34-.055.53.4.2.484.678 1.657.737 1.777.06.12.099.26.02.42-.08.16-.12.26-.24.4-.12.14-.253.313-.36.42-.12.12-.246.251-.106.49.14.24.62.1.996 1.442.861.42 2.502.83 2.85.992.35.16.55.13.754-.1.204-.23.88-1.026 1.116-1.378.236-.352.472-.292.793-.172.32.12 2.032.96 2.383 1.134.351.173.585.258.67.404.086.147.086.852-.167 1.564z" />
                    </svg>
                  </div>
                  <h3 className="card-name">WhatsApp</h3>
                  <p className="card-desc">
                    {user?.integrations?.whatsapp?.connected
                      ? `Linked as ${user?.integrations?.whatsapp?.phoneNumber || 'Active'}`
                      : 'Sync your conversations, media, and auto-replies instantly.'}
                  </p>
                  <div className="card-status-badge">
                    <span>{user?.integrations?.whatsapp?.connected ? 'Connected' : 'Connect'}</span>
                    <ChevronRight size={14} className="badge-arrow" />
                  </div>
                </div>
              </div>

              {/* Telegram Card */}
              <div
                className={`connection-card telegram ${user?.integrations?.telegram?.connected ? 'connected' : ''}`}
                onClick={() => alert('Telegram auth configuration wizard will open here.')}
              >
                <div className="card-brand-glow"></div>
                <div className="card-border-highlight"></div>
                <div className="card-content">
                  <div className="card-icon-wrapper">
                    <svg className="card-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-1-.65-.35-1 .22-1.58.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.24-5.54 3.66-.52.36-1 .53-1.42.52-.47-.01-1.37-.27-2.03-.49-.82-.27-1.47-.41-1.42-.87.03-.24.36-.49.99-.74 3.88-1.69 6.46-2.8 7.74-3.35 3.69-1.54 4.45-1.81 4.95-1.82.11 0 .36.03.52.16.14.12.18.28.19.45-.01.06-.01.12-.02.17z" />
                    </svg>
                  </div>
                  <h3 className="card-name">Telegram</h3>
                  <p className="card-desc">
                    {user?.integrations?.telegram?.connected ? 'Connected' : 'Link your active groups, channels, and DMs.'}
                  </p>
                  <div className="card-status-badge">
                    <span>{user?.integrations?.telegram?.connected ? 'Connected' : 'Connect'}</span>
                    <ChevronRight size={14} className="badge-arrow" />
                  </div>
                </div>
              </div>

              {/* LinkedIn Card */}
              <div className="connection-card linkedin" onClick={() => alert('LinkedIn OAuth login integration will open here.')}>
                <div className="card-brand-glow"></div>
                <div className="card-border-highlight"></div>
                <div className="card-content">
                  <div className="card-icon-wrapper">
                    <svg className="card-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                    </svg>
                  </div>
                  <h3 className="card-name">LinkedIn</h3>
                  <p className="card-desc">Sync inbound recruitment requests and network connections.</p>
                  <div className="card-status-badge">
                    <span>Connect</span>
                    <ChevronRight size={14} className="badge-arrow" />
                  </div>
                </div>
              </div>
            </div>

            {/* Logout/Danger Zone inside settings */}
            <div className="settings-danger-zone" style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <h3 className="danger-zone-title" style={{ fontSize: '16px', fontWeight: '700', color: '#ef4444', marginBottom: '8px' }}>Danger Zone</h3>
              <p className="danger-zone-desc" style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>Permanently sign out of this browser device session.</p>
              <button className="settings-logout-btn" onClick={handleLogout} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                fontWeight: '700',
                fontSize: '13.5px',
                cursor: 'pointer',
                transition: 'opacity 0.2s ease'
              }}>
                <LogOut size={16} />
                <span>Sign Out of Ping</span>
              </button>
            </div>
          </div>
        </main>
      ) : (
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
              {chats.map((chat) => (
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
                      {chat.isOnline && <span className="chat-status-dot online"></span>}
                      <div className={`channel-badge ${chat.platform}`}>
                        {getPlatformIcon(chat.platform)}
                      </div>
                    </div>

                    {/* Message details */}
                    <div className="chat-details">
                      <div className="chat-details-header">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-start' }}>
                          <span className="chat-user-name">{chat.name}</span>
                          {chat.lastSeen && (
                            <span className="chat-last-seen" style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                              last seen {chat.lastSeen}
                            </span>
                          )}
                        </div>
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
      )}
    </div>
  )
}

export default App
