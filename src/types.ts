export interface Gig {
  id: number
  creatorName: string
  handle: string
  avatar: string
  followers: string
  niche: string
  title: string
  type: string
  budget: string
  tags: string[]
  location: string
  verified: boolean
  applicants: number
  description: string
  deliverables: string[]
  deadline: string
  brand: string | null
  brandLogo: string | null
  userId?: string
  posterUid?: string
  applicantSelected?: boolean
  selectedApplicantName?: string
  selectedApplicantAvatar?: string | null
  selectedApplicantHandle?: string
  selectedApplicantUid?: string | null
  status?: string
  isFeatured?: boolean
}

export interface Creator {
  id: number
  name: string
  handle: string
  avatar: string
  followers: string
  engagement: string
  niche: string
  verified: boolean
  bio: string
  instagram?: any
  isInstagramConnected?: boolean
  uid?: string
  lastSeen?: string
}

export interface Brand {
  id: number
  name: string
  industry: string
  logo: string
  campaignsCount: number
  location: string
  verified: boolean
  bio: string
  instagram?: any
  isInstagramConnected?: boolean
  uid?: string
  lastSeen?: string
}

export interface Event {
  id: number
  title: string
  subtitle?: string
  date: string
  day: string
  month: string
  time: string
  venue: string
  location: string
  attendees: number
  tag: string
  color: string
  image: string
  description: string
  organizer: string
  entryFee: string
  speakers?: string[]
  isFeatured?: boolean
  isPaid?: boolean
  price?: number | string
  detailImage?: string
}

export interface ChatMessage {
  id: number
  text: string
  sender: string
  time: string
}

export interface ChatThread {
  id: number
  name: string
  avatar: string
  handle: string
  online: boolean
  verified: boolean
  unreadCount: number
  messages: ChatMessage[]
}

export interface Conversation {
  id: string
  participants: string[]
  participantNames: Record<string, string>
  participantAvatars: Record<string, string>
  participantHandles: Record<string, string>
  lastMessage: string
  lastMessageTime: string
  lastSenderId: string
  unreadCounts: Record<string, number>
  createdAt: string
}

export interface LiveMessage {
  id: string
  text: string
  senderId: string
  senderName: string
  senderAvatar: string
  timestamp: string
}

export interface UserProfile {
  uid?: string
  name?: string
  email?: string
  role?: string
  avatar?: string
  logo?: string
  handle?: string
  niche?: string
  industry?: string
  location?: string
  bio?: string
  followers?: string
  instagram?: any
  isInstagramConnected?: boolean
}
