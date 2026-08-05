import { AdminDashboardPage } from "./admin/AdminDashboard"
import { AdminPendingPage } from "./admin/AdminPending"
import { ExplorePage } from "./components/ExplorePage"
import { ChatPage } from "./components/ChatPage"
import { PublicProfilePage, PublicBrandProfilePage } from "./components/ProfilePage"
import type { Gig, Creator, Brand, Event, Conversation, LiveMessage, ChatThread } from "./types"
import {
  useState,
  useRef,
  useEffect,
  type CSSProperties,
  type TouchEvent,
} from "react"

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth"

import {
  collection,
  doc,
  setDoc,
  getDoc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  deleteDoc,
  increment,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore"

import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

import { auth, db, storage, messaging } from "./firebase"
import { getToken } from "firebase/messaging"

const FCM_VAPID_KEY = "YOUR_FCM_VAPID_KEY" // Update this with your VAPID key from Firebase Console

const INTRO_BLUE = "#2b4ef7"

const SLIDES = [
  {
    id: 1,
    tag: "01 — Welcome",
    headline: "Let's Collab,",
    headlineAccent: "Kolkata!",
    sub: "Kolkata's first hyperlocal platform for creators, PR collabs, and brand deals — built by the city, for the city.",
    img: "https://images.unsplash.com/photo-1766676219472-bafcced3b3f7?w=900&h=1200&fit=crop&auto=format&q=80",
    alt: "Howrah Bridge at sunset",
  },
  {
    id: 2,
    tag: "02 — Community",
    headline: "The City Is",
    headlineAccent: "Your Team.",
    sub: "From Park Street to New Town — every corner of Kolkata has a creator ready to collaborate with you.",
    img: "https://images.unsplash.com/photo-1737391591935-b10cec322512?w=900&h=1200&fit=crop&auto=format&q=80",
    alt: "Kolkata street community",
  },
  {
    id: 3,
    tag: "03 — Creators",
    headline: "Find Your",
    headlineAccent: "Crew.",
    sub: "Photographers, stylists, writers, reels creators — find your people and make things happen together.",
    img: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=900&h=1200&fit=crop&auto=format&q=80",
    alt: "Creators collaborating",
  },
  {
    id: 4,
    tag: "04 — Growth",
    headline: "Grow",
    headlineAccent: "Together.",
    sub: "Land real brand deals, paid gigs, and PR collabs. Build your name right here in Kolkata.",
    img: "https://images.unsplash.com/photo-1782187859788-c00888c7e277?w=900&h=1200&fit=crop&auto=format&q=80",
    alt: "Kolkata river at dawn",
  },
]



const GIGS = [
  {
    id: 1,

    creatorName: "Priya Sengupta",

    handle: "@priya.creates",

    avatar:
      "https://images.unsplash.com/photo-1624610261655-777af2f586d7?w=80&h=80&fit=crop&auto=format",

    followers: "124K",

    niche: "Lifestyle & Fashion",

    title: "Brand Collab for Ethnic Fashion Launch",

    type: "Paid",

    budget: "₹8,000 – ₹15,000",

    tags: ["Fashion", "Reel", "Story"],

    location: "Kolkata, WB",

    verified: true,

    applicants: 12,

    description:
      "We are launching a new ethnic fashion line and looking for a lifestyle creator based in Kolkata to help us create 2 Reels and 3 Stories. You will receive the outfits as gifted products in addition to the paid fee. Shoot can be done at a location of your choice in Kolkata.",

    deliverables: ["2 Instagram Reels", "3 Instagram Stories", "1 Feed Post"],

    deadline: "Aug 20, 2026",

    brand: "Rang Bahar Textiles",

    brandLogo:
      "https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=60&h=60&fit=crop&auto=format",
  },

  {
    id: 2,

    creatorName: "Arjun Das",

    handle: "@arjun.lens",

    avatar:
      "https://images.unsplash.com/photo-1607346256330-dee7af15f7c5?w=80&h=80&fit=crop&auto=format",

    followers: "56K",

    niche: "Photography",

    title: "Co-shoot: Street Photography Series",

    type: "Barter",

    budget: "Print + Credits",

    tags: ["Photography", "Collab", "Street"],

    location: "North Kolkata",

    verified: true,

    applicants: 5,

    description:
      "Looking for a fellow photographer to co-shoot a street photography series across North Kolkata — Shyambazar, Kumartuli, and College Street. The series will be exhibited at a local gallery and published online. Barter basis: you get high-quality prints and full credit.",

    deliverables: [
      "20+ edited shots",
      "Gallery exhibition credit",
      "Online publication",
    ],

    deadline: "Sep 5, 2026",

    brand: null,

    brandLogo: null,
  },

  {
    id: 3,

    creatorName: "Tanisha Roy",

    handle: "@tanisha.eats",

    avatar:
      "https://images.unsplash.com/photo-1639591903821-9b5e38f97bbd?w=80&h=80&fit=crop&auto=format",

    followers: "89K",

    niche: "Food & Travel",

    title: "Restaurant Review Collab – Park Street",

    type: "Collab",

    budget: "Complimentary Meal",

    tags: ["Food", "Review", "Reel"],

    location: "Park Street, KOL",

    verified: false,

    applicants: 20,

    description:
      "A new multi-cuisine restaurant on Park Street is inviting food creators for a complimentary dining experience in exchange for an honest review. You will receive a full meal for 2 and full creative freedom on the content format. No script, no forced positivity.",

    deliverables: ["1 Instagram Reel or YouTube Short", "2 Stories with tag"],

    deadline: "Aug 15, 2026",

    brand: "The Calcutta Table",

    brandLogo: null,
  },

  {
    id: 4,

    creatorName: "Souvik Chatterjee",

    handle: "@souvik.motion",

    avatar:
      "https://images.unsplash.com/photo-1622782262029-1c8f5762be36?w=80&h=80&fit=crop&auto=format",

    followers: "210K",

    niche: "Video & Editing",

    title: "Looking for Videographer – Music Label",

    type: "Paid",

    budget: "₹20,000 – ₹35,000",

    tags: ["Video", "Music", "Production"],

    location: "Salt Lake, KOL",

    verified: true,

    applicants: 8,

    description:
      "An indie music label based in Salt Lake is looking for an experienced videographer for a 2-day music video shoot. The track is an upcoming Bengali indie fusion single. Equipment provided. Need someone with prior music video or short film experience.",

    deliverables: [
      "2-day shoot commitment",
      "Raw footage handover",
      "1 BTS Reel",
    ],

    deadline: "Aug 30, 2026",

    brand: "Raag Records",

    brandLogo: null,
  },

  {
    id: 5,

    creatorName: "Anika Bose",

    handle: "@anika.wellness",

    avatar:
      "https://images.unsplash.com/photo-1764740128390-4196892b3f61?w=80&h=80&fit=crop&auto=format",

    followers: "43K",

    niche: "Health & Wellness",

    title: "Fitness Brand Ambassador – 3 months",

    type: "Barter",

    budget: "Product + ₹5,000",

    tags: ["Fitness", "Health", "Reels"],

    location: "New Town, KOL",

    verified: true,

    applicants: 14,

    description:
      "A Kolkata-based fitness supplement brand is looking for a wellness creator to be their brand ambassador for 3 months. You will receive monthly product hampers + ₹5,000/month. We want authentic content — workout reels, morning routines, and honest reviews.",

    deliverables: [
      "4 Reels/month",
      "8 Stories/month",
      "1 dedicated feed post/month",
    ],

    deadline: "Aug 12, 2026",

    brand: "StrengthBox India",

    brandLogo: null,
  },
]

const EVENTS = [
  {
    id: 1,

    title: "Kreator Meetup #3",

    subtitle: "Network. Collaborate. Create.",

    date: "Aug 10, 2026",

    day: "10",

    month: "AUG",

    time: "5:30 PM",

    venue: "Goethe Institut, Max Mueller Bhavan",

    location: "Park Street, Kolkata",

    attendees: 84,

    tag: "Networking",

    color: "#3b5bdb",

    image:
      "https://images.unsplash.com/photo-1648440108249-30567222448a?w=400&h=200&fit=crop&auto=format",

    description:
      "Join Kolkata's premier creator networking meetup! Connect with top lifestyle, food, and tech creators, meet hiring brand managers, and participate in exclusive collab pitch sessions.",

    organizer: "Kreator Kolkata Community",

    entryFee: "Free RSVP",

    speakers: ["Priya Sengupta", "Souvik Chatterjee", "Arjun Das"],
  },

  {
    id: 2,

    title: "Brand × Creator Summit",

    subtitle: "Meet the brands hiring now",

    date: "Aug 24, 2026",

    day: "24",

    month: "AUG",

    time: "11:00 AM",

    venue: "The Park Hotel",

    location: "Camac Street, Kolkata",

    attendees: 210,

    tag: "Summit",

    color: "#f76707",

    image:
      "https://images.unsplash.com/photo-1661061968438-97ab151ac32e?w=400&h=200&fit=crop&auto=format",

    description:
      "A 1-day summit designed for content creators and local Kolkata brands. Discover upcoming brand campaigns, attend workshops on monetization, and negotiate live collab contracts.",

    organizer: "Kreator Kolkata x Rang Bahar",

    entryFee: "Free RSVP",

    speakers: [
      "Rang Bahar Marketing Lead",
      "The Calcutta Table Founder",
      "Tanisha Roy",
    ],
  },
]

const CREATORS = [
  {
    id: 1,

    name: "Priya Sengupta",

    handle: "@priya.creates",

    avatar:
      "https://images.unsplash.com/photo-1624610261655-777af2f586d7?w=150&h=150&fit=crop&auto=format",

    followers: "124K",

    engagement: "4.8%",

    niche: "Lifestyle & Fashion",

    verified: true,

    bio: "Creating real, aesthetic content from the heart of Kolkata 🌸 Open to brand collabs & events.",

    recentPost:
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=200&h=200&fit=crop&auto=format",
  },

  {
    id: 2,

    name: "Arjun Das",

    handle: "@arjun.lens",

    avatar:
      "https://images.unsplash.com/photo-1607346256330-dee7af15f7c5?w=150&h=150&fit=crop&auto=format",

    followers: "56K",

    engagement: "5.2%",

    niche: "Photography",

    verified: true,

    bio: "Visual storyteller capturing the soul of Kolkata. Street, portraits, & cinematic stills 📸",

    recentPost:
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=200&h=200&fit=crop&auto=format",
  },

  {
    id: 3,

    name: "Tanisha Roy",

    handle: "@tanisha.eats",

    avatar:
      "https://images.unsplash.com/photo-1639591903821-9b5e38f97bbd?w=150&h=150&fit=crop&auto=format",

    followers: "89K",

    engagement: "6.1%",

    niche: "Food & Travel",

    verified: false,

    bio: "Exploring Kolkata’s culinary secrets one plate at a time. From street food to fine dining 🍽️",

    recentPost:
      "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&h=200&fit=crop&auto=format",
  },

  {
    id: 4,

    name: "Souvik Chatterjee",

    handle: "@souvik.motion",

    avatar:
      "https://images.unsplash.com/photo-1622782262029-1c8f5762be36?w=150&h=150&fit=crop&auto=format",

    followers: "210K",

    engagement: "3.9%",

    niche: "Video & Editing",

    verified: true,

    bio: "Director & Editor. Bringing stories to life with dynamic edits and high-fidelity visuals 🎥",

    recentPost:
      "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=200&h=200&fit=crop&auto=format",
  },

  {
    id: 5,

    name: "Anika Bose",

    handle: "@anika.wellness",

    avatar:
      "https://images.unsplash.com/photo-1764740128390-4196892b3f61?w=150&h=150&fit=crop&auto=format",

    followers: "43K",

    engagement: "5.5%",

    niche: "Health & Wellness",

    verified: true,

    bio: "Yoga practitioner & holistic wellness advocate. Helping you find balance in the chaos 🧘‍♀️",

    recentPost:
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=200&h=200&fit=crop&auto=format",
  },

  {
    id: 6,

    name: "Rohan Sen",

    handle: "@rohan.tunes",

    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&auto=format",

    followers: "78K",

    engagement: "4.2%",

    niche: "Music & Art",

    verified: false,

    bio: "Independent singer-songwriter from Kolkata. Sharing acoustic sessions and original melodies 🎸",

    recentPost:
      "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=200&h=200&fit=crop&auto=format",
  },
]

const BRANDS = [
  {
    id: 1,

    name: "Rang Bahar Textiles",

    logo: "https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=100&h=100&fit=crop&auto=format",

    industry: "Ethnic Fashion",

    campaignsCount: 2,

    location: "Kolkata, WB",

    verified: true,

    bio: "Celebrating the vibrant heritage of Indian textiles with modern cuts and sustainable fabrics.",
  },

  {
    id: 2,

    name: "The Calcutta Table",

    logo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100&h=100&fit=crop&auto=format",

    industry: "Food & Beverage",

    campaignsCount: 1,

    location: "Park Street, KOL",

    verified: true,

    bio: "Artisanal dining experiences mixing traditional Bengali flavors with contemporary global cuisine.",
  },

  {
    id: 3,

    name: "Raag Records",

    logo: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100&fit=crop&auto=format",

    industry: "Music Label",

    campaignsCount: 1,

    location: "Salt Lake, KOL",

    verified: true,

    bio: "Connecting indie musicians with global audiences. Championing sound and expression.",
  },

  {
    id: 4,

    name: "StrengthBox India",

    logo: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=100&h=100&fit=crop&auto=format",

    industry: "Fitness & Health",

    campaignsCount: 1,

    location: "New Town, KOL",

    verified: false,

    bio: "Premium fitness nutrition and wellness products formulated for high-performance lifestyles.",
  },
]

const FILTERS = ["All Gigs", "Paid", "Barter", "Collab"]

const NICHES = ["All", "Fashion", "Food", "Photography", "Video", "Wellness"]

const TYPE_COLORS: Record<string, string> = {
  Paid: "bg-emerald-100 text-emerald-700",

  Barter: "bg-violet-100 text-violet-700",

  Collab: "bg-amber-100 text-amber-700",
}

const formatLocation = (loc?: string) => {
  if (!loc) return "Kolkata"

  const cleaned = loc.replace(/,\s*(kol|kolkata|wb)\b/gi, "").trim()

  return cleaned || loc
}

// Prepend ₹ to numeric budgets that don't already have a currency symbol

const formatBudget = (budget: string | undefined, type?: string) => {
  if (!budget) return ""

  const b = budget.trim()

  // Already has a currency symbol or is a non-numeric description

  if (b.startsWith("₹") || b.startsWith("$") || b.startsWith("€")) return b

  // If it's a Paid gig and the budget looks numeric (digits/commas/dashes), add ₹

  if (type === "Paid" || /^\d[\d,\s–\-\.]*$/.test(b)) return `₹${b}`

  return b
}

type Gig = typeof GIGS[0]

type Creator = typeof CREATORS[0]

type Brand = typeof BRANDS[0]

type Event = typeof EVENTS[0]

const NOTIFICATIONS = [
  {
    id: 1,

    type: "collab",

    title: "New Collab Pitch received",

    message:
      'Arjun Das pitched for your "Brand Collab for Ethnic Fashion Launch" gig.',

    time: "2 hours ago",

    unread: true,

    avatar:
      "https://images.unsplash.com/photo-1607346256330-dee7af15f7c5?w=80&h=80&fit=crop&auto=format",

    actionText: "View Pitch",

    category: "activity",
  },

  {
    id: 2,

    type: "collab" === "event" ? "collab" : "event", // just preserving formatting/structure

    title: "RSVP Confirmed",

    message: 'Your registration for "Kreator Meetup #3" has been approved.',

    time: "5 hours ago",

    unread: true,

    avatar:
      "https://images.unsplash.com/photo-1648440108249-30567222448a?w=80&h=80&fit=crop&auto=format",

    actionText: "Add to Calendar",

    category: "activity",
  },

  {
    id: 3,

    type: "brand",

    title: "Campaign Invitation",

    message:
      'Rang Bahar Textiles invited you to apply for their upcoming "Winter Silk Campaign".',

    time: "1 day ago",

    unread: false,

    avatar:
      "https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=80&h=80&fit=crop&auto=format",

    actionText: "Apply Now",

    category: "activity",
  },

  {
    id: 4,

    type: "system",

    title: "Account Verified Check",

    message:
      "Congratulations! Your profile has been verified as a Top Kolkata Creator.",

    time: "3 days ago",

    unread: false,

    avatar:
      "https://images.unsplash.com/photo-1624610261655-777af2f586d7?w=80&h=80&fit=crop&auto=format",

    actionText: "View Badges",

    category: "system",
  },

  {
    id: 5,

    type: "collab",

    title: "New Review Posted",

    message:
      'Anika Bose left you a 5-star review: "Priya is extremely professional and creative!"',

    time: "4 days ago",

    unread: false,

    avatar:
      "https://images.unsplash.com/photo-1764740128390-4196892b3f61?w=80&h=80&fit=crop&auto=format",

    actionText: "View Review",

    category: "activity",
  },

  {
    id: 6,

    type: "system",

    title: "Security Alert",

    message:
      "Your account was accessed from a new device in Salt Lake, Kolkata.",

    time: "1 week ago",

    unread: false,

    avatar: "",

    actionText: "Review Security",

    category: "system",
  },
]

type AppNotification = typeof NOTIFICATIONS[0]

const INITIAL_CHATS = [
  {
    id: 1,

    name: "Arjun Das",

    avatar:
      "https://images.unsplash.com/photo-1607346256330-dee7af15f7c5?w=80&h=80&fit=crop&auto=format",

    handle: "@arjun.lens",

    niche: "Photography",

    online: true,

    verified: true,

    unreadCount: 1,

    messages: [
      {
        id: 1,
        text: "Hey Priya, loved your ethnic styling reel!",
        sender: "them",
        time: "10:30 AM",
      },

      {
        id: 2,
        text: "Thanks Arjun! The locations you suggested were perfect.",
        sender: "me",
        time: "10:32 AM",
      },

      {
        id: 3,
        text: "Awesome. Let's collab on the North Kolkata street photography series soon. Are you free this weekend?",
        sender: "them",
        time: "2:15 PM",
      },
    ],
  },

  {
    id: 2,

    name: "Rang Bahar Textiles",

    avatar:
      "https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=80&h=80&fit=crop&auto=format",

    handle: "Brand Account",

    niche: "Ethnic Fashion Brand",

    online: false,

    verified: true,

    unreadCount: 0,

    messages: [
      {
        id: 1,
        text: "Hello Priya, we saw your portfolio and would love to collaborate on our upcoming Ethnic Fashion Launch.",
        sender: "them",
        time: "Yesterday",
      },

      {
        id: 2,
        text: "Hello! I would love to know more about the deliverables and timeline.",
        sender: "me",
        time: "Yesterday",
      },

      {
        id: 3,
        text: "We have sent you the official invite. Please review the budget details in your gigs portal.",
        sender: "them",
        time: "Yesterday",
      },
    ],
  },

  {
    id: 3,

    name: "Tanisha Roy",

    avatar:
      "https://images.unsplash.com/photo-1639591903821-9b5e38f97bbd?w=80&h=80&fit=crop&auto=format",

    handle: "@tanisha.eats",

    niche: "Food & Travel",

    online: true,

    verified: false,

    unreadCount: 0,

    messages: [
      {
        id: 1,
        text: "Hey! Are you coming to the Goethe Institut meetup this Friday?",
        sender: "them",
        time: "2 days ago",
      },

      {
        id: 2,
        text: "Yes, definitely! RSVP'd yesterday.",
        sender: "me",
        time: "2 days ago",
      },

      {
        id: 3,
        text: "Great, see you there! Let's grab some coffee after.",
        sender: "them",
        time: "2 days ago",
      },
    ],
  },

  {
    id: 4,

    name: "Souvik Chatterjee",

    avatar:
      "https://images.unsplash.com/photo-1622782262029-1c8f5762be36?w=80&h=80&fit=crop&auto=format",

    handle: "@souvik.motion",

    niche: "Video & Editing",

    online: false,

    verified: true,

    unreadCount: 0,

    messages: [
      {
        id: 1,
        text: "Hey, did you get the raw files from the music label video shoot?",
        sender: "them",
        time: "3 days ago",
      },

      {
        id: 2,
        text: "Yes, downloaded them. I will start the edits today.",
        sender: "me",
        time: "3 days ago",
      },

      {
        id: 3,
        text: "Perfect, let me know if you need any BTS footage.",
        sender: "them",
        time: "3 days ago",
      },
    ],
  },
]

type ChatThread = typeof INITIAL_CHATS[0]

type ChatMessage = typeof INITIAL_CHATS[0]["messages"][0]

// ── Real-time Chat Types ────────────────────────────────────────────────────

type Conversation = {
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

type LiveMessage = {
  id: string
  text: string
  senderId: string
  senderName: string
  senderAvatar: string
  timestamp: string
}

function getConvoId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join("_")
}

// ── Instagram API Constants ────────────────────────────────────────────────

const INSTAGRAM_APP_ID = "1361228946204623"

const IG_SCOPES =
  "instagram_business_basic,instagram_business_content_publish,instagram_business_manage_messages,instagram_business_manage_comments"

const CLOUD_FUNCTION_URL = "https://instagramcallback-zoelsnl3gq-uc.a.run.app"

// ── Icons ──────────────────────────────────────────────────────────────────

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? "#3b5bdb" : "none"}
      stroke={filled ? "#3b5bdb" : "#94a3b8"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function FilterIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="11" y1="18" x2="13" y2="18" />
    </svg>
  )
}

function MapPinIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function ArrowLeftIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#3b5bdb"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  )
}

function CompassIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

function VideoIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="3" ry="3" />
    </svg>
  )
}

function PhoneOffIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.68 13.31a16 16 0 0 0 3.41 3.41l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.33a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function MicIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}

function MicOffIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}

function CameraOffIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

// Helper function to format deadline date string to dd-mm-yy format

function formatDeadline(dateStr: string): string {
  if (!dateStr) return ""

  // 1. Check if the string matches ISO date (YYYY-MM-DD)

  const isoMatch = dateStr.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)

  if (isoMatch) {
    const [, year, month, day] = isoMatch

    return `${day}-${month}-${year.slice(-2)}`
  }

  // 2. Try parsing with standard Date parser

  const parsedDate = new Date(dateStr)

  if (!isNaN(parsedDate.getTime()) && !/^[0-9]+$/.test(dateStr)) {
    const day = String(parsedDate.getDate()).padStart(2, "0")

    const month = String(parsedDate.getMonth() + 1).padStart(2, "0")

    const year = String(parsedDate.getFullYear()).slice(-2)

    return `${day}-${month}-${year}`
  }

  // 3. Fallback manual regex parser for formats like "Aug 20, 2026" or "4th august 2026"

  const cleanStr = dateStr
    .toLowerCase()
    .replace(/st|nd|rd|th/g, "")
    .trim()

  const monthsMap: Record<string, string> = {
    jan: "01",
    feb: "02",
    mar: "03",
    apr: "04",
    may: "05",
    jun: "06",

    jul: "07",
    aug: "08",
    sep: "09",
    oct: "10",
    nov: "11",
    dec: "12",

    january: "01",
    february: "02",
    march: "03",
    april: "04",
    june: "06",

    july: "07",
    august: "08",
    september: "09",
    october: "10",
    november: "11",
    december: "12",
  }

  const m1 = cleanStr.match(/([a-z]+)\s+(\d+),?\s+(\d+)/)

  if (m1) {
    const month = monthsMap[m1[1].slice(0, 3)] || "08"

    const day = m1[2].padStart(2, "0")

    const year = m1[3].slice(-2)

    return `${day}-${month}-${year}`
  }

  const m2 = cleanStr.match(/(\d+)\s+([a-z]+)\s+(\d+)/)

  if (m2) {
    const day = m2[1].padStart(2, "0")

    const month = monthsMap[m2[2].slice(0, 3)] || "08"

    const year = m2[3].slice(-2)

    return `${day}-${month}-${year}`
  }

  return dateStr
}

// ── Apply Page ─────────────────────────────────────────────────────────────

function ApplyPage({
  gig,

  onBack,

  userProfile,

  currentUser,

  creators,

  brands,

  onCreatorClick,

  onBrandClick,
}: {
  gig: Gig

  onBack: () => void

  userProfile?: any

  currentUser?: any

  creators: Creator[]

  brands: Brand[]

  onCreatorClick: (name: string) => void

  onBrandClick: (brand: Brand) => void
}) {
  const [step, setStep] = useState<"detail" | "form" | "success">("detail")

  const [pitch, setPitch] = useState("")

  const [rate, setRate] = useState("")

  const [instaHandle, setInstaHandle] = useState(
    userProfile?.instaHandle || userProfile?.handle || "",
  )

  const [portfolio, setPortfolio] = useState(userProfile?.portfolio || "")

  const [availability, setAvailability] = useState("")

  const [errors, setErrors] = useState<Record<string, string>>({})

  const [submitting, setSubmitting] = useState(false)

  // Find creator matching the gig poster to display real Instagram followers

  const matchedCreator =
    creators.find(
      (c) => c.name.toLowerCase() === gig.creatorName.toLowerCase(),
    ) ||
    CREATORS.find((c) => c.name.toLowerCase() === gig.creatorName.toLowerCase())

  const matchedBrand =
    brands.find(
      (b) =>
        b.name?.toLowerCase() === gig.creatorName?.toLowerCase() ||
        b.brand?.toLowerCase() === gig.creatorName?.toLowerCase(),
    ) ||
    BRANDS.find(
      (b) =>
        b.name?.toLowerCase() === gig.creatorName?.toLowerCase() ||
        b.brand?.toLowerCase() === gig.creatorName?.toLowerCase(),
    )

  const followersCount =
    (matchedCreator as any)?.instagram?.followersFormatted ||
    matchedCreator?.followers ||
    gig.followers

  useEffect(() => {
    if (userProfile) {
      if (!instaHandle && (userProfile.instaHandle || userProfile.handle)) {
        setInstaHandle(userProfile.instaHandle || userProfile.handle)
      }

      if (!portfolio && userProfile.portfolio) {
        setPortfolio(userProfile.portfolio)
      }
    }
  }, [userProfile])

  const validate = () => {
    const e: Record<string, string> = {}

    if (!pitch.trim()) e.pitch = "Please write a short pitch"

    if (!instaHandle.trim()) e.instaHandle = "Instagram handle is required"

    return e
  }

  const [hasAlreadyApplied, setHasAlreadyApplied] = useState(false)

  useEffect(() => {
    if (!currentUser?.uid || !gig?.id) return

    const q = query(
      collection(db, "applications"),
      where("gigId", "==", gig.id),
      where("applicantUid", "==", currentUser.uid),
    )

    getDocs(q)
      .then((snap) => {
        if (!snap.empty) {
          setHasAlreadyApplied(true)
        }
      })
      .catch((err) => console.warn("Check application error:", err))
  }, [currentUser?.uid, gig?.id])

  const handleSubmit = async () => {
    if (hasAlreadyApplied) {
      alert(
        "You have already submitted an application for this gig! Track your pitch in your Profile.",
      )
      return
    }

    const e = validate()

    if (Object.keys(e).length) {
      setErrors(e)
      return
    }

    setSubmitting(true)

    try {
      // 1. Write Application document to Firestore

      await addDoc(collection(db, "applications"), {
        gigId: gig.id,

        gigTitle: gig.title,

        posterName: gig.creatorName,

        posterUid: (gig as any).userId || (gig as any).uid || null,

        applicantUid: currentUser?.uid || null,

        applicantName:
          userProfile?.name || currentUser?.displayName || "Kolkata Creator",

        applicantEmail: currentUser?.email || "",

        applicantAvatar:
          userProfile?.avatar ||
          userProfile?.logo ||
          "https://images.unsplash.com/photo-1624610261655-777af2f586d7?w=80&h=80&fit=crop&auto=format",

        pitch: pitch.trim(),

        instaHandle: instaHandle.trim(),

        expectedRate: rate.trim() || gig.budget,

        portfolio: portfolio.trim(),

        availability: availability || "Flexible",

        status: "pending",

        appliedAt: new Date().toISOString(),
      })

      // 2. Increment applicant count on the Gig document in Firestore

      try {
        const qGigs = query(collection(db, "gigs"), where("id", "==", gig.id))

        const gigSnap = await getDocs(qGigs)

        if (!gigSnap.empty) {
          const docRef = gigSnap.docs[0].ref

          const currentApplicants = gigSnap.docs[0].data().applicants || 0

          await updateDoc(docRef, { applicants: currentApplicants + 1 })
        }
      } catch (err) {
        console.warn(
          "[APPLY] Could not update applicants count in Firestore:",
          err,
        )
      }

      // 3. Send Notification to poster in Firestore
      try {
        const posterUid =
          (gig as any).posterUid ||
          (gig as any).userId ||
          (gig as any).uid ||
          (matchedCreator as any)?.uid ||
          (matchedCreator as any)?.id ||
          (matchedBrand as any)?.uid ||
          (matchedBrand as any)?.id ||
          "all"

        await addDoc(collection(db, "notifications"), {
          recipientUid: posterUid,

          recipientName: gig.creatorName,

          senderName:
            userProfile?.name || currentUser?.displayName || "Kolkata Creator",

          senderAvatar:
            userProfile?.avatar ||
            userProfile?.logo ||
            "https://images.unsplash.com/photo-1624610261655-777af2f586d7?w=80&h=80&fit=crop&auto=format",

          type: "application",

          category: "activity",

          actionText: "Review Pitch",

          title: `New Application for "${gig.title}"`,

          message: `${userProfile?.name || "A creator"} applied with pitch: "${pitch.trim().slice(0, 60)}..."`,

          gigId: gig.id,

          createdAt: new Date().toISOString(),

          read: false,
        })

        // Also send confirmation notification to the applicant
        if (currentUser?.uid) {
          await addDoc(collection(db, "notifications"), {
            recipientUid: currentUser.uid,
            recipientName: userProfile?.name || "Applicant",
            senderName: gig.creatorName,
            senderAvatar:
              gig.avatar ||
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&auto=format",
            type: "application",
            category: "activity",
            actionText: "View Status",
            title: `Application Submitted!`,
            message: `You successfully applied to "${gig.title}". We'll notify you when ${gig.creatorName} reviews your pitch!`,
            read: false,
            createdAt: new Date().toISOString(),
            avatar:
              gig.avatar ||
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&auto=format",
          })
        }
      } catch (err) {
        console.warn("[APPLY] Could not send notification:", err)
      }

      setStep("success")
    } catch (err) {
      console.error("[APPLY] Error submitting application to Firestore:", err)

      // Show success so UX remains smooth

      setStep("success")
    } finally {
      setSubmitting(false)
    }
  }

  if (step === "success") {
    return (
      <div className="flex flex-col items-center justify-center flex-1 px-6 py-16 text-center">
        <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center mb-6">
          <CheckCircleIcon />
        </div>
        <h2 className="font-display text-2xl font-black text-slate-900 mb-2">
          Application Sent! 🎉
        </h2>
        <p className="text-slate-500 text-sm mb-2 leading-relaxed">
          Your pitch has been sent to{" "}
          <span className="font-bold text-slate-700">{gig.creatorName}</span>.
        </p>
        <p className="text-slate-400 text-xs mb-8">
          You'll get a notification when they respond, usually within 48 hours.
        </p>
        <div className="w-full bg-[#e8edff] rounded-2xl p-4 mb-6 text-left">
          <div className="text-[11px] text-[#3b5bdb] font-bold uppercase tracking-wider mb-2">
            Your Application
          </div>
          <div className="text-sm font-semibold text-slate-800 mb-1">
            {gig.title}
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <img
              src={gig.avatar}
              alt=""
              className="w-5 h-5 rounded-full object-cover"
            />
            <span>{gig.creatorName}</span>
          </div>
        </div>
        <button
          onClick={onBack}
          className="w-full bg-[#3b5bdb] text-white font-bold py-4 rounded-2xl shadow-md shadow-blue-200"
        >
          Back to Gigs
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 overflow-y-auto scrollbar-hide">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 bg-[#f0f4ff] flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={step === "form" ? () => setStep("detail") : onBack}
          className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center border border-slate-100 text-slate-700"
        >
          <ArrowLeftIcon />
        </button>
        <div>
          <div className="text-[11px] text-slate-400 font-medium">
            {step === "form" ? "Your Application" : "Gig Details"}
          </div>
          <div className="text-sm font-bold text-slate-900 leading-tight max-w-[240px] truncate">
            {gig.title}
          </div>
        </div>
      </div>

      {step === "detail" && (
        <>
          {/* Creator card */}
          <div className="mx-5 mb-4 bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-start gap-3 mb-3">
              <div
                onClick={() => onCreatorClick(gig.creatorName)}
                className="relative cursor-pointer hover:opacity-90 active:scale-95 transition-opacity duration-150 flex-shrink-0"
              >
                <img
                  src={gig.avatar}
                  alt={gig.creatorName}
                  className="w-14 h-14 rounded-full object-cover border-2 border-[#e8edff]"
                />
                {gig.verified && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-[#3b5bdb] rounded-full flex items-center justify-center">
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                      <path
                        d="M2 5l2 2 4-4"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  onClick={() => onCreatorClick(gig.creatorName)}
                  className="font-bold text-slate-900 text-sm hover:text-[#3b5bdb] hover:underline transition cursor-pointer truncate"
                >
                  {gig.creatorName}
                </div>
                <div
                  onClick={() => onCreatorClick(gig.creatorName)}
                  className="text-xs text-slate-400 font-medium hover:text-[#3b5bdb] hover:underline transition cursor-pointer truncate"
                >
                  {gig.handle}
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className="flex items-center gap-1 text-[10px] font-bold text-[#e4405f] bg-rose-50 px-2 py-0.5 rounded-full">
                    <InstagramIcon /> {followersCount} followers
                  </span>
                  <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                    {gig.niche}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${TYPE_COLORS[gig.type] || "bg-slate-100"}`}
                  >
                    {gig.type}
                  </span>
                </div>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-3">
              <h2 className="font-bold text-slate-900 text-base leading-snug mb-1">
                {gig.title}
              </h2>
              <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                <MapPinIcon />
                <span>{formatLocation(gig.location)}</span>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="mx-5 mb-4 bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
            <div className="text-[11px] text-[#3b5bdb] font-bold uppercase tracking-wider mb-2">
              About this Gig
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              {gig.description}
            </p>
          </div>

          {/* Deliverables */}
          <div className="mx-5 mb-4 bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
            <div className="text-[11px] text-[#3b5bdb] font-bold uppercase tracking-wider mb-3">
              What You'll Deliver
            </div>
            <div className="flex flex-col gap-2">
              {gig.deliverables.map((d, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path
                        d="M2 5l2 2 4-4"
                        stroke="#3b5bdb"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span className="text-sm text-slate-700 font-medium">
                    {d}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats row */}
          <div className="mx-5 mb-5 grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 text-center">
              <div className="text-base font-black text-slate-900 mb-0.5">
                {formatBudget(gig.budget, gig.type)}
              </div>
              <div className="text-[10px] text-slate-400 font-medium">
                Offer
              </div>
            </div>
            <div className="bg-white rounded-2xl p-2.5 shadow-sm border border-slate-100 text-center flex flex-col justify-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <CalendarIcon />
                <span className="text-[9px] font-bold text-slate-700 tracking-tight">
                  {formatDeadline(gig.deadline)}
                </span>
              </div>
              <div className="text-[9px] text-slate-400 font-medium">
                Deadline
              </div>
            </div>
            <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 text-center">
              <div className="text-base font-black text-slate-900 mb-0.5">
                {gig.applicants}
              </div>
              <div className="text-[10px] text-slate-400 font-medium">
                Applied
              </div>
            </div>
          </div>

          {/* Brand */}
          {gig.brand && (
            <div
              onClick={() => {
                const matchedBrand =
                  brands.find(
                    (b) => b.name.toLowerCase() === gig.brand?.toLowerCase(),
                  ) ||
                  BRANDS.find(
                    (b) => b.name.toLowerCase() === gig.brand?.toLowerCase(),
                  )

                if (matchedBrand) {
                  onBrandClick(matchedBrand)
                }
              }}
              className="mx-5 mb-5 bg-[#e8edff] hover:bg-[#dbe4ff] active:scale-[0.99] rounded-2xl px-4 py-3 flex items-center gap-3 cursor-pointer transition-all duration-200"
            >
              {/* Show uploaded logo if available, else letter avatar */}
              {(gig as any).brandLogo &&
              !(gig as any).brandLogo.includes("unsplash") ? (
                <img
                  src={(gig as any).brandLogo}
                  alt={gig.brand}
                  className="w-10 h-10 rounded-xl object-cover border border-[#c5d3ff] flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-[#3b5bdb]/20 flex items-center justify-center text-[#3b5bdb] text-sm font-black flex-shrink-0">
                  {gig.brand[0]}
                </div>
              )}
              <div>
                <div className="text-[10px] text-[#3b5bdb] font-bold uppercase tracking-wider">
                  Brand / Client
                </div>
                <div className="text-sm font-bold text-slate-800 hover:underline">
                  {gig.brand}
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="mx-5 mb-6 flex flex-wrap gap-2">
            {gig.tags.map((t) => (
              <span
                key={t}
                className="text-xs font-semibold bg-white border border-slate-200 text-slate-500 px-3 py-1 rounded-full"
              >
                {t}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div className="mx-5 mb-8">
            {(gig as any).applicantSelected ? (
              <div className="w-full bg-emerald-50 border-2 border-emerald-300 rounded-2xl py-4 px-5 flex flex-col items-center gap-2 text-center">
                <span className="text-2xl">✅</span>
                <div className="text-sm font-black text-emerald-700">
                  Creator Selected
                </div>
                <div className="text-xs text-emerald-600 font-medium">
                  The gig poster has already selected a creator for this gig.
                </div>
              </div>
            ) : hasAlreadyApplied ? (
              <div className="w-full bg-emerald-50 border-2 border-emerald-200 rounded-2xl py-4 px-5 flex flex-col items-center gap-2 text-center">
                <span className="text-2xl">✅</span>
                <div className="text-sm font-black text-emerald-800">
                  Already Applied
                </div>
                <div className="text-xs text-emerald-700 font-medium">
                  You have already submitted an application for this gig. You
                  can track your status in your Profile.
                </div>
              </div>
            ) : (
              <button
                onClick={() => setStep("form")}
                className="w-full bg-[#3b5bdb] text-white font-bold py-4 rounded-2xl shadow-md shadow-blue-200 text-base"
              >
                Apply for this Gig ↗
              </button>
            )}
          </div>
        </>
      )}

      {step === "form" && (
        <>
          <div className="px-5 pt-2 pb-6 flex flex-col gap-4">
            {/* Pitch */}
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                Your Pitch <span className="text-[#e4405f]">*</span>
              </label>
              <textarea
                rows={4}
                value={pitch}
                onChange={(e) => {
                  setPitch(e.target.value)
                  setErrors((p) => ({ ...p, pitch: "" }))
                }}
                placeholder="Tell them why you're the perfect fit. Be specific, be yourself."
                className={`w-full bg-white border ${
                  errors.pitch ? "border-red-400" : "border-slate-200"
                } rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#3b5bdb] transition resize-none`}
              />
              {errors.pitch && (
                <p className="text-xs text-red-500 mt-1 font-medium">
                  {errors.pitch}
                </p>
              )}
            </div>

            {/* Instagram */}
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                Instagram Handle <span className="text-[#e4405f]">*</span>
              </label>
              <div
                className={`flex items-center gap-2 bg-white border ${
                  errors.instaHandle ? "border-red-400" : "border-slate-200"
                } rounded-2xl px-4 py-3 focus-within:border-[#3b5bdb] transition`}
              >
                <span className="text-[#e4405f]">
                  <InstagramIcon />
                </span>
                <input
                  type="text"
                  value={instaHandle}
                  onChange={(e) => {
                    setInstaHandle(e.target.value)
                    setErrors((p) => ({ ...p, instaHandle: "" }))
                  }}
                  placeholder="@yourhandle"
                  className="flex-1 text-sm text-slate-800 placeholder:text-slate-400 outline-none bg-transparent"
                />
              </div>
              {errors.instaHandle && (
                <p className="text-xs text-red-500 mt-1 font-medium">
                  {errors.instaHandle}
                </p>
              )}
            </div>

            {/* Rate */}
            {gig.type === "Paid" && (
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                  Your Expected Rate
                </label>
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-3 focus-within:border-[#3b5bdb] transition">
                  <span className="text-slate-400 text-sm font-bold">₹</span>
                  <input
                    type="text"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    placeholder={`e.g. 12,000`}
                    className="flex-1 text-sm text-slate-800 placeholder:text-slate-400 outline-none bg-transparent"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Budget range: {formatBudget(gig.budget, gig.type)}
                </p>
              </div>
            )}

            {/* Portfolio */}
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                Portfolio / Past Work Link
              </label>
              <input
                type="url"
                value={portfolio}
                onChange={(e) => setPortfolio(e.target.value)}
                placeholder="Drive, Linktree, Website, etc."
                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#3b5bdb] transition"
              />
            </div>

            {/* Availability */}
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                Availability
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "Immediately",
                  "Within a week",
                  "Flexible",
                  "Need to discuss",
                ].map((a) => (
                  <button
                    key={a}
                    onClick={() => setAvailability(a)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                      availability === a
                        ? "bg-[#3b5bdb] text-white border-[#3b5bdb] shadow-sm"
                        : "bg-white text-slate-500 border-slate-200"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {hasAlreadyApplied && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                <span className="text-xl">✅</span>
                <div>
                  <div className="text-xs font-bold text-emerald-900">
                    Application Already Submitted
                  </div>
                  <div className="text-[11px] text-emerald-700">
                    You have already submitted a pitch for this gig. You can
                    track status in your Profile.
                  </div>
                </div>
              </div>
            )}

            {/* Terms notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex gap-2.5">
              <span className="text-amber-500 mt-0.5 flex-shrink-0">⚠️</span>
              <p className="text-xs text-amber-700 leading-relaxed font-medium">
                By applying you agree to the terms of Kreator Kolkata. All
                payments and agreements are directly between you and the
                collaborator.
              </p>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting || hasAlreadyApplied}
              className={`w-full font-bold py-4 rounded-2xl text-base flex items-center justify-center gap-2 transition ${
                hasAlreadyApplied
                  ? "bg-emerald-500/20 text-emerald-700 border border-emerald-500/30 cursor-not-allowed"
                  : "bg-[#3b5bdb] text-white shadow-md shadow-blue-200 cursor-pointer disabled:opacity-70"
              }`}
            >
              {hasAlreadyApplied ? (
                "✓ Application Already Submitted"
              ) : submitting ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="white"
                      strokeWidth="3"
                      strokeDasharray="60"
                      strokeDashoffset="20"
                    />
                  </svg>
                  Sending…
                </>
              ) : (
                "Send Application 🚀"
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ── View & Manage My Gig Page ────────────────────────────────────────────────

function ViewMyGigPage({
  gig,

  initialTab = "applicants",

  onBack,

  onOpenChat,

  onCreatorClick,
}: {
  gig: Gig

  initialTab?: "applicants" | "edit"

  onBack: () => void

  onOpenChat?: (applicantName: string, avatar: string) => void

  onCreatorClick?: (name: string) => void
}) {
  const [activeTab, setActiveTab] = useState<"applicants" | "edit">(initialTab)

  const [applications, setApplications] = useState<any[]>([])

  const [loadingApps, setLoadingApps] = useState(true)

  const [acceptToast, setAcceptToast] = useState<string | null>(null)

  const [acceptingId, setAcceptingId] = useState<string | null>(null)

  // Edit states

  const [editTitle, setEditTitle] = useState(gig.title)

  const [editType, setEditType] = useState(gig.type)

  const [editBudget, setEditBudget] = useState(gig.budget)

  const [editLocation, setEditLocation] = useState(gig.location)

  const [editDeadline, setEditDeadline] = useState(
    gig.deadline || "Aug 30, 2026",
  )

  const [editDescription, setEditDescription] = useState(gig.description || "")

  const [saving, setSaving] = useState(false)

  const [saveSuccess, setSaveSuccess] = useState(false)

  // Status state

  const [gigStatus, setGigStatus] = useState((gig as any).status || "Active")

  // Real-time Firestore applications fetch

  useEffect(() => {
    setLoadingApps(true)

    const qApps = query(
      collection(db, "applications"),
      where("gigId", "==", gig.id),
    )

    const unsubscribe = onSnapshot(
      qApps,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))

        setApplications(list)

        setLoadingApps(false)
      },
      (err) => {
        console.warn("Apps snapshot error:", err)

        setLoadingApps(false)
      },
    )

    return () => unsubscribe()
  }, [gig.id])

  const handleSaveGig = async () => {
    if (!editTitle.trim()) return

    setSaving(true)

    setSaveSuccess(false)

    try {
      const qGigs = query(collection(db, "gigs"), where("id", "==", gig.id))

      const snap = await getDocs(qGigs)

      if (!snap.empty) {
        await updateDoc(snap.docs[0].ref, {
          title: editTitle,

          type: editType,

          budget: editBudget,

          location: editLocation,

          deadline: editDeadline,

          description: editDescription,

          status: gigStatus,
        })
      } else {
        await setDoc(
          doc(db, "gigs", String(gig.id)),
          {
            ...gig,

            title: editTitle,

            type: editType,

            budget: editBudget,

            location: editLocation,

            deadline: editDeadline,

            description: editDescription,

            status: gigStatus,
          },
          { merge: true },
        )
      }

      setSaveSuccess(true)

      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err: any) {
      alert(err.message || "Failed to update gig in database")
    } finally {
      setSaving(false)
    }
  }

  const acceptApplicant = async (app: any) => {
    if (
      !window.confirm(
        `Accept ${app.applicantName || "this creator"} for this gig?`,
      )
    )
      return
    setAcceptingId(app.id)
    try {
      const qGigs = query(collection(db, "gigs"), where("id", "==", gig.id))
      const snap = await getDocs(qGigs)
      if (!snap.empty) {
        await updateDoc(snap.docs[0].ref, {
          applicantSelected: true,
          selectedApplicantUid: app.applicantUid || null,
          selectedApplicantName: app.applicantName || "Creator",
          selectedApplicantAvatar: app.applicantAvatar || null,
          selectedApplicantHandle: app.instaHandle || app.applicantHandle || "",
          status: "Closed",
        })
      }
      // Update the application doc status too
      try {
        const qApp = query(
          collection(db, "applications"),
          where("gigId", "==", gig.id),
        )
        const appSnap = await getDocs(qApp)
        appSnap.docs.forEach(async (d) => {
          await updateDoc(d.ref, {
            status: d.id === app.id ? "accepted" : "rejected",
          })
        })

        // Send Push Notification for Application Accepted
        if (app.applicantUid) {
          await addDoc(collection(db, "notifications"), {
            recipientUid: app.applicantUid,
            recipientName: app.applicantName || "Creator",
            senderName: gig.creatorName || "Gig Owner",
            senderAvatar:
              gig.avatar ||
              "https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=80&h=80&fit=crop&auto=format",
            title: "Application Accepted!",
            message: `Congratulations! Your application for "${gig.title}" was accepted by ${gig.creatorName}!`,
            type: "application",
            category: "activity",
            actionText: "Open Chat",
            read: false,
            createdAt: new Date().toISOString(),
            avatar:
              gig.avatar ||
              "https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=80&h=80&fit=crop&auto=format",
          })
        }
      } catch (_) {}
      setAcceptToast(app.applicantName || "Creator")
      setTimeout(() => setAcceptToast(null), 4000)
    } catch (err: any) {
      alert(err.message || "Failed to accept applicant")
    } finally {
      setAcceptingId(null)
    }
  }

  const toggleGigStatus = async () => {
    const nextStatus = gigStatus === "Active" ? "Closed" : "Active"

    setGigStatus(nextStatus)

    try {
      const qGigs = query(collection(db, "gigs"), where("id", "==", gig.id))

      const snap = await getDocs(qGigs)

      if (!snap.empty) {
        await updateDoc(snap.docs[0].ref, { status: nextStatus })
      }
    } catch (err) {
      console.warn("Status update error:", err)
    }
  }

  return (
    <div className="flex flex-col flex-1 overflow-y-auto scrollbar-hide bg-[#f8fafc] min-h-screen pb-24">
      {/* Accept Toast */}
      {acceptToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <span>✅</span> {acceptToast} accepted! Gig is now closed.
        </div>
      )}

      {/* Top Header */}
      <div className="px-5 pt-12 pb-4 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-20 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 shadow-sm flex items-center justify-center border border-slate-200 text-slate-700 active:scale-95 transition cursor-pointer"
          >
            <ArrowLeftIcon />
          </button>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Gig Management
            </div>
            <div className="text-sm font-black text-slate-900 leading-tight max-w-[180px] truncate">
              {gig.title}
            </div>
          </div>
        </div>

        <button
          onClick={toggleGigStatus}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm ${
            gigStatus === "Active"
              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              gigStatus === "Active"
                ? "bg-emerald-500 animate-pulse"
                : "bg-slate-400"
            }`}
          />
          {gigStatus}
        </button>
      </div>

      {/* Hero Banner */}
      <div className="px-5 pt-5 pb-3">
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <img
              src={
                gig.avatar ||
                gig.brandLogo ||
                "https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=80&h=80&fit=crop&auto=format"
              }
              alt=""
              className="w-12 h-12 rounded-full object-cover border-2 border-[#e8edff]"
            />
            <div className="flex-1">
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold text-slate-900">
                  {gig.creatorName || gig.brand}
                </span>
                {gig.verified && (
                  <span className="text-[#3b5bdb] text-xs">✓</span>
                )}
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {gig.handle}
              </span>
            </div>
          </div>

          <div>
            <h2 className="text-base font-extrabold text-slate-900 leading-snug mb-2">
              {gig.title}
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${TYPE_COLORS[gig.type] || "bg-slate-100"}`}
              >
                {gig.type}
              </span>
              <span className="text-xs font-bold text-slate-800 bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-100">
                {formatBudget(gig.budget, gig.type)}
              </span>
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <MapPinIcon /> {formatLocation(gig.location)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-50 text-center">
            <div className="bg-slate-50 rounded-2xl py-2 px-1">
              <div className="text-xs font-black text-[#3b5bdb]">
                {applications.length}
              </div>
              <div className="text-[9px] text-slate-400 font-semibold">
                Applicants
              </div>
            </div>
            <div className="bg-slate-50 rounded-2xl py-2 px-1">
              <div className="text-xs font-black text-[#f76707]">
                {gig.type}
              </div>
              <div className="text-[9px] text-slate-400 font-semibold">
                Deal Type
              </div>
            </div>
            <div className="bg-slate-50 rounded-2xl py-2 px-1">
              <div className="text-[9.5px] font-bold text-emerald-600">
                {formatDeadline(gig.deadline) || "30-08-26"}
              </div>
              <div className="text-[9px] text-slate-400 font-semibold">
                Deadline
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="px-5 mb-4">
        <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-slate-100 gap-1">
          <button
            onClick={() => setActiveTab("applicants")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "applicants"
                ? "bg-[#3b5bdb] text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>👥</span> Applicants ({applications.length})
          </button>
          <button
            onClick={() => setActiveTab("edit")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "edit"
                ? "bg-[#3b5bdb] text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>✏️</span> Edit Gig Details
          </button>
        </div>
      </div>

      {/* TAB 1: APPLICANTS */}
      {activeTab === "applicants" && (
        <div className="px-5 flex flex-col gap-3">
          {loadingApps ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-3 border-slate-200 border-t-[#3b5bdb] animate-spin" />
              <span className="text-xs text-slate-400 font-medium">
                Fetching real-time applications...
              </span>
            </div>
          ) : applications.length > 0 ? (
            applications.map((app) => {
              const isAccepted = app.status === "accepted"
              const isRejected = app.status === "rejected"
              return (
                <div
                  key={app.id}
                  className={`bg-white rounded-3xl p-4 shadow-sm border flex flex-col gap-3 transition ${
                    isAccepted
                      ? "border-emerald-300 bg-emerald-50/40"
                      : isRejected
                        ? "border-slate-100 opacity-50"
                        : "border-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition"
                      onClick={() =>
                        onCreatorClick &&
                        onCreatorClick(app.applicantName || "Creator")
                      }
                    >
                      <div className="relative">
                        <img
                          src={
                            app.applicantAvatar ||
                            "https://images.unsplash.com/photo-1624610261655-777af2f586d7?w=80&h=80&fit=crop&auto=format"
                          }
                          alt=""
                          className="w-11 h-11 rounded-full object-cover border-2 border-slate-100"
                        />
                        {isAccepted && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[10px] font-black">
                            ✓
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-900 underline-offset-2 hover:underline">
                            {app.applicantName || "Creator"}
                          </h4>
                          {isAccepted && (
                            <span className="text-[8px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                              Selected
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {app.instaHandle || app.applicantHandle || "@creator"}
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {app.expectedRate || "Standard Rate"}
                    </span>
                  </div>

                  {app.pitch && (
                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-xs text-slate-600 leading-relaxed italic">
                      "{app.pitch}"
                    </div>
                  )}

                  {/* Applicant extra info */}
                  <div className="flex gap-2 flex-wrap">
                    {app.availability && (
                      <span className="text-[9px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                        🗓 {app.availability}
                      </span>
                    )}
                    {app.portfolio && (
                      <a
                        href={app.portfolio}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[9px] font-bold bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full"
                      >
                        🔗 Portfolio
                      </a>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1 gap-2">
                    <span className="text-[9px] text-slate-400 font-semibold">
                      Applied:{" "}
                      {app.appliedAt
                        ? new Date(app.appliedAt).toLocaleDateString()
                        : "Recently"}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          onOpenChat &&
                          onOpenChat(
                            app.applicantName || "Creator",
                            app.applicantAvatar ||
                              "https://images.unsplash.com/photo-1624610261655-777af2f586d7?w=80&h=80&fit=crop&auto=format",
                          )
                        }
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-sm cursor-pointer active:scale-95 transition flex items-center gap-1"
                      >
                        💬 Chat
                      </button>

                      {!isAccepted && !isRejected && (
                        <button
                          disabled={acceptingId === app.id}
                          onClick={() => acceptApplicant(app)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-sm cursor-pointer active:scale-95 transition flex items-center gap-1 disabled:opacity-60"
                        >
                          {acceptingId === app.id ? (
                            <svg
                              className="animate-spin w-3 h-3"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="white"
                                strokeWidth="3"
                                strokeDasharray="60"
                                strokeDashoffset="20"
                              />
                            </svg>
                          ) : (
                            "✅ Accept"
                          )}
                        </button>
                      )}

                      {isAccepted && (
                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl flex items-center gap-1">
                          ✅ Accepted
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm flex flex-col items-center gap-3">
              <span className="text-4xl">📩</span>
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">
                  No Applications Received Yet
                </h3>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  Your gig is live in the Browse Gigs feed! Creators and brands
                  across Kolkata will discover and pitch here soon.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EDIT GIG DETAILS */}
      {activeTab === "edit" && (
        <div className="px-5">
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-0.5">
                Edit Campaign Specifications
              </h3>
              <p className="text-[10px] text-slate-400">
                Updates saved here sync instantly across the entire platform.
              </p>
            </div>

            {saveSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold p-3 rounded-2xl flex items-center gap-2 animate-in fade-in">
                <span>✓</span> Gig details updated successfully in Database!
              </div>
            )}

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Gig Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 outline-none focus:border-[#3b5bdb] focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Deal Type
                  </label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 outline-none focus:border-[#3b5bdb] focus:bg-white transition"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Barter">Barter</option>
                    <option value="PR Package">PR Package</option>
                    <option value="Event RSVP">Event RSVP</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 outline-none focus:border-[#3b5bdb] focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Budget / Offer
                  </label>
                  <input
                    type="text"
                    value={editBudget}
                    onChange={(e) => setEditBudget(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 outline-none focus:border-[#3b5bdb] focus:bg-white transition"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Deadline
                  </label>
                  <input
                    type="text"
                    value={editDeadline}
                    onChange={(e) => setEditDeadline(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 outline-none focus:border-[#3b5bdb] focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Description & Requirements
                </label>
                <textarea
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 outline-none focus:border-[#3b5bdb] focus:bg-white transition resize-none leading-relaxed"
                />
              </div>

              <button
                onClick={handleSaveGig}
                disabled={saving || !editTitle.trim()}
                className="w-full bg-[#3b5bdb] text-white text-xs font-bold py-3.5 rounded-2xl shadow-md shadow-blue-200 active:scale-98 transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 mt-2"
              >
                {saving ? (
                  <>
                    <svg
                      className="animate-spin w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="white"
                        strokeWidth="3"
                        strokeDasharray="60"
                        strokeDashoffset="20"
                      />
                    </svg>
                    Saving Changes…
                  </>
                ) : (
                  "Save Changes to Database 💾"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Helper: Resolve Gig Poster Details ───────────────────────────────────────

function resolveGigPosterDetails(
  gig: Gig,
  userProfile?: any,
  creators: Creator[] = [],
  brands: Brand[] = [],
) {
  const isOwner = !!(
    userProfile &&
    ((auth.currentUser && (gig as any).userId === auth.currentUser.uid) ||
      (userProfile.name &&
        userProfile.name.toLowerCase() === gig.creatorName?.toLowerCase()) ||
      (userProfile.handle &&
        userProfile.handle.toLowerCase() === gig.handle?.toLowerCase()) ||
      (userProfile.name &&
        userProfile.name.toLowerCase() === gig.brand?.toLowerCase()))
  )

  const matchedCreator = creators.find(
    (c) =>
      ((gig as any).userId && (c as any).uid === (gig as any).userId) ||
      (c.handle &&
        gig.handle &&
        c.handle.toLowerCase() === gig.handle.toLowerCase()),
  )

  const matchedBrand = brands.find(
    (b) =>
      ((gig as any).userId && (b as any).uid === (gig as any).userId) ||
      (b.name && gig.brand && b.name.toLowerCase() === gig.brand.toLowerCase()),
  )

  const avatar = isOwner
    ? userProfile.avatar ||
      userProfile.logo ||
      gig.avatar ||
      gig.brandLogo ||
      "https://images.unsplash.com/photo-1624610261655-777af2f586d7?w=80&h=80&fit=crop&auto=format"
    : matchedCreator?.avatar ||
      gig.avatar ||
      gig.brandLogo ||
      matchedBrand?.logo ||
      "https://images.unsplash.com/photo-1624610261655-777af2f586d7?w=80&h=80&fit=crop&auto=format"

  const name = isOwner
    ? userProfile.name || gig.creatorName
    : matchedCreator?.name || gig.creatorName || matchedBrand?.name

  const handle = isOwner
    ? userProfile.handle || gig.handle
    : gig.handle || matchedCreator?.handle || "@brand"

  const verified = isOwner
    ? (userProfile.verified ?? gig.verified)
    : (gig.verified ??
      matchedCreator?.verified ??
      matchedBrand?.verified ??
      true)

  const followers = isOwner
    ? userProfile.followers || gig.followers
    : gig.followers || matchedCreator?.followers || "50K"

  return { avatar, name, handle, verified, followers, isOwner }
}

// ── Home Page ──────────────────────────────────────────────────────────────

function HomePage({
  savedGigs,

  toggleSave,

  onApply,

  onBellClick,

  unreadCount,

  onCreatorClick,

  onBrandClick,

  onEventClick,

  onSelectEvent,

  onSearch,

  gigs = GIGS,

  events = EVENTS,

  creators = CREATORS,

  brands = BRANDS,

  userProfile,

  onProfileClick,

  onShareGig,

  userAppliedGigIds,
}: {
  savedGigs: Set<number>

  toggleSave: (id: number) => void

  onApply: (gig: Gig) => void

  onBellClick: () => void

  unreadCount: number

  onCreatorClick: (name: string) => void

  onBrandClick?: (brand: Brand) => void

  onEventClick: () => void

  onSelectEvent?: (event: Event) => void

  onSearch: (query: string) => void

  gigs?: Gig[]

  events?: Event[]

  creators?: Creator[]

  brands?: Brand[]

  userProfile?: any

  onProfileClick?: () => void

  onShareGig: (gig: Gig) => void

  userAppliedGigIds?: Set<number>
}) {
  const [activeFilter, setActiveFilter] = useState("All Gigs")

  const [activeNiche, setActiveNiche] = useState("All")

  const [localSearch, setLocalSearch] = useState("")

  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [filterLocation, setFilterLocation] = useState("All")
  const [filterBudget, setFilterBudget] = useState("All")

  const userAvatar =
    userProfile?.avatar ||
    userProfile?.logo ||
    "https://images.unsplash.com/photo-1624610261655-777af2f586d7?w=80&h=80&fit=crop&auto=format"

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearch(localSearch)
    }
  }

  const isGigExpired = (deadline: string): boolean => {
    if (!deadline) return false
    const parsed = new Date(deadline)
    if (isNaN(parsed.getTime())) return false
    // Gig expires at 00:00 of the day after deadline
    const expiry = new Date(parsed)
    expiry.setDate(expiry.getDate() + 1)
    expiry.setHours(0, 0, 0, 0)
    return new Date() >= expiry
  }

  const activeFilterCount =
    (activeFilter !== "All Gigs" ? 1 : 0) +
    (activeNiche !== "All" ? 1 : 0) +
    (filterLocation !== "All" ? 1 : 0) +
    (filterBudget !== "All" ? 1 : 0)

  const filteredGigs = gigs
    .filter((g) => {
      // Remove expired gigs
      if (isGigExpired((g as any).deadline || "")) return false

      const matchType =
        activeFilter === "All Gigs" ||
        g.type === activeFilter

      const matchNiche =
        activeNiche === "All" ||
        g.niche.includes(activeNiche) ||
        g.tags.includes(activeNiche)

      const matchLocation =
        filterLocation === "All" ||
        ((g as any).location || "").toLowerCase().includes(filterLocation.toLowerCase())

      const matchBudget = (() => {
        if (filterBudget === "All") return true
        const budget = (g.budget || "").toLowerCase()
        if (filterBudget === "Free / Barter") return g.type === "Barter" || g.type === "Collab"
        if (filterBudget === "Under ₹10k") return budget.includes("₹") && !budget.includes("20,000") && !budget.includes("35,000") && !budget.includes("15,000")
        if (filterBudget === "₹10k – ₹30k") return budget.includes("15,000") || budget.includes("20,000")
        if (filterBudget === "₹30k+") return budget.includes("35,000")
        return true
      })()

      return matchType && matchNiche && matchLocation && matchBudget
    })
    .sort((a, b) => {
      const aFeat = (a as any).isFeatured ? 1 : 0

      const bFeat = (b as any).isFeatured ? 1 : 0

      if (bFeat !== aFeat) {
        return bFeat - aFeat
      }

      return (b.id || 0) - (a.id || 0)
    })

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide pb-28">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-0.5">
              <MapPinIcon />
              <span>Kolkata, West Bengal</span>
            </div>
            <h1 className="font-display text-[22px] font-black text-slate-900 leading-tight tracking-tight">
              Kreator <span className="text-[#3b5bdb]">Kolkata</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onBellClick}
              className="relative w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-600 border border-slate-100 transition active:scale-95"
            >
              <BellIcon />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#f76707] text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>
            <img
              src={userAvatar}
              alt="Profile"
              onClick={onProfileClick}
              className="w-10 h-10 rounded-full object-cover border-2 border-[#3b5bdb] cursor-pointer hover:opacity-90 transition active:scale-95"
            />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-5 mb-5">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2.5 bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-100">
            <span
              onClick={() => onSearch(localSearch)}
              className="text-slate-400 cursor-pointer"
            >
              <SearchIcon />
            </span>
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search gigs, creators, brands…"
              className="flex-1 text-sm text-slate-700 placeholder:text-slate-400 outline-none bg-transparent font-medium"
            />
          </div>
          <button
            onClick={() => setShowFilterPanel(true)}
            className={`relative w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md transition active:scale-95 ${
              activeFilterCount > 0
                ? "bg-[#f76707] shadow-orange-200"
                : "bg-[#3b5bdb] shadow-blue-200"
            }`}
          >
            <FilterIcon />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-[#f76707] text-[9px] font-black rounded-full flex items-center justify-center border border-orange-200 shadow-sm">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Events */}
      <div className="mb-6">
        <div className="flex items-center justify-between px-5 mb-3">
          <h2 className="text-base font-bold text-slate-900">
            Upcoming Events 🎉
          </h2>
          <button
            onClick={onEventClick}
            className="text-xs font-semibold text-[#3b5bdb]"
          >
            See all →
          </button>
        </div>
        <div className="flex gap-4 px-5 overflow-x-auto scrollbar-hide pb-1">
          {events.map((event) => (
            <div
              key={event.id}
              onClick={() =>
                onSelectEvent ? onSelectEvent(event) : onEventClick()
              }
              className="min-w-[280px] w-[280px] h-[110px] rounded-3xl overflow-hidden shadow-sm border border-slate-100 cursor-pointer flex-shrink-0 bg-white transition-transform active:scale-[0.98] relative"
            >
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              {(event as any).isFeatured && (
                <span className="absolute top-2 right-2 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-md">
                  ⭐ FEATURED
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Featured Network Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between px-5 mb-2.5">
          <h2 className="text-base font-bold text-slate-900">
            Featured Network 🌟
          </h2>
          <span className="text-[11px] font-semibold text-slate-400">
            Creators & Brands
          </span>
        </div>
        <div className="flex gap-2.5 px-5 overflow-x-auto scrollbar-hide pb-1">
          {creators.slice(0, 6).map((creator) => (
            <div
              key={creator.id}
              onClick={() => onCreatorClick(creator.name)}
              className="flex items-center gap-2 bg-white rounded-full pl-1.5 pr-3.5 py-1.5 border border-slate-100 shadow-sm flex-shrink-0 cursor-pointer transition active:scale-95 hover:border-slate-200"
            >
              <img
                src={creator.avatar}
                alt={creator.name}
                className="w-7 h-7 rounded-full object-cover border border-[#e8edff]"
              />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-800 leading-none">
                  {creator.name}
                </span>
                <span className="text-[9px] text-[#3b5bdb] font-semibold leading-none mt-0.5">
                  {creator.niche}
                </span>
              </div>
            </div>
          ))}
          {brands.slice(0, 4).map((brand) => (
            <div
              key={brand.id}
              onClick={() => onBrandClick && onBrandClick(brand)}
              className="flex items-center gap-2 bg-[#f0f4ff] rounded-full pl-1.5 pr-3.5 py-1.5 border border-blue-100 shadow-sm flex-shrink-0 cursor-pointer transition active:scale-95 hover:border-blue-200"
            >
              <img
                src={brand.logo}
                alt={brand.name}
                className="w-7 h-7 rounded-full object-cover border border-white"
              />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#3b5bdb] leading-none">
                  {brand.name}
                </span>
                <span className="text-[9px] text-slate-400 font-medium leading-none mt-0.5">
                  {brand.industry}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="px-5 mb-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-900">Browse Gigs</h2>
          <span className="text-xs text-slate-500 font-medium">
            {filteredGigs.length} found
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeFilter === f
                  ? "bg-[#3b5bdb] text-white shadow-md shadow-blue-200"
                  : "bg-white text-slate-500 border border-slate-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {NICHES.map((n) => (
            <button
              key={n}
              onClick={() => setActiveNiche(n)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                activeNiche === n
                  ? "bg-[#f76707] text-white"
                  : "bg-[#e8edff] text-[#3b5bdb]"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Panel Overlay */}
      {showFilterPanel && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-[2px]"
            onClick={() => setShowFilterPanel(false)}
          />
          <div className="fixed bottom-0 inset-x-0 max-w-[430px] mx-auto z-50 bg-white rounded-t-[28px] shadow-2xl border-t border-slate-100 flex flex-col max-h-[80vh]">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>
            {/* Header */}
            <div className="px-5 pt-3 pb-4 flex items-center justify-between border-b border-slate-100">
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Refine Search</div>
                <div className="text-base font-black text-slate-900">Filter Gigs</div>
              </div>
              <button
                onClick={() => { setActiveFilter("All Gigs"); setActiveNiche("All"); setFilterLocation("All"); setFilterBudget("All") }}
                className="text-[11px] font-bold text-[#f76707] bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100 cursor-pointer"
              >
                Clear All
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-6 scrollbar-hide">
              {/* Type Filter */}
              <div>
                <div className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3">Gig Type</div>
                <div className="flex flex-wrap gap-2">
                  {["All Gigs", "Paid", "Barter", "Collab"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setActiveFilter(f)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        activeFilter === f
                          ? "bg-[#3b5bdb] text-white shadow-md shadow-blue-200"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {f === "Paid" ? "💰 Paid" : f === "Barter" ? "🔄 Barter" : f === "Collab" ? "🤝 Collab" : "✨ All Gigs"}
                    </button>
                  ))}
                </div>
              </div>
              {/* Niche Filter */}
              <div>
                <div className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3">Category / Niche</div>
                <div className="flex flex-wrap gap-2">
                  {["All", "Fashion", "Food", "Photography", "Video", "Wellness"].map((n) => (
                    <button
                      key={n}
                      onClick={() => setActiveNiche(n)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        activeNiche === n
                          ? "bg-[#f76707] text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              {/* Location Filter */}
              <div>
                <div className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3">Location</div>
                <div className="flex flex-wrap gap-2">
                  {["All", "North Kolkata", "Park Street", "Salt Lake", "New Town"].map((loc) => (
                    <button
                      key={loc}
                      onClick={() => setFilterLocation(loc)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        filterLocation === loc
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {loc === "All" ? "📍 All" : loc}
                    </button>
                  ))}
                </div>
              </div>
              {/* Budget Filter */}
              <div>
                <div className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3">Budget Range</div>
                <div className="flex flex-wrap gap-2">
                  {["All", "Free / Barter", "Under ₹10k", "₹10k – ₹30k", "₹30k+"].map((b) => (
                    <button
                      key={b}
                      onClick={() => setFilterBudget(b)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        filterBudget === b
                          ? "bg-violet-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {/* Apply Button */}
            <div className="px-5 py-4 border-t border-slate-100">
              <button
                onClick={() => setShowFilterPanel(false)}
                className="w-full py-3.5 rounded-2xl bg-[#3b5bdb] text-white font-black text-sm shadow-lg shadow-blue-200 active:scale-[0.98] transition cursor-pointer"
              >
                Show {filteredGigs.length} Gig{filteredGigs.length !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Gig Cards */}
      <div className="px-5 flex flex-col gap-3">
        {filteredGigs.map((gig, i) => {
          const isFeat = !!(gig as any).isFeatured

          const poster = resolveGigPosterDetails(
            gig,
            userProfile,
            creators,
            brands,
          )

          const displayAvatar = poster.avatar

          const displayName = poster.name

          const displayHandle = poster.handle

          const isVerified = poster.verified

          const displayFollowers = poster.followers

          const hasInstagram = displayFollowers && displayFollowers !== "0"

          return (
            <div
              key={gig.id}
              onClick={() => onApply(gig)}
              className={`bg-white rounded-3xl overflow-hidden shadow-sm border cursor-pointer transition-transform active:scale-[0.98] ${
                isFeat
                  ? "border-2 border-[#3b5bdb] shadow-blue-100"
                  : "border-slate-100"
              }`}
            >
              {isFeat && (
                <div className="bg-[#3b5bdb] px-4 py-1.5 flex items-center justify-between">
                  <span className="text-white text-[11px] font-bold tracking-wide">
                    ⚡ Featured Gig
                  </span>
                  <span className="text-[9px] font-black text-amber-300 bg-blue-900/40 px-2 py-0.5 rounded-full">
                    ⭐ FEATURED
                  </span>
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div
                    onClick={(e) => {
                      e.stopPropagation()
                      onCreatorClick(displayName)
                    }}
                    className="flex items-center gap-3 cursor-pointer hover:opacity-85"
                  >
                    <div className="relative">
                      <img
                        src={displayAvatar}
                        alt={displayName}
                        className="w-11 h-11 rounded-full object-cover border-2 border-[#e8edff]"
                      />
                      {isVerified && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#3b5bdb] rounded-full flex items-center justify-center">
                          <svg
                            width="8"
                            height="8"
                            viewBox="0 0 10 10"
                            fill="none"
                          >
                            <path
                              d="M2 5l2 2 4-4"
                              stroke="white"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              fill="none"
                            />
                          </svg>
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-900">
                        {displayName}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 font-medium">
                          {displayHandle}
                        </span>
                        {hasInstagram && (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold text-[#e4405f] bg-rose-50 px-1.5 py-0.5 rounded-full">
                            <InstagramIcon />
                            {displayFollowers}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onShareGig(gig)
                    }}
                    className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:text-[#3b5bdb] hover:bg-blue-50 active:scale-90 transition cursor-pointer"
                    title="Share Gig"
                  >
                    <ShareIcon />
                  </button>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-2 leading-snug">
                  {gig.title}
                </h3>
                <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${TYPE_COLORS[gig.type]}`}
                  >
                    {gig.type}
                  </span>
                  {gig.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-slate-400 font-medium mb-0.5">
                      Budget / Offer
                    </div>
                    <div className="text-sm font-bold text-slate-800">
                      {formatBudget(gig.budget, gig.type)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 font-medium">
                        {gig.applicants} applied
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <MapPinIcon />
                        <span className="font-medium">
                          {formatLocation(gig.location)}
                        </span>
                      </div>
                    </div>
                    {(gig as any).applicantSelected && !poster.isOwner ? (
                      <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl flex items-center gap-1 whitespace-nowrap">
                        ✅ Selected
                      </span>
                    ) : userAppliedGigIds?.has(gig.id) && !poster.isOwner ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1 whitespace-nowrap">
                        ✓ Applied
                      </span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onApply(gig)
                        }}
                        className="bg-[#3b5bdb] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm shadow-blue-200 whitespace-nowrap"
                      >
                        {poster.isOwner ? "View Applications" : "Apply ↗"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Post Gig Page ──────────────────────────────────────────────────────────

const NICHE_OPTIONS = [
  "Fashion & Lifestyle",
  "Food & Travel",
  "Photography",
  "Video & Editing",
  "Health & Wellness",
  "Music & Audio",
  "Art & Design",
  "Tech & Gaming",
  "Education",
  "Other",
]

const TAG_OPTIONS = [
  "Reel",
  "Story",
  "Feed Post",
  "YouTube",
  "Collab",
  "Street",
  "Review",
  "Production",
  "BTS",
  "Podcast",
]

const LOCATION_OPTIONS = [
  "North Kolkata",
  "South Kolkata",
  "Salt Lake",
  "New Town",
  "Park Street",
  "Howrah",
  "Remote / Anywhere",
]

function PostGigPage({
  onBack,

  onPosted,

  userProfile,

  userRole,

  currentUser,
}: {
  onBack: () => void

  onPosted: () => void

  userProfile?: any

  userRole?: any

  currentUser?: any
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1)

  const [submitting, setSubmitting] = useState(false)

  // Step 1

  const [title, setTitle] = useState("")

  const [gigType, setGigType] = useState("")

  const [niche, setNiche] = useState(
    userProfile?.niche || userProfile?.industry || "",
  )

  const [description, setDescription] = useState("")

  // Step 2

  const [budget, setBudget] = useState("")

  const [budgetNote, setBudgetNote] = useState("")

  const [deadline, setDeadline] = useState("")

  const [location, setLocation] = useState(
    userProfile?.location || "Kolkata, WB",
  )

  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const [deliverable, setDeliverable] = useState("")

  const [deliverables, setDeliverables] = useState<string[]>([])

  // Step 3

  const [brand, setBrand] = useState(userProfile?.name || "")

  const [contactMode, setContactMode] = useState("")

  const [minFollowers, setMinFollowers] = useState("")

  const [brandLogoUrl, setBrandLogoUrl] = useState<string | null>(null)

  const brandLogoInputRef = useRef<HTMLInputElement>(null)

  const handleBrandLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (!file) return

    const reader = new FileReader()

    reader.onload = (ev) => setBrandLogoUrl(ev.target?.result as string)

    reader.readAsDataURL(file)
  }

  useEffect(() => {
    if (userProfile?.name && !brand) {
      setBrand(userProfile.name)
    }
  }, [userProfile])

  const [errors, setErrors] = useState<Record<string, string>>({})

  const toggleTag = (t: string) =>
    setSelectedTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    )

  const addDeliverable = () => {
    if (deliverable.trim()) {
      setDeliverables((p) => [...p, deliverable.trim()])

      setDeliverable("")
    }
  }

  const validateStep1 = () => {
    const e: Record<string, string> = {}

    if (!title.trim()) e.title = "Gig title is required"

    if (!gigType) e.gigType = "Select a gig type"

    if (!niche) e.niche = "Select a niche"

    if (!description.trim()) e.description = "Add a description"

    return e
  }

  const validateStep2 = () => {
    const e: Record<string, string> = {}

    if (!budget.trim()) e.budget = "Add an offer or budget"

    if (!location) e.location = "Select a location"

    return e
  }

  const handleNext = () => {
    if (step === 1) {
      const e = validateStep1()

      if (Object.keys(e).length) {
        setErrors(e)
        return
      }

      setErrors({})

      setStep(2)
    } else if (step === 2) {
      const e = validateStep2()

      if (Object.keys(e).length) {
        setErrors(e)
        return
      }

      setErrors({})

      setStep(3)
    }
  }

  const handlePost = async () => {
    setSubmitting(true)

    try {
      const newGigId = Date.now()

      const posterName =
        userProfile?.name ||
        (userRole === "brand" ? "Kreator Brand" : "Kreator Creator")

      const posterHandle =
        userProfile?.handle ||
        `@${posterName.toLowerCase().replace(/\s+/g, "")}`

      const posterAvatar =
        userProfile?.avatar ||
        userProfile?.logo ||
        (userRole === "brand"
          ? "https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=80&h=80&fit=crop&auto=format"
          : "https://images.unsplash.com/photo-1624610261655-777af2f586d7?w=80&h=80&fit=crop&auto=format")

      const posterFollowers =
        userProfile?.followers || (userRole === "brand" ? "45K" : "18.5K")

      const posterVerified = userProfile?.verified ?? true

      const newGig: Gig = {
        id: newGigId,

        userId: userProfile?.uid || currentUser?.uid || null,

        posterUid: userProfile?.uid || currentUser?.uid || null,

        creatorName: posterName,

        handle: posterHandle,

        avatar: posterAvatar,

        followers: posterFollowers,

        niche:
          niche ||
          userProfile?.niche ||
          userProfile?.industry ||
          "Retail & Fashion",

        title: title || "New Campaign Gig",

        type: gigType as any || "Paid",

        budget: budget || "₹5,000 – ₹10,000",

        tags: selectedTags.length ? selectedTags : ["Campaign", "Collab"],

        location: location || userProfile?.location || "Kolkata, WB",

        verified: posterVerified,

        applicants: 0,

        description: description || "New gig posted on Kreator Kolkata.",

        deliverables: deliverables.length
          ? deliverables
          : ["1 Reel", "2 Stories"],

        deadline: deadline || "Aug 30, 2026",

        brand: brand.trim() || posterName,

        brandLogo: brandLogoUrl || posterAvatar,
      }

      await setDoc(doc(db, "gigs", String(newGigId)), newGig)

      // 4. Send Push Notification for New Gig Created
      try {
        await addDoc(collection(db, "notifications"), {
          recipientUid: "all",
          recipientName: "Community",
          senderName: newGig.creatorName,
          senderUid: auth.currentUser?.uid || null,
          senderAvatar: newGig.avatar,
          title: `New Gig Posted: ${newGig.title}`,
          message: `${newGig.creatorName} posted a new gig "${newGig.title}" in ${newGig.niche}! Budget: ${newGig.budget}`,
          type: "gig",
          category: "activity",
          actionText: "View Gig",
          gigId: newGigId,
          read: false,
          createdAt: new Date().toISOString(),
          avatar: newGig.avatar,
        })
      } catch (e) {
        console.warn("Gig notification failed:", e)
      }

      onPosted()
    } catch (err: any) {
      alert(err.message || "Failed to post gig to database")
    } finally {
      setSubmitting(false)
    }
  }

  const progress = step === 1 ? 33 : step === 2 ? 66 : 100

  return (
    <div className="flex flex-col flex-1 min-h-screen">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 bg-[#f0f4ff] sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={
              step === 1 ? onBack : () => setStep((s) => (s - 1) as 1 | 2 | 3)
            }
            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center border border-slate-100 text-slate-700 flex-shrink-0"
          >
            <ArrowLeftIcon />
          </button>
          <div className="flex-1">
            <div className="text-[11px] text-slate-400 font-medium">
              Step {step} of 3
            </div>
            <div className="text-sm font-bold text-slate-900">
              {step === 1
                ? "Gig Basics"
                : step === 2
                  ? "Details & Budget"
                  : "Requirements & Publish"}
            </div>
          </div>
          <span className="text-xs font-bold text-[#3b5bdb]">{progress}%</span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#3b5bdb] rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pt-4 pb-36">
        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
              <div className="text-[11px] text-[#3b5bdb] font-bold uppercase tracking-wider mb-4">
                What's the Gig?
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                    Gig Title <span className="text-[#e4405f]">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value)
                      setErrors((p) => ({ ...p, title: "" }))
                    }}
                    placeholder="e.g. Brand Collab for Ethnic Fashion Launch"
                    className={`w-full bg-slate-50 border ${
                      errors.title ? "border-red-400" : "border-slate-200"
                    } rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#3b5bdb] transition`}
                  />
                  {errors.title && (
                    <p className="text-xs text-red-500 mt-1 font-medium">
                      {errors.title}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-2 block">
                    Gig Type <span className="text-[#e4405f]">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: "Paid", emoji: "💰", desc: "You pay" },

                      { val: "Barter", emoji: "🔄", desc: "Exchange" },

                      { val: "Collab", emoji: "🤝", desc: "Free collab" },
                    ].map(({ val, emoji, desc }) => (
                      <button
                        key={val}
                        onClick={() => {
                          setGigType(val)
                          setErrors((p) => ({ ...p, gigType: "" }))
                        }}
                        className={`flex flex-col items-center py-3 px-2 rounded-2xl border-2 transition ${
                          gigType === val
                            ? "border-[#3b5bdb] bg-[#e8edff]"
                            : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        <span className="text-xl mb-1">{emoji}</span>
                        <span
                          className={`text-xs font-bold ${
                            gigType === val
                              ? "text-[#3b5bdb]"
                              : "text-slate-600"
                          }`}
                        >
                          {val}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {desc}
                        </span>
                      </button>
                    ))}
                  </div>
                  {errors.gigType && (
                    <p className="text-xs text-red-500 mt-1 font-medium">
                      {errors.gigType}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-2 block">
                    Niche / Category <span className="text-[#e4405f]">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {NICHE_OPTIONS.map((n) => (
                      <button
                        key={n}
                        onClick={() => {
                          setNiche(n)
                          setErrors((p) => ({ ...p, niche: "" }))
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                          niche === n
                            ? "bg-[#3b5bdb] text-white border-[#3b5bdb]"
                            : "bg-slate-50 text-slate-500 border-slate-200"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  {errors.niche && (
                    <p className="text-xs text-red-500 mt-1 font-medium">
                      {errors.niche}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                    Description <span className="text-[#e4405f]">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value)
                      setErrors((p) => ({ ...p, description: "" }))
                    }}
                    placeholder="Describe the collaboration — what you're looking for, how it'll work, what the creator gets…"
                    className={`w-full bg-slate-50 border ${
                      errors.description ? "border-red-400" : "border-slate-200"
                    } rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#3b5bdb] transition resize-none`}
                  />
                  <div className="flex justify-between mt-1">
                    {errors.description ? (
                      <p className="text-xs text-red-500 font-medium">
                        {errors.description}
                      </p>
                    ) : (
                      <span />
                    )}
                    <span className="text-[10px] text-slate-400">
                      {description.length}/500
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
              <div className="text-[11px] text-[#3b5bdb] font-bold uppercase tracking-wider mb-4">
                Budget & Offer
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                    {gigType === "Paid"
                      ? "Fixed Budget"
                      : gigType === "Barter"
                        ? "What you offer"
                        : "What they get"}{" "}
                    <span className="text-[#e4405f]">*</span>
                  </label>
                  {gigType === "Paid" ? (
                    <div
                      className={`flex items-center gap-2 bg-slate-50 border ${
                        errors.budget ? "border-red-400" : "border-slate-200"
                      } rounded-2xl px-4 py-3 focus-within:border-[#3b5bdb] transition`}
                    >
                      <span className="text-slate-400 text-sm font-bold">
                        ₹
                      </span>
                      <input
                        type="number"
                        value={budget.startsWith("₹") ? "" : budget}
                        onChange={(e) => {
                          setBudget(e.target.value ? e.target.value : "")
                          setErrors((p) => ({ ...p, budget: "" }))
                        }}
                        placeholder="Enter amount e.g. 5000"
                        className="flex-1 text-sm text-slate-800 placeholder:text-slate-400 outline-none bg-transparent"
                      />
                    </div>
                  ) : (
                    <div
                      className={`flex items-center gap-2 bg-slate-50 border ${
                        errors.budget ? "border-red-400" : "border-slate-200"
                      } rounded-2xl px-4 py-3 focus-within:border-[#3b5bdb] transition`}
                    >
                      <input
                        type="text"
                        value={budget}
                        onChange={(e) => {
                          setBudget(e.target.value)
                          setErrors((p) => ({ ...p, budget: "" }))
                        }}
                        placeholder={
                          gigType === "Barter"
                            ? "e.g. Products + Credits"
                            : "e.g. Complimentary meal for 2"
                        }
                        className="flex-1 text-sm text-slate-800 placeholder:text-slate-400 outline-none bg-transparent"
                      />
                    </div>
                  )}
                  {errors.budget && (
                    <p className="text-xs text-red-500 mt-1 font-medium">
                      {errors.budget}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                    Additional Note{" "}
                    <span className="text-slate-400 font-normal">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={budgetNote}
                    onChange={(e) => setBudgetNote(e.target.value)}
                    placeholder="e.g. Negotiable for right fit"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#3b5bdb] transition"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
              <div className="text-[11px] text-[#3b5bdb] font-bold uppercase tracking-wider mb-4">
                Deliverables
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={deliverable}
                    onChange={(e) => setDeliverable(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addDeliverable()}
                    placeholder="e.g. 2 Instagram Reels"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#3b5bdb] transition"
                  />
                  <button
                    onClick={addDeliverable}
                    className="w-10 h-10 rounded-2xl bg-[#3b5bdb] flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                  >
                    +
                  </button>
                </div>
                {deliverables.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {deliverables.map((d, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2.5 bg-[#e8edff] rounded-xl px-3 py-2"
                      >
                        <div className="w-4 h-4 rounded-full bg-[#3b5bdb] flex items-center justify-center flex-shrink-0">
                          <svg
                            width="8"
                            height="8"
                            viewBox="0 0 10 10"
                            fill="none"
                          >
                            <path
                              d="M2 5l2 2 4-4"
                              stroke="white"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                        <span className="flex-1 text-xs font-semibold text-slate-700">
                          {d}
                        </span>
                        <button
                          onClick={() =>
                            setDeliverables((p) => p.filter((_, j) => j !== i))
                          }
                          className="text-slate-400 text-sm leading-none"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
              <div className="text-[11px] text-[#3b5bdb] font-bold uppercase tracking-wider mb-4">
                Logistics
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                    Application Deadline
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#3b5bdb] transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-2 block">
                    Location <span className="text-[#e4405f]">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {LOCATION_OPTIONS.map((l) => (
                      <button
                        key={l}
                        onClick={() => {
                          setLocation(l)
                          setErrors((p) => ({ ...p, location: "" }))
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                          location === l
                            ? "bg-[#3b5bdb] text-white border-[#3b5bdb]"
                            : "bg-slate-50 text-slate-500 border-slate-200"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                  {errors.location && (
                    <p className="text-xs text-red-500 mt-1 font-medium">
                      {errors.location}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-2 block">
                    Content Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TAG_OPTIONS.map((t) => (
                      <button
                        key={t}
                        onClick={() => toggleTag(t)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                          selectedTags.includes(t)
                            ? "bg-[#f76707] text-white border-[#f76707]"
                            : "bg-slate-50 text-slate-500 border-slate-200"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <div className="flex flex-col gap-5">
            {/* Preview card */}
            <div className="bg-[#3b5bdb] rounded-3xl p-5 shadow-lg">
              <div className="text-[10px] text-white/60 font-bold uppercase tracking-wider mb-2">
                Preview
              </div>
              <h3 className="text-white font-bold text-base mb-2 leading-snug">
                {title || "Your Gig Title"}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                {gigType && (
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      gigType === "Paid"
                        ? "bg-emerald-100 text-emerald-700"
                        : gigType === "Barter"
                          ? "bg-violet-100 text-violet-700"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {gigType}
                  </span>
                )}
                {niche && (
                  <span className="text-[10px] text-white/70 bg-white/15 px-2.5 py-0.5 rounded-full font-medium">
                    {niche}
                  </span>
                )}
                {selectedTags.slice(0, 2).map((t) => (
                  <span
                    key={t}
                    className="text-[10px] text-white/70 bg-white/15 px-2.5 py-0.5 rounded-full font-medium"
                  >
                    {t}
                  </span>
                ))}
              </div>
              {budget && (
                <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between">
                  <span className="text-white font-bold text-sm">
                    {gigType === "Paid" ? `₹${budget}` : budget}
                  </span>
                  {location && (
                    <span className="flex items-center gap-1 text-white/60 text-xs font-medium">
                      <MapPinIcon />
                      {location}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
              <div className="text-[11px] text-[#3b5bdb] font-bold uppercase tracking-wider mb-4">
                Creator Requirements
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                    Minimum Instagram Followers
                  </label>
                  <div className="flex gap-2">
                    {["Any", "1K+", "5K+", "10K+", "50K+", "100K+"].map((f) => (
                      <button
                        key={f}
                        onClick={() => setMinFollowers(f)}
                        className={`flex-1 py-2 rounded-xl text-[11px] font-bold border transition ${
                          minFollowers === f
                            ? "bg-[#3b5bdb] text-white border-[#3b5bdb]"
                            : "bg-slate-50 text-slate-500 border-slate-200"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                    Preferred Contact
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["In-App Chat", "Instagram DM", "WhatsApp"].map((c) => (
                      <button
                        key={c}
                        onClick={() => setContactMode(c)}
                        className={`py-2.5 px-2 rounded-xl text-[11px] font-bold border transition text-center ${
                          contactMode === c
                            ? "bg-[#3b5bdb] text-white border-[#3b5bdb]"
                            : "bg-slate-50 text-slate-500 border-slate-200"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                    Brand / Company Name{" "}
                    <span className="text-slate-400 font-normal">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Rang Bahar Textiles"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#3b5bdb] transition"
                  />
                </div>

                {/* Brand Logo Upload */}
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                    Brand Logo{" "}
                    <span className="text-slate-400 font-normal">
                      (optional)
                    </span>
                  </label>
                  <div className="flex items-center gap-3">
                    {/* Preview circle */}
                    <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {brandLogoUrl ? (
                        <img
                          src={brandLogoUrl}
                          alt="Brand logo"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#cbd5e1"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="3" y="3" width="18" height="18" rx="3" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="M21 15l-5-5L5 21" />
                        </svg>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 flex-1">
                      <button
                        onClick={() => brandLogoInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 bg-[#e8edff] hover:bg-[#dbe4ff] text-[#3b5bdb] text-xs font-bold py-2.5 rounded-xl transition cursor-pointer border border-[#c5d3ff]"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        {brandLogoUrl ? "Change Logo" : "Upload Logo"}
                      </button>
                      {brandLogoUrl && (
                        <button
                          onClick={() => setBrandLogoUrl(null)}
                          className="w-full text-xs font-bold text-slate-400 hover:text-red-500 transition py-1"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      ref={brandLogoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleBrandLogoUpload}
                    />
                  </div>
                  {brandLogoUrl && (
                    <p className="text-[10px] text-slate-400 font-medium mt-2">
                      ✓ Logo will be shown in gig details
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-[#e8edff] border border-[#c5d3ff] rounded-2xl px-4 py-3 flex gap-2.5">
              <span className="mt-0.5 flex-shrink-0">ℹ️</span>
              <p className="text-xs text-[#3b5bdb] leading-relaxed font-medium">
                Your gig will be reviewed and go live within a few minutes. You
                can edit or remove it anytime from your profile.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Sticky bottom CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-slate-100 px-5 py-4 z-20 shadow-xl">
        {step < 3 ? (
          <button
            onClick={handleNext}
            className="w-full bg-[#3b5bdb] text-white font-bold py-4 rounded-2xl shadow-md shadow-blue-200 text-base"
          >
            Continue →
          </button>
        ) : (
          <button
            onClick={handlePost}
            disabled={submitting}
            className="w-full bg-[#3b5bdb] text-white font-bold py-4 rounded-2xl shadow-md shadow-blue-200 text-base flex items-center justify-center gap-2 disabled:opacity-70 transition"
          >
            {submitting ? (
              <>
                <svg
                  className="animate-spin w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="white"
                    strokeWidth="3"
                    strokeDasharray="60"
                    strokeDashoffset="20"
                  />
                </svg>
                Publishing…
              </>
            ) : (
              "Post this Gig 🚀"
            )}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Gig Posted Success ─────────────────────────────────────────────────────

function GigPostedSuccess({
  onBack,

  onViewMyGigs,

  onShareInstagram,
}: {
  onBack: () => void

  onViewMyGigs: () => void

  onShareInstagram: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-16 text-center min-h-screen">
      <div className="relative mb-6">
        <div className="w-28 h-28 rounded-full bg-[#e8edff] flex items-center justify-center">
          <svg
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#3b5bdb"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22 11 13 2 9l20-7z" />
          </svg>
        </div>
        <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-[#f76707] flex items-center justify-center text-white text-base shadow-lg">
          🎉
        </div>
      </div>
      <h2 className="font-display text-2xl font-black text-slate-900 mb-2">
        Gig is Live!
      </h2>
      <p className="text-slate-500 text-sm mb-2 leading-relaxed max-w-[280px]">
        Your gig is now visible to creators across Kolkata. Sit back and watch
        the applications roll in.
      </p>
      <p className="text-slate-400 text-xs mb-8">
        You'll be notified for every new applicant.
      </p>

      <button
        onClick={onViewMyGigs}
        className="w-full bg-white rounded-2xl p-4 mb-3 shadow-sm border border-slate-100 hover:border-[#3b5bdb]/40 hover:bg-slate-50/80 flex items-center gap-3 active:scale-[0.99] transition cursor-pointer text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-[#e8edff] flex items-center justify-center text-[#3b5bdb] text-lg">
          💼
        </div>
        <div className="flex-1 text-left">
          <div className="text-xs font-bold text-slate-500 mb-0.5">My Gigs</div>
          <div className="text-sm text-slate-700 font-semibold">
            View &amp; manage your posted gigs
          </div>
        </div>
        <span className="text-slate-400 font-bold text-lg">→</span>
      </button>

      <button
        onClick={onShareInstagram}
        className="w-full bg-white rounded-2xl p-4 mb-8 shadow-sm border border-slate-100 hover:border-rose-300 hover:bg-rose-50/40 flex items-center gap-3 active:scale-[0.99] transition cursor-pointer text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-lg">
          📣
        </div>
        <div className="flex-1 text-left">
          <div className="text-xs font-bold text-slate-500 mb-0.5">Share</div>
          <div className="text-sm text-slate-700 font-semibold">
            Share your gig on Instagram
          </div>
        </div>
        <span className="text-slate-400 font-bold text-lg">→</span>
      </button>

      <button
        onClick={onBack}
        className="w-full bg-[#3b5bdb] text-white font-bold py-4 rounded-2xl shadow-md shadow-blue-200 active:scale-[0.99] transition cursor-pointer"
      >
        Back to Home
      </button>
    </div>
  )
}

// ── Profile Page ───────────────────────────────────────────────────────────

const MY_POSTED_GIGS: Gig[] = [
  {
    ...GIGS[0],

    id: 101,

    title: "Brand Collab for Ethnic Fashion Launch",

    type: "Paid",

    budget: "₹8,000 – ₹15,000",

    applicants: 12,
  },

  {
    ...GIGS[1],

    id: 102,

    title: "Looking for Lifestyle Photographer",

    type: "Barter",

    budget: "Products + Credit",

    applicants: 4,
  },
]

const SAVED_GIGS_DATA = [GIGS[1], GIGS[4]]

const PORTFOLIO_ITEMS = [
  {
    id: 1,
    img: "https://images.unsplash.com/photo-1624610261655-777af2f586d7?w=200&h=200&fit=crop&auto=format",
    likes: "2.1K",
  },

  {
    id: 2,
    img: "https://images.unsplash.com/photo-1648440108249-30567222448a?w=200&h=200&fit=crop&auto=format",
    likes: "3.8K",
  },

  {
    id: 3,
    img: "https://images.unsplash.com/photo-1661061968438-97ab151ac32e?w=200&h=200&fit=crop&auto=format",
    likes: "1.5K",
  },

  {
    id: 4,
    img: "https://images.unsplash.com/photo-1650477574222-ea46446ef5b2?w=200&h=200&fit=crop&auto=format",
    likes: "4.2K",
  },

  {
    id: 5,
    img: "https://images.unsplash.com/photo-1607346256330-dee7af15f7c5?w=200&h=200&fit=crop&auto=format",
    likes: "980",
  },

  {
    id: 6,
    img: "https://images.unsplash.com/photo-1639591903821-9b5e38f97bbd?w=200&h=200&fit=crop&auto=format",
    likes: "2.7K",
  },
]

const REVIEWS = [
  {
    name: "Rang Bahar Textiles",
    avatar: "🧵",
    text: "Priya was professional, creative, and delivered ahead of deadline. Highly recommend!",
    rating: 5,
    date: "Jul 2026",
  },

  {
    name: "Souvik Chatterjee",
    avatar: "🎬",
    text: "Great energy and super easy to work with. The reels got amazing engagement.",
    rating: 5,
    date: "Jun 2026",
  },

  {
    name: "The Calcutta Table",
    avatar: "🍽️",
    text: "Really authentic content. Our restaurant saw a 30% spike in footfall that week.",
    rating: 4,
    date: "May 2026",
  },
]

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill={filled ? "#f76707" : "none"}
      stroke={filled ? "#f76707" : "#cbd5e1"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

// ── My Applications Page ────────────────────────────────────────────────────

function MyApplicationsPage({
  onBack,
  currentUser,
  userProfile,
  gigs = [],
}: {
  onBack: () => void
  currentUser: any
  userProfile?: any
  gigs?: Gig[]
}) {
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false)
      return
    }

    const q = query(
      collection(db, "applications"),
      where("applicantUid", "==", currentUser.uid),
    )

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a: any, b: any) => {
            const ta = a.appliedAt ? new Date(a.appliedAt).getTime() : 0
            const tb = b.appliedAt ? new Date(b.appliedAt).getTime() : 0
            return tb - ta
          })
        setApplications(list)
        setLoading(false)
      },
      (err) => {
        console.warn("MyApplications error:", err)
        setLoading(false)
      },
    )

    return () => unsub()
  }, [currentUser?.uid])

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "accepted":
        return {
          label: "🎉 Accepted",
          bg: "bg-emerald-50",
          border: "border-emerald-200",
          text: "text-emerald-700",
          dot: "bg-emerald-500",
          desc: "Congratulations! You've been selected for this gig.",
        }
      case "rejected":
        return {
          label: "❌ Not Selected",
          bg: "bg-red-50",
          border: "border-red-200",
          text: "text-red-600",
          dot: "bg-red-400",
          desc: "The poster selected another creator for this gig.",
        }
      default:
        return {
          label: "⏳ Pending Review",
          bg: "bg-amber-50",
          border: "border-amber-200",
          text: "text-amber-700",
          dot: "bg-amber-400",
          desc: "Your pitch is being reviewed by the gig poster.",
        }
    }
  }

  const formatRelativeTime = (isoStr: string) => {
    if (!isoStr) return ""
    const diff = Date.now() - new Date(isoStr).getTime()
    const mins = Math.floor(diff / 60000)
    const hrs = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (mins < 2) return "Just now"
    if (mins < 60) return `${mins}m ago`
    if (hrs < 24) return `${hrs}h ago`
    if (days < 7) return `${days}d ago`
    return new Date(isoStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    })
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide pb-28 bg-slate-50 min-h-screen">
      {/* Header */}
      <div
        className="sticky top-0 z-20 px-5 pt-12 pb-4"
        style={{
          background:
            "linear-gradient(135deg, #3b5bdb 0%, #7048e8 60%, #f76707 100%)",
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white cursor-pointer active:scale-95 transition-all"
          >
            <ArrowLeftIcon />
          </button>
          <div>
            <div className="text-[11px] text-white/70 font-semibold">
              Your Activity
            </div>
            <h1 className="text-lg font-black text-white leading-tight">
              My Applications
            </h1>
          </div>
          <div className="ml-auto bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
            <span className="text-white text-[11px] font-bold">
              {applications.length} Pitch{applications.length !== 1 ? "es" : ""}
            </span>
          </div>
        </div>

        {/* Stats row */}
        {!loading && applications.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              {
                label: "Pending",
                count: applications.filter(
                  (a: any) => !a.status || a.status === "pending",
                ).length,
                color: "text-amber-300",
              },
              {
                label: "Accepted",
                count: applications.filter((a: any) => a.status === "accepted")
                  .length,
                color: "text-emerald-300",
              },
              {
                label: "Not Selected",
                count: applications.filter((a: any) => a.status === "rejected")
                  .length,
                color: "text-red-300",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white/15 backdrop-blur-sm rounded-2xl py-2 px-2 text-center"
              >
                <div className={`text-xl font-black ${s.color}`}>{s.count}</div>
                <div className="text-[9px] text-white/70 font-semibold">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pt-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#3b5bdb]/30 border-t-[#3b5bdb] animate-spin" />
            <p className="text-xs text-slate-400 font-medium">
              Loading your applications...
            </p>
          </div>
        ) : applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-20 h-20 rounded-3xl bg-[#e8edff] flex items-center justify-center text-4xl shadow-sm">
              📝
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-base mb-1">
                No Applications Yet
              </h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-[240px]">
                You haven't applied to any gigs yet. Browse the Explore page to
                find opportunities!
              </p>
            </div>
            <button
              onClick={onBack}
              className="bg-[#3b5bdb] text-white text-xs font-bold px-5 py-2.5 rounded-2xl shadow-md shadow-blue-200"
            >
              Browse Gigs ↗
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {applications.map((app: any) => {
              const statusConfig = getStatusConfig(app.status)
              const matchedGig = gigs.find(
                (g) => String(g.id) === String(app.gigId),
              )

              return (
                <div
                  key={app.id}
                  className={`bg-white rounded-3xl overflow-hidden shadow-sm border ${statusConfig.border} transition-all`}
                >
                  {/* Status bar */}
                  <div
                    className={`${statusConfig.bg} px-4 py-2.5 flex items-center justify-between border-b ${statusConfig.border}`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot} animate-pulse`}
                      />
                      <span
                        className={`text-[11px] font-black ${statusConfig.text}`}
                      >
                        {statusConfig.label}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Applied {formatRelativeTime(app.appliedAt)}
                    </span>
                  </div>

                  {/* Card body */}
                  <div className="p-4">
                    {/* Poster info */}
                    <div className="flex items-center gap-2.5 mb-3">
                      <img
                        src={
                          app.posterAvatar ||
                          matchedGig?.avatar ||
                          "https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=80&h=80&fit=crop&auto=format"
                        }
                        className="w-10 h-10 rounded-2xl object-cover border border-slate-100"
                        alt={app.posterName}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-black text-slate-900 truncate">
                          {app.gigTitle || "Untitled Gig"}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium truncate">
                          by {app.posterName || "Gig Poster"}
                        </div>
                      </div>
                      {matchedGig && (
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                            matchedGig.type === "Paid"
                              ? "bg-emerald-100 text-emerald-700"
                              : matchedGig.type === "Barter"
                                ? "bg-violet-100 text-violet-700"
                                : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {matchedGig.type}
                        </span>
                      )}
                    </div>

                    {/* Status description */}
                    <div
                      className={`${statusConfig.bg} rounded-2xl px-3 py-2.5 mb-3 border ${statusConfig.border}`}
                    >
                      <p
                        className={`text-[11px] font-medium ${statusConfig.text} leading-relaxed`}
                      >
                        {statusConfig.desc}
                      </p>
                    </div>

                    {/* Pitch preview */}
                    {app.pitch && (
                      <div className="mb-3">
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                          Your Pitch
                        </div>
                        <p className="text-[12px] text-slate-600 font-medium leading-relaxed line-clamp-2 bg-slate-50 rounded-xl px-3 py-2">
                          "{app.pitch}"
                        </p>
                      </div>
                    )}

                    {/* Meta row */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                      {app.instaHandle && (
                        <span className="text-[10px] font-semibold text-[#e4405f] bg-pink-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                          <span className="text-[9px]">📸</span>{" "}
                          {app.instaHandle.startsWith("@")
                            ? app.instaHandle
                            : `@${app.instaHandle}`}
                        </span>
                      )}
                      {app.expectedRate && (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                          <span className="text-[9px]">₹</span>{" "}
                          {app.expectedRate}
                        </span>
                      )}
                      {app.availability && (
                        <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                          🗓 {app.availability}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function ProfilePage({
  onPostGig,

  onLogout,

  userProfile,

  userRole,

  onSwitchToAdmin,

  gigs = [],

  onViewGig,

  onViewMyApplications,
}: {
  onPostGig: () => void

  onLogout: () => void

  userProfile: any

  userRole: "creator" | "brand" | "admin" | "admin_pending" | null

  onSwitchToAdmin?: () => void

  gigs?: Gig[]

  onViewGig?: (gig: Gig, initialTab?: "applicants" | "edit") => void

  onViewMyApplications?: () => void
}) {
  const [activeSection, setActiveSection] =
    useState<"portfolio" | "gigs" | "saved" | "reviews" | "about">("portfolio")

  const [showLogoutToast, setShowLogoutToast] = useState(false)

  // Edit Gig State

  const [editingGig, setEditingGig] = useState<Gig | null>(null)

  const [editGigTitle, setEditGigTitle] = useState("")

  const [editGigBudget, setEditGigBudget] = useState("")

  const [editGigType, setEditGigType] = useState("Paid")

  const [editGigLocation, setEditGigLocation] = useState("")

  const [editGigDescription, setEditGigDescription] = useState("")

  const [editGigDeadline, setEditGigDeadline] = useState("")

  const [savingGig, setSavingGig] = useState(false)

  const handleOpenEditGig = (gig: Gig) => {
    setEditingGig(gig)

    setEditGigTitle(gig.title)

    setEditGigBudget(gig.budget)

    setEditGigType(gig.type)

    setEditGigLocation(gig.location)

    setEditGigDescription(gig.description || "")

    setEditGigDeadline(gig.deadline || "Aug 30, 2026")
  }

  const handleSaveEditedGig = async () => {
    if (!editingGig) return

    setSavingGig(true)

    try {
      await updateDoc(doc(db, "gigs", String(editingGig.id)), {
        title: editGigTitle,

        budget: editGigBudget,

        type: editGigType,

        location: editGigLocation,

        description: editGigDescription,

        deadline: editGigDeadline,
      })

      setEditingGig(null)
    } catch (err: any) {
      alert(err.message || "Failed to update gig details in database")
    } finally {
      setSavingGig(false)
    }
  }

  // Hamburger Menu & Share Actions

  const [showMenu, setShowMenu] = useState(false)

  const [shareCopied, setShareCopied] = useState(false)

  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleShareProfile = () => {
    const shareUrl = `${window.location.origin}/?creator=${userProfile?.handle || userProfile?.name || "profile"}`

    navigator.clipboard.writeText(shareUrl)

    setShareCopied(true)

    setTimeout(() => setShareCopied(false), 2000)
  }

  // Profile Edit State

  const [isEditing, setIsEditing] = useState(false)

  const [editName, setEditName] = useState("")

  const [editBio, setEditBio] = useState("")

  const [editLocation, setEditLocation] = useState("")

  const [editNiche, setEditNiche] = useState("")

  const [saving, setSaving] = useState(false)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Instagram Connection state (real API — reads from Firestore userProfile)

  const igData = userProfile?.instagram

  const isInstagramConnected =
    !!igData?.handle || userProfile?.isInstagramConnected === true

  const instaHandle = igData?.handle || ""

  const instaMediaCount = igData?.mediaCount || 0

  // Followers: use pre-formatted string from Firestore if available, else format raw number

  const rawFollowers: number = igData?.followersCount || 0

  const instaFollowers =
    igData?.followersFormatted ||
    (rawFollowers >= 1000
      ? `${(rawFollowers / 1000).toFixed(1).replace(/\.0$/, "")}K`
      : rawFollowers > 0
        ? String(rawFollowers)
        : null)

  const [igConnecting, setIgConnecting] = useState(false)

  const [igError, setIgError] = useState<string | null>(null)

  const [igDisconnecting, setIgDisconnecting] = useState(false)

  const handleIgDisconnect = async () => {
    if (!auth.currentUser || igDisconnecting) return

    setIgDisconnecting(true)

    try {
      const uid = auth.currentUser.uid

      const clearData = { isInstagramConnected: false, instagram: null }

      const updates: Promise<any>[] = []

      if (userRole === "creator")
        updates.push(updateDoc(doc(db, "creators", uid), clearData))
      else if (userRole === "brand")
        updates.push(updateDoc(doc(db, "brands", uid), clearData))

      updates.push(updateDoc(doc(db, "users", uid), clearData))

      await Promise.all(updates)
    } catch (err) {
      console.warn("Error disconnecting Instagram:", err)
    } finally {
      setIgDisconnecting(false)
    }
  }

  // Instagram Business Login OAuth URL

  // Dynamically use current origin as the redirect URI (e.g. https://kreatorkolkata.vercel.app/ or https://ktest-nine.vercel.app/)

  const dynamicRedirectUri = window.location.origin + "/"

  const INSTAGRAM_AUTH_URL = `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${encodeURIComponent(dynamicRedirectUri)}&scope=${IG_SCOPES}&response_type=code&state=${auth.currentUser?.uid || ""}`

  // Portfolio Upload & Management state

  const [showAddPortfolioModal, setShowAddPortfolioModal] = useState(false)

  const [portfolioFile, setPortfolioFile] = useState<File | null>(null)

  const [portfolioPreviewUrl, setPortfolioPreviewUrl] = useState<string | null>(
    null,
  )

  const [portfolioLikes, setPortfolioLikes] = useState("1.5K")

  const [uploadingPortfolio, setUploadingPortfolio] = useState(false)

  const portfolioItems = userProfile?.portfolioItems || PORTFOLIO_ITEMS

  const handleAddPortfolio = async () => {
    if (!auth.currentUser) return

    if (!portfolioFile && !portfolioPreviewUrl) {
      alert("Please select an image file or enter an image URL")

      return
    }

    setUploadingPortfolio(true)

    try {
      let finalUrl = portfolioPreviewUrl || ""

      if (portfolioFile) {
        const storageRef = ref(
          storage,
          `portfolio/${auth.currentUser.uid}/${Date.now()}`,
        )

        const uploadResult = await uploadBytes(storageRef, portfolioFile)

        finalUrl = await getDownloadURL(uploadResult.ref)
      }

      const newItem = {
        id: Date.now(),

        img: finalUrl,

        likes: portfolioLikes.trim() || "1.5K",

        createdAt: new Date().toISOString(),
      }

      const currentList = userProfile?.portfolioItems || PORTFOLIO_ITEMS

      const updatedList = [newItem, ...currentList]

      const docCollection = userRole === "brand" ? "brands" : "creators"

      await updateDoc(doc(db, docCollection, auth.currentUser.uid), {
        portfolioItems: updatedList,
      })

      setShowAddPortfolioModal(false)

      setPortfolioFile(null)

      setPortfolioPreviewUrl(null)
    } catch (err: any) {
      alert(err.message || "Failed to upload portfolio image")
    } finally {
      setUploadingPortfolio(false)
    }
  }

  const handleDeletePortfolioItem = async (itemId: any) => {
    if (!auth.currentUser) return

    try {
      const currentList = userProfile?.portfolioItems || PORTFOLIO_ITEMS

      const updatedList = currentList.filter((item: any, idx: number) => {
        const id = item.id || idx

        return id !== itemId
      })

      const docCollection = userRole === "brand" ? "brands" : "creators"

      await updateDoc(doc(db, docCollection, auth.currentUser.uid), {
        portfolioItems: updatedList,
      })
    } catch (err: any) {
      alert(err.message || "Failed to remove image")
    }
  }

  useEffect(() => {
    if (userRole === "brand") {
      setActiveSection("gigs")
    } else {
      setActiveSection("portfolio")
    }
  }, [userRole])

  // Profile data mappings

  const name = userProfile?.name || "Priya Sengupta"

  const handleOrIndustry =
    userProfile?.handle || userProfile?.industry || "@priya.creates"

  const avatar =
    userProfile?.avatar ||
    userProfile?.logo ||
    "https://images.unsplash.com/photo-1624610261655-777af2f586d7?w=160&h=160&fit=crop&auto=format"

  const bio =
    userProfile?.bio ||
    "Creating real, aesthetic content from the heart of Kolkata 🌸 Open to brand collabs, co-shoots & community events."

  const stats =
    userRole === "brand"
      ? [
          { label: "Active Gigs", value: "3" },

          { label: "Applicants", value: "24" },

          { label: "Avg Rating", value: "4.8 ★" },

          { label: "Category", value: "Brand" },
        ]
      : [
          { label: "Collabs", value: "18" },

          { label: "Gigs Posted", value: "6" },

          { label: "Avg. ER", value: "4.8%" },

          { label: "Rating", value: "4.9 ★" },
        ]

  const tabs =
    userRole === "brand"
      ? [
          { id: "gigs", label: "Campaigns" },

          { id: "about", label: "About Us" },
        ]
      : [
          { id: "portfolio", label: "Portfolio" },

          { id: "gigs", label: "My Gigs" },

          { id: "saved", label: "Saved" },

          { id: "reviews", label: "Reviews" },
        ]

  if (isEditing) {
    return (
      <div className="fixed inset-0 z-50 bg-[#f8fafc] flex flex-col min-h-screen">
        {/* Header */}
        <div className="px-5 pt-12 pb-4 bg-white border-b border-slate-100 flex items-center gap-3 sticky top-0 z-10">
          <button
            onClick={() => setIsEditing(false)}
            className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-700 active:scale-95 transition cursor-pointer"
          >
            <ArrowLeftIcon />
          </button>
          <div>
            <h3 className="text-base font-black text-slate-900">
              Edit Profile
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              Update your profile info
            </p>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-6 pb-28">
          {/* Framed Profile Image Picker */}
          <div className="flex flex-col items-center gap-2.5 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Profile Photo
            </div>
            <div
              className="relative group cursor-pointer"
              onClick={() =>
                document.getElementById("avatar-file-input")?.click()
              }
            >
              <div className="p-1 rounded-full bg-gradient-to-tr from-[#3b5bdb] via-[#7048e8] to-[#f76707] shadow-md">
                <div className="w-24 h-24 rounded-full border-2 border-white overflow-hidden bg-slate-100 relative">
                  <img
                    src={previewUrl || avatar}
                    alt="Upload Preview Frame"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200">
                    <span className="text-white text-base">📷</span>
                    <span className="text-white text-[9px] font-bold">
                      Change
                    </span>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#3b5bdb] text-white border-2 border-white flex items-center justify-center shadow-md">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
            </div>
            <input
              type="file"
              id="avatar-file-input"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0]

                if (file) {
                  setSelectedFile(file)

                  setPreviewUrl(URL.createObjectURL(file))
                }
              }}
            />
            <button
              type="button"
              onClick={() =>
                document.getElementById("avatar-file-input")?.click()
              }
              className="text-xs font-bold text-[#3b5bdb] hover:underline bg-transparent border-none cursor-pointer"
            >
              {previewUrl
                ? "Choose Different Photo"
                : userRole === "brand"
                  ? "Change Brand Logo"
                  : "Change Profile Picture"}
            </button>
          </div>

          {/* Form Fields Card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {userRole === "brand" ? "Brand / Company Name" : "Display Name"}
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 outline-none focus:border-[#3b5bdb] focus:bg-white transition"
                placeholder="Enter name"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {userRole === "brand" ? "Industry" : "Niche / Specialty"}
              </label>
              <input
                type="text"
                value={editNiche}
                onChange={(e) => setEditNiche(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 outline-none focus:border-[#3b5bdb] focus:bg-white transition"
                placeholder={
                  userRole === "brand"
                    ? "e.g. Retail, Food, Tech"
                    : "e.g. Lifestyle & Fashion"
                }
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Location
              </label>
              <input
                type="text"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 outline-none focus:border-[#3b5bdb] focus:bg-white transition"
                placeholder="e.g. Kolkata, WB"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                About / Bio
              </label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 outline-none focus:border-[#3b5bdb] focus:bg-white transition resize-none"
                placeholder="Tell us about yourself or your brand..."
              />
            </div>
          </div>
        </div>

        {/* Footer Fixed Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 flex gap-3 z-10">
          <button
            onClick={() => setIsEditing(false)}
            disabled={saving}
            className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-2xl active:scale-95 transition cursor-pointer disabled:opacity-50 border-none"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              if (!auth.currentUser) return

              setSaving(true)

              try {
                let finalAvatarUrl =
                  userProfile?.avatar || userProfile?.logo || null

                if (selectedFile) {
                  const storageRef = ref(
                    storage,
                    `profile_pics/${auth.currentUser.uid}`,
                  )

                  const uploadResult = await uploadBytes(
                    storageRef,
                    selectedFile,
                  )

                  finalAvatarUrl = await getDownloadURL(uploadResult.ref)
                }

                if (userRole === "brand") {
                  await updateDoc(doc(db, "brands", auth.currentUser.uid), {
                    name: editName,

                    bio: editBio,

                    location: editLocation,

                    industry: editNiche,

                    logo: finalAvatarUrl,
                  })
                } else {
                  await updateDoc(doc(db, "creators", auth.currentUser.uid), {
                    name: editName,

                    bio: editBio,

                    location: editLocation,

                    niche: editNiche,

                    avatar: finalAvatarUrl,
                  })
                }

                // Update common user doc

                await updateDoc(doc(db, "users", auth.currentUser.uid), {
                  name: editName,

                  bio: editBio,

                  location: editLocation,

                  niche: editNiche,

                  avatar: finalAvatarUrl,
                })

                setIsEditing(false)
              } catch (err: any) {
                alert(err.message || "Failed to update profile details")
              } finally {
                setSaving(false)
              }
            }}
            disabled={saving || !editName.trim()}
            className="flex-1 py-3.5 bg-[#3b5bdb] hover:bg-[#2b4ef7] text-white text-sm font-bold rounded-2xl active:scale-95 transition cursor-pointer shadow-md shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-50 border-none"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide pb-28">
      {/* Hero banner */}
      <div className="relative">
        <div
          className="h-36 w-full"
          style={{
            background:
              "linear-gradient(135deg, #3b5bdb 0%, #7048e8 60%, #f76707 100%)",
          }}
        >
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at center, white 1px, transparent 1.5px)",
              backgroundSize: "20px 20px",
            }}
          />
        </div>

        {/* Hamburger Menu on top-right */}
        <div className="absolute top-4 right-4 z-20" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-9 h-9 rounded-full bg-black/25 backdrop-blur-md flex items-center justify-center border border-white/20 text-white cursor-pointer hover:bg-black/35 transition-all duration-150 active:scale-95 shadow-md"
            aria-label="Menu"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
              {userRole === "admin" && onSwitchToAdmin && (
                <button
                  onClick={() => {
                    setShowMenu(false)

                    onSwitchToAdmin()
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer border-none bg-transparent"
                >
                  <span className="text-amber-500">⚡</span> Admin Dashboard
                </button>
              )}
              <button
                onClick={() => {
                  setShowMenu(false)

                  setEditName(name)

                  setEditBio(bio)

                  setEditLocation(userProfile?.location || "Kolkata, WB")

                  setEditNiche(
                    userProfile?.niche ||
                      userProfile?.industry ||
                      "Lifestyle & Fashion",
                  )

                  setSelectedFile(null)

                  setPreviewUrl(null)

                  setIsEditing(true)
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer border-none bg-transparent"
              >
                <EditIcon /> Edit Profile
              </button>
              <button
                onClick={() => {
                  setShowMenu(false)

                  handleShareProfile()
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer border-none bg-transparent"
              >
                <ShareIcon /> Share Profile
              </button>
              {onViewMyApplications && (
                <button
                  onClick={() => {
                    setShowMenu(false)
                    onViewMyApplications()
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer border-none bg-transparent border-t border-slate-100"
                >
                  <span className="text-[#3b5bdb] text-base leading-none">
                    📋
                  </span>{" "}
                  My Applications
                </button>
              )}
            </div>
          )}
        </div>

        {/* Share Copied Tooltip Toast */}
        {shareCopied && (
          <div className="absolute top-16 right-4 bg-slate-900/90 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-lg z-30 animate-in fade-in slide-in-from-top-1 duration-150">
            Link copied!
          </div>
        )}

        {/* Centered Avatar */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
          <div className="relative">
            <img
              src={avatar}
              alt={name}
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
            />
            {userProfile?.verified && (
              <span className="absolute bottom-1 right-1 w-6 h-6 bg-[#3b5bdb] rounded-full flex items-center justify-center border-2 border-white">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M2 5l2 2 4-4"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Name & bio */}
      <div className="px-5 pt-16 pb-4 flex flex-col items-center text-center">
        <div className="flex items-center justify-center gap-2 mb-0.5">
          <h2 className="font-display text-2xl font-black text-slate-900">
            {name}
          </h2>
          {userProfile?.verified && (
            <span className="text-[#3b5bdb] text-sm">✓</span>
          )}
        </div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-sm text-slate-500 font-medium">
            {handleOrIndustry}
          </span>
          {userRole !== "brand" && (
            <>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="text-xs font-semibold text-[#f76707] bg-amber-50 px-2 py-0.5 rounded-full">
                {userProfile?.niche || "Lifestyle & Fashion"}
              </span>
            </>
          )}
        </div>
        <p className="text-sm text-slate-600 leading-relaxed mb-3 max-w-sm">
          {bio}
        </p>
        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 font-medium mb-3">
          <MapPinIcon />
          <span>
            {userProfile?.location || "Kolkata, West Bengal"} · Joined Aug 2026
          </span>
        </div>

        {/* Instagram row */}
        {userRole !== "brand" &&
          (isInstagramConnected ? (
            <div className="w-full flex items-center gap-2 bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100 rounded-2xl px-3 py-2.5 mb-4">
              <span className="text-[#e4405f]">
                <InstagramIcon />
              </span>
              <span className="text-xs font-bold text-slate-700">
                {instaHandle}
              </span>
              <span className="text-xs font-black text-[#e4405f] ml-auto">
                {instaFollowers
                  ? `${instaFollowers} followers · ✓`
                  : "✓ Connected"}
              </span>
              <button
                onClick={handleIgDisconnect}
                disabled={igDisconnecting}
                className="flex-shrink-0 text-[10px] font-bold text-slate-400 hover:text-red-500 border border-slate-200 hover:border-red-200 hover:bg-red-50 rounded-lg px-2 py-1 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {igDisconnecting ? "..." : "Disconnect"}
              </button>
            </div>
          ) : igConnecting ? (
            <div className="w-full flex items-center gap-3 bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100 rounded-2xl px-3 py-3 mb-4">
              <div className="w-5 h-5 rounded-full border-2 border-slate-200 border-t-[#e4405f] animate-spin flex-shrink-0" />
              <span className="text-xs font-bold text-slate-600">
                Connecting your Instagram account...
              </span>
            </div>
          ) : (
            <a
              href={INSTAGRAM_AUTH_URL}
              className="w-full flex items-center gap-2 bg-gradient-to-r from-slate-50 to-slate-100 hover:from-rose-50 hover:to-pink-50 border border-slate-200 hover:border-rose-100 rounded-2xl px-3 py-2.5 mb-4 transition duration-200 cursor-pointer no-underline"
            >
              <span className="text-slate-400 hover:text-[#e4405f]">
                <InstagramIcon />
              </span>
              <span className="text-xs font-bold text-slate-600">
                Connect Instagram{" "}
                <span className="text-[10px] text-slate-400 font-medium">
                  (Official Meta API)
                </span>
              </span>
              <span className="ml-auto text-[10px] font-bold text-[#3b5bdb]">
                Connect →
              </span>
            </a>
          ))}
        {igError && (
          <div className="w-full bg-red-50 border border-red-100 rounded-2xl px-3 py-2 mb-4 text-xs text-red-600 font-medium">
            ⚠️ {igError}
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 w-full">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-2xl py-3 px-2 text-center shadow-sm border border-slate-100"
            >
              <div className="text-base font-black text-slate-900 leading-none mb-1">
                {s.value}
              </div>
              <div className="text-[9px] text-slate-400 font-semibold leading-tight">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section tabs */}
      <div className="px-5 mb-4">
        <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-slate-100 gap-1">
          {tabs.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id as any)}
              className={`flex-1 py-2 rounded-xl text-[11px] font-bold transition ${
                activeSection === s.id
                  ? "bg-[#3b5bdb] text-white shadow-sm"
                  : "text-slate-400"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Portfolio grid */}
      {activeSection === "portfolio" && (
        <div className="px-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700">
              Work Showcase ({portfolioItems.length})
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {portfolioItems.map((item: any, idx: number) => {
              const itemImg =
                typeof item === "string" ? item : item.img || item.url

              const itemId = item.id || idx

              return (
                <div
                  key={itemId}
                  className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-slate-100 group cursor-pointer shadow-sm border border-slate-100"
                >
                  <img
                    src={itemImg}
                    alt="Portfolio work"
                    className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex flex-col justify-end items-end p-1.5 z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeletePortfolioItem(itemId)
                      }}
                      title="Remove image"
                      className="bg-red-600/90 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold hover:bg-red-600 transition cursor-pointer shadow-md"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )
            })}

            {/* Upload Work Tile — always last */}
            <div
              onClick={() =>
                document.getElementById("portfolio-direct-input")?.click()
              }
              className="relative rounded-2xl overflow-hidden aspect-[3/4] border-2 border-dashed border-[#3b5bdb]/40 bg-[#e8edff]/40 hover:bg-[#e8edff] transition cursor-pointer flex flex-col items-center justify-center text-center p-2 group"
            >
              {uploadingPortfolio ? (
                <div className="w-8 h-8 rounded-full border-2 border-[#3b5bdb]/30 border-t-[#3b5bdb] animate-spin" />
              ) : (
                <>
                  <div className="w-8 h-8 rounded-full bg-[#3b5bdb] text-white flex items-center justify-center text-lg font-bold shadow-md group-hover:scale-110 transition">
                    ＋
                  </div>
                  <span className="text-[10px] font-bold text-[#3b5bdb] mt-1">
                    Upload Work
                  </span>
                </>
              )}
            </div>

            {/* Hidden direct file input */}
            <input
              type="file"
              id="portfolio-direct-input"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file || !auth.currentUser) return
                setUploadingPortfolio(true)
                try {
                  const storageRef = ref(
                    storage,
                    `portfolio/${auth.currentUser.uid}/${Date.now()}`,
                  )
                  const uploadResult = await uploadBytes(storageRef, file)
                  const finalUrl = await getDownloadURL(uploadResult.ref)
                  const newItem = {
                    id: Date.now(),
                    img: finalUrl,
                    likes: "",
                    createdAt: new Date().toISOString(),
                  }
                  const currentList =
                    userProfile?.portfolioItems || PORTFOLIO_ITEMS
                  const updatedList = [newItem, ...currentList]
                  const docCollection =
                    userRole === "brand" ? "brands" : "creators"
                  await updateDoc(
                    doc(db, docCollection, auth.currentUser.uid),
                    { portfolioItems: updatedList },
                  )
                } catch (err: any) {
                  alert(err.message || "Failed to upload portfolio image")
                } finally {
                  setUploadingPortfolio(false)
                  e.target.value = ""
                }
              }}
            />
          </div>
        </div>
      )}

      {/* My Gigs */}
      {activeSection === "gigs" && (
        <div className="px-5 flex flex-col gap-3">
          {(gigs.filter((g) => {
            const isOwner =
              (userProfile?.name &&
                g.creatorName?.toLowerCase() ===
                  userProfile.name.toLowerCase()) ||
              (userProfile?.name &&
                g.brand?.toLowerCase() === userProfile.name.toLowerCase()) ||
              (userProfile?.handle &&
                g.handle?.toLowerCase() === userProfile.handle.toLowerCase())

            return isOwner
          }).length > 0
            ? gigs.filter((g) => {
                const isOwner =
                  (userProfile?.name &&
                    g.creatorName?.toLowerCase() ===
                      userProfile.name.toLowerCase()) ||
                  (userProfile?.name &&
                    g.brand?.toLowerCase() ===
                      userProfile.name.toLowerCase()) ||
                  (userProfile?.handle &&
                    g.handle?.toLowerCase() ===
                      userProfile.handle.toLowerCase())

                return isOwner
              })
            : MY_POSTED_GIGS
          )

            .map((g) => (
              <div
                key={g.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 pr-3">
                    <h4 className="text-sm font-bold text-slate-900 leading-snug mb-1">
                      {g.title}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[g.type] || "bg-slate-100"}`}
                      >
                        {g.type}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {g.budget}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-bold flex-shrink-0 ${
                      (g as any).status === "Closed"
                        ? "bg-slate-100 text-slate-500"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {(g as any).status || "Active"}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                      <UsersIcon />
                      <span>{g.applicants || 0} applied</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                      <CalendarIcon />
                      <span>{(g as any).daysLeft || 5}d left</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onViewGig && onViewGig(g, "edit")}
                      className="text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-xl transition cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onViewGig && onViewGig(g, "applicants")}
                      className="text-xs font-bold text-white bg-[#3b5bdb] hover:bg-[#2b4ef7] px-3.5 py-1.5 rounded-xl shadow-sm shadow-blue-200 transition cursor-pointer active:scale-95 flex items-center gap-1"
                    >
                      View ({g.applicants || 0}) ↗
                    </button>
                  </div>
                </div>
              </div>
            ))}
          <button
            onClick={onPostGig}
            className="w-full bg-blue-50 hover:bg-blue-100 rounded-2xl py-4 flex items-center justify-center gap-2 text-sm font-bold text-[#3b5bdb] transition-all cursor-pointer shadow-sm"
          >
            <span className="w-5 h-5 rounded-lg bg-[#3b5bdb]/10 flex items-center justify-center text-sm font-extrabold text-[#3b5bdb]">
              ＋
            </span>
            Post a New Gig
          </button>
        </div>
      )}

      {/* Saved Gigs */}
      {activeSection === "saved" && (
        <div className="px-5 flex flex-col gap-3">
          {SAVED_GIGS_DATA.map((gig) => (
            <div
              key={gig.id}
              className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3"
            >
              <img
                src={gig.avatar}
                alt={gig.creatorName}
                className="w-12 h-12 rounded-full object-cover border-2 border-[#e8edff] flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-900 truncate">
                  {gig.title}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[gig.type]}`}
                  >
                    {gig.type}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium truncate">
                    {formatBudget(gig.budget, gig.type)}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-0.5 text-[10px] text-[#e4405f] font-bold">
                  <InstagramIcon />
                  {gig.followers}
                </div>
              </div>
              <button className="flex-shrink-0">
                <BookmarkIcon filled={true} />
              </button>
            </div>
          ))}
          {SAVED_GIGS_DATA.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-sm font-medium">
              No saved gigs yet
            </div>
          )}
        </div>
      )}

      {/* Reviews */}
      {activeSection === "reviews" && (
        <div className="px-5 flex flex-col gap-3">
          <div className="bg-[#3b5bdb] rounded-2xl p-4 flex items-center gap-4 shadow-md">
            <div className="text-center">
              <div className="text-4xl font-black text-white leading-none">
                4.9
              </div>
              <div className="flex gap-0.5 justify-center mt-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <StarIcon key={i} filled={i <= 5} />
                ))}
              </div>
              <div className="text-white/60 text-[10px] font-medium mt-1">
                3 reviews
              </div>
            </div>
            <div className="flex-1">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] text-white/60 w-2">{star}</span>
                  <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full"
                      style={{
                        width: star === 5 ? "80%" : star === 4 ? "20%" : "0%",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {REVIEWS.map((r, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-9 h-9 rounded-full bg-[#e8edff] flex items-center justify-center text-lg flex-shrink-0">
                  {r.avatar}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-slate-900">
                    {r.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    {r.date}
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <StarIcon key={i} filled={i <= r.rating} />
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{r.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* About Us (for Brands) */}
      {activeSection === "about" && (
        <div className="px-5">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-3">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Company Description
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed">
                {userProfile?.bio || "No description provided."}
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Location
              </h4>
              <p className="text-sm text-slate-700">
                {userProfile?.location || "Kolkata, WB"}
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Industry
              </h4>
              <p className="text-sm text-slate-700">
                {userProfile?.industry || "Retail & Fashion"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Settings links */}
      <div className="px-5 mt-6 mb-2">
        <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-3">
          Account
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-100">
          {[
            { icon: "🔔", label: "Notifications", sub: "Manage alerts" },

            {
              icon: "🔒",
              label: "Privacy & Safety",
              sub: "Who can contact you",
            },

            { icon: "💳", label: "Payment Settings", sub: "UPI, bank account" },

            {
              icon: "🌐",
              label: "Connected Accounts",
              sub: "Instagram, YouTube",
            },

            { icon: "🚪", label: "Log Out", sub: "", danger: true },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => {
                if (item.danger) {
                  setShowLogoutToast(true)
                }
              }}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <span className="text-lg leading-none w-6 text-center flex-shrink-0">
                {item.icon}
              </span>
              <div className="flex-1">
                <div
                  className={`text-sm font-semibold ${
                    item.danger ? "text-red-500" : "text-slate-800"
                  }`}
                >
                  {item.label}
                </div>
                {item.sub && (
                  <div className="text-[10px] text-slate-400 font-medium">
                    {item.sub}
                  </div>
                )}
              </div>
              {!item.danger && (
                <span className="text-slate-300">
                  <ChevronRightIcon />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Logout Centered Modal / Toast */}
      {showLogoutToast && (
        <>
          {/* Backdrop overlay */}
          <div
            onClick={() => setShowLogoutToast(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity"
          />
          {/* Centered Modal Card */}
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] max-w-[340px] bg-slate-900 text-white rounded-3xl p-5 shadow-2xl z-50 border border-slate-800 flex flex-col gap-4 transition-all duration-300">
            <div className="flex flex-col items-center text-center gap-3">
              <span className="text-3xl bg-slate-800 w-14 h-14 rounded-full flex items-center justify-center">
                🚪
              </span>
              <div className="flex flex-col gap-1">
                <h4 className="text-base font-bold text-slate-100">
                  Are you sure to logout?
                </h4>
                <p className="text-xs text-slate-400">
                  You will need to sign back in to access your profile.
                </p>
              </div>
            </div>
            <div className="flex gap-3 text-xs font-bold pt-1">
              <button
                onClick={() => setShowLogoutToast(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutToast(false)

                  onLogout()
                }}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-colors cursor-pointer"
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </>
      )}

      {/* Add Portfolio Image Modal */}
      {showAddPortfolioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Add Portfolio Showcase Image
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">
                  Showcase your past work, shoots, and content to brands
                </p>
              </div>
              <button
                onClick={() => setShowAddPortfolioModal(false)}
                className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 active:scale-95 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {/* Live Preview Card */}
              <div className="flex flex-col items-center gap-2">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Image Preview
                </div>
                <div className="w-32 rounded-2xl overflow-hidden aspect-[3/4] bg-slate-100 relative shadow-md border-2 border-slate-100">
                  {portfolioPreviewUrl ? (
                    <img
                      src={portfolioPreviewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                      <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <span className="text-[10px] font-semibold mt-1">
                        Select image below
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload controls */}
              <div className="flex flex-col gap-3">
                <div
                  onClick={() =>
                    document.getElementById("portfolio-file-input")?.click()
                  }
                  className="bg-blue-50/70 hover:bg-blue-50 border-2 border-dashed border-[#3b5bdb]/30 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 cursor-pointer transition"
                >
                  <span className="text-xl">📁</span>
                  <span className="text-xs font-bold text-[#3b5bdb]">
                    {portfolioFile
                      ? portfolioFile.name
                      : "Choose Image File from Device"}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    PNG, JPG, WEBP up to 10MB
                  </span>
                  <input
                    type="file"
                    id="portfolio-file-input"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]

                      if (file) {
                        setPortfolioFile(file)

                        setPortfolioPreviewUrl(URL.createObjectURL(file))
                      }
                    }}
                  />
                </div>

                <div className="relative flex items-center justify-center my-1">
                  <div className="border-t border-slate-100 w-full" />
                  <span className="bg-white px-2 text-[10px] font-bold text-slate-400 uppercase absolute">
                    Or Image URL
                  </span>
                </div>

                <div>
                  <input
                    type="url"
                    value={
                      portfolioPreviewUrl && !portfolioFile
                        ? portfolioPreviewUrl
                        : ""
                    }
                    onChange={(e) => {
                      setPortfolioFile(null)

                      setPortfolioPreviewUrl(e.target.value)
                    }}
                    placeholder="https://images.unsplash.com/your-image.jpg"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 outline-none focus:border-[#3b5bdb] focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddPortfolioModal(false)}
                  disabled={uploadingPortfolio}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPortfolio}
                  disabled={
                    uploadingPortfolio ||
                    (!portfolioFile && !portfolioPreviewUrl)
                  }
                  className="flex-1 py-3 bg-[#3b5bdb] text-white text-xs font-bold rounded-2xl shadow-md shadow-blue-200 active:scale-98 transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {uploadingPortfolio ? (
                    <>
                      <svg
                        className="animate-spin w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="white"
                          strokeWidth="3"
                          strokeDasharray="60"
                          strokeDashoffset="20"
                        />
                      </svg>
                      Uploading…
                    </>
                  ) : (
                    "Add to Portfolio"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Gig Modal */}
      {editingGig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Edit Posted Gig
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">
                  Update gig title, budget, requirements, and deadline
                </p>
              </div>
              <button
                onClick={() => setEditingGig(null)}
                className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 active:scale-95 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Gig Title
                </label>
                <input
                  type="text"
                  value={editGigTitle}
                  onChange={(e) => setEditGigTitle(e.target.value)}
                  placeholder="e.g. Ethnic Fashion Launch Reel Shoots"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 outline-none focus:border-[#3b5bdb] focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Type
                  </label>
                  <select
                    value={editGigType}
                    onChange={(e) => setEditGigType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 outline-none focus:border-[#3b5bdb] focus:bg-white transition"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Barter">Barter</option>
                    <option value="PR Package">PR Package</option>
                    <option value="Event RSVP">Event RSVP</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editGigLocation}
                    onChange={(e) => setEditGigLocation(e.target.value)}
                    placeholder="e.g. Salt Lake, Kolkata"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 outline-none focus:border-[#3b5bdb] focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Budget / Offer
                  </label>
                  <input
                    type="text"
                    value={editGigBudget}
                    onChange={(e) => setEditGigBudget(e.target.value)}
                    placeholder="e.g. ₹5,000 – ₹10,000"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 outline-none focus:border-[#3b5bdb] focus:bg-white transition"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Deadline
                  </label>
                  <input
                    type="text"
                    value={editGigDeadline}
                    onChange={(e) => setEditGigDeadline(e.target.value)}
                    placeholder="e.g. Aug 30, 2026"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 outline-none focus:border-[#3b5bdb] focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Description / Deliverables
                </label>
                <textarea
                  rows={3}
                  value={editGigDescription}
                  onChange={(e) => setEditGigDescription(e.target.value)}
                  placeholder="Details about expectations, reels, posts..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 outline-none focus:border-[#3b5bdb] focus:bg-white transition resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditingGig(null)}
                  disabled={savingGig}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEditedGig}
                  disabled={savingGig || !editGigTitle.trim()}
                  className="flex-1 py-3 bg-[#3b5bdb] text-[#ffffff] text-xs font-bold rounded-2xl shadow-md shadow-blue-200 active:scale-98 transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {savingGig ? (
                    <>
                      <svg
                        className="animate-spin w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="white"
                          strokeWidth="3"
                          strokeDasharray="60"
                          strokeDashoffset="20"
                        />
                      </svg>
                      Saving…
                    </>
                  ) : (
                    "Save Gig Changes"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ProfileSetupPage({
  userProfile,

  userRole,

  onComplete,
}: {
  userProfile: any

  userRole: "creator" | "brand" | "admin" | "admin_pending" | null

  onComplete: () => void
}) {
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const [username, setUsername] = useState("")

  const [bio, setBio] = useState("")

  const [nicheOrIndustry, setNicheOrIndustry] = useState("")

  const [location, setLocation] = useState("")

  const [errorMsg, setErrorMsg] = useState("")

  const [isCheckingUsername, setIsCheckingUsername] = useState(false)

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (userProfile) {
      if (userRole === "creator") {
        setUsername(userProfile.handle || "")

        setNicheOrIndustry(userProfile.niche || "Fashion & Lifestyle")
      } else {
        setUsername(userProfile.name?.toLowerCase().replace(/\s+/g, "") || "")

        setNicheOrIndustry(userProfile.industry || "Retail & Fashion")
      }

      setBio(userProfile.bio || "")

      setLocation(userProfile.location || "Kolkata, WB")
    }
  }, [userProfile, userRole])

  useEffect(() => {
    if (!username.trim()) {
      setErrorMsg("")

      return
    }

    const checkedUsername = username.trim().toLowerCase()

    const queryHandle =
      userRole === "creator"
        ? checkedUsername.startsWith("@")
          ? checkedUsername
          : `@${checkedUsername}`
        : checkedUsername

    const timer = setTimeout(async () => {
      setIsCheckingUsername(true)

      setErrorMsg("")

      try {
        const qCreators = query(
          collection(db, "creators"),
          where("handle", "==", queryHandle),
        )

        const snapCreators = await getDocs(qCreators)

        const otherCreator = snapCreators.docs.find(
          (d) => d.id !== auth.currentUser?.uid,
        )

        if (otherCreator) {
          setErrorMsg("Username is already taken!")
        } else {
          setErrorMsg("")
        }
      } catch (err) {
        console.error(err)
      } finally {
        setIsCheckingUsername(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [username, userRole])

  const handleFinish = async () => {
    if (!auth.currentUser) return

    if (errorMsg || !username.trim()) return

    setSaving(true)

    try {
      let finalAvatarUrl =
        userRole === "brand" ? userProfile.logo : userProfile.avatar

      if (avatarFile) {
        const storageRef = ref(storage, `profile_pics/${auth.currentUser.uid}`)

        const uploadResult = await uploadBytes(storageRef, avatarFile)

        finalAvatarUrl = await getDownloadURL(uploadResult.ref)
      }

      const cleanUsername = username.trim()

      const finalUsername =
        userRole === "creator"
          ? cleanUsername.startsWith("@")
            ? cleanUsername
            : `@${cleanUsername}`
          : cleanUsername

      if (userRole === "brand") {
        await updateDoc(doc(db, "brands", auth.currentUser.uid), {
          name: finalUsername,

          bio: bio,

          location: location,

          industry: nicheOrIndustry,

          logo: finalAvatarUrl,

          setupComplete: true,
        })
      } else {
        await updateDoc(doc(db, "creators", auth.currentUser.uid), {
          handle: finalUsername,

          bio: bio,

          location: location,

          niche: nicheOrIndustry,

          avatar: finalAvatarUrl,

          setupComplete: true,
        })
      }

      onComplete()
    } catch (err: any) {
      alert(err.message || "Failed to complete profile setup")
    } finally {
      setSaving(false)
    }
  }

  const defaultAvatar =
    userRole === "brand"
      ? "https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=160&h=160&fit=crop&auto=format"
      : "https://images.unsplash.com/photo-1624610261655-777af2f586d7?w=80&h=80&fit=crop&auto=format"

  return (
    <div className="flex-1 flex flex-col justify-start bg-slate-50 min-h-screen px-6 py-8">
      <div className="w-full max-w-md mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="text-center mt-4">
          <h2 className="text-2xl font-black text-slate-900 mt-2">
            Complete Your Profile
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Let others know who you are before entering the Kolkata network.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 flex flex-col gap-5">
          {/* Framed Photo Selector */}
          <div className="flex flex-col items-center gap-3">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Photo Frame Preview
            </div>

            <div
              onClick={() =>
                document.getElementById("setup-avatar-input")?.click()
              }
              className="relative group cursor-pointer"
            >
              {/* Outer Framed Ring */}
              <div className="p-1 rounded-full bg-gradient-to-tr from-[#3b5bdb] via-[#7048e8] to-[#f76707] shadow-md shadow-blue-200">
                <div className="w-24 h-24 rounded-full border-2 border-white overflow-hidden bg-slate-100 relative">
                  <img
                    src={previewUrl || defaultAvatar}
                    alt="Profile Avatar Frame Preview"
                    className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200">
                    <span className="text-white text-lg">📷</span>
                    <span className="text-white text-[9px] font-bold">
                      Change
                    </span>
                  </div>
                </div>
              </div>

              {/* Camera badge */}
              <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#3b5bdb] text-white border-2 border-white flex items-center justify-center shadow-md group-hover:scale-110 transition">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
            </div>

            <input
              type="file"
              id="setup-avatar-input"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]

                if (file) {
                  setAvatarFile(file)

                  setPreviewUrl(URL.createObjectURL(file))
                }
              }}
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  document.getElementById("setup-avatar-input")?.click()
                }
                className="text-xs font-bold text-[#3b5bdb] hover:underline"
              >
                {previewUrl
                  ? "Choose Different Photo"
                  : userRole === "brand"
                    ? "Select Brand Logo"
                    : "Select Profile Photo"}
              </button>
              {previewUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setAvatarFile(null)

                    setPreviewUrl(null)
                  }}
                  className="text-xs font-bold text-slate-400 hover:text-rose-500 transition"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Form fields */}
          <div className="flex flex-col gap-4">
            {/* Username Input */}
            <div className="flex flex-col gap-1.5 relative">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {userRole === "brand"
                    ? "Brand Username / Slug"
                    : "Creator Username"}
                </label>
                {isCheckingUsername && (
                  <span className="text-[9px] text-[#3b5bdb] font-bold animate-pulse">
                    Checking…
                  </span>
                )}
                {errorMsg && (
                  <span className="text-[10px] text-rose-500 font-bold transition-all">
                    {errorMsg}
                  </span>
                )}
                {!isCheckingUsername && !errorMsg && username.trim() && (
                  <span className="text-[10px] text-emerald-600 font-bold">
                    Username is available ✓
                  </span>
                )}
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full px-4 py-3 rounded-2xl border bg-slate-50 text-sm outline-none transition ${
                  errorMsg
                    ? "border-rose-300 focus:border-rose-400 focus:bg-rose-50/10"
                    : "border-slate-200 focus:border-[#3b5bdb] focus:bg-white"
                }`}
                placeholder={
                  userRole === "brand" ? "e.g. wowmomo" : "e.g. priya.creates"
                }
              />
            </div>

            {/* Profession / Niche Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                {userRole === "brand" ? "Industry" : "Profession / Niche"}
              </label>
              <input
                type="text"
                value={nicheOrIndustry}
                onChange={(e) => setNicheOrIndustry(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-[#3b5bdb] focus:bg-white transition"
                placeholder={
                  userRole === "brand"
                    ? "e.g. Food & Beverage"
                    : "e.g. Video Editor / Influencer"
                }
              />
            </div>

            {/* Place / Location Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Location (Place)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-[#3b5bdb] focus:bg-white transition"
                placeholder="e.g. Salt Lake, Kolkata"
              />
            </div>

            {/* Bio / About Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Bio / About
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-[#3b5bdb] focus:bg-white transition resize-none"
                placeholder="Brief description about yourself or company..."
              />
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleFinish}
            disabled={
              saving || isCheckingUsername || !!errorMsg || !username.trim()
            }
            className="w-full bg-[#3b5bdb] text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-blue-100 hover:bg-[#2b4ef7] active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <svg
                  className="animate-spin w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="white"
                    strokeWidth="3"
                    strokeDasharray="60"
                    strokeDashoffset="20"
                  />
                </svg>
                Finishing Setup…
              </>
            ) : (
              "Finish Setup & Enter network →"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── View Event Page ─────────────────────────────────────────────────────────

function ViewEventPage({
  event,

  onBack,

  isRsvp,

  toggleRsvpEvent,

  userProfile,
}: {
  event: Event

  onBack: () => void

  isRsvp: boolean

  toggleRsvpEvent: (id: number) => void

  userProfile?: any
}) {
  const [copied, setCopied] = useState(false)

  const [showConfirmToast, setShowConfirmToast] = useState(false)

  const isFeat = (event as any).isFeatured || false

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)

      setCopied(true)

      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleRegisterClick = () => {
    if (isRsvp) return

    setShowConfirmToast(true)
  }

  const handleConfirmRegister = () => {
    setShowConfirmToast(false)

    toggleRsvpEvent(event.id)
  }

  const speakers =
    Array.isArray((event as any).speakers) && (event as any).speakers.length > 0
      ? (event as any).speakers
      : []

  const organizer = (event as any).organizer || "Kreator Kolkata Community"

  const description =
    (event as any).description ||
    "Join Kolkata's premier creator networking meetup! Connect with top lifestyle, food, and tech creators, meet hiring brand managers, and participate in exclusive collab pitch sessions."

  const entryFee = (event as any).entryFee || "Free RSVP"

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide pb-32 bg-[#f8fafc]">
      {/* Top Bar / Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-full hover:bg-slate-200 transition cursor-pointer"
        >
          ← Back
        </button>
        <span className="text-xs font-bold text-slate-900 truncate max-w-[180px]">
          {event.title}
        </span>
        <button
          onClick={handleShare}
          className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition cursor-pointer relative"
        >
          <ShareIcon />
          {copied && (
            <span className="absolute -bottom-7 right-0 text-[9px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded shadow whitespace-nowrap">
              Copied Link!
            </span>
          )}
        </button>
      </div>

      {/* Hero Banner */}
      <div className="relative h-[220px] w-full overflow-hidden bg-slate-900">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

        {/* Badges */}
        <div className="absolute top-4 left-5 right-5 flex items-center justify-between z-10">
          <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full border border-white/30">
            {event.tag}
          </span>
          {isFeat && (
            <span className="bg-amber-500 text-white text-[9px] font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
              ⭐ FEATURED EVENT
            </span>
          )}
        </div>

        {/* Date Stamp Overlay */}
        <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between z-10">
          <div>
            <span className="text-amber-400 text-xs font-bold uppercase tracking-wider block mb-0.5">
              📅 Upcoming Event
            </span>
            <h1 className="text-white font-display font-black text-xl leading-tight drop-shadow-md">
              {event.title}
            </h1>
            <p className="text-slate-200 text-xs mt-0.5 font-medium">
              {event.subtitle}
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl px-3.5 py-1.5 text-center min-w-[56px] shadow-lg">
            <span className="text-white font-display font-black text-xl leading-none block">
              {event.day}
            </span>
            <span className="text-white/90 text-[10px] font-bold uppercase tracking-wider block">
              {event.month}
            </span>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-5">
        {/* Date, Time & Venue Card */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-[#3b5bdb] flex-shrink-0">
              <CalendarIcon />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">
                {event.date}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                {event.time} IST
              </div>
            </div>
          </div>
          <div className="h-[1px] bg-slate-100 w-full" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-[#f76707] flex-shrink-0">
              <MapPinIcon />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">
                {event.venue}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                {event.location}
              </div>
            </div>
          </div>
        </div>

        {/* RSVP & Attendee Counter */}
        <div className="bg-gradient-to-r from-[#3b5bdb]/10 to-[#3b5bdb]/5 rounded-3xl p-4 border border-[#3b5bdb]/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2 overflow-hidden">
              <img
                className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                src="https://images.unsplash.com/photo-1624610261655-777af2f586d7?w=60&h=60&fit=crop&auto=format"
                alt=""
              />
              <img
                className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                src="https://images.unsplash.com/photo-1607346256330-dee7af15f7c5?w=60&h=60&fit=crop&auto=format"
                alt=""
              />
              <img
                className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                src="https://images.unsplash.com/photo-1639591903821-9b5e38f97bbd?w=60&h=60&fit=crop&auto=format"
                alt=""
              />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">
                {event.attendees + (isRsvp ? 1 : 0)} People Registered
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                Join top Kolkata creators
              </div>
            </div>
          </div>
          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
              isRsvp
                ? "bg-emerald-100 text-emerald-700"
                : "bg-blue-100 text-[#3b5bdb]"
            }`}
          >
            {isRsvp ? "✓ Registered" : "Spots Available"}
          </span>
        </div>

        {/* Organized By */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
              Organized By
            </div>
            <div className="text-xs font-bold text-slate-900">{organizer}</div>
          </div>
          <span className="text-xs font-bold text-[#3b5bdb] bg-blue-50 px-3 py-1 rounded-full">
            {entryFee}
          </span>
        </div>

        {/* About Event Description */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 mb-2">About Event</h3>
          <p className="text-xs text-slate-600 leading-relaxed font-normal whitespace-pre-line">
            {description}
          </p>
        </div>

        {/* Featured Guests / Speakers */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 mb-3">
            Featured Speakers & Hosts
          </h3>
          <div className="flex flex-wrap gap-2">
            {speakers.length > 0 ? (
              speakers.map((sp: string) => (
                <span
                  key={sp}
                  className="bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200/80 flex items-center gap-1.5"
                >
                  {sp}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic font-medium">
                No featured speakers specified yet
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar CTA */}
      <div className="fixed bottom-0 inset-x-0 max-w-[430px] mx-auto bg-white/90 backdrop-blur-lg border-t border-slate-100 p-4 z-40 shadow-2xl flex items-center justify-between gap-4">
        <div>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Registration
          </div>
          <div className="text-sm font-bold text-slate-900">{entryFee}</div>
        </div>
        <button
          onClick={handleRegisterClick}
          disabled={isRsvp}
          className={`flex-1 py-3.5 rounded-2xl font-bold text-xs shadow-lg transition active:scale-98 flex items-center justify-center gap-2 ${
            isRsvp
              ? "bg-emerald-600 text-white shadow-emerald-200 opacity-100 cursor-default"
              : "bg-[#3b5bdb] text-white shadow-blue-200 hover:bg-[#2b4ef7] cursor-pointer"
          }`}
        >
          {isRsvp ? "✓ Registered" : "Register Now 🎉"}
        </button>
      </div>

      {/* Confirmation Toast Overlay */}
      {showConfirmToast && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pb-8 px-5 pointer-events-none">
          <div className="w-full max-w-[390px] bg-white rounded-3xl shadow-2xl border border-slate-100 p-5 pointer-events-auto animate-[slideUp_0.25s_ease-out]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-[#3b5bdb]/10 flex items-center justify-center text-[#3b5bdb] text-xl flex-shrink-0">
                🎟️
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">
                  Confirm Registration
                </div>
                <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                  This action cannot be undone
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Are you sure you want to register for{" "}
              <span className="font-bold text-slate-900">"{event.title}"</span>?
              Once registered, you cannot unregister.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmToast(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl hover:bg-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRegister}
                className="flex-1 py-3 bg-[#3b5bdb] text-white text-xs font-bold rounded-2xl shadow-lg shadow-blue-200 hover:bg-[#2b4ef7] transition cursor-pointer"
              >
                Yes, Register Me ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Explore Page ────────────────────────────────────────────────────────────

function ExplorePage({
  savedGigs,

  toggleSave,

  onApply,

  followedBrands,

  toggleFollowBrand,

  rsvpEvents,

  toggleRsvpEvent,

  onBellClick,

  unreadCount,

  onCreatorClick,

  onBrandClick,

  searchQuery,

  setSearchQuery,

  activeFilter,

  setActiveFilter,

  gigs = GIGS,

  creators = CREATORS,

  brands = BRANDS,

  events = EVENTS,

  userProfile,

  onProfileClick,

  onSelectEvent,

  onShareGig,

  userAppliedGigIds,
}: {
  savedGigs: Set<number>

  toggleSave: (id: number) => void

  onApply: (gig: Gig) => void

  followedBrands: Set<number>

  toggleFollowBrand: (id: number) => void

  rsvpEvents: Set<number>

  toggleRsvpEvent: (id: number) => void

  onBellClick: () => void

  unreadCount: number

  onCreatorClick: (name: string) => void

  onBrandClick: (brand: Brand) => void

  searchQuery: string

  setSearchQuery: (query: string) => void

  activeFilter: "all" | "creators" | "brands" | "gigs" | "events"

  setActiveFilter: (
    filter: "all" | "creators" | "brands" | "gigs" | "events",
  ) => void

  gigs?: Gig[]

  creators?: Creator[]

  brands?: Brand[]

  events?: Event[]

  userProfile?: any

  onProfileClick?: () => void

  onSelectEvent?: (event: Event) => void

  onShareGig: (gig: Gig) => void

  userAppliedGigIds?: Set<number>
}) {
  const userAvatar =
    userProfile?.avatar ||
    userProfile?.logo ||
    "https://images.unsplash.com/photo-1624610261655-777af2f586d7?w=80&h=80&fit=crop&auto=format"

  const query = searchQuery.toLowerCase().trim()

  const filteredCreators = creators.filter(
    (c) =>
      c.name.toLowerCase().includes(query) ||
      c.handle.toLowerCase().includes(query) ||
      c.niche.toLowerCase().includes(query) ||
      c.bio.toLowerCase().includes(query),
  )

  const filteredBrands = brands.filter(
    (b) =>
      b.name.toLowerCase().includes(query) ||
      b.industry.toLowerCase().includes(query) ||
      b.bio.toLowerCase().includes(query) ||
      b.location.toLowerCase().includes(query),
  )

  const filteredGigs = gigs
    .filter(
      (g) =>
        g.title.toLowerCase().includes(query) ||
        g.creatorName.toLowerCase().includes(query) ||
        g.niche.toLowerCase().includes(query) ||
        g.tags.some((t) => t.toLowerCase().includes(query)),
    )
    .sort((a, b) => {
      const aFeat = (a as any).isFeatured ? 1 : 0

      const bFeat = (b as any).isFeatured ? 1 : 0

      if (bFeat !== aFeat) {
        return bFeat - aFeat
      }

      return (b.id || 0) - (a.id || 0)
    })

  const filteredEvents = events.filter(
    (e) =>
      e.title.toLowerCase().includes(query) ||
      e.subtitle.toLowerCase().includes(query) ||
      e.venue.toLowerCase().includes(query) ||
      e.tag.toLowerCase().includes(query),
  )

  const isSearching = query.length > 0

  const renderSearchResults = () => {
    const hasCreators = filteredCreators.length > 0

    const hasBrands = filteredBrands.length > 0

    const hasGigs = filteredGigs.length > 0

    const hasEvents = filteredEvents.length > 0

    const hasAnyResults = hasCreators || hasBrands || hasGigs || hasEvents

    if (!hasAnyResults) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-5 text-center">
          <span className="text-4xl mb-3">🔍</span>
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            No matches found
          </h3>
          <p className="text-xs text-slate-400 max-w-[240px]">
            We couldn't find anything matching "{searchQuery}" in Kolkata.
          </p>
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-6">
        {hasCreators && (
          <div>
            <h3 className="px-5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Creators ({filteredCreators.length})
            </h3>
            <div className="grid grid-cols-2 gap-3 px-5">
              {filteredCreators.map((creator) => {
                const hasInstagram =
                  (creator as any).isInstagramConnected === true ||
                  ((creator as any).isInstagramConnected !== false &&
                    creator.followers &&
                    creator.followers !== "0")

                return (
                  <div
                    key={creator.id}
                    onClick={() => onCreatorClick(creator.name)}
                    className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex flex-col items-center text-center relative overflow-hidden transition-transform active:scale-[0.98] cursor-pointer hover:border-slate-200"
                  >
                    <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-[#e8edff] to-transparent opacity-60" />
                    <div className="relative mt-1 mb-2 z-10">
                      <img
                        src={creator.avatar}
                        alt={creator.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                      />
                      {creator.verified && (
                        <span className="absolute bottom-0 right-0 w-4 h-4 bg-[#3b5bdb] rounded-full flex items-center justify-center border border-white">
                          <svg
                            width="6"
                            height="6"
                            viewBox="0 0 10 10"
                            fill="none"
                          >
                            <path
                              d="M2 5l2 2 4-4"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              fill="none"
                            />
                          </svg>
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-bold text-slate-900 leading-tight truncate w-full px-1">
                      {creator.name}
                    </div>
                    <div className="text-[9px] text-slate-400 font-medium mb-1">
                      {creator.handle}
                    </div>
                    {hasInstagram && (
                      <span className="text-[9px] font-bold text-[#e4405f] bg-rose-50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 mb-1">
                        <InstagramIcon />
                        {(creator as any).instagram?.followersFormatted ||
                          creator.followers}
                      </span>
                    )}
                    <div className="text-[9px] text-slate-500 font-semibold truncate max-w-full mb-3">
                      {creator.niche}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onCreatorClick(creator.name)
                      }}
                      className="w-full mt-auto bg-[#3b5bdb]/10 hover:bg-[#3b5bdb]/20 text-[#3b5bdb] text-[9px] font-bold py-1.5 rounded-lg transition cursor-pointer"
                    >
                      View Profile
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {hasBrands && (
          <div>
            <h3 className="px-5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Brands ({filteredBrands.length})
            </h3>
            <div className="flex flex-col gap-3 px-5">
              {filteredBrands.map((brand) => {
                const isFollowing = followedBrands.has(brand.id)

                return (
                  <div
                    key={brand.id}
                    onClick={() => onBrandClick(brand)}
                    className="bg-white rounded-3xl p-3 shadow-sm border border-slate-100 flex gap-3 cursor-pointer transition-transform active:scale-[0.98] hover:border-slate-200"
                  >
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      className="w-11 h-11 rounded-xl object-cover border border-slate-100 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {brand.name}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFollowBrand(brand.id)
                          }}
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-lg transition cursor-pointer ${
                            isFollowing
                              ? "bg-slate-100 text-slate-500"
                              : "bg-[#3b5bdb] text-white shadow-sm"
                          }`}
                        >
                          {isFollowing ? "Following" : "Follow"}
                        </button>
                      </div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase">
                        {brand.industry}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {hasGigs && (
          <div>
            <h3 className="px-5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Gigs ({filteredGigs.length})
            </h3>
            <div className="flex flex-col gap-3 px-5">
              {filteredGigs.map((gig) => {
                const poster = resolveGigPosterDetails(
                  gig,
                  userProfile,
                  creators,
                  brands,
                )

                return (
                  <div
                    key={gig.id}
                    onClick={() => onApply(gig)}
                    className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 cursor-pointer flex justify-between items-center"
                  >
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate mb-1">
                        {gig.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span
                          onClick={(e) => {
                            e.stopPropagation()
                            onCreatorClick(poster.name)
                          }}
                          className="text-[10px] text-slate-500 hover:text-[#3b5bdb] hover:underline"
                        >
                          {poster.name}
                        </span>
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                          {formatBudget(gig.budget, gig.type)}
                        </span>
                      </div>
                    </div>
                    {userAppliedGigIds?.has(gig.id) && !poster.isOwner ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1 flex-shrink-0 ml-3">
                        ✓ Applied
                      </span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onApply(gig)
                        }}
                        className="bg-[#3b5bdb] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex-shrink-0 ml-3"
                      >
                        {poster.isOwner ? "View Applications" : "Apply"}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {hasEvents && (
          <div>
            <h3 className="px-5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Events ({filteredEvents.length})
            </h3>
            <div className="flex flex-col gap-3 px-5">
              {filteredEvents.map((event) => {
                const isRsvp = rsvpEvents.has(event.id)

                return (
                  <div
                    key={event.id}
                    onClick={() => onSelectEvent && onSelectEvent(event)}
                    className="bg-white rounded-3xl p-3 shadow-sm border border-slate-100 flex items-center justify-between cursor-pointer hover:border-slate-200 transition"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 mb-0.5">
                        {event.title}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        {event.date} · {event.venue}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectEvent && onSelectEvent(event)
                      }}
                      className={`text-[9px] font-bold px-3 py-1.5 rounded-lg transition ${
                        isRsvp
                          ? "bg-emerald-50 text-emerald-600 cursor-default"
                          : "bg-[#3b5bdb] text-white cursor-pointer"
                      }`}
                    >
                      {isRsvp ? "✓ Registered" : "Register Now"}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide pb-28">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-0.5">
              <MapPinIcon />
              <span>Kolkata, West Bengal</span>
            </div>
            <h1 className="font-display text-[22px] font-black text-slate-900 leading-tight tracking-tight">
              Explore <span className="text-[#3b5bdb]">Kolkata</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onBellClick}
              className="relative w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-600 border border-slate-100 transition active:scale-95"
            >
              <BellIcon />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#f76707] text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>
            <img
              src={userAvatar}
              alt="Profile"
              onClick={onProfileClick}
              className="w-10 h-10 rounded-full object-cover border-2 border-[#3b5bdb] cursor-pointer hover:opacity-90 transition active:scale-95"
            />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-5 mb-5">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2.5 bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-100">
            <span className="text-slate-400">
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder={`Search ${
                activeFilter === "all"
                  ? "creators, brands, gigs..."
                  : activeFilter
              }...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 text-sm text-slate-700 placeholder:text-slate-400 outline-none bg-transparent font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 text-xs font-bold flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter pills */}
      <div className="px-5 mb-5">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {[
            { id: "all", label: "✨ All" },

            { id: "creators", label: "👤 Creators" },

            { id: "brands", label: "🏢 Brands" },

            { id: "gigs", label: "💼 Gigs" },

            { id: "events", label: "📅 Events" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveFilter(tab.id as any)
              }}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeFilter === tab.id
                  ? "bg-[#3b5bdb] text-white shadow-md shadow-blue-200"
                  : "bg-white text-slate-500 border border-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      {activeFilter === "all" && !isSearching && (
        <div className="flex flex-col gap-2">
          {/* Featured Creators Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between px-5 mb-3">
              <h2 className="text-base font-bold text-slate-900">
                Featured Creators 🌟
              </h2>
              <button
                onClick={() => setActiveFilter("creators")}
                className="text-xs font-semibold text-[#3b5bdb]"
              >
                See all →
              </button>
            </div>
            <div className="flex gap-4 px-5 overflow-x-auto scrollbar-hide pb-1">
              {creators.slice(0, 4).map((creator) => {
                const hasInstagram =
                  (creator as any).isInstagramConnected === true ||
                  ((creator as any).isInstagramConnected !== false &&
                    creator.followers &&
                    creator.followers !== "0")

                return (
                  <div
                    key={creator.id}
                    onClick={() => onCreatorClick(creator.name)}
                    className="min-w-[150px] bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex flex-col items-center text-center relative overflow-hidden flex-shrink-0 cursor-pointer transition-transform active:scale-[0.98] hover:border-slate-200"
                  >
                    <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-[#e8edff] to-transparent opacity-60" />
                    <div className="relative mt-1 mb-2 z-10">
                      <img
                        src={creator.avatar}
                        alt={creator.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md shadow-slate-100"
                      />
                      {creator.verified && (
                        <span className="absolute bottom-0 right-0 w-4 h-4 bg-[#3b5bdb] rounded-full flex items-center justify-center border border-white">
                          <svg
                            width="6"
                            height="6"
                            viewBox="0 0 10 10"
                            fill="none"
                          >
                            <path
                              d="M2 5l2 2 4-4"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              fill="none"
                            />
                          </svg>
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-bold text-slate-900 leading-tight truncate w-full px-1">
                      {creator.name}
                    </div>
                    <div className="text-[9px] text-slate-400 font-medium mb-2">
                      {creator.handle}
                    </div>
                    {hasInstagram && (
                      <span className="text-[9px] font-bold text-[#e4405f] bg-rose-50 px-2.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <InstagramIcon />
                        {(creator as any).instagram?.followersFormatted ||
                          creator.followers}
                      </span>
                    )}
                    <span className="text-[9px] text-slate-500 font-semibold mt-1 truncate max-w-full">
                      {creator.niche}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top Brands Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between px-5 mb-3">
              <h2 className="text-base font-bold text-slate-900">
                Top Brands 🏢
              </h2>
              <button
                onClick={() => setActiveFilter("brands")}
                className="text-xs font-semibold text-[#3b5bdb]"
              >
                See all →
              </button>
            </div>
            <div className="flex gap-4 px-5 overflow-x-auto scrollbar-hide pb-1">
              {brands.map((brand) => {
                const isFollowing = followedBrands.has(brand.id)

                return (
                  <div
                    key={brand.id}
                    onClick={() => onBrandClick(brand)}
                    className="min-w-[280px] w-[280px] h-[100px] bg-white rounded-3xl p-3 shadow-sm border border-slate-100 flex gap-3 flex-shrink-0 relative cursor-pointer transition-transform active:scale-[0.98] hover:border-slate-200"
                  >
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-100 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {brand.name}
                            </span>
                            {brand.verified && (
                              <span className="w-3.5 h-3.5 bg-[#3b5bdb] rounded-full flex items-center justify-center flex-shrink-0">
                                <svg
                                  width="6"
                                  height="6"
                                  viewBox="0 0 10 10"
                                  fill="none"
                                >
                                  <path
                                    d="M2 5l2 2 4-4"
                                    stroke="white"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    fill="none"
                                  />
                                </svg>
                              </span>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleFollowBrand(brand.id)
                            }}
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-lg transition-all flex-shrink-0 cursor-pointer ${
                              isFollowing
                                ? "bg-slate-100 text-slate-500"
                                : "bg-[#3b5bdb] text-white shadow-sm shadow-blue-100"
                            }`}
                          >
                            {isFollowing ? "Following" : "Follow"}
                          </button>
                        </div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase leading-none">
                          {brand.industry}
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed mb-0">
                        {brand.bio}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Trending Gigs Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between px-5 mb-3">
              <h2 className="text-base font-bold text-slate-900">
                Trending Gigs 💼
              </h2>
              <button
                onClick={() => setActiveFilter("gigs")}
                className="text-xs font-semibold text-[#3b5bdb]"
              >
                See all →
              </button>
            </div>
            <div className="flex flex-col gap-3 px-5">
              {gigs.slice(0, 2).map((gig) => {
                const poster = resolveGigPosterDetails(
                  gig,
                  userProfile,
                  creators,
                  brands,
                )

                return (
                  <div
                    key={gig.id}
                    onClick={() => onApply(gig)}
                    className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 cursor-pointer transition-transform active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div
                        onClick={(e) => {
                          e.stopPropagation()
                          onCreatorClick(poster.name)
                        }}
                        className="flex items-center gap-3 cursor-pointer hover:opacity-85"
                      >
                        <div className="relative">
                          <img
                            src={poster.avatar}
                            alt={poster.name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-100"
                          />
                          {poster.verified && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#3b5bdb] rounded-full flex items-center justify-center border border-white">
                              <svg
                                width="6"
                                height="6"
                                viewBox="0 0 10 10"
                                fill="none"
                              >
                                <path
                                  d="M2 5l2 2 4-4"
                                  stroke="white"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  fill="none"
                                />
                              </svg>
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900">
                            {poster.name}
                          </span>
                          <div className="text-[10px] text-slate-400 font-medium">
                            {poster.handle}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[gig.type]}`}
                        >
                          {gig.type}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onShareGig(gig)
                          }}
                          className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:text-[#3b5bdb] hover:bg-blue-50 transition active:scale-95 cursor-pointer"
                          title="Share Gig"
                        >
                          <ShareIcon />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 mb-2 truncate">
                      {gig.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        {formatBudget(gig.budget, gig.type)}
                      </span>
                      {userAppliedGigIds?.has(gig.id) && !poster.isOwner ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                          ✓ Applied
                        </span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onApply(gig)
                          }}
                          className="bg-[#3b5bdb] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm"
                        >
                          {poster.isOwner ? "View Applications" : "Apply"}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Featured Events Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between px-5 mb-3">
              <h2 className="text-base font-bold text-slate-900">
                Featured Events 📅
              </h2>
              <button
                onClick={() => setActiveFilter("events")}
                className="text-xs font-semibold text-[#3b5bdb]"
              >
                See all →
              </button>
            </div>
            <div className="flex gap-4 px-5 overflow-x-auto scrollbar-hide pb-1">
              {events.map((event) => {
                const isRsvp = rsvpEvents.has(event.id)

                const isFeat = (event as any).isFeatured || false

                return (
                  <div
                    key={event.id}
                    onClick={() => onSelectEvent && onSelectEvent(event)}
                    className={`min-w-[280px] rounded-3xl overflow-hidden shadow-md relative cursor-pointer flex-shrink-0 ${
                      isFeat ? "ring-2 ring-amber-400" : ""
                    }`}
                    style={{ background: event.color }}
                  >
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-[110px] object-cover opacity-30"
                    />
                    <div className="absolute inset-0 p-4 flex flex-col justify-between">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/30">
                            {event.tag}
                          </span>
                          {isFeat && (
                            <span className="bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm">
                              ⭐ FEATURED
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelectEvent && onSelectEvent(event)
                          }}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md active:scale-95 transition ${
                            isRsvp
                              ? "bg-emerald-100 text-emerald-700 cursor-default"
                              : "bg-white text-slate-800 cursor-pointer"
                          }`}
                        >
                          {isRsvp ? "✓ Registered" : "Register Now"}
                        </button>
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-sm leading-tight mb-0.5">
                          {event.title}
                        </h3>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-white/80 text-[10px]">
                            <CalendarIcon />
                            <span>
                              {event.date} · {event.time}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Specific categories and Search results */}
      {isSearching && renderSearchResults()}

      {!isSearching && activeFilter === "creators" && (
        <div className="grid grid-cols-2 gap-3 px-5">
          {filteredCreators.map((creator) => {
            const hasInstagram =
              (creator as any).isInstagramConnected === true ||
              ((creator as any).isInstagramConnected !== false &&
                creator.followers &&
                creator.followers !== "0")

            return (
              <div
                key={creator.id}
                className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex flex-col items-center text-center relative overflow-hidden transition-transform active:scale-[0.98]"
              >
                <div className="absolute top-0 inset-x-0 h-12 bg-gradient-to-b from-[#e8edff] to-transparent opacity-60" />
                <div className="relative mt-2 mb-2 z-10">
                  <img
                    src={creator.avatar}
                    alt={creator.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md shadow-slate-100"
                  />
                  {creator.verified && (
                    <span className="absolute bottom-0 right-0 w-5 h-5 bg-[#3b5bdb] rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                      <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                        <path
                          d="M2 5l2 2 4-4"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                      </svg>
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold text-slate-900 leading-tight truncate w-full px-1">
                  {creator.name}
                </div>
                <div className="text-[10px] text-slate-400 font-medium mb-2">
                  {creator.handle}
                </div>
                <div className="flex gap-1.5 items-center mb-3">
                  {hasInstagram && (
                    <span className="text-[9px] font-bold text-[#e4405f] bg-rose-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <InstagramIcon />
                      {(creator as any).instagram?.followersFormatted ||
                        creator.followers}
                    </span>
                  )}
                  {creator.engagement && (
                    <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {creator.engagement} ER
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 line-clamp-2 min-h-[28px] leading-relaxed mb-4 px-1">
                  {creator.bio}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onCreatorClick(creator.name)
                  }}
                  className="w-full mt-auto bg-[#3b5bdb]/10 hover:bg-[#3b5bdb]/20 text-[#3b5bdb] text-[10px] font-bold py-2 rounded-xl transition cursor-pointer"
                >
                  View Profile
                </button>
              </div>
            )
          })}
        </div>
      )}

      {!isSearching && activeFilter === "brands" && (
        <div className="flex flex-col gap-3 px-5">
          {filteredBrands.map((brand) => {
            const isFollowing = followedBrands.has(brand.id)

            return (
              <div
                key={brand.id}
                onClick={() => onBrandClick(brand)}
                className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 transition-transform active:scale-[0.99] hover:border-slate-200 flex gap-3 cursor-pointer"
              >
                <img
                  src={brand.logo}
                  alt={brand.name}
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-100 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm font-bold text-slate-900 truncate">
                        {brand.name}
                      </span>
                      {brand.verified && (
                        <span className="w-4 h-4 bg-[#3b5bdb] rounded-full flex items-center justify-center flex-shrink-0">
                          <svg
                            width="8"
                            height="8"
                            viewBox="0 0 10 10"
                            fill="none"
                          >
                            <path
                              d="M2 5l2 2 4-4"
                              stroke="white"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              fill="none"
                            />
                          </svg>
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFollowBrand(brand.id)
                      }}
                      className={`text-[10px] font-bold px-3 py-1 rounded-xl transition cursor-pointer ${
                        isFollowing
                          ? "bg-slate-100 text-slate-500"
                          : "bg-[#3b5bdb] text-white shadow-sm shadow-blue-100"
                      }`}
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {brand.industry}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="text-[10px] text-slate-500 font-medium flex items-center gap-0.5">
                      <MapPinIcon />
                      {brand.location}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                    {brand.bio}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                      💼 {brand.campaignsCount} active campaigns
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!isSearching && activeFilter === "gigs" && (
        <div className="flex flex-col gap-3 px-5">
          {filteredGigs.map((gig, i) => {
            const poster = resolveGigPosterDetails(
              gig,
              userProfile,
              creators,
              brands,
            )

            return (
              <div
                key={gig.id}
                onClick={() => onApply(gig)}
                className={`bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 cursor-pointer transition-transform active:scale-[0.98] ${
                  i === 0 ? "border-2 border-[#3b5bdb]/30" : ""
                }`}
              >
                {i === 0 && (
                  <div className="bg-[#3b5bdb] px-4 py-1.5 flex items-center gap-2">
                    <span className="text-white text-[11px] font-bold tracking-wide">
                      ⚡ Featured Gig
                    </span>
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div
                      onClick={(e) => {
                        e.stopPropagation()
                        onCreatorClick(poster.name)
                      }}
                      className="flex items-center gap-3 cursor-pointer hover:opacity-85"
                    >
                      <div className="relative">
                        <img
                          src={poster.avatar}
                          alt={poster.name}
                          className="w-11 h-11 rounded-full object-cover border-2 border-[#e8edff]"
                        />
                        {poster.verified && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#3b5bdb] rounded-full flex items-center justify-center border border-white">
                            <svg
                              width="8"
                              height="8"
                              viewBox="0 0 10 10"
                              fill="none"
                            >
                              <path
                                d="M2 5l2 2 4-4"
                                stroke="white"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="none"
                              />
                            </svg>
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-bold text-slate-900">
                          {poster.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400 font-medium">
                            {poster.handle}
                          </span>
                          {poster.followers && poster.followers !== "0" && (
                            <span className="flex items-center gap-0.5 text-[10px] font-bold text-[#e4405f] bg-rose-50 px-1.5 py-0.5 rounded-full">
                              <InstagramIcon />
                              {poster.followers}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onShareGig(gig)
                      }}
                      className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:text-[#3b5bdb] hover:bg-blue-50 active:scale-90 transition cursor-pointer"
                      title="Share Gig"
                    >
                      <ShareIcon />
                    </button>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2 leading-snug">
                    {gig.title}
                  </h3>
                  <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${TYPE_COLORS[gig.type]}`}
                    >
                      {gig.type}
                    </span>
                    {gig.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-slate-400 font-medium mb-0.5">
                        Budget / Offer
                      </div>
                      <div className="text-sm font-bold text-slate-800">
                        {formatBudget(gig.budget, gig.type)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 font-medium">
                          {gig.applicants} applied
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <MapPinIcon />
                          <span className="font-medium">
                            {formatLocation(gig.location)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onApply(gig)
                        }}
                        className="bg-[#3b5bdb] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm shadow-blue-200 whitespace-nowrap"
                      >
                        {poster.isOwner ? "View Applications" : "Apply ↗"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!isSearching && activeFilter === "events" && (
        <div className="flex flex-col gap-4 px-5">
          {filteredEvents.map((event) => {
            const isRsvp = rsvpEvents.has(event.id)

            return (
              <div
                key={event.id}
                onClick={() => onSelectEvent && onSelectEvent(event)}
                className="w-full h-[180px] rounded-3xl overflow-hidden shadow-md border border-slate-100 flex flex-col relative transition-transform active:scale-[0.99] cursor-pointer hover:border-slate-200"
              >
                <img
                  src={event.image}
                  alt={event.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/20" />

                <div className="absolute inset-0 p-4 flex flex-col justify-between z-10">
                  {/* Top Row: Tag/Featured & RSVP Button */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="bg-white/20 backdrop-blur-md text-white text-[9px] font-bold px-2.5 py-1 rounded-full border border-white/30 uppercase tracking-wider">
                        {event.tag}
                      </span>
                      {(event as any).isFeatured && (
                        <span className="bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm">
                          ⭐ FEATURED
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectEvent && onSelectEvent(event)
                      }}
                      className={`text-[10px] font-bold px-3.5 py-1.5 rounded-full shadow-md active:scale-95 transition ${
                        isRsvp
                          ? "bg-emerald-500/20 backdrop-blur-md text-emerald-300 border border-emerald-500/30 cursor-default"
                          : "bg-white text-slate-800 hover:bg-slate-50 cursor-pointer"
                      }`}
                    >
                      {isRsvp ? "✓ Registered" : "Register Now"}
                    </button>
                  </div>

                  {/* Bottom Row: Title & Info */}
                  <div className="flex justify-between items-end gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-display font-black text-base leading-tight mb-1 truncate">
                        {event.title}
                      </h3>
                      {event.subtitle && (
                        <p className="text-white/70 text-[10px] font-medium truncate mb-1.5">
                          {event.subtitle}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-white/80 text-[10px]">
                        <span className="flex items-center gap-1">
                          <CalendarIcon />
                          {event.date} · {event.time}
                        </span>
                        <span className="flex items-center gap-1 truncate">
                          <MapPinIcon />
                          {event.venue}
                        </span>
                      </div>
                    </div>

                    {/* Attendees count */}
                    <div className="flex items-center gap-1 text-[10px] text-white/85 bg-white/10 backdrop-blur-sm border border-white/10 px-2.5 py-1 rounded-full flex-shrink-0">
                      <UsersIcon />
                      <span className="font-bold">
                        {event.attendees + (isRsvp ? 1 : 0)} attending
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Notifications Page ──────────────────────────────────────────────────────

function NotificationsPage({
  onBack,

  unreadNotifications,

  setUnreadNotifications,

  dbNotifications = [],

  onNotificationAction,
}: {
  onBack: () => void

  unreadNotifications: Set<number>

  setUnreadNotifications: React.Dispatch<React.SetStateAction<Set<number>>>

  dbNotifications?: any[]

  onNotificationAction?: (notification: any) => void
}) {
  const [activeTab, setActiveTab] = useState<"all" | "activity" | "system">(
    "all",
  )

  const handleMarkAllRead = () => {
    setUnreadNotifications(new Set())

    dbNotifications.forEach(async (n) => {
      if (!n.read && n.id) {
        try {
          await updateDoc(doc(db, "notifications", n.id), { read: true })
        } catch (e) {}
      }
    })
  }

  const handleToggleRead = async (item: any) => {
    if (item.isDbDoc && item.dbId) {
      try {
        await updateDoc(doc(db, "notifications", item.dbId), {
          read: !item.read,
        })
      } catch (e) {}
    } else {
      setUnreadNotifications((prev) => {
        const next = new Set(prev)

        if (next.has(item.id)) {
          next.delete(item.id)
        } else {
          next.add(item.id)
        }

        return next
      })
    }
  }

  const combinedList = [
    ...(dbNotifications || []).map((n) => ({
      id: n.id,
      dbId: n.id,
      title: n.title,
      message: n.message,
      time: n.createdAt
        ? new Date(n.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Just now",
      type: n.type || "system",
      category: n.category || "activity",
      actionText: n.actionText || "View",
      read: n.read ?? false,
      avatar: n.avatar || null,
      isDbDoc: true,
      raw: n,
    })),
    ...NOTIFICATIONS.map((n) => ({
      id: n.id,
      dbId: null,
      title: n.title,
      message: n.message,
      time: n.time,
      type: n.type,
      category: n.category,
      actionText: n.actionText,
      read: !unreadNotifications.has(n.id),
      avatar: n.avatar || null,
      isDbDoc: false,
      raw: n,
    })),
  ]

  const filteredNotifications = combinedList.filter((n) => {
    if (activeTab === "all") return true

    return n.category === activeTab
  })

  const unreadCount = combinedList.filter((n) => !n.read).length

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide pb-10 bg-slate-50 flex flex-col min-h-screen">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 active:scale-95 transition"
          >
            <ArrowLeftIcon />
          </button>
          <h1 className="font-display text-[20px] font-black text-slate-900 leading-tight">
            Notifications
          </h1>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs font-bold text-[#3b5bdb] hover:underline"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="px-5 py-4 bg-white border-b border-slate-100 flex gap-2">
        {([
          { id: "all", label: "All" },

          { id: "activity", label: "Activity" },

          { id: "system", label: "System" },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
              activeTab === tab.id
                ? "bg-[#3b5bdb] text-white shadow-sm"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="flex-1 px-4 py-4 flex flex-col gap-3">
        {filteredNotifications.map((notification) => {
          const isUnread = !notification.read

          const renderNotificationIcon = () => {
            if (notification.avatar) {
              return (
                <img
                  src={notification.avatar}
                  alt={notification.title}
                  className="w-11 h-11 rounded-full object-cover border border-slate-100"
                />
              )
            }

            return (
              <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center font-bold text-xs text-[#3b5bdb]">
                {notification.type === "system" ? "SYS" : "ACT"}
              </div>
            )
          }

          return (
            <div
              key={notification.id}
              onClick={() => {
                handleToggleRead(notification)
                if (onNotificationAction) onNotificationAction(notification)
              }}
              className={`p-4 rounded-3xl bg-white border transition-all duration-200 cursor-pointer flex gap-3 relative ${
                isUnread
                  ? "border-l-4 border-l-[#3b5bdb] border-slate-100 shadow-sm"
                  : "border-slate-100"
              }`}
            >
              <div className="flex-shrink-0 relative">
                {renderNotificationIcon()}
                {isUnread && (
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#f76707] rounded-full border-2 border-white" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-bold text-slate-800 truncate">
                    {(notification.title || "")
                      .replace(
                        /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu,
                        "",
                      )
                      .trim()}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap ml-2">
                    {notification.time}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed mb-2.5">
                  {(notification.message || "")
                    .replace(
                      /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu,
                      "",
                    )
                    .trim()}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleRead(notification)
                      if (onNotificationAction)
                        onNotificationAction(notification)
                    }}
                    className="text-[10px] font-bold text-[#3b5bdb] bg-[#3b5bdb]/10 px-3 py-1.5 rounded-xl hover:bg-[#3b5bdb]/20 transition"
                  >
                    {notification.actionText}
                  </button>
                  {isUnread && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleRead(notification)
                      }}
                      className="text-[10px] font-medium text-slate-400 hover:text-slate-600 px-2 py-1.5 transition"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {filteredNotifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              No notifications
            </h3>
            <p className="text-xs text-slate-400 max-w-[200px]">
              You are all caught up for now!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Chat Page ───────────────────────────────────────────────────────────────

function ChatPage({
  chats = [],
  setChats,
  activeChatId,
  setActiveChatId,
  handleOpenChat,
  userProfile,
  gigs = [],
  conversations = [],
  setConversations,
  activeConvoId,
  setActiveConvoId,
  activeMessages = [],
  currentUser,
  creators = [],
  brands = [],
  onStartCall,
}: {
  chats: ChatThread[]
  setChats: React.Dispatch<React.SetStateAction<ChatThread[]>>
  activeChatId: number | null
  setActiveChatId: (id: number | null) => void
  handleOpenChat: (id: number) => void
  userProfile?: any
  gigs?: any[]
  conversations: Conversation[]
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>
  activeConvoId: string | null
  setActiveConvoId: (id: string | null) => void
  activeMessages: LiveMessage[]
  currentUser?: any
  creators: Creator[]
  brands: Brand[]
  onStartCall?: (type: "audio" | "video") => void
}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [inputText, setInputText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showGigPanel, setShowGigPanel] = useState(false)
  const [gigPanelApps, setGigPanelApps] = useState<any[]>([])
  const [gigPanelLoading, setGigPanelLoading] = useState(false)
  const [gigPanelAction, setGigPanelAction] =
    useState<Record<number, "accepting" | "rejecting" | "accepted" | "rejected">>(
      {},
    )
  const [gigPanelToast, setGigPanelToast] = useState<string | null>(null)

  const safeConversations = conversations || []
  const safeChats = chats || []
  const safeCreators = creators || []
  const safeBrands = brands || []

  const activeConvo = safeConversations.find((c) => c.id === activeConvoId)
  const activeChat = safeChats.find((c) => c.id === activeChatId)

  const otherUid = activeConvo
    ? activeConvo.participants.find((uid) => uid !== currentUser?.uid) || ""
    : ""
  const chatName = activeConvo
    ? activeConvo.participantNames[otherUid] || "Kreator Member"
    : activeChat?.name || ""
  const chatAvatar = activeConvo
    ? activeConvo.participantAvatars[otherUid] || ""
    : activeChat?.avatar || ""
  const chatHandle = activeConvo
    ? activeConvo.participantHandles[otherUid] || ""
    : activeChat?.handle || ""
  const otherUserObj = activeConvo
    ? safeCreators.find((c: any) => c.uid === otherUid) ||
      safeBrands.find((b: any) => b.uid === otherUid)
    : null
  const otherLastSeen = otherUserObj?.lastSeen
  const chatOnline = activeConvo
    ? otherLastSeen
      ? new Date().getTime() - new Date(otherLastSeen).getTime() < 300000
      : false
    : activeChat?.online || false
  const chatVerified = activeConvo
    ? otherUserObj?.verified || false
    : activeChat?.verified || false

  const displayThreads = [
    ...conversations.map((convo) => {
      const oUid =
        convo.participants.find((uid) => uid !== currentUser?.uid) || ""
      const lastMsgText = convo.lastMessage || "No messages yet"
      const lastMsgTime = convo.lastMessageTime
        ? new Date(convo.lastMessageTime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : ""
      const uObj =
        creators.find((c: any) => c.uid === oUid) ||
        brands.find((b: any) => b.uid === oUid)
      const uLastSeen = uObj?.lastSeen
      const uOnline = uLastSeen
        ? new Date().getTime() - new Date(uLastSeen).getTime() < 300000
        : false
      return {
        id: convo.id,
        isReal: true,
        name: convo.participantNames[oUid] || "Kreator Member",
        avatar:
          convo.participantAvatars[oUid] ||
          "https://images.unsplash.com/photo-1624610261655-777af2f586d7?w=80&h=80&fit=crop&auto=format",
        handle: convo.participantHandles[oUid] || "@member",
        online: uOnline,
        verified: uObj?.verified || false,
        unreadCount: convo.unreadCounts?.[currentUser?.uid || ""] || 0,
        lastMessageText: lastMsgText,
        lastMessageTime: lastMsgTime,
      }
    }),
    ...chats
      .filter((c) => {
        const hasRealConvo = conversations.some((convo) => {
          const oUid =
            convo.participants.find((uid) => uid !== currentUser?.uid) || ""
          return (
            convo.participantNames[oUid]?.toLowerCase() === c.name.toLowerCase()
          )
        })
        return !hasRealConvo
      })
      .map((c) => {
        const lastMsg = c.messages[c.messages.length - 1]
        return {
          id: c.id,
          isReal: false,
          name: c.name,
          avatar: c.avatar,
          handle: c.handle,
          online: c.online,
          verified: c.verified,
          unreadCount: c.unreadCount,
          lastMessageText: lastMsg ? lastMsg.text : "No messages yet",
          lastMessageTime: lastMsg ? lastMsg.time : "",
        }
      }),
  ]

  const filteredChats = displayThreads.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.handle.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getAutoReplyMessage = (name: string, userMsg: string): string => {
    const text = userMsg.toLowerCase()
    if (name.includes("Arjun")) {
      if (
        text.includes("weekend") ||
        text.includes("saturday") ||
        text.includes("sunday")
      ) {
        return "Saturday afternoon works perfectly for me! Let's meet near Kumartuli around 3 PM? 📸"
      }
      if (
        text.includes("hi") ||
        text.includes("hello") ||
        text.includes("hey")
      ) {
        return "Hey Priya! Glad we connected. I was just looking at some street shoots we could do. Are you free this weekend?"
      }
      return "That sounds like a plan! Let's catch up and lock in the shoot details. 🚀"
    }
    if (name.includes("Bahar"))
      return "Perfect! Our project manager will send over the agreement draft. Let us know if you have any questions about the deliverables. 💼"
    if (name.includes("Tanisha"))
      return "Yay! Can't wait. Let's try that new cafe on Park Street, I heard their brews are amazing! ☕"
    return "Thanks for the message! Let's coordinate and get this moving. 👍"
  }

  const handleSendMessage = async () => {
    if (!inputText.trim()) return
    const userMessageText = inputText.trim()
    setInputText("")
    if (activeConvoId && currentUser) {
      try {
        const convoRef = doc(db, "conversations", activeConvoId)
        const msgRef = collection(
          db,
          "conversations",
          activeConvoId,
          "messages",
        )
        await addDoc(msgRef, {
          text: userMessageText,
          senderId: currentUser.uid,
          senderName: userProfile?.name || "Kreator Member",
          senderAvatar:
            userProfile?.avatar ||
            userProfile?.logo ||
            "https://images.unsplash.com/photo-1624610261655-777af2f586d7?w=80&h=80&fit=crop&auto=format",
          timestamp: new Date().toISOString(),
        })
        const oUid =
          activeConvo?.participants.find((uid) => uid !== currentUser.uid) || ""
        await updateDoc(convoRef, {
          lastMessage: userMessageText,
          lastMessageTime: new Date().toISOString(),
          lastSenderId: currentUser.uid,
          [`unreadCounts.${oUid}`]: increment(1),
        })
        await addDoc(collection(db, "notifications"), {
          recipientUid: oUid,
          recipientName: activeConvo?.participantNames[oUid] || "Creator",
          senderName: userProfile?.name || "Kreator Member",
          senderAvatar:
            userProfile?.avatar ||
            userProfile?.logo ||
            "https://images.unsplash.com/photo-1624610261655-777af2f586d7?w=80&h=80&fit=crop&auto=format",
          type: "message",
          title: `New message from ${userProfile?.name}!`,
          message: userMessageText.slice(0, 60),
          createdAt: new Date().toISOString(),
          read: false,
        })
      } catch (err) {
        console.warn("Failed to send message to Firestore:", err)
      }
    } else if (activeChatId) {
      const now = new Date()
      const timeStr = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
      const currentChat = chats.find((c) => c.id === activeChatId)
      if (!currentChat) return
      const userMessage = {
        id: Date.now(),
        text: userMessageText,
        sender: "me",
        time: timeStr,
      }
      await updateDoc(doc(db, "chats", String(activeChatId)), {
        messages: [...currentChat.messages, userMessage],
      })
      setIsTyping(true)
      setTimeout(async () => {
        setIsTyping(false)
        const latestChat = chats.find((c) => c.id === activeChatId)
        if (!latestChat) return
        const replyText = getAutoReplyMessage(
          latestChat.name || "",
          userMessageText,
        )
        await updateDoc(doc(db, "chats", String(activeChatId)), {
          messages: [
            ...latestChat.messages,
            {
              id: Date.now() + 1,
              text: replyText,
              sender: "them",
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
          ],
        })
      }, 1500)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSendMessage()
  }

  const openGigPanel = async () => {
    if (!chatName) return
    setShowGigPanel(true)
    setGigPanelLoading(true)
    try {
      const q = query(
        collection(db, "applications"),
        where("applicantName", "==", chatName),
      )
      const snap = await getDocs(q)
      const apps = snap.docs.map((d) => ({
        id: d.id,
        docRef: d.ref,
        ...d.data(),
      }))
      const myGigIds = new Set(
        (gigs || [])
          .filter(
            (g: any) =>
              g.userId === (userProfile?.uid || null) ||
              g.creatorName === userProfile?.name,
          )
          .map((g: any) => g.id),
      )
      const relevant = apps.filter((a: any) => myGigIds.has(a.gigId))
      setGigPanelApps(relevant)
    } catch (err) {
      console.warn("GigPanel fetch error:", err)
      setGigPanelApps([])
    } finally {
      setGigPanelLoading(false)
    }
  }

  const handleGigPanelAction = async (
    app: any,
    action: "accept" | "reject",
  ) => {
    setGigPanelAction((prev) => ({
      ...prev,
      [app.gigId]: action === "accept" ? "accepting" : "rejecting",
    }))
    try {
      const qGigs = query(collection(db, "gigs"), where("id", "==", app.gigId))
      const gigSnap = await getDocs(qGigs)
      if (!gigSnap.empty) {
        if (action === "accept") {
          await updateDoc(gigSnap.docs[0].ref, {
            applicantSelected: true,
            selectedApplicantName: app.applicantName || chatName || "Creator",
            selectedApplicantAvatar: app.applicantAvatar || chatAvatar || null,
            selectedApplicantHandle:
              app.instaHandle || app.applicantHandle || "",
            selectedApplicantUid: app.applicantUid || null,
            status: "Closed",
          })
        }
      }
      if (app.docRef)
        await updateDoc(app.docRef, {
          status: action === "accept" ? "accepted" : "rejected",
        })
      setGigPanelAction((prev) => ({
        ...prev,
        [app.gigId]: action === "accept" ? "accepted" : "rejected",
      }))
      if (action === "accept") {
        setGigPanelToast(
          `✅ Accepted ${app.applicantName || chatName} for "${app.gigTitle || "Gig"}"!`,
        )
        setTimeout(() => setGigPanelToast(null), 4000)

        // Send Push Notification for Application Accepted
        if (app.applicantUid) {
          await addDoc(collection(db, "notifications"), {
            recipientUid: app.applicantUid,
            recipientName: app.applicantName || chatName || "Creator",
            senderName: userProfile?.name || "Gig Host",
            senderAvatar:
              userProfile?.avatar ||
              userProfile?.logo ||
              "https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=80&h=80&fit=crop&auto=format",
            title: "Application Accepted!",
            senderUid: auth.currentUser?.uid || null,
            message: `Congratulations! Your application for "${app.gigTitle || "Gig"}" was accepted by ${userProfile?.name || "Gig Host"}!`,
            type: "application",
            category: "activity",
            actionText: "Open Chat",
            read: false,
            createdAt: new Date().toISOString(),
            avatar:
              userProfile?.avatar ||
              userProfile?.logo ||
              "https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=80&h=80&fit=crop&auto=format",
          })
        }
      }
    } catch (err: any) {
      alert(err.message || "Action failed")
      setGigPanelAction((prev) => {
        const n = { ...prev }
        delete n[app.gigId]
        return n
      })
    }
  }

  if (activeConvoId || activeChatId) {
    const messagesToRender = activeConvoId
      ? activeMessages
      : activeChat?.messages || []
    return (
      <div className="flex-1 bg-slate-50 flex flex-col h-screen relative">
        <div className="px-4 pt-12 pb-3 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => {
                setActiveConvoId(null)
                setActiveChatId(null)
                setShowGigPanel(false)
              }}
              className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 active:scale-95 transition cursor-pointer"
            >
              <ArrowLeftIcon />
            </button>
            <div className="relative flex-shrink-0">
              <img
                src={chatAvatar}
                alt={chatName}
                className="w-10 h-10 rounded-full object-cover border border-slate-100"
              />
              {chatOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm animate-pulse" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold text-slate-900 truncate">
                  {chatName}
                </span>
                {chatVerified && (
                  <span className="w-3.5 h-3.5 bg-[#3b5bdb] rounded-full flex items-center justify-center flex-shrink-0">
                    <svg width="6" height="6" viewBox="0 0 10 10" fill="none">
                      <path
                        d="M2 5l2 2 4-4"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </svg>
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 font-semibold">
                {chatOnline ? "Online" : "Offline"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onStartCall?.("audio")}
              className="w-9.5 h-9.5 rounded-full bg-slate-50 hover:bg-[#e8edff] text-slate-600 hover:text-[#3b5bdb] flex items-center justify-center active:scale-95 transition cursor-pointer border border-slate-100 shadow-2xs"
              title="Voice Call"
            >
              <PhoneIcon />
            </button>
            <button
              onClick={() => onStartCall?.("video")}
              className="w-9.5 h-9.5 rounded-full bg-slate-50 hover:bg-[#e8edff] text-slate-600 hover:text-[#3b5bdb] flex items-center justify-center active:scale-95 transition cursor-pointer border border-slate-100 shadow-2xs"
              title="Video Call"
            >
              <VideoIcon />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3.5 pb-24 scrollbar-hide">
          {messagesToRender.map((msg: any) => {
            const isMe = activeConvoId
              ? msg.senderId === currentUser?.uid
              : msg.sender === "me"
            const formattedTime = activeConvoId
              ? msg.timestamp
                ? new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : ""
              : msg.time
            return (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[75%] ${
                  isMe ? "self-end items-end" : "self-start items-start"
                }`}
              >
                <div
                  className={`px-4 py-2.5 rounded-3xl text-sm leading-relaxed ${
                    isMe
                      ? "bg-[#3b5bdb] text-white rounded-tr-sm shadow-sm"
                      : "bg-white text-slate-800 border border-slate-100 rounded-tl-sm shadow-sm"
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[9px] text-slate-400 font-medium mt-1 px-1">
                  {formattedTime}
                </span>
              </div>
            )
          })}
          {isTyping && (
            <div className="flex flex-col items-start self-start max-w-[75%]">
              <div className="px-4 py-3 rounded-3xl bg-white border border-slate-100 rounded-tl-sm flex gap-1 items-center shadow-sm">
                <span
                  className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
              <span className="text-[9px] text-slate-400 font-medium mt-1 px-1">
                {chatName} is typing...
              </span>
            </div>
          )}
        </div>
        <div className="absolute bottom-0 inset-x-0 bg-white border-t border-slate-100 px-4 py-3 flex items-center gap-2 z-10 shadow-lg">
          <button
            onClick={openGigPanel}
            className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-lg text-slate-500 hover:bg-[#e8edff] hover:text-[#3b5bdb] transition active:scale-95 cursor-pointer"
          >
            ＋
          </button>
          <input
            type="text"
            placeholder="Type a message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-slate-50 rounded-2xl px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 outline-none border border-slate-100 font-medium"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim()}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md transition cursor-pointer ${
              inputText.trim()
                ? "bg-[#3b5bdb] active:scale-95"
                : "bg-slate-200 cursor-not-allowed shadow-none"
            }`}
          >
            ➔
          </button>
        </div>
        {showGigPanel && (
          <>
            <div
              className="absolute inset-0 bg-black/30 z-20"
              onClick={() => setShowGigPanel(false)}
            />
            {gigPanelToast && (
              <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2">
                {gigPanelToast}
              </div>
            )}
            <div className="absolute bottom-0 inset-x-0 z-30 bg-white rounded-t-[28px] shadow-2xl border-t border-slate-100 flex flex-col max-h-[70vh]">
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-slate-200 rounded-full" />
              </div>
              <div className="px-5 pt-2 pb-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                    Gig Applications
                  </div>
                  <div className="text-sm font-black text-slate-900">
                    {chatName}'s Applications
                  </div>
                </div>
                <button
                  onClick={() => setShowGigPanel(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3 scrollbar-hide">
                {gigPanelLoading ? (
                  <div className="flex flex-col items-center py-10 gap-3">
                    <div className="w-7 h-7 rounded-full border-3 border-slate-200 border-t-[#3b5bdb] animate-spin" />
                    <span className="text-xs text-slate-400 font-medium">
                      Loading applications...
                    </span>
                  </div>
                ) : gigPanelApps.length === 0 ? (
                  <div className="flex flex-col items-center py-10 gap-3 text-center">
                    <span className="text-4xl">📭</span>
                    <div className="text-sm font-bold text-slate-800">
                      No Applications Found
                    </div>
                    <p className="text-xs text-slate-400 max-w-[220px]">
                      {chatName} hasn't applied to any of your posted gigs yet.
                    </p>
                  </div>
                ) : (
                  gigPanelApps.map((app: any) => {
                    const statusText = gigPanelAction[app.gigId] || app.status
                    const isDone =
                      statusText === "accepted" || statusText === "rejected"
                    return (
                      <div
                        key={app.id}
                        className={`rounded-2xl border p-4 flex flex-col gap-3 transition ${
                          statusText === "accepted"
                            ? "bg-emerald-50 border-emerald-200"
                            : statusText === "rejected"
                              ? "bg-slate-50 border-slate-200 opacity-60"
                              : "bg-white border-slate-100 shadow-sm"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#e8edff] flex items-center justify-center flex-shrink-0">
                            <span className="text-base">📋</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-black text-slate-900 leading-tight mb-0.5 truncate">
                              {app.gigTitle || "Untitled Gig"}
                            </div>
                            {app.expectedRate && (
                              <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                                {app.expectedRate}
                              </div>
                            )}
                          </div>
                          {isDone && (
                            <span
                              className={`text-[9px] font-black px-2 py-1 rounded-full flex-shrink-0 ${
                                statusText === "accepted"
                                  ? "text-emerald-700 bg-emerald-100"
                                  : "text-slate-500 bg-slate-100"
                              }`}
                            >
                              {statusText === "accepted"
                                ? "✅ Accepted"
                                : "❌ Rejected"}
                            </span>
                          )}
                        </div>
                        {app.pitch && (
                          <div className="bg-slate-50 rounded-xl px-3 py-2 text-[10px] text-slate-500 leading-relaxed border border-slate-100 italic line-clamp-2">
                            "{app.pitch}"
                          </div>
                        )}
                        {!isDone && (
                          <div className="flex gap-2">
                            <button
                              disabled={!!gigPanelAction[app.gigId]}
                              onClick={() =>
                                handleGigPanelAction(app, "accept")
                              }
                              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-2.5 rounded-xl transition active:scale-95 disabled:opacity-60 flex items-center justify-center gap-1 cursor-pointer"
                            >
                              {gigPanelAction[app.gigId] === "accepting" ? (
                                <svg
                                  className="animate-spin w-3 h-3"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <circle
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="white"
                                    strokeWidth="3"
                                    strokeDasharray="60"
                                    strokeDashoffset="20"
                                  />
                                </svg>
                              ) : (
                                "✅ Accept"
                              )}
                            </button>
                            <button
                              disabled={!!gigPanelAction[app.gigId]}
                              onClick={() =>
                                handleGigPanelAction(app, "reject")
                              }
                              className="flex-1 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 text-xs font-bold py-2.5 rounded-xl transition active:scale-95 disabled:opacity-60 flex items-center justify-center gap-1 border border-slate-200 hover:border-red-200 cursor-pointer"
                            >
                              {gigPanelAction[app.gigId] === "rejecting" ? (
                                <svg
                                  className="animate-spin w-3 h-3"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <circle
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    strokeDasharray="60"
                                    strokeDashoffset="20"
                                  />
                                </svg>
                              ) : (
                                "❌ Reject"
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide pb-28 bg-slate-50 flex flex-col min-h-screen">
      <div className="px-5 pt-12 pb-4 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-0.5">
            <MapPinIcon />
            <span>Kolkata, WB</span>
          </div>
          <h1 className="font-display text-[22px] font-black text-slate-900 leading-tight tracking-tight">
            Chats <span className="text-[#3b5bdb]">Messages</span>
          </h1>
        </div>
        <button className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 active:scale-95 transition border border-slate-100 cursor-pointer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
        </button>
      </div>
      <div className="px-4 py-3 bg-white border-b border-slate-100 mb-2">
        <div className="flex items-center gap-2.5 bg-slate-50 rounded-2xl px-4 py-2.5 border border-slate-100">
          <span className="text-slate-400">
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 text-sm text-slate-700 placeholder:text-slate-400 outline-none bg-transparent font-medium"
          />
        </div>
      </div>
      <div className="flex-1 px-4 py-2 flex flex-col gap-2.5">
        {filteredChats.map((thread) => {
          const isUnread = thread.unreadCount > 0
          return (
            <div
              key={thread.id}
              onClick={() => {
                if (thread.isReal) {
                  setActiveConvoId(String(thread.id))
                  setActiveChatId(null)
                } else {
                  handleOpenChat(Number(thread.id))
                }
              }}
              className="p-3.5 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3 cursor-pointer transition active:scale-[0.99]"
            >
              <div className="relative flex-shrink-0">
                <img
                  src={thread.avatar}
                  alt={thread.name}
                  className="w-12 h-12 rounded-full object-cover border border-slate-100 shadow-sm"
                />
                {thread.online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm animate-pulse" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {thread.name}
                    </span>
                    {thread.verified && (
                      <span className="w-3.5 h-3.5 bg-[#3b5bdb] rounded-full flex items-center justify-center flex-shrink-0">
                        <svg
                          width="6"
                          height="6"
                          viewBox="0 0 10 10"
                          fill="none"
                        >
                          <path
                            d="M2 5l2 2 4-4"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                          />
                        </svg>
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {thread.lastMessageTime}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`text-[11px] truncate flex-1 leading-relaxed ${
                      isUnread
                        ? "text-slate-800 font-bold"
                        : "text-slate-400 font-medium"
                    }`}
                  >
                    {thread.lastMessageText}
                  </p>
                  {isUnread && (
                    <span className="bg-[#3b5bdb] text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center">
                      {thread.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {filteredChats.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-4xl mb-3">💬</span>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              No chats found
            </h3>
            <p className="text-xs text-slate-400 max-w-[200px]">
              No conversations match your search query.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Public Profile Page ──────────────────────────────────────────────────────

function PublicProfilePage({
  creator,

  onBack,

  followedCreators,

  toggleFollowCreator,

  onMessageCreator,
}: {
  creator: Creator

  onBack: () => void

  followedCreators: Set<number>

  toggleFollowCreator: (id: number) => void

  onMessageCreator: (creator: Creator) => void
}) {
  const [activeTab, setActiveTab] = useState<"portfolio" | "reviews">(
    "portfolio",
  )

  const [copied, setCopied] = useState(false)
  const [showAvatarViewer, setShowAvatarViewer] = useState(false)
  const [activePhotoViewerIndex, setActivePhotoViewerIndex] =
    useState<number | null>(null)

  const isFollowing = followedCreators.has(creator.id)

  const handleShare = () => {
    setCopied(true)

    setTimeout(() => setCopied(false), 2000)
  }

  const getPortfolioItems = (id: number) => {
    const galleries: Record<number, string[]> = {
      1: [
        "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=300&h=300&fit=crop&auto=format",

        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&h=300&fit=crop&auto=format",

        "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300&h=300&fit=crop&auto=format",

        "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300&h=300&fit=crop&auto=format",
      ],

      2: [
        "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&h=300&fit=crop&auto=format",

        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&h=300&fit=crop&auto=format",

        "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=300&h=300&fit=crop&auto=format",

        "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=300&h=300&fit=crop&auto=format",
      ],

      3: [
        "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&h=300&fit=crop&auto=format",

        "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=300&h=300&fit=crop&auto=format",

        "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=300&h=300&fit=crop&auto=format",

        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=300&fit=crop&auto=format",
      ],

      4: [
        "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=300&h=300&fit=crop&auto=format",

        "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&h=300&fit=crop&auto=format",

        "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=300&fit=crop&auto=format",

        "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=300&h=300&fit=crop&auto=format",
      ],

      5: [
        "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300&h=300&fit=crop&auto=format",

        "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=300&h=300&fit=crop&auto=format",

        "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=300&h=300&fit=crop&auto=format",

        "https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=300&h=300&fit=crop&auto=format",
      ],

      6: [
        "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=300&h=300&fit=crop&auto=format",

        "https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?w=300&h=300&fit=crop&auto=format",

        "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300&h=300&fit=crop&auto=format",

        "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop&auto=format",
      ],
    }

    return galleries[id] || galleries[1]
  }

  const getReviews = (name: string) => {
    return [
      {
        id: 1,
        author: "Rang Bahar Textiles",
        rating: 5,
        text: `Absolute pleasure collaborating with ${name}. Content was high-quality and delivered on time!`,
        date: "1 month ago",
      },

      {
        id: 2,
        author: "The Calcutta Table",
        rating: 5,
        text: `Great engagement on the post. Highly recommend collaborating!`,
        date: "2 months ago",
      },
    ]
  }

  const livePortfolio =
    (creator as any).portfolioItems &&
    (creator as any).portfolioItems.length > 0
      ? (creator as any).portfolioItems.map((item: any) =>
          typeof item === "string" ? item : item.img || item.url,
        )
      : getPortfolioItems(creator.id)

  const reviews = getReviews(creator.name)

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide pb-28 bg-[#f8fafc] flex flex-col min-h-screen">
      {/* Hero */}
      <div className="relative">
        <div className="h-32 w-full bg-gradient-to-r from-[#3b5bdb] via-[#7048e8] to-[#f76707]">
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage:
                "radial-gradient(circle at center, white 1px, transparent 1.5px)",
              backgroundSize: "16px 16px",
            }}
          />
        </div>

        <div className="absolute top-10 left-0 right-0 flex items-center justify-between px-5">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/20 text-white active:scale-95 transition"
          >
            <ArrowLeftIcon />
          </button>
          <button
            onClick={handleShare}
            className="w-9 h-9 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/20 text-white active:scale-95 transition relative"
          >
            <ShareIcon />
            {copied && (
              <span className="absolute -bottom-8 right-0 bg-slate-900 text-white text-[9px] font-bold px-2 py-1 rounded whitespace-nowrap shadow-md">
                Link copied!
              </span>
            )}
          </button>
        </div>

        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
          <div
            className="relative cursor-pointer group active:scale-95 transition duration-150"
            onClick={() => setShowAvatarViewer(true)}
          >
            <img
              src={creator.avatar}
              alt={creator.name}
              className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md shadow-slate-200 group-hover:opacity-90"
            />
            {creator.verified && (
              <span className="absolute bottom-0.5 right-0.5 w-5 h-5 bg-[#3b5bdb] rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M2 5l2 2 4-4"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 pt-16 pb-4 bg-white border-b border-slate-100 shadow-sm flex flex-col items-center text-center">
        <div className="flex flex-col items-center mb-2">
          <h2 className="font-display text-xl font-black text-slate-900 leading-tight mb-1">
            {creator.name}
          </h2>
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 font-semibold">
            <span>{creator.handle}</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="text-[#f76707] font-bold">{creator.niche}</span>
          </div>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed mb-4 max-w-sm">
          {creator.bio}
        </p>

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-4">
          <MapPinIcon />
          <span>Kolkata, West Bengal · Creator</span>
        </div>

        <div className="flex gap-3 mb-4 w-full">
          <button
            onClick={() => toggleFollowCreator(creator.id)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
              isFollowing
                ? "bg-slate-100 text-slate-500 border border-slate-200"
                : "bg-[#3b5bdb] text-white shadow-blue-100"
            }`}
          >
            {isFollowing ? "✓ Following" : "Follow"}
          </button>
          <button
            onClick={() => onMessageCreator(creator)}
            className="flex-1 py-2.5 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-600 shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition"
          >
            Message
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2 pt-2 w-full">
          {[
            {
              label: "Followers",
              value:
                (creator as any).instagram?.followersFormatted ||
                creator.followers,
              color: "text-rose-500",
            },

            {
              label: "Avg. ER",
              value: creator.engagement,
              color: "text-indigo-500",
            },

            { label: "Collabs", value: "14+", color: "text-emerald-500" },

            { label: "Rating", value: "5.0 ★", color: "text-amber-500" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-slate-50 rounded-2xl py-3 px-1 text-center border border-slate-100"
            >
              <div
                className={`text-sm font-black leading-none mb-1 stat.color ${stat.color}`}
              >
                {stat.value}
              </div>
              <div className="text-[9px] text-slate-400 font-semibold">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 mt-4 mb-3">
        <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-slate-100 gap-1">
          {[
            { id: "portfolio", label: "Portfolio" },

            { id: "reviews", label: `Reviews (${reviews.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === tab.id
                  ? "bg-[#3b5bdb] text-white shadow-sm"
                  : "text-slate-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "portfolio" && (
        <div className="grid grid-cols-3 gap-2 px-5">
          {livePortfolio.map((img: string, i: number) => (
            <div
              key={i}
              onClick={() => setActivePhotoViewerIndex(i)}
              className="aspect-[3/4] bg-slate-200 rounded-2xl overflow-hidden shadow-sm border border-slate-100 cursor-pointer active:opacity-90 transition duration-150"
            >
              <img
                src={img}
                alt="portfolio item"
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {activeTab === "reviews" && (
        <div className="px-5 flex flex-col gap-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  {review.author}
                </span>
                <span className="text-[9px] text-slate-400 font-semibold">
                  {review.date}
                </span>
              </div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className="text-amber-400 text-xs">
                    ★
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {review.text}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Avatar Viewer Overlay */}
      {showAvatarViewer && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowAvatarViewer(false)}
        >
          <button
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-lg cursor-pointer active:scale-95 transition border-none"
            onClick={() => setShowAvatarViewer(false)}
          >
            ✕
          </button>
          <img
            src={creator.avatar}
            alt={creator.name}
            className="max-w-full max-h-[80vh] rounded-3xl object-contain shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Fullscreen Film-strip / Instagram-like Portfolio Viewer Overlay */}
      {activePhotoViewerIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setActivePhotoViewerIndex(null)}
        >
          {/* Close button */}
          <button
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-lg cursor-pointer active:scale-95 transition z-50 border-none"
            onClick={() => setActivePhotoViewerIndex(null)}
          >
            ✕
          </button>

          {/* Film list container */}
          <div
            className="w-full max-w-md flex flex-col items-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prev button */}
            {activePhotoViewerIndex > 0 && (
              <button
                onClick={() =>
                  setActivePhotoViewerIndex(activePhotoViewerIndex - 1)
                }
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-lg cursor-pointer z-50 active:scale-95 transition border-none shadow-md"
              >
                ‹
              </button>
            )}

            {/* Viewport container */}
            <div className="w-full overflow-hidden relative">
              <div
                className="flex transition-transform duration-300 ease-out"
                style={{
                  transform: `translateX(-${activePhotoViewerIndex * 100}%)`,
                }}
              >
                {livePortfolio.map((img: string, idx: number) => (
                  <div key={idx} className="w-full flex-shrink-0 px-6">
                    <div className="w-full aspect-[3/4] max-h-[70vh] rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-slate-950 flex items-center justify-center">
                      <img
                        src={img}
                        alt={`Portfolio item ${idx + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Next button */}
            {activePhotoViewerIndex < livePortfolio.length - 1 && (
              <button
                onClick={() =>
                  setActivePhotoViewerIndex(activePhotoViewerIndex + 1)
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-lg cursor-pointer z-50 active:scale-95 transition border-none shadow-md"
              >
                ›
              </button>
            )}
          </div>

          {/* Dots Indicator */}
          <div className="flex gap-1.5 mt-4 z-40">
            {livePortfolio.map((_: any, idx: number) => (
              <span
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                  activePhotoViewerIndex === idx
                    ? "bg-white scale-125"
                    : "bg-white/30"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Public Brand Profile Page ────────────────────────────────────────────────

function PublicBrandProfilePage({
  brand,

  onBack,

  followedBrands,

  toggleFollowBrand,

  onMessageBrand,

  onApply,

  gigs = GIGS,

  userProfile,

  creators = [],

  brands = [],

  userAppliedGigIds,
}: {
  brand: Brand

  onBack: () => void

  followedBrands: Set<number>

  toggleFollowBrand: (id: number) => void

  onMessageBrand: (brand: Brand) => void

  onApply: (gig: Gig) => void

  gigs?: Gig[]

  userProfile?: any

  creators?: Creator[]

  brands?: Brand[]

  userAppliedGigIds?: Set<number>
}) {
  const [activeTab, setActiveTab] = useState<"campaigns" | "about">("campaigns")

  const [copied, setCopied] = useState(false)

  const isFollowing = followedBrands.has(brand.id)

  const handleShare = () => {
    setCopied(true)

    setTimeout(() => setCopied(false), 2000)
  }

  const brandGigs = gigs.filter(
    (g) => g.brand && g.brand.toLowerCase() === brand.name.toLowerCase(),
  )

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide pb-28 bg-[#f8fafc] flex flex-col min-h-screen">
      {/* Hero */}
      <div className="relative">
        <div className="h-32 w-full bg-gradient-to-r from-[#3b5bdb] via-[#7048e8] to-[#f76707]">
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage:
                "radial-gradient(circle at center, white 1px, transparent 1.5px)",
              backgroundSize: "16px 16px",
            }}
          />
        </div>

        <div className="absolute top-10 left-0 right-0 flex items-center justify-between px-5">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/20 text-white active:scale-95 transition cursor-pointer"
          >
            <ArrowLeftIcon />
          </button>
          <button
            onClick={handleShare}
            className="w-9 h-9 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/20 text-white active:scale-95 transition relative cursor-pointer"
          >
            <ShareIcon />
            {copied && (
              <span className="absolute -bottom-8 right-0 bg-slate-900 text-white text-[9px] font-bold px-2 py-1 rounded whitespace-nowrap shadow-md">
                Link copied!
              </span>
            )}
          </button>
        </div>

        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
          <div className="relative">
            <img
              src={brand.logo}
              alt={brand.name}
              className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md shadow-slate-200"
            />
            {brand.verified && (
              <span className="absolute bottom-0.5 right-0.5 w-5 h-5 bg-[#3b5bdb] rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M2 5l2 2 4-4"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 pt-16 pb-4 bg-white border-b border-slate-100 shadow-sm flex flex-col items-center text-center">
        <div className="flex flex-col items-center mb-2">
          <h2 className="font-display text-xl font-black text-slate-900 leading-tight mb-1">
            {brand.name}
          </h2>
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 font-semibold">
            <span>Brand Account</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="text-[#3b5bdb] font-bold">{brand.industry}</span>
          </div>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed mb-4 max-w-sm">
          {brand.bio}
        </p>

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-4">
          <MapPinIcon />
          <span>{brand.location || "Kolkata, WB"} · Brand Partner</span>
        </div>

        <div className="flex gap-3 mb-4 w-full">
          <button
            onClick={() => toggleFollowBrand(brand.id)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
              isFollowing
                ? "bg-slate-100 text-slate-500 border border-slate-200"
                : "bg-[#3b5bdb] text-white shadow-blue-100"
            }`}
          >
            {isFollowing ? "✓ Following" : "Follow Brand"}
          </button>
          <button
            onClick={() => onMessageBrand(brand)}
            className="flex-1 py-2.5 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-600 shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer"
          >
            Message
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2 pt-2 w-full">
          {[
            { label: "Followers", value: "45K+", color: "text-indigo-500" },

            {
              label: "Active Gigs",
              value: brandGigs.length,
              color: "text-emerald-500",
            },

            {
              label: "Industry",
              value: brand.industry.split(" ")[0],
              color: "text-rose-500",
            },

            { label: "Rating", value: "4.8 ★", color: "text-amber-500" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-slate-50 rounded-2xl py-3 px-1 text-center border border-slate-100 min-w-0"
            >
              <div
                className={`text-xs font-black leading-none mb-1 truncate ${stat.color}`}
              >
                {stat.value}
              </div>
              <div className="text-[9px] text-slate-400 font-semibold truncate">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 mt-4 mb-3">
        <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-slate-100 gap-1">
          {[
            { id: "campaigns", label: `Campaigns (${brandGigs.length})` },

            { id: "about", label: "About Brand" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === tab.id
                  ? "bg-[#3b5bdb] text-white shadow-sm"
                  : "text-slate-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "campaigns" && (
        <div className="px-5 flex flex-col gap-3">
          {brandGigs.map((gig) => {
            const poster = resolveGigPosterDetails(
              gig,
              userProfile,
              creators,
              brands,
            )

            return (
              <div
                key={gig.id}
                onClick={() => onApply(gig)}
                className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 cursor-pointer transition-transform active:scale-[0.98] hover:border-slate-200"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-snug mb-1">
                      {gig.title}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[gig.type] || "bg-slate-100"}`}
                      >
                        {gig.type}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {formatBudget(gig.budget, gig.type)}
                      </span>
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded-full">
                    {gig.location}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed mb-3">
                  {gig.description}
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[9px] text-slate-400 font-semibold">
                    Deadline: {formatDeadline(gig.deadline)}
                  </span>
                  {userAppliedGigIds?.has(gig.id) && !poster.isOwner ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      ✓ Applied
                    </span>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onApply(gig)
                      }}
                      className="bg-[#3b5bdb] text-white text-[10px] font-bold px-3 py-1 rounded-xl shadow-sm cursor-pointer"
                    >
                      {poster.isOwner ? "View Applications" : "Apply Now"}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
          {brandGigs.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-xs font-medium bg-white rounded-3xl border border-slate-100 shadow-sm">
              No active campaigns right now.
            </div>
          )}
        </div>
      )}

      {activeTab === "about" && (
        <div className="px-5">
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col gap-4">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Overview
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {brand.bio}
              </p>
            </div>
            <div className="border-t border-slate-50 pt-3 flex flex-col gap-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Industry</span>
                <span className="text-slate-800 font-bold">
                  {brand.industry}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Location</span>
                <span className="text-slate-800 font-bold">
                  {brand.location}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Website</span>
                <span className="text-[#3b5bdb] font-bold cursor-pointer hover:underline">
                  www.{brand.name.toLowerCase().replace(/\s+/g, "")}.com
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">
                  Verification Status
                </span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  ✓ Verified Brand Partner
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Slidable Intro Pages ───────────────────────────────────────────────────

function SlideScreen({
  slide,

  onNext,

  onSkip,

  current,

  total,
}: {
  slide: typeof SLIDES[0]

  onNext: () => void

  onSkip: () => void

  current: number

  total: number
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(false)

    const t = setTimeout(() => setMounted(true), 30)

    return () => clearTimeout(t)
  }, [slide.id])

  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        overflow: "hidden",
        minHeight: "100svh",
      }}
    >
      {/* full-bleed image */}
      <img
        src={slide.img}
        alt={slide.alt}
        style={{
          position: "absolute",

          inset: 0,

          width: "100%",

          height: "100%",

          objectFit: "cover",

          objectPosition: "center",

          transition: "opacity 0.5s ease",

          opacity: mounted ? 1 : 0,
        }}
      />

      {/* gradient: dark at top fading, then clear middle, then strong at bottom */}
      <div
        style={{
          position: "absolute",

          inset: 0,

          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0) 40%, rgba(10,14,30,0.72) 70%, rgba(8,10,24,0.96) 100%)",
        }}
      />

      {/* top bar — floats over image */}
      <div
        style={{
          position: "absolute",

          top: 0,

          left: 0,

          right: 0,

          display: "flex",

          justifyContent: "space-between",

          alignItems: "center",

          padding: "52px 28px 0",
        }}
      >
        <span
          style={{
            fontFamily: "'Instrument Sans', sans-serif",

            fontSize: 11,

            fontWeight: 600,

            letterSpacing: "0.16em",

            textTransform: "uppercase",

            color: "rgba(255,255,255,0.7)",
          }}
        >
          {slide.tag}
        </span>
        <button
          onClick={onSkip}
          style={{
            background: "rgba(255,255,255,0.14)",

            border: "1px solid rgba(255,255,255,0.2)",

            borderRadius: 99,

            padding: "6px 16px",

            color: "rgba(255,255,255,0.85)",

            fontFamily: "'Instrument Sans', sans-serif",

            fontSize: 12,

            fontWeight: 500,

            cursor: "pointer",

            backdropFilter: "blur(8px)",
          }}
        >
          Skip
        </button>
      </div>

      {/* bottom content panel */}
      <div
        style={{
          position: "absolute",

          bottom: 0,

          left: 0,

          right: 0,

          padding: "40px 28px 44px",

          transition: "opacity 0.45s ease, transform 0.45s ease",

          opacity: mounted ? 1 : 0,

          transform: mounted ? "translateY(0)" : "translateY(20px)",
        }}
      >
        {/* headline */}
        <h1
          style={{
            fontFamily: "'DM Serif Display', serif",

            fontSize: 56,

            lineHeight: 1.0,

            margin: "0 0 16px",

            letterSpacing: "-0.02em",

            color: "#fff",
          }}
        >
          <span style={{ display: "block" }}>{slide.headline}</span>
          <span style={{ display: "block", color: "#7fa3ff" }}>
            {slide.headlineAccent}
          </span>
        </h1>

        {/* sub */}
        <p
          style={{
            fontFamily: "'Instrument Sans', sans-serif",

            fontSize: 14,

            lineHeight: 1.65,

            color: "rgba(255,255,255,0.6)",

            margin: "0 0 36px",

            maxWidth: 300,
          }}
        >
          {slide.sub}
        </p>

        {/* nav row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* progress dots */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {Array.from({ length: total }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === current ? 24 : 7,

                  height: 7,

                  borderRadius: 99,

                  background: i === current ? "#fff" : "rgba(255,255,255,0.25)",

                  transition: "all 0.35s ease",
                }}
              />
            ))}
          </div>

          {/* next */}
          <button
            onClick={onNext}
            style={{
              display: "flex",

              alignItems: "center",

              gap: 10,

              background: INTRO_BLUE,

              border: "none",

              borderRadius: 99,

              padding: "13px 24px",

              color: "#fff",

              fontFamily: "'Instrument Sans', sans-serif",

              fontSize: 14,

              fontWeight: 600,

              cursor: "pointer",

              boxShadow: "0 8px 28px rgba(43,78,247,0.5)",

              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.04)"

              e.currentTarget.style.boxShadow =
                "0 12px 36px rgba(43,78,247,0.6)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)"

              e.currentTarget.style.boxShadow = "0 8px 28px rgba(43,78,247,0.5)"
            }}
          >
            Next
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Admin Components (Imported from ./admin/) ──

function AuthScreen({
  onBack,

  onAuthSubmit,
}: {
  onBack: () => void

  onAuthSubmit: (
    email: string,
    pass: string,
    mode: "login" | "signup",
    name: string,
    role?: "creator" | "brand" | "admin",
  ) => void
}) {
  const [mode, setMode] = useState<"signup" | "login">("signup")

  const [role, setRole] = useState<"creator" | "brand" | "admin">("creator")

  const [name, setName] = useState("")

  const [contact, setContact] = useState("")

  const [password, setPassword] = useState("")

  const field: CSSProperties = {
    width: "100%",

    padding: "15px 18px",

    borderRadius: 16,

    border: "1.5px solid #e2e6f5",

    background: "#f0f2fc",

    fontSize: 14,

    color: "#0a1628",

    fontFamily: "'Instrument Sans', sans-serif",

    outline: "none",

    boxSizing: "border-box",

    transition: "border-color 0.2s, background 0.2s",
  }

  return (
    <div
      style={{
        height: "100%",

        minHeight: "100svh",

        background: "#f5f7ff",

        display: "flex",

        flexDirection: "column",

        padding: "0 28px",

        overflow: "hidden",

        position: "relative",
      }}
    >
      {/* decorative blue arc top-right */}
      <div
        style={{
          position: "absolute",

          top: -80,

          right: -80,

          width: 240,

          height: 240,

          borderRadius: "50%",

          background:
            "radial-gradient(circle, rgba(43,78,247,0.1) 0%, transparent 70%)",

          pointerEvents: "none",
        }}
      />

      {/* dot grid */}
      <div
        style={{
          position: "absolute",

          inset: 0,

          backgroundImage:
            "radial-gradient(circle at center, rgba(157,200,255,0.45) 1.2px, transparent 1.4px)",

          backgroundSize: "18px 18px",

          backgroundPosition: "center",

          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          minHeight: "100svh",
        }}
      >
        {/* header row with back button & top-right Admin capital A redirect button */}
        <div style={{ marginTop: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button
            onClick={onBack}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#adb3cc",
              fontFamily: "'Instrument Sans', sans-serif",
              fontSize: 13,
              padding: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M13 8H3M7 4L3 8l4 4"
                stroke="#adb3cc"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back
          </button>

          <button
            onClick={() => {
              setRole("admin")
              setMode("login")
            }}
            title="Admin Portal Login"
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: role === "admin" ? "#3b5bdb" : "#ffffff",
              color: role === "admin" ? "#ffffff" : "#3b5bdb",
              border: role === "admin" ? "none" : "1.5px solid #d0d7f7",
              fontSize: 15,
              fontWeight: 900,
              fontFamily: "'DM Serif Display', serif",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(59,91,219,0.15)",
              transition: "all 0.2s",
            }}
          >
            A
          </button>
        </div>

        {/* brand */}
        <div style={{ marginTop: 36, marginBottom: 32 }}>
          <p
            style={{
              fontFamily: "'Instrument Sans', sans-serif",

              fontSize: 11,

              fontWeight: 600,

              letterSpacing: "0.14em",

              textTransform: "uppercase",

              color: INTRO_BLUE,

              marginBottom: 10,
            }}
          >
            Kreator Kolkata
          </p>
          <h2
            style={{
              fontFamily: "'DM Serif Display', serif",

              fontSize: 38,

              color: "#0a1628",

              margin: "0 0 10px",

              lineHeight: 1.1,

              whiteSpace: "pre-wrap",
            }}
          >
            {mode === "signup" ? "Join the\nmovement." : "Welcome\nback."}
          </h2>
          <p
            style={{
              fontFamily: "'Instrument Sans', sans-serif",

              fontSize: 13,

              color: "#9097b4",

              margin: 0,
            }}
          >
            {mode === "signup"
              ? "Create account. Fill your profile later."
              : "Good to see you again, creator."}
          </p>
        </div>

        {/* toggle */}
        <div
          style={{
            display: "flex",

            background: "#e8eaf5",

            borderRadius: 14,

            padding: 4,

            marginBottom: 24,
          }}
        >
          {(["signup", "login"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1,

                padding: "11px 0",

                borderRadius: 11,

                border: "none",

                cursor: "pointer",

                fontFamily: "'Instrument Sans', sans-serif",

                fontSize: 13,

                fontWeight: 600,

                background: mode === m ? "#fff" : "transparent",

                color: mode === m ? "#0a1628" : "#adb3cc",

                boxShadow: mode === m ? "0 2px 8px rgba(0,0,0,0.08)" : "none",

                transition: "all 0.2s",
              }}
            >
              {m === "signup" ? "Sign Up" : "Log In"}
            </button>
          ))}
        </div>

        {/* role selection (only for signup) */}
        {mode === "signup" && (
          <div
            style={{
              display: "flex",

              background: "#e8eaf5",

              borderRadius: 14,

              padding: 4,

              marginBottom: 16,
            }}
          >
            {(["creator", "brand"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                style={{
                  flex: 1,

                  padding: "9px 0",

                  borderRadius: 11,

                  border: "none",

                  cursor: "pointer",

                  fontFamily: "'Instrument Sans', sans-serif",

                  fontSize: 11,

                  fontWeight: 600,

                  background: role === r ? "#fff" : "transparent",

                  color: role === r ? "#0a1628" : "#adb3cc",

                  boxShadow: role === r ? "0 2px 8px rgba(0,0,0,0.08)" : "none",

                  transition: "all 0.2s",
                }}
              >
                {r === "creator"
                  ? "Creator"
                  : r === "brand"
                    ? "Brand"
                    : "Admin"}
              </button>
            ))}
          </div>
        )}

        {/* inputs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mode === "signup" && (
            <input
              type="text"
              placeholder={
                role === "brand"
                  ? "Company / Brand name"
                  : role === "admin"
                    ? "Admin Full Name"
                    : "Your name"
              }
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={field}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = INTRO_BLUE

                e.currentTarget.style.background = "#fff"
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#e2e6f5"

                e.currentTarget.style.background = "#f0f2fc"
              }}
            />
          )}
          <input
            type="text"
            placeholder="Mobile number or email"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            style={field}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = INTRO_BLUE

              e.currentTarget.style.background = "#fff"
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#e2e6f5"

              e.currentTarget.style.background = "#f0f2fc"
            }}
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={field}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = INTRO_BLUE

              e.currentTarget.style.background = "#fff"
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#e2e6f5"

              e.currentTarget.style.background = "#f0f2fc"
            }}
          />
        </div>

        {/* cta */}
        <button
          onClick={() => onAuthSubmit(contact, password, mode, name, role)}
          style={{
            marginTop: 24,

            width: "100%",

            padding: "16px 0",

            borderRadius: 16,

            border: "none",

            background: INTRO_BLUE,

            color: "#fff",

            fontFamily: "'Instrument Sans', sans-serif",

            fontSize: 15,

            fontWeight: 600,

            cursor: "pointer",

            boxShadow: "0 10px 30px rgba(43,78,247,0.28)",

            transition: "transform 0.15s, box-shadow 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)"

            e.currentTarget.style.boxShadow = "0 14px 36px rgba(43,78,247,0.36)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)"

            e.currentTarget.style.boxShadow = "0 10px 30px rgba(43,78,247,0.28)"
          }}
        >
          {mode === "signup" ? "Create Account →" : "Continue →"}
        </button>

        <p
          style={{
            fontFamily: "'Instrument Sans', sans-serif",

            fontSize: 12,

            color: "#c0c6dc",

            textAlign: "center",

            marginTop: 18,
          }}
        >
          Profile can always be completed later.
        </p>
      </div>
    </div>
  )
}

// ── Canvas Story Card Generator ──────────────────────────────────────────

const generateGigStoryImage = async (gig: Gig, poster: any): Promise<File> => {
  const canvas = document.createElement("canvas")

  canvas.width = 1080

  canvas.height = 1920

  const ctx = canvas.getContext("2d")

  if (!ctx) throw new Error("Could not get canvas context")

  // 1. Draw Background Gradient

  const grad = ctx.createLinearGradient(0, 0, 0, 1920)

  grad.addColorStop(0, "#3b5bdb")

  grad.addColorStop(0.5, "#7048e8")

  grad.addColorStop(1, "#f76707")

  ctx.fillStyle = grad

  ctx.fillRect(0, 0, 1080, 1920)

  // Add subtle grid radial dot pattern

  ctx.fillStyle = "rgba(255, 255, 255, 0.08)"

  for (let x = 60; x < 1080; x += 60) {
    for (let y = 60; y < 1920; y += 60) {
      ctx.beginPath()

      ctx.arc(x, y, 3, 0, Math.PI * 2)

      ctx.fill()
    }
  }

  // 2. Draw Title Header

  ctx.fillStyle = "#ffffff"

  ctx.font = "900 48px sans-serif"

  ctx.textAlign = "center"

  ctx.fillText("KREATOR KOLKATA", 540, 200)

  ctx.fillStyle = "rgba(255, 255, 255, 0.85)"

  ctx.font = "bold 32px sans-serif"

  ctx.fillText("NEW COLLABORATION GIG", 540, 260)

  // 3. Draw Main Card Container

  const cardX = 90

  const cardY = 360

  const cardW = 900

  const cardH = 1140

  const r = 50

  ctx.shadowColor = "rgba(0, 0, 0, 0.25)"

  ctx.shadowBlur = 35

  ctx.shadowOffsetX = 0

  ctx.shadowOffsetY = 15

  ctx.fillStyle = "#ffffff"

  ctx.beginPath()

  ctx.moveTo(cardX + r, cardY)

  ctx.lineTo(cardX + cardW - r, cardY)

  ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + r)

  ctx.lineTo(cardX + cardW, cardY + cardH - r)

  ctx.quadraticCurveTo(
    cardX + cardW,
    cardY + cardH,
    cardX + cardW - r,
    cardY + cardH,
  )

  ctx.lineTo(cardX + r, cardY + cardH)

  ctx.quadraticCurveTo(cardX, cardY + cardH, cardX, cardY + cardH - r)

  ctx.lineTo(cardX, cardY + r)

  ctx.quadraticCurveTo(cardX, cardY, cardX + r, cardY)

  ctx.closePath()

  ctx.fill()

  // Reset shadow

  ctx.shadowColor = "transparent"

  ctx.shadowBlur = 0

  ctx.shadowOffsetY = 0

  // 4. Load & Draw Avatar safely

  let avatarImg: HTMLImageElement | null = null

  let useFallbackAvatar = false

  if (poster.avatar) {
    try {
      avatarImg = new Image()

      avatarImg.crossOrigin = "anonymous"

      let avatarUrl = poster.avatar

      if (poster.avatar.startsWith("http")) {
        avatarUrl =
          poster.avatar +
          (poster.avatar.includes("?") ? "&" : "?") +
          "t=" +
          new Date().getTime()
      }

      avatarImg.src = avatarUrl

      await new Promise((resolve) => {
        avatarImg!.onload = () => resolve(null)

        avatarImg!.onerror = () => {
          // If direct load fails (e.g. CORS missing on bucket), fall back to public CORS proxy

          if (avatarImg && !avatarImg.src.includes("allorigins.win")) {
            avatarImg.src = `https://api.allorigins.win/raw?url=${encodeURIComponent(avatarUrl)}`
          } else {
            useFallbackAvatar = true

            resolve(null)
          }
        }
      })
    } catch (e) {
      useFallbackAvatar = true
    }
  } else {
    useFallbackAvatar = true
  }

  const avX = cardX + 80

  const avY = cardY + 100

  const avSize = 140

  if (!useFallbackAvatar && avatarImg) {
    ctx.strokeStyle = "#f1f5f9"

    ctx.lineWidth = 6

    ctx.beginPath()

    ctx.arc(avX + avSize / 2, avY + avSize / 2, avSize / 2 + 3, 0, Math.PI * 2)

    ctx.stroke()

    ctx.save()

    ctx.beginPath()

    ctx.arc(avX + avSize / 2, avY + avSize / 2, avSize / 2, 0, Math.PI * 2)

    ctx.clip()

    try {
      ctx.drawImage(avatarImg, avX, avY, avSize, avSize)
    } catch (e) {
      useFallbackAvatar = true
    }

    ctx.restore()
  }

  if (useFallbackAvatar) {
    ctx.fillStyle = "#3b5bdb"

    ctx.beginPath()

    ctx.arc(avX + avSize / 2, avY + avSize / 2, avSize / 2, 0, Math.PI * 2)

    ctx.fill()

    ctx.fillStyle = "#ffffff"

    ctx.font = "bold 64px sans-serif"

    ctx.textAlign = "center"

    const initial = (poster.name || "K").trim()[0].toUpperCase()

    ctx.fillText(initial, avX + avSize / 2, avY + avSize / 2 + 22)
  }

  // 5. Draw Poster Name

  ctx.fillStyle = "#0f172a"

  ctx.font = "bold 44px sans-serif"

  ctx.textAlign = "left"

  ctx.fillText(poster.name, avX + avSize + 40, avY + avSize / 2 - 10)

  // Draw Poster Handle

  ctx.fillStyle = "#64748b"

  ctx.font = "bold 32px sans-serif"

  ctx.fillText(
    poster.handle || "@kolkata.creator",
    avX + avSize + 40,
    avY + avSize / 2 + 40,
  )

  // Draw Verified checkmark

  if (poster.verified) {
    const checkX = avX + avSize + 45 + ctx.measureText(poster.name).width

    if (checkX < cardX + cardW - 80) {
      ctx.fillStyle = "#3b5bdb"

      ctx.beginPath()

      ctx.arc(checkX + 18, avY + avSize / 2 - 25, 18, 0, Math.PI * 2)

      ctx.fill()

      ctx.strokeStyle = "#ffffff"

      ctx.lineWidth = 3

      ctx.lineCap = "round"

      ctx.lineJoin = "round"

      ctx.beginPath()

      ctx.moveTo(checkX + 11, avY + avSize / 2 - 25)

      ctx.lineTo(checkX + 16, avY + avSize / 2 - 20)

      ctx.lineTo(checkX + 24, avY + avSize / 2 - 30)

      ctx.stroke()
    }
  }

  // 6. Draw Divider Line

  ctx.strokeStyle = "#f1f5f9"

  ctx.lineWidth = 4

  ctx.beginPath()

  ctx.moveTo(cardX + 80, cardY + 280)

  ctx.lineTo(cardX + cardW - 80, cardY + 280)

  ctx.stroke()

  // 7. Draw Campaign Title (Wrapped Text)

  ctx.fillStyle = "#0f172a"

  ctx.font = "900 52px sans-serif"

  const titleY = cardY + 370

  const titleText = gig.title

  const words = titleText.split(" ")

  let line = ""

  const lines = []

  const maxWidth = cardW - 160

  ctx.font = "900 52px sans-serif"

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " "

    const metrics = ctx.measureText(testLine)

    if (metrics.width > maxWidth && n > 0) {
      lines.push(line)

      line = words[n] + " "
    } else {
      line = testLine
    }
  }

  lines.push(line)

  ctx.textAlign = "left"

  for (let i = 0; i < Math.min(lines.length, 3); i++) {
    ctx.fillText(lines[i], cardX + 80, titleY + i * 70)
  }

  // 8. Draw Badges

  const badgeY = titleY + Math.min(lines.length, 3) * 70 + 20

  const drawRoundRect = (
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
  ) => {
    ctx.beginPath()

    ctx.moveTo(x + r, y)

    ctx.lineTo(x + w - r, y)

    ctx.quadraticCurveTo(x + w, y, x + w, y + r)

    ctx.lineTo(x + w, y + h - r)

    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)

    ctx.lineTo(x + r, y + h)

    ctx.quadraticCurveTo(x, y + h, x, y + h - r)

    ctx.lineTo(x, y + r)

    ctx.quadraticCurveTo(x, y, x + r, y)

    ctx.closePath()

    ctx.fill()
  }

  // Draw Type Badge

  ctx.fillStyle = "#e8edff"

  drawRoundRect(cardX + 80, badgeY, 180, 60, 30)

  ctx.fillStyle = "#3b5bdb"

  ctx.font = "bold 28px sans-serif"

  ctx.textAlign = "center"

  ctx.fillText(gig.type, cardX + 80 + 90, badgeY + 40)

  // Draw Niche Badge

  ctx.fillStyle = "#fef3c7"

  ctx.font = "bold 28px sans-serif"

  const nicheW = ctx.measureText(gig.niche).width + 60

  drawRoundRect(cardX + 280, badgeY, nicheW, 60, 30)

  ctx.fillStyle = "#d97706"

  ctx.textAlign = "center"

  ctx.fillText(gig.niche, cardX + 280 + nicheW / 2, badgeY + 40)

  // 9. Draw Details Box

  const detailY = badgeY + 110

  ctx.fillStyle = "#f8fafc"

  drawRoundRect(cardX + 80, detailY, cardW - 160, 240, 30)

  // Draw Budget Heading

  ctx.fillStyle = "#64748b"

  ctx.font = "bold 26px sans-serif"

  ctx.textAlign = "left"

  ctx.fillText("BUDGET / OFFER", cardX + 120, detailY + 70)

  ctx.fillStyle = "#0f172a"

  ctx.font = "900 44px sans-serif"

  ctx.fillText(formatBudget(gig.budget, gig.type), cardX + 120, detailY + 130)

  // Draw Location Heading

  ctx.fillStyle = "#64748b"

  ctx.font = "bold 26px sans-serif"

  ctx.fillText("LOCATION", cardX + 120, detailY + 200)

  ctx.fillStyle = "#334155"

  ctx.font = "bold 28px sans-serif"

  ctx.fillText(gig.location || "Kolkata, WB", cardX + 280, detailY + 200)

  // 10. Draw Footer CTA Reminder

  ctx.fillStyle = "#ffffff"

  ctx.font = "bold 28px sans-serif"

  ctx.textAlign = "center"

  ctx.fillText(
    "Join Kolkata’s biggest creator community",
    540,
    cardY + cardH + 110,
  )

  ctx.fillStyle = "#ffffff"

  ctx.font = "900 38px sans-serif"

  ctx.fillText("kreatorkolkata.com", 540, cardY + cardH + 170)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(new File([blob], `gig-${gig.id}.png`, { type: "image/png" }))
      } else {
        reject(new Error("Canvas blob is null"))
      }
    }, "image/png")
  })
}

// ── Share Gig Popup Modal Removed ──

// ── Web Audio Synthesized Notification & Call Ringtone Engine ──────────────

function playNotificationSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()

    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start)
      gain.gain.setValueAtTime(0.18, ctx.currentTime + start)
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + start + duration,
      )
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + duration)
    }

    playTone(523.25, 0, 0.25) // C5
    playTone(659.25, 0.1, 0.3) // E5
    playTone(783.99, 0.2, 0.45) // G5
  } catch (e) {
    console.warn("Notification sound error:", e)
  }
}

let ringtoneIntervalId: any = null

function playCallRingtone() {
  stopCallRingtone()

  const playRingPulse = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()

      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()

      osc1.type = "sine"
      osc2.type = "sine"
      osc1.frequency.setValueAtTime(440, ctx.currentTime)
      osc2.frequency.setValueAtTime(480, ctx.currentTime)

      gain.gain.setValueAtTime(0.18, ctx.currentTime)
      gain.gain.setValueAtTime(0.18, ctx.currentTime + 1.2)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5)

      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(ctx.destination)

      osc1.start(ctx.currentTime)
      osc2.start(ctx.currentTime)
      osc1.stop(ctx.currentTime + 1.5)
      osc2.stop(ctx.currentTime + 1.5)
    } catch (e) {}
  }

  playRingPulse()
  ringtoneIntervalId = setInterval(playRingPulse, 2800)
}

function stopCallRingtone() {
  if (ringtoneIntervalId) {
    clearInterval(ringtoneIntervalId)
    ringtoneIntervalId = null
  }
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const [currentUser, setCurrentUser] = useState<any>(null)

  const [introPage, setIntroPage] = useState(0)

  // Instagram OAuth callback handler state

  const [isIgConnecting, setIsIgConnecting] = useState(false)

  const [igConnectSuccess, setIgConnectSuccess] = useState<string | null>(null)

  const [igConnectError, setIgConnectError] = useState<string | null>(null)

  // Synchronized lists loaded from Firestore

  const [gigs, setGigs] = useState<Gig[]>(GIGS)

  const [creators, setCreators] = useState<Creator[]>(CREATORS)

  const [brands, setBrands] = useState<Brand[]>(BRANDS)

  const [events, setEvents] = useState<Event[]>(EVENTS)

  // User Profile and Role State

  const [userProfile, setUserProfile] = useState<any>(null)

  const [userRole, setUserRole] =
    useState<"creator" | "brand" | "admin" | "admin_pending" | null>(null)

  const [adminViewMode, setAdminViewMode] = useState<"dashboard" | "platform">(
    "dashboard",
  )

  const [generatingShareCard, setGeneratingShareCard] = useState(false)

  // Real-time Push Notifications state
  const [dbNotifications, setDbNotifications] = useState<any[]>([])
  const [liveToast, setLiveToast] = useState<any>(null)

  // WebRTC Live Calling State & Refs
  const [activeCall, setActiveCall] = useState<any>(null)
  const [incomingCall, setIncomingCall] = useState<any>(null)
  const [callTimer, setCallTimer] = useState<number>(0)
  const [isMuted, setIsMuted] = useState<boolean>(false)
  const [isVideoOff, setIsVideoOff] = useState<boolean>(false)

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)

  // Route restoration & Session storage persistence
  const touchStartX = useRef<number | null>(null)

  const getInitialRouteState = () => {
    try {
      const saved = sessionStorage.getItem("kreator_route")

      if (saved) return JSON.parse(saved)
    } catch (e) {}

    return null
  }

  const savedRoute = useRef(getInitialRouteState())

  const [activeTab, setActiveTab] = useState(
    savedRoute.current?.activeTab || "home",
  )

  const [selectedGigId, setSelectedGigId] = useState<number | null>(
    savedRoute.current?.selectedGigId || null,
  )

  const [selectedCreatorName, setSelectedCreatorName] = useState<string | null>(
    savedRoute.current?.selectedCreatorName || null,
  )

  const [selectedBrandName, setSelectedBrandName] = useState<string | null>(
    savedRoute.current?.selectedBrandName || null,
  )

  const [selectedEventId, setSelectedEventId] = useState<number | null>(
    savedRoute.current?.selectedEventId || null,
  )

  const [selectedMyGigId, setSelectedMyGigId] = useState<number | null>(
    savedRoute.current?.selectedMyGigId || null,
  )

  const [selectedMyGigTab, setSelectedMyGigTab] =
    useState<"applicants" | "edit">(
      savedRoute.current?.selectedMyGigTab || "applicants",
    )

  const [posting, setPosting] = useState(savedRoute.current?.posting || false)

  const [gigPosted, setGigPosted] = useState(false)

  const [savedGigs, setSavedGigs] = useState<Set<number>>(new Set([2, 5]))

  const [followedBrands, setFollowedBrands] = useState<Set<number>>(
    new Set([1]),
  )

  const [userAppliedGigIds, setUserAppliedGigIds] = useState<Set<number>>(
    new Set(),
  )

  useEffect(() => {
    if (!currentUser?.uid) {
      setUserAppliedGigIds(new Set())
      return
    }

    const q = query(
      collection(db, "applications"),
      where("applicantUid", "==", currentUser.uid),
    )

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const ids = new Set<number>()
        snap.docs.forEach((doc) => {
          const data = doc.data()
          if (data.gigId) ids.add(Number(data.gigId))
        })
        setUserAppliedGigIds(ids)
      },
      (err) => console.warn("User applications snapshot error:", err),
    )

    return () => unsubscribe()
  }, [currentUser?.uid])

  const [rsvpEvents, setRsvpEvents] = useState<Set<number>>(new Set([1]))

  const [viewingNotifications, setViewingNotifications] = useState(
    savedRoute.current?.viewingNotifications || false,
  )

  const [viewingMyApplications, setViewingMyApplications] = useState(false)

  const [unreadNotifications, setUnreadNotifications] = useState<Set<number>>(
    new Set([1, 2]),
  )

  const [chats, setChats] = useState<ChatThread[]>(INITIAL_CHATS)

  const [activeChatId, setActiveChatId] = useState<number | null>(
    savedRoute.current?.activeChatId || null,
  )

  // Real-time chat state
  const [conversations, setConversations] = useState<Conversation[]>([])

  const [activeConvoId, setActiveConvoId] = useState<string | null>(null)

  const [activeMessages, setActiveMessages] = useState<LiveMessage[]>([])

  const [followedCreators, setFollowedCreators] = useState<Set<number>>(
    new Set(),
  )

  const [exploreFilter, setExploreFilter] =
    useState<"all" | "creators" | "brands" | "gigs" | "events">(
      savedRoute.current?.exploreFilter || "all",
    )

  const [exploreSearchQuery, setExploreSearchQuery] = useState("")

  const handleShareGig = async (gig: Gig) => {
    setGeneratingShareCard(true)

    const poster = resolveGigPosterDetails(gig, userProfile, creators, brands)

    try {
      const file = await generateGigStoryImage(gig, poster)

      const shareData = {
        files: [file],

        title: gig.title,

        text: `Check out this creator gig on Kreator Kolkata: ${gig.title}`,
      }

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData)
      } else {
        const url = URL.createObjectURL(file)

        const a = document.createElement("a")

        a.href = url

        a.download = `kreator-kolkata-gig-${gig.id}.png`

        document.body.appendChild(a)

        a.click()

        document.body.removeChild(a)
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.warn("Direct share failed", err)

        const shareUrl = `${window.location.origin}/?gig=${gig.id}`

        navigator.clipboard.writeText(shareUrl)

        alert("Link copied to clipboard!")
      }
    } finally {
      setGeneratingShareCard(false)
    }
  }

  const setupFCM = async (userId: string) => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("Notification" in window)
    ) {
      console.warn("FCM: Notifications or service workers are not supported by this browser.")
      return
    }
    try {
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        console.warn("FCM: Notification permission denied.")
        return
      }

      if (!messaging) {
        console.warn("FCM: Messaging service is not initialized.")
        return
      }

      const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js")

      const token = await getToken(messaging, {
        serviceWorkerRegistration: registration,
        vapidKey: FCM_VAPID_KEY === "YOUR_FCM_VAPID_KEY" ? undefined : FCM_VAPID_KEY,
      })

      if (token) {
        const tokenRef = doc(db, "fcmTokens", userId)
        await setDoc(
          tokenRef,
          {
            tokens: arrayUnion(token),
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        )
        console.log("FCM: Token registered successfully:", token)
      } else {
        console.warn("FCM: No registration token available.")
      }
    } catch (err) {
      console.error("FCM: Error setting up FCM:", err)
    }
  }

  // Auth State changed hook

  useEffect(() => {
    let unsubs: () => void[] = []

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user)
      setCurrentUser(user)

      unsubs.forEach((un) => un())
      unsubs = []

      if (user) {
        setupFCM(user.uid)
        // Subscribe to real-time conversations
        const qConvos = query(
          collection(db, "conversations"),
          where("participants", "array-contains", user.uid),
        )
        const unsubConvos = onSnapshot(
          qConvos,
          (snap) => {
            const list = snap.docs.map(
              (d) => ({ id: d.id, ...d.data() }) as Conversation,
            )
            list.sort(
              (a, b) =>
                new Date(b.lastMessageTime || b.createdAt).getTime() -
                new Date(a.lastMessageTime || a.createdAt).getTime(),
            )
            setConversations(list)
          },
          (err) => console.warn("Conversations snapshot error:", err),
        )
        unsubs.push(unsubConvos)

        let foundProfile = false

        const adminRef = doc(db, "admins", user.uid)

        const unsubAdmin = onSnapshot(
          adminRef,
          (snap) => {
            if (snap.exists()) {
              foundProfile = true

              const data = snap.data()

              if (data.isAdmin === true) {
                setUserRole("admin")

                setUserProfile(data)
              } else {
                setUserRole("admin_pending")

                setUserProfile(data)
              }
            }
          },
          (err) => console.warn("Admin snapshot error:", err),
        )

        unsubs.push(unsubAdmin)

        const creatorRef = doc(db, "creators", user.uid)

        const unsubCreator = onSnapshot(
          creatorRef,
          (snap) => {
            if (snap.exists()) {
              foundProfile = true

              setUserRole("creator")

              setUserProfile(snap.data())
            }
          },
          (err) => console.warn("Creator snapshot error:", err),
        )

        unsubs.push(unsubCreator)

        const brandRef = doc(db, "brands", user.uid)

        const unsubBrand = onSnapshot(
          brandRef,
          (snap) => {
            if (snap.exists()) {
              foundProfile = true

              setUserRole("brand")

              setUserProfile(snap.data())
            }
          },
          (err) => console.warn("Brand snapshot error:", err),
        )

        unsubs.push(unsubBrand)

        // Fallback: If no document exists in admins, creators, or brands after 1.8s,

        // auto-initialize a creator profile for this user so they are never stuck!

        const timer = setTimeout(async () => {
          if (!foundProfile) {
            console.log(
              "[AUTH FALLBACK] Auto-initializing profile doc for UID:",
              user.uid,
            )

            const defaultCreator = {
              id: Date.now(),

              name:
                user.displayName ||
                user.email?.split("@")[0] ||
                "Kreator Member",

              handle: `@${(user.displayName || user.email?.split("@")[0] || "kreator").toLowerCase().replace(/\s+/g, "")}`,

              avatar:
                "https://images.unsplash.com/photo-1624610261655-777af2f586d7?w=160&h=160&fit=crop&auto=format",

              followers: "0",

              niche: "Fashion & Lifestyle",

              bio: "Kreator Kolkata member",

              verified: false,

              followers_count: 0,

              setupComplete: false,
            }

            try {
              await setDoc(doc(db, "creators", user.uid), defaultCreator, {
                merge: true,
              })
            } catch (err) {
              console.warn("[AUTH FALLBACK ERROR]", err)
            }
          }
        }, 1800)

        unsubs.push(() => clearTimeout(timer))
      } else {
        setCurrentUser(null)

        setUserProfile(null)

        setUserRole(null)

        setConversations([])
      }
    })

    return () => {
      unsubscribeAuth()

      unsubs.forEach((un) => un())
    }
  }, [])

  // Database Syncer and Seeder

  useEffect(() => {
    const unsubscribeGigs = onSnapshot(
      collection(db, "gigs"),
      (snapshot) => {
        if (snapshot.empty) {
          GIGS.forEach(async (g) => {
            await setDoc(doc(db, "gigs", String(g.id)), g)
          })
        } else {
          const list = snapshot.docs.map((doc) => doc.data() as Gig)

          list.sort((a, b) => (b.id || 0) - (a.id || 0))

          setGigs(list)
        }
      },
      (err) => console.warn("Gigs snapshot error:", err),
    )

    const unsubscribeCreators = onSnapshot(
      collection(db, "creators"),
      (snapshot) => {
        if (snapshot.empty) {
          CREATORS.forEach(async (c) => {
            await setDoc(doc(db, "creators", String(c.id)), c)
          })
        } else {
          const list = snapshot.docs.map(
            (doc) => ({ uid: doc.id, ...doc.data() }) as any,
          )

          list.sort((a, b) => a.id - b.id)

          setCreators(list)
        }
      },
      (err) => console.warn("Creators snapshot error:", err),
    )

    const unsubscribeBrands = onSnapshot(
      collection(db, "brands"),
      (snapshot) => {
        if (snapshot.empty) {
          BRANDS.forEach(async (b) => {
            await setDoc(doc(db, "brands", String(b.id)), b)
          })
        } else {
          const list = snapshot.docs.map(
            (doc) => ({ uid: doc.id, ...doc.data() }) as any,
          )

          list.sort((a, b) => a.id - b.id)

          setBrands(list)
        }
      },
      (err) => console.warn("Brands snapshot error:", err),
    )

    const unsubscribeEvents = onSnapshot(
      collection(db, "events"),
      (snapshot) => {
        if (snapshot.empty) {
          EVENTS.forEach(async (e) => {
            await setDoc(doc(db, "events", String(e.id)), e)
          })
        } else {
          const list = snapshot.docs.map((doc) => doc.data() as Event)

          list.sort((a, b) => a.id - b.id)

          setEvents(list)
        }
      },
      (err) => console.warn("Events snapshot error:", err),
    )

    const unsubscribeChats = onSnapshot(
      collection(db, "chats"),
      (snapshot) => {
        if (snapshot.empty) {
          INITIAL_CHATS.forEach(async (c) => {
            await setDoc(doc(db, "chats", String(c.id)), c)
          })
        } else {
          const list = snapshot.docs.map((doc) => doc.data() as ChatThread)

          list.sort((a, b) => b.id - a.id)

          setChats(list)
        }
      },
      (err) => console.warn("Chats snapshot error:", err),
    )

    return () => {
      unsubscribeGigs()

      unsubscribeCreators()

      unsubscribeBrands()

      unsubscribeEvents()

      unsubscribeChats()
    }
  }, [])

  // Real-time messages subcollection fetcher for the active conversation
  useEffect(() => {
    if (!activeConvoId) {
      setActiveMessages([])
      return
    }

    if (currentUser) {
      const convoRef = doc(db, "conversations", activeConvoId)
      updateDoc(convoRef, {
        [`unreadCounts.${currentUser.uid}`]: 0,
      }).catch((e) => console.warn("Error marking read:", e))
    }

    const qMsgs = query(
      collection(db, "conversations", activeConvoId, "messages"),
      orderBy("timestamp", "asc"),
    )

    const unsubscribe = onSnapshot(
      qMsgs,
      (snap) => {
        const list = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as LiveMessage,
        )
        setActiveMessages(list)
      },
      (err) => console.warn("Messages fetch error:", err),
    )

    return () => unsubscribe()
  }, [activeConvoId, currentUser])

  // Presence / lastSeen Updater
  useEffect(() => {
    if (!currentUser || !userRole) return
    const collectionName =
      userRole === "admin" || userRole === "admin_pending"
        ? "admins"
        : userRole === "brand"
          ? "brands"
          : "creators"

    const updatePresence = async () => {
      try {
        await updateDoc(doc(db, collectionName, currentUser.uid), {
          lastSeen: new Date().toISOString(),
        })
      } catch (e) {
        console.warn("Failed to update presence:", e)
      }
    }

    updatePresence()
    const interval = setInterval(updatePresence, 60000)
    return () => clearInterval(interval)
  }, [currentUser, userRole])

  // ── WebRTC Signaling & Live Calling Hooks ─────────────────────────────────

  // 1. Listen for Incoming Calls
  useEffect(() => {
    if (!currentUser) return
    const qCalls = query(
      collection(db, "calls"),
      where("calleeUid", "==", currentUser.uid),
      where("status", "==", "calling"),
    )
    const unsubscribe = onSnapshot(qCalls, (snap) => {
      if (!snap.empty) {
        const d = snap.docs[0]
        setIncomingCall({ id: d.id, ...d.data() })
      } else {
        setIncomingCall(null)
      }
    })
    return () => unsubscribe()
  }, [currentUser])

  // 2. Listen for Active Call Updates
  useEffect(() => {
    if (!activeCall) return
    const callRef = doc(db, "calls", activeCall.id)
    const unsubscribe = onSnapshot(callRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        if (data?.status === "ended" || data?.status === "rejected") {
          handleCleanupCall()
        }
      } else {
        handleCleanupCall()
      }
    })
    return () => unsubscribe()
  }, [activeCall?.id])

  // 3. Call Duration Timer
  useEffect(() => {
    let interval: any
    if (activeCall && activeCall.status === "accepted") {
      interval = setInterval(() => setCallTimer((t) => t + 1), 1000)
    } else {
      setCallTimer(0)
    }
    return () => clearInterval(interval)
  }, [activeCall?.status])

  // 4. Call Ringtone Controller Hook
  useEffect(() => {
    if (incomingCall || (activeCall && activeCall.status === "calling")) {
      playCallRingtone()
    } else {
      stopCallRingtone()
    }
    return () => stopCallRingtone()
  }, [incomingCall?.id, activeCall?.status])

  const handleCleanupCall = () => {
    stopCallRingtone()
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
      localStreamRef.current = null
    }
    if (pcRef.current) {
      pcRef.current.close()
      pcRef.current = null
    }
    setActiveCall(null)
    setIncomingCall(null)
    setCallTimer(0)
    setIsMuted(false)
    setIsVideoOff(false)
  }

  const startCall = async (type: "audio" | "video") => {
    if (!currentUser) {
      alert("Please log in to start a call.")
      return
    }

    let calleeUid = ""
    let calleeName = "Kreator Member"
    let calleeAvatar =
      "https://images.unsplash.com/photo-1624610261655-777af2f586d7?w=160&h=160&fit=crop&auto=format"

    if (activeConvoId) {
      const convo = conversations.find((c) => c.id === activeConvoId)
      if (convo) {
        calleeUid =
          convo.participants.find((uid) => uid !== currentUser.uid) || ""
        calleeName = convo.participantNames[calleeUid] || "Kreator Member"
        calleeAvatar = convo.participantAvatars[calleeUid] || calleeAvatar
      }
    }

    if (!calleeUid) {
      alert("Real-time calls are available between registered members.")
      return
    }

    try {
      const callId = getConvoId(currentUser.uid, calleeUid)
      const callRef = doc(db, "calls", callId)

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === "video",
      })
      localStreamRef.current = stream

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      })
      pcRef.current = pc

      stream.getTracks().forEach((track) => pc.addTrack(track, stream))

      const callerCandidatesCol = collection(callRef, "callerCandidates")
      pc.onicecandidate = (e) => {
        if (e.candidate) addDoc(callerCandidatesCol, e.candidate.toJSON())
      }

      pc.ontrack = (e) => {
        if (e.streams && e.streams[0]) {
          remoteStreamRef.current = e.streams[0]
          if (remoteVideoRef.current)
            remoteVideoRef.current.srcObject = e.streams[0]
        }
      }

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      const newCallData = {
        id: callId,
        callerUid: currentUser.uid,
        callerName: userProfile?.name || "Kreator Member",
        callerAvatar: userProfile?.avatar || userProfile?.logo || calleeAvatar,
        calleeUid,
        calleeName,
        calleeAvatar,
        type,
        status: "calling",
        offer: { type: offer.type, sdp: offer.sdp },
        createdAt: new Date().toISOString(),
      }

      await setDoc(callRef, newCallData)
      setActiveCall(newCallData)

      onSnapshot(callRef, async (snap) => {
        const d = snap.data()
        if (d && d.answer && !pc.currentRemoteDescription) {
          await pc.setRemoteDescription(new RTCSessionDescription(d.answer))
          setActiveCall((prev: any) => ({ ...prev, status: "accepted" }))
        }
      })

      const calleeCandidatesCol = collection(callRef, "calleeCandidates")
      onSnapshot(calleeCandidatesCol, (snap) => {
        snap.docChanges().forEach(async (change) => {
          if (change.type === "added") {
            await pc.addIceCandidate(new RTCIceCandidate(change.doc.data()))
          }
        })
      })
    } catch (err: any) {
      console.error("Failed to start call:", err)
      alert(
        "Microphone / Camera access required for calling: " +
          (err.message || err),
      )
    }
  }

  const answerCall = async () => {
    if (!incomingCall || !currentUser) return
    try {
      const callRef = doc(db, "calls", incomingCall.id)
      const callSnap = await getDoc(callRef)
      if (!callSnap.exists()) return

      const callData = callSnap.data()
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callData.type === "video",
      })
      localStreamRef.current = stream

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      })
      pcRef.current = pc

      stream.getTracks().forEach((track) => pc.addTrack(track, stream))

      const calleeCandidatesCol = collection(callRef, "calleeCandidates")
      pc.onicecandidate = (e) => {
        if (e.candidate) addDoc(calleeCandidatesCol, e.candidate.toJSON())
      }

      pc.ontrack = (e) => {
        if (e.streams && e.streams[0]) {
          remoteStreamRef.current = e.streams[0]
          if (remoteVideoRef.current)
            remoteVideoRef.current.srcObject = e.streams[0]
        }
      }

      await pc.setRemoteDescription(new RTCSessionDescription(callData.offer))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      await updateDoc(callRef, {
        answer: { type: answer.type, sdp: answer.sdp },
        status: "accepted",
      })

      setActiveCall({ ...incomingCall, status: "accepted" })
      setIncomingCall(null)

      const callerCandidatesCol = collection(callRef, "callerCandidates")
      onSnapshot(callerCandidatesCol, (snap) => {
        snap.docChanges().forEach(async (change) => {
          if (change.type === "added") {
            await pc.addIceCandidate(new RTCIceCandidate(change.doc.data()))
          }
        })
      })
    } catch (err: any) {
      console.error("Answer call error:", err)
      alert("Call connection failed: " + err.message)
    }
  }

  const declineCall = async () => {
    if (!incomingCall) return
    try {
      await updateDoc(doc(db, "calls", incomingCall.id), { status: "rejected" })
    } catch (e) {}
    setIncomingCall(null)
  }

  const endCall = async () => {
    if (activeCall) {
      try {
        await updateDoc(doc(db, "calls", activeCall.id), { status: "ended" })
      } catch (e) {}
    }
    handleCleanupCall()
  }

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled
      })
      setIsMuted((prev) => !prev)
    }
  }

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled
      })
      setIsVideoOff((prev) => !prev)
    }
  }

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  // Real-time Firestore Notifications Listener & Desktop Push
  useEffect(() => {
    if (!currentUser) return

    // Run two separate queries (avoids composite index requirement for in+orderBy)
    const q1 = query(
      collection(db, "notifications"),
      where("recipientUid", "==", currentUser.uid),
    )
    const q2 = query(
      collection(db, "notifications"),
      where("recipientUid", "==", "all"),
    )

    let snap1Docs: any[] = []
    let snap2Docs: any[] = []

    const merge = () => {
      const seen = new Set<string>()
      const merged: any[] = []
      ;[...snap1Docs, ...snap2Docs].forEach((d) => {
        if (!seen.has(d.id)) {
          seen.add(d.id)
          merged.push(d)
        }
      })
      merged.sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return tb - ta
      })
      setDbNotifications(merged)
    }

    const handleChanges = (changes: any[]) => {
      changes.forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data()
          const createdTime = new Date(data.createdAt || Date.now()).getTime()
          const isRecent = Date.now() - createdTime < 15000

          if (!data.read && isRecent) {
            setLiveToast(data)
            playNotificationSound()
            setTimeout(() => setLiveToast(null), 6000)

            if (
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              try {
                new Notification(data.title || "Kreator Kolkata", {
                  body: data.message,
                  icon: data.avatar || "/favicon.ico",
                })
              } catch (e) {}
            }
          }
        }
      })
    }

    const unsub1 = onSnapshot(
      q1,
      (snap) => {
        snap1Docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        merge()
        handleChanges(snap.docChanges())
      },
      (err) => console.warn("Notifications listener (user) error:", err),
    )

    const unsub2 = onSnapshot(
      q2,
      (snap) => {
        snap2Docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        merge()
        handleChanges(snap.docChanges())
      },
      (err) => console.warn("Notifications listener (all) error:", err),
    )

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {})
    }

    return () => {
      unsub1()
      unsub2()
    }
  }, [currentUser])

  // Derived object states from IDs/names

  const selectedGig = gigs.find((g) => g.id === selectedGigId) || null

  const selectedEvent =
    events.find((e) => e.id === selectedEventId) ||
    EVENTS.find((e) => e.id === selectedEventId) ||
    null

  const selectedCreator =
    creators.find(
      (c) => c.name.toLowerCase() === selectedCreatorName?.toLowerCase(),
    ) ||
    CREATORS.find(
      (c) => c.name.toLowerCase() === selectedCreatorName?.toLowerCase(),
    ) ||
    null

  const selectedBrand =
    brands.find(
      (b) => b.name.toLowerCase() === selectedBrandName?.toLowerCase(),
    ) ||
    BRANDS.find(
      (b) => b.name.toLowerCase() === selectedBrandName?.toLowerCase(),
    ) ||
    null

  const selectedMyGig = gigs.find((g) => g.id === selectedMyGigId) || null

  // Instagram OAuth callback handler effect

  useEffect(() => {
    const pathname = window.location.pathname

    const searchParams = new URLSearchParams(window.location.search)

    const code = searchParams.get("code")

    const stateUid = searchParams.get("state")

    if (code) {
      const handleIgCallback = async () => {
        setIsIgConnecting(true)

        setIgConnectError(null)

        setIgConnectSuccess(null)

        setActiveTab("profile")

        try {
          // If state contains the user's uid, use it. Otherwise fall back to auth.currentUser?.uid.

          const targetUid = stateUid || auth.currentUser?.uid

          if (!targetUid) {
            throw new Error("No authenticated user found. Please log in first.")
          }

          // Dynamically pass the exact landing page URL to the Cloud Function

          const currentRedirectUri = window.location.origin + pathname

          const response = await fetch(
            `${CLOUD_FUNCTION_URL}?code=${code}&uid=${targetUid}&redirect_uri=${encodeURIComponent(currentRedirectUri)}`,
          )

          const data = await response.json()

          if (!response.ok || data.error) {
            throw new Error(
              data.details || data.error || "Instagram connection failed",
            )
          }

          setIgConnectSuccess(
            `Successfully connected Instagram account @${data.username}!`,
          )
        } catch (err: any) {
          console.error("Error connecting Instagram:", err)

          setIgConnectError(err.message || "Failed to connect Instagram")
        } finally {
          setIsIgConnecting(false)

          // Clean up the URL path and params to prevent infinite loop or bad routing

          window.history.replaceState({}, document.title, "/")
        }
      }

      handleIgCallback()
    }
  }, [isLoggedIn])

  // Toast automatic clear effects

  useEffect(() => {
    if (igConnectSuccess) {
      const t = setTimeout(() => setIgConnectSuccess(null), 5000)

      return () => clearTimeout(t)
    }
  }, [igConnectSuccess])

  useEffect(() => {
    if (igConnectError) {
      const t = setTimeout(() => setIgConnectError(null), 6000)

      return () => clearTimeout(t)
    }
  }, [igConnectError])

  // Route state synchronizer effect

  useEffect(() => {
    const routeState = {
      activeTab,

      selectedGigId: selectedGigId,

      selectedEventId: selectedEventId,

      selectedCreatorName: selectedCreatorName,

      selectedBrandName: selectedBrandName,

      selectedMyGigId: selectedMyGigId,

      selectedMyGigTab,

      posting,

      viewingNotifications,

      activeChatId,

      adminViewMode,

      exploreFilter,
    }

    try {
      sessionStorage.setItem("kreator_route", JSON.stringify(routeState))
    } catch (e) {}
  }, [
    activeTab,
    selectedGigId,
    selectedEventId,
    selectedCreatorName,
    selectedBrandName,
    selectedMyGigId,
    selectedMyGigTab,
    posting,
    viewingNotifications,
    activeChatId,
    adminViewMode,
    exploreFilter,
  ])

  const handleOpenEventsTab = () => {
    setExploreFilter("events")

    setActiveTab("explore")
  }

  const handleHomeSearch = (query: string) => {
    setExploreSearchQuery(query)

    setExploreFilter("all")

    setActiveTab("explore")
  }

  const toggleSave = (id: number) => {
    setSavedGigs((prev) => {
      const next = new Set(prev)

      next.has(id) ? next.delete(id) : next.add(id)

      return next
    })
  }

  const toggleFollowBrand = (id: number) => {
    setFollowedBrands((prev) => {
      const next = new Set(prev)

      next.has(id) ? next.delete(id) : next.add(id)

      return next
    })
  }

  const toggleRsvpEvent = async (id: number) => {
    const isCurrentlyRsvp = rsvpEvents.has(id)

    // Registration is one-way — no unregistration allowed

    if (isCurrentlyRsvp) return

    setRsvpEvents((prev) => {
      const next = new Set(prev)

      next.add(id)

      return next
    })

    try {
      const eventRef = doc(db, "events", String(id))

      await updateDoc(eventRef, {
        attendees: increment(1),
      })

      if (auth.currentUser) {
        const userRef = doc(db, "users", auth.currentUser.uid)

        await updateDoc(userRef, {
          rsvps: arrayUnion(id),
        })
      }
    } catch (err) {
      console.warn("Error syncing registration to Firestore:", err)
    }
  }

  const toggleFollowCreator = (id: number) => {
    setFollowedCreators((prev) => {
      const next = new Set(prev)

      next.has(id) ? next.delete(id) : next.add(id)

      return next
    })
  }

  const handleOpenCreatorProfile = (name: string) => {
    const creator =
      creators.find((c) => c.name.toLowerCase() === name.toLowerCase()) ||
      CREATORS.find((c) => c.name.toLowerCase() === name.toLowerCase())

    if (creator) {
      setSelectedCreatorName(creator.name)
    }
  }

  const handleMessageCreator = async (creator: Creator) => {
    const otherUid = (creator as any).uid
    const isRealUser = currentUser && otherUid && otherUid.length > 10

    if (isRealUser) {
      const convoId = getConvoId(currentUser.uid, otherUid)
      try {
        const convoRef = doc(db, "conversations", convoId)
        const snap = await getDoc(convoRef)
        if (!snap.exists()) {
          await setDoc(
            convoRef,
            {
              id: convoId,
              participants: [currentUser.uid, otherUid],
              participantNames: {
                [currentUser.uid]: userProfile?.name || "Kreator Member",
                [otherUid]: creator.name || "Kreator Creator",
              },
              participantAvatars: {
                [currentUser.uid]:
                  userProfile?.avatar ||
                  userProfile?.logo ||
                  "https://images.unsplash.com/photo-1624610261655-777af2f586d7?w=160&h=160&fit=crop&auto=format",
                [otherUid]:
                  creator.avatar ||
                  "https://images.unsplash.com/photo-1624610261655-777af2f586d7?w=160&h=160&fit=crop&auto=format",
              },
              participantHandles: {
                [currentUser.uid]: userProfile?.handle || "@member",
                [otherUid]: creator.handle || "@creator",
              },
              lastMessage: "",
              lastMessageTime: new Date().toISOString(),
              lastSenderId: "",
              unreadCounts: {
                [currentUser.uid]: 0,
                [otherUid]: 0,
              },
              createdAt: new Date().toISOString(),
            },
            { merge: true },
          )
        }

        setActiveConvoId(convoId)
        setActiveChatId(null)
        await updateDoc(convoRef, {
          [`unreadCounts.${currentUser.uid}`]: 0,
        })
      } catch (err) {
        console.warn("Error creating conversation:", err)
      }
      setSelectedCreatorName(null)
      setActiveTab("chat")
    } else {
      const existingThread = chats.find(
        (c) => c.name.toLowerCase() === creator.name.toLowerCase(),
      )

      if (existingThread) {
        handleOpenChat(existingThread.id)
      } else {
        const newThread = {
          id: Date.now(),

          name: creator.name,

          avatar: creator.avatar,

          handle: creator.handle,

          niche: creator.niche,

          online: true,

          verified: creator.verified,

          unreadCount: 0,

          messages: [
            {
              id: Date.now(),
              text: `Hi ${creator.name}! I saw your profile and would love to collaborate.`,
              sender: "me",
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
          ],
        }

        setChats((prev) => [newThread, ...prev])

        handleOpenChat(newThread.id)
      }

      setSelectedCreatorName(null)

      setActiveTab("chat")
    }
  }

  const handleMessageBrand = async (brand: Brand) => {
    const otherUid = (brand as any).uid
    const isRealUser = currentUser && otherUid && otherUid.length > 10

    if (isRealUser) {
      const convoId = getConvoId(currentUser.uid, otherUid)
      try {
        const convoRef = doc(db, "conversations", convoId)
        const snap = await getDoc(convoRef)
        if (!snap.exists()) {
          await setDoc(
            convoRef,
            {
              id: convoId,
              participants: [currentUser.uid, otherUid],
              participantNames: {
                [currentUser.uid]: userProfile?.name || "Kreator Member",
                [otherUid]: brand.name || "Kreator Brand",
              },
              participantAvatars: {
                [currentUser.uid]:
                  userProfile?.avatar ||
                  userProfile?.logo ||
                  "https://images.unsplash.com/photo-1624610261655-777af2f586d7?w=160&h=160&fit=crop&auto=format",
                [otherUid]:
                  brand.logo ||
                  "https://images.unsplash.com/photo-1624610261655-777af2f586d7?w=160&h=160&fit=crop&auto=format",
              },
              participantHandles: {
                [currentUser.uid]: userProfile?.handle || "@member",
                [otherUid]: "Brand Account",
              },
              lastMessage: "",
              lastMessageTime: new Date().toISOString(),
              lastSenderId: "",
              unreadCounts: {
                [currentUser.uid]: 0,
                [otherUid]: 0,
              },
              createdAt: new Date().toISOString(),
            },
            { merge: true },
          )
        }

        setActiveConvoId(convoId)
        setActiveChatId(null)
        await updateDoc(convoRef, {
          [`unreadCounts.${currentUser.uid}`]: 0,
        })
      } catch (err) {
        console.warn("Error creating conversation:", err)
      }
      setSelectedBrandName(null)
      setActiveTab("chat")
    } else {
      const existingThread = chats.find(
        (c) => c.name.toLowerCase() === brand.name.toLowerCase(),
      )

      if (existingThread) {
        handleOpenChat(existingThread.id)
      } else {
        const newThread = {
          id: Date.now(),

          name: brand.name,

          avatar: brand.logo,

          handle: "Brand Account",

          niche: brand.industry,

          online: false,

          verified: brand.verified,

          unreadCount: 0,

          messages: [
            {
              id: Date.now(),
              text: `Hi ${brand.name}! I saw your brand profile and would love to collaborate on your campaigns.`,
              sender: "me",
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
          ],
        }

        setChats((prev) => [newThread, ...prev])

        handleOpenChat(newThread.id)
      }

      setSelectedBrandName(null)

      setActiveTab("chat")
    }
  }

  const handleOpenChat = (id: number) => {
    setActiveChatId(id)
    setActiveConvoId(null)

    setChats((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)),
    )
  }

  const handleApply = (gig: Gig) => {
    const poster = resolveGigPosterDetails(gig, userProfile, creators, brands)

    if (poster.isOwner) {
      setSelectedMyGigId(gig.id)

      setSelectedMyGigTab("applicants")
    } else {
      setSelectedGigId(gig.id)
    }
  }

  const handleBack = () => {
    setSelectedMyGigId(null)

    setSelectedGigId(null)

    setSelectedEventId(null)

    setPosting(false)

    setGigPosted(false)

    setViewingNotifications(false)

    setActiveChatId(null)

    setSelectedCreatorName(null)

    setSelectedBrandName(null)

    setExploreFilter("all")

    setExploreSearchQuery("")

    setActiveTab("home")
  }

  const showNav =
    isLoggedIn &&
    !selectedMyGig &&
    !selectedGig &&
    !selectedEvent &&
    !posting &&
    !gigPosted &&
    !viewingNotifications &&
    !viewingMyApplications &&
    activeChatId === null &&
    activeConvoId === null &&
    selectedCreator === null &&
    selectedBrand === null

  const handleTouchStart = (e: any) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: any) => {
    if (touchStartX.current === null) return

    const diff = touchStartX.current - e.changedTouches[0].clientX

    if (Math.abs(diff) > 50) {
      if (diff > 0 && introPage < SLIDES.length)
        setIntroPage((p) => Math.min(p + 1, SLIDES.length))
      else if (diff < 0 && introPage > 0)
        setIntroPage((p) => Math.max(p - 1, 0))
    }

    touchStartX.current = null
  }

  const handleAuthSubmit = async (
    email: string,
    pass: string,
    mode: "login" | "signup",
    name: string,
    role?: "creator" | "brand" | "admin",
  ) => {
    let formattedEmail = email.trim()

    if (!formattedEmail.includes("@")) {
      formattedEmail = `${formattedEmail.replace(/\s+/g, "")}@kreator.com`
    }

    try {
      if (mode === "signup") {
        let userUid = ""

        try {
          const credential = await createUserWithEmailAndPassword(
            auth,
            formattedEmail,
            pass,
          )

          userUid = credential.user.uid
        } catch (authErr: any) {
          if (authErr.code === "auth/email-already-in-use") {
            const cred = await signInWithEmailAndPassword(
              auth,
              formattedEmail,
              pass,
            )

            userUid = cred.user.uid
          } else {
            throw authErr
          }
        }

        if (role === "admin") {
          const newAdmin = {
            id: Date.now(),

            uid: userUid,

            name: name || "Admin User",

            email: formattedEmail,

            role: "admin",

            isAdmin: false, // Must be set to true in Firestore DB to log in

            setupComplete: true,

            createdAt: new Date().toISOString(),
          }

          console.log(
            "[ADMIN REGISTRATION] Writing admin document to Firestore:",
            newAdmin,
          )

          try {
            await setDoc(doc(db, "admins", userUid), newAdmin, { merge: true })

            console.log(
              "[ADMIN REGISTRATION SUCCESS] Successfully created doc in admins/",
              userUid,
            )
          } catch (docErr: any) {
            console.error("[ADMIN REGISTRATION ERROR]", docErr)

            alert(
              `Failed to save admin record to Firestore: ${docErr.message || docErr}\n\nPlease check Cloud Firestore Security Rules in Firebase Console to ensure read/write permission on 'admins' collection!`,
            )
          }
        } else if (role === "brand") {
          const newBrand = {
            id: Date.now(),

            name: name || "New Brand",

            industry: "Retail & Fashion",

            logo: "https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=160&h=160&fit=crop&auto=format",

            bio: "Bengal based brand. Exciting new campaigns coming soon.",

            location: "Kolkata, WB",

            verified: false,

            setupComplete: false,
          }

          await setDoc(doc(db, "brands", userUid), newBrand)
        } else {
          const newCreator = {
            id: Date.now(),

            name: name || "New Creator",

            handle: `@${(name || "creator").toLowerCase().replace(/\s+/g, "")}`,

            avatar:
              "https://images.unsplash.com/photo-1624610261655-777af2f586d7?w=80&h=80&fit=crop&auto=format",

            followers: "0",

            niche: "Fashion & Lifestyle",

            bio: "Kreator Kolkata member",

            verified: false,

            followers_count: 0,

            setupComplete: false,
          }

          await setDoc(doc(db, "creators", userUid), newCreator)
        }
      } else {
        await signInWithEmailAndPassword(auth, formattedEmail, pass)
      }
    } catch (err: any) {
      console.error("[AUTH ERROR]", err)

      if (
        err.code === "permission-denied" ||
        err.message?.includes("permission")
      ) {
        alert(
          "Firestore Permission Error: Cloud Firestore rules blocked creating doc in 'admins' collection. Please check security rules in Firebase Console!",
        )
      } else {
        alert(err.message || "Authentication failed")
      }
    }
  }

  const handleLogout = () => {
    signOut(auth)

    setIntroPage(0)

    setActiveTab("home")
  }

  const renderMain = () => {
    if (selectedMyGig) {
      return (
        <ViewMyGigPage
          gig={selectedMyGig}
          initialTab={selectedMyGigTab}
          onBack={() => setSelectedMyGigId(null)}
          onCreatorClick={(name) => {
            const matched =
              creators.find(
                (c) => c.name.toLowerCase() === name.toLowerCase(),
              ) ||
              CREATORS.find((c) => c.name.toLowerCase() === name.toLowerCase())
            if (matched) {
              setSelectedCreatorName(matched.name)
            }
          }}
          onOpenChat={(applicantName, avatar) => {
            const matched =
              creators.find(
                (c) => c.name.toLowerCase() === applicantName.toLowerCase(),
              ) ||
              CREATORS.find(
                (c) => c.name.toLowerCase() === applicantName.toLowerCase(),
              )
            if (matched) {
              handleMessageCreator(matched)
            } else {
              handleMessageCreator({
                id: Date.now(),
                name: applicantName,
                avatar: avatar,
                handle: `@${applicantName.toLowerCase().replace(/\s+/g, "")}`,
                niche: "Creator",
                followers: "10K",
                verified: true,
                bio: "",
              } as any)
            }
            setSelectedMyGigId(null)
          }}
        />
      )
    }

    const totalUnreadNotificationsCount =
      dbNotifications.filter((n) => !n.read).length + unreadNotifications.size

    const handleNotificationAction = (notification: any) => {
      setViewingNotifications(false)
      const raw = notification.raw || notification
      const action = notification.actionText

      if (raw?.link || raw?.actionUrl) {
        const link = (raw.link || raw.actionUrl).toLowerCase()
        if (link.includes("explore")) setActiveTab("explore")
        else if (link.includes("gig") || link.includes("browse"))
          setActiveTab("home")
        else if (link.includes("event")) setActiveTab("events")
        else if (link.includes("chat") || link.includes("message"))
          setActiveTab("chat")
        else if (link.includes("profile")) setActiveTab("profile")
        else setActiveTab("home")
        return
      }

      if (
        action === "Open Chat" ||
        notification.type === "chat" ||
        notification.type === "message" ||
        (action === "View" && notification.type === "message")
      ) {
        // Open the specific chat/convo with the sender
        setActiveTab("chat")
        if (raw?.senderUid && currentUser?.uid) {
          const convoId = getConvoId(currentUser.uid, raw.senderUid)
          setActiveConvoId(convoId)
          setActiveChatId(null)
          try {
            const convoRef = doc(db, "conversations", convoId)
            updateDoc(convoRef, {
              [`unreadCounts.${currentUser.uid}`]: 0,
            }).catch(() => {})
          } catch (e) {}
        }
      } else if (action === "View Gig") {
        if (raw?.gigId) {
          setSelectedGigId(Number(raw.gigId))
        } else {
          setActiveTab("explore")
        }
      } else if (action === "Review Pitch") {
        // Open profile > My Gig > Applicants tab for that gig
        if (raw?.gigId) {
          setSelectedMyGigId(Number(raw.gigId))
          setSelectedMyGigTab("applicants")
        }
        setActiveTab("profile")
      } else if (action === "View Status") {
        setActiveTab("profile")
        setViewingMyApplications(true)
      } else if (raw?.gigId) {
        setSelectedGigId(Number(raw.gigId))
      } else {
        setActiveTab("profile")
      }
    }

    if (gigPosted)
      return (
        <GigPostedSuccess
          onBack={handleBack}
          onViewMyGigs={() => {
            setGigPosted(false)
            setPosting(false)
            setActiveTab("profile")
          }}
          onShareInstagram={() => {
            const latestGig = gigs[0] || GIGS[0]
            if (latestGig) {
              handleShareGigCard(latestGig)
            } else {
              const shareUrl = `${window.location.origin}`
              navigator.clipboard.writeText(shareUrl)
              alert(
                "Gig link copied! You can now paste and share on Instagram!",
              )
            }
          }}
        />
      )

    if (posting)
      return (
        <PostGigPage
          userProfile={userProfile}
          userRole={userRole}
          currentUser={currentUser}
          onBack={handleBack}
          onPosted={() => {
            setPosting(false)
            setGigPosted(true)
          }}
        />
      )

    if (selectedGig) {
      return (
        <ApplyPage
          gig={selectedGig}
          onBack={handleBack}
          userProfile={userProfile}
          currentUser={auth.currentUser}
          creators={creators}
          brands={brands}
          onCreatorClick={(name) => {
            const matched =
              creators.find(
                (c) => c.name.toLowerCase() === name.toLowerCase(),
              ) ||
              CREATORS.find((c) => c.name.toLowerCase() === name.toLowerCase())

            if (matched) {
              setSelectedGigId(null)

              setSelectedCreatorName(matched.name)
            }
          }}
          onBrandClick={(b) => {
            setSelectedGigId(null)

            setSelectedBrandName(b.name)
          }}
        />
      )
    }

    if (viewingMyApplications) {
      return (
        <MyApplicationsPage
          onBack={() => setViewingMyApplications(false)}
          currentUser={currentUser}
          userProfile={userProfile}
          gigs={gigs}
        />
      )
    }

    if (viewingNotifications) {
      return (
        <NotificationsPage
          onBack={() => setViewingNotifications(false)}
          unreadNotifications={unreadNotifications}
          setUnreadNotifications={setUnreadNotifications}
          dbNotifications={dbNotifications}
          onNotificationAction={handleNotificationAction}
        />
      )
    }

    if (selectedCreator) {
      return (
        <PublicProfilePage
          creator={selectedCreator}
          onBack={() => setSelectedCreatorName(null)}
          followedCreators={followedCreators}
          toggleFollowCreator={toggleFollowCreator}
          onMessageCreator={handleMessageCreator}
        />
      )
    }

    if (selectedBrand) {
      return (
        <PublicBrandProfilePage
          brand={selectedBrand}
          onBack={() => setSelectedBrandName(null)}
          followedBrands={followedBrands}
          toggleFollowBrand={toggleFollowBrand}
          onMessageBrand={handleMessageBrand}
          onApply={handleApply}
          gigs={gigs}
          userProfile={userProfile}
          creators={creators}
          brands={brands}
          userAppliedGigIds={userAppliedGigIds}
        />
      )
    }

    if (selectedEvent) {
      return (
        <ViewEventPage
          event={selectedEvent}
          onBack={() => setSelectedEventId(null)}
          isRsvp={rsvpEvents.has(selectedEvent.id)}
          toggleRsvpEvent={toggleRsvpEvent}
          userProfile={userProfile}
        />
      )
    }

    if (activeTab === "profile") {
      return (
        <ProfilePage
          onPostGig={() => {
            setPosting(true)
          }}
          onLogout={handleLogout}
          userProfile={userProfile}
          userRole={userRole}
          onSwitchToAdmin={() => setAdminViewMode("dashboard")}
          gigs={gigs}
          onViewGig={(gig, tab) => {
            setSelectedMyGigId(gig.id)
            setSelectedMyGigTab(tab || "applicants")
          }}
          onViewMyApplications={() => setViewingMyApplications(true)}
        />
      )
    }

    if (activeTab === "chat") {
      return (
        <ChatPage
          chats={chats}
          setChats={setChats}
          activeChatId={activeChatId}
          setActiveChatId={setActiveChatId}
          handleOpenChat={handleOpenChat}
          userProfile={userProfile}
          gigs={gigs}
          conversations={conversations}
          setConversations={setConversations}
          activeConvoId={activeConvoId}
          setActiveConvoId={setActiveConvoId}
          activeMessages={activeMessages}
          currentUser={currentUser}
          creators={creators}
          brands={brands}
          onStartCall={startCall}
        />
      )
    }

    if (activeTab === "explore") {
      return (
        <ExplorePage
          savedGigs={savedGigs}
          toggleSave={toggleSave}
          onApply={handleApply}
          followedBrands={followedBrands}
          toggleFollowBrand={toggleFollowBrand}
          rsvpEvents={rsvpEvents}
          toggleRsvpEvent={toggleRsvpEvent}
          onBellClick={() => setViewingNotifications(true)}
          unreadCount={totalUnreadNotificationsCount}
          onCreatorClick={handleOpenCreatorProfile}
          onBrandClick={(b) => setSelectedBrandName(b.name)}
          searchQuery={exploreSearchQuery}
          setSearchQuery={setExploreSearchQuery}
          activeFilter={exploreFilter}
          setActiveFilter={setExploreFilter}
          gigs={gigs}
          events={events}
          creators={creators}
          brands={brands}
          userProfile={userProfile}
          onProfileClick={() => setActiveTab("profile")}
          onSelectEvent={(ev) => setSelectedEventId(ev.id)}
          onShareGig={handleShareGig}
          userAppliedGigIds={userAppliedGigIds}
        />
      )
    }

    return (
      <HomePage
        savedGigs={savedGigs}
        toggleSave={toggleSave}
        onApply={handleApply}
        onBellClick={() => setViewingNotifications(true)}
        unreadCount={totalUnreadNotificationsCount}
        onCreatorClick={handleOpenCreatorProfile}
        onBrandClick={(b) => setSelectedBrandName(b.name)}
        onEventClick={handleOpenEventsTab}
        onSelectEvent={(ev) => setSelectedEventId(ev.id)}
        onSearch={handleHomeSearch}
        gigs={gigs}
        events={events}
        creators={creators}
        brands={brands}
        userProfile={userProfile}
        onProfileClick={() => setActiveTab("profile")}
        onShareGig={handleShareGig}
        userAppliedGigIds={userAppliedGigIds}
      />
    )
  }

  const isIntroAuth = introPage === SLIDES.length

  return (
    <div className="min-h-screen bg-[#f0f4ff] flex justify-center items-start">
      <div className="w-full max-w-[430px] min-h-screen bg-[#f0f4ff] flex flex-col relative overflow-hidden">
        {/* Instagram Connection Overlay */}
        {isIgConnecting && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center text-white text-3xl shadow-xl mb-4 animate-bounce">
              📸
            </div>
            <div className="w-8 h-8 rounded-full border-3 border-slate-200 border-t-[#e4405f] animate-spin mb-4" />
            <h3 className="text-base font-display font-black text-slate-900 mb-1">
              Authenticating with Meta
            </h3>
            <p className="text-xs text-slate-500 max-w-[240px] leading-relaxed">
              Exchanging secure authorization codes and fetching your Instagram
              Business statistics...
            </p>
          </div>
        )}

        {/* Real-time Connection Success Toast */}
        {igConnectSuccess && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 w-[90%] max-w-[380px] bg-emerald-600 text-white rounded-2xl p-4 shadow-xl z-50 flex items-center justify-between gap-3 animate-slideDown">
            <div className="flex items-center gap-2">
              <span className="text-lg">✓</span>
              <span className="text-xs font-bold text-left">
                {igConnectSuccess}
              </span>
            </div>
            <button
              onClick={() => setIgConnectSuccess(null)}
              className="text-white hover:opacity-80 text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Real-time Connection Error Toast */}
        {igConnectError && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 w-[90%] max-w-[380px] bg-rose-600 text-white rounded-2xl p-4 shadow-xl z-50 flex items-center justify-between gap-3 animate-slideDown">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <span className="text-xs font-bold text-left">
                {igConnectError}
              </span>
            </div>
            <button
              onClick={() => setIgConnectError(null)}
              className="text-white hover:opacity-80 text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {isLoggedIn ? (
          userRole === "admin" && adminViewMode === "dashboard" ? (
            <AdminDashboardPage
              gigs={gigs}
              events={events}
              creators={creators}
              brands={brands}
              onLogout={handleLogout}
              onSwitchToPlatform={() => setAdminViewMode("platform")}
            />
          ) : userRole === "admin_pending" ? (
            <AdminPendingPage
              userProfile={userProfile}
              onLogout={handleLogout}
            />
          ) : !userProfile ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-white p-6 text-center">
              <div className="w-10 h-10 rounded-full border-4 border-slate-100 border-t-[#3b5bdb] animate-spin mb-4" />
              <div className="text-sm font-bold text-slate-700 animate-pulse mb-1">
                Loading Kolkata network profile…
              </div>
              <p className="text-xs text-slate-400 max-w-xs mb-6">
                Connecting to live Cloud Firestore database...
              </p>

              <button
                onClick={handleLogout}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 underline transition cursor-pointer"
              >
                Stuck loading? Sign Out 🚪
              </button>
            </div>
          ) : userProfile.setupComplete === false ? (
            <ProfileSetupPage
              userProfile={userProfile}
              userRole={userRole}
              onComplete={() => {
                // updates automatically via real-time onSnapshot
              }}
            />
          ) : (
            <>
              {userRole === "admin" && adminViewMode === "platform" && (
                <div className="bg-[#0a1628] text-white px-4 py-2.5 flex items-center justify-between sticky top-0 z-40 border-b border-slate-800 shadow-md">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-bold text-slate-200">
                      Admin Mode Active (User View)
                    </span>
                  </div>
                  <button
                    onClick={() => setAdminViewMode("dashboard")}
                    className="bg-[#3b5bdb] hover:bg-[#2b4ef7] text-white text-[10px] font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1 shadow-sm cursor-pointer active:scale-95"
                  >
                    <span>⚡</span> Dashboard →
                  </button>
                </div>
              )}

              {renderMain()}

              {showNav &&
                (() => {
                  const unreadChatUsersCount = currentUser
                    ? conversations.filter(
                        (c) => (c.unreadCounts?.[currentUser.uid] || 0) > 0,
                      ).length
                    : chats.filter((c) => c.unreadCount > 0).length

                  return (
                    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-slate-100 px-6 pt-3 pb-6 flex items-center justify-around shadow-xl z-20">
                      {[
                        { id: "home", label: "Home", icon: "⊞" },

                        { id: "explore", label: "Explore", icon: "🧭" },

                        { id: "post", label: "", icon: "＋", special: true },

                        { id: "chat", label: "Chat", icon: "💬" },

                        { id: "profile", label: "Profile", icon: "👤" },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setActiveTab(tab.id)

                            if (tab.id === "post") setPosting(true)

                            if (tab.id === "explore") setExploreFilter("all")

                            // Reset sub-pages/views when switching bottom tabs
                            setViewingNotifications(false)
                            setViewingMyApplications(false)
                            setSelectedGigId(null)
                            setSelectedMyGigId(null)
                            setSelectedCreatorName(null)
                            setSelectedBrandName(null)
                            setSelectedEventId(null)
                          }}
                          className={`flex flex-col items-center gap-1 ${
                            tab.special ? "-mt-6" : ""
                          }`}
                        >
                          {tab.special ? (
                            <span className="w-14 h-14 rounded-full bg-[#3b5bdb] flex items-center justify-center text-2xl text-white shadow-lg shadow-blue-300">
                              {tab.icon}
                            </span>
                          ) : (
                            <>
                              <div className="relative flex items-center justify-center">
                                <span
                                  className={`text-lg leading-none ${
                                    activeTab === tab.id
                                      ? "opacity-100"
                                      : "opacity-40"
                                  }`}
                                >
                                  {tab.icon}
                                </span>
                                {tab.id === "chat" &&
                                  unreadChatUsersCount > 0 && (
                                    <span className="absolute -top-1.5 -right-2.5 bg-[#3b5bdb] text-white text-[9px] font-black h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                                      {unreadChatUsersCount}
                                    </span>
                                  )}
                              </div>
                              <span
                                className={`text-[10px] font-bold ${
                                  activeTab === tab.id
                                    ? "text-[#3b5bdb]"
                                    : "text-slate-400"
                                }`}
                              >
                                {tab.label}
                              </span>
                              {activeTab === tab.id && (
                                <span className="w-1 h-1 rounded-full bg-[#3b5bdb]" />
                              )}
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  )
                })()}
            </>
          )
        ) : (
          <div
            className="w-full min-h-screen relative overflow-hidden bg-white"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {isIntroAuth ? (
              <AuthScreen
                onBack={() => setIntroPage(SLIDES.length - 1)}
                onAuthSubmit={handleAuthSubmit}
              />
            ) : (
              <SlideScreen
                slide={SLIDES[introPage]}
                onNext={() =>
                  setIntroPage((p) => Math.min(p + 1, SLIDES.length))
                }
                onSkip={() => setIntroPage(SLIDES.length)}
                current={introPage}
                total={SLIDES.length}
              />
            )}
          </div>
        )}
        {/* Incoming Call Overlay */}
        {incomingCall && (
          <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-between p-8 text-white animate-in fade-in duration-300">
            <div className="flex flex-col items-center gap-2 pt-12">
              <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700">
                Incoming {incomingCall.type === "video" ? "Video" : "Voice"}{" "}
                Call
              </span>
            </div>

            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <div className="absolute -inset-4 rounded-full bg-[#3b5bdb]/30 animate-ping" />
                <img
                  src={incomingCall.callerAvatar}
                  alt={incomingCall.callerName}
                  className="w-28 h-28 rounded-full object-cover border-4 border-[#3b5bdb] shadow-2xl relative z-10"
                />
              </div>

              <div className="text-center">
                <h2 className="text-2xl font-black tracking-tight">
                  {incomingCall.callerName}
                </h2>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Kreator Member
                </p>
              </div>
            </div>

            <div className="flex items-center gap-12 pb-12">
              <button
                onClick={declineCall}
                className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 active:scale-95 transition cursor-pointer"
                title="Decline Call"
              >
                <PhoneOffIcon />
              </button>
              <button
                onClick={answerCall}
                className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40 active:scale-95 transition cursor-pointer"
                title="Accept Call"
              >
                <PhoneIcon />
              </button>
            </div>
          </div>
        )}

        {/* Active Ongoing Call Overlay */}
        {activeCall && (
          <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between text-white overflow-hidden">
            {/* Video Feed */}
            {activeCall.type === "video" ? (
              <div className="relative flex-1 bg-slate-900 overflow-hidden">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                {/* Local Video PiP */}
                <div className="absolute top-6 right-6 w-28 h-40 rounded-2xl bg-slate-800 border-2 border-slate-700/60 shadow-2xl overflow-hidden z-10">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Call Header */}
                <div className="absolute top-6 left-6 z-10 flex items-center gap-3 bg-slate-900/60 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700/50">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-200">
                    {activeCall.status === "calling"
                      ? "Calling..."
                      : formatTimer(callTimer)}
                  </span>
                </div>
              </div>
            ) : (
              /* Audio Mode Screen */
              <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 p-6 relative">
                <div className="relative mb-6">
                  {activeCall.status === "accepted" && (
                    <div className="absolute -inset-6 rounded-full bg-[#3b5bdb]/20 animate-ping" />
                  )}
                  <img
                    src={
                      activeCall.callerUid === currentUser?.uid
                        ? activeCall.calleeAvatar
                        : activeCall.callerAvatar
                    }
                    alt="Call participant"
                    className="w-32 h-32 rounded-full object-cover border-4 border-slate-700 shadow-2xl relative z-10"
                  />
                </div>
                <h3 className="text-2xl font-black tracking-tight mb-1">
                  {activeCall.callerUid === currentUser?.uid
                    ? activeCall.calleeName
                    : activeCall.callerName}
                </h3>
                <span className="text-xs text-[#3b5bdb] font-bold bg-[#3b5bdb]/10 px-3 py-1 rounded-full border border-[#3b5bdb]/20 mt-2">
                  {activeCall.status === "calling"
                    ? "Ringing..."
                    : formatTimer(callTimer)}
                </span>
              </div>
            )}

            {/* In-Call Toolbar */}
            <div className="bg-slate-900/90 backdrop-blur-md px-8 py-6 flex items-center justify-around border-t border-slate-800 z-20">
              <button
                onClick={toggleMute}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition active:scale-95 cursor-pointer border ${
                  isMuted
                    ? "bg-rose-600 text-white border-rose-500"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                }`}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <MicOffIcon /> : <MicIcon />}
              </button>

              {activeCall.type === "video" && (
                <button
                  onClick={toggleVideo}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition active:scale-95 cursor-pointer border ${
                    isVideoOff
                      ? "bg-rose-600 text-white border-rose-500"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                  }`}
                  title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
                >
                  {isVideoOff ? <CameraOffIcon /> : <VideoIcon />}
                </button>
              )}

              <button
                onClick={endCall}
                className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 active:scale-95 transition cursor-pointer border border-rose-500"
                title="End Call"
              >
                <PhoneOffIcon />
              </button>
            </div>
          </div>
        )}

        {/* Live Notification Banner Toast */}
        {liveToast && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-[400px] bg-slate-900/95 text-white backdrop-blur-xl p-4 rounded-3xl shadow-2xl border border-slate-700/60 flex items-center gap-3 animate-in slide-in-from-top duration-300">
            <img
              src={
                liveToast.avatar ||
                "https://images.unsplash.com/photo-1624610261655-777af2f586d7?w=80&h=80&fit=crop&auto=format"
              }
              alt=""
              className="w-11 h-11 rounded-full object-cover border border-slate-700 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-black text-white truncate">
                {liveToast.title}
              </div>
              <p className="text-[11px] text-slate-300 leading-tight truncate">
                {liveToast.message}
              </p>
            </div>
            <button
              onClick={() => setLiveToast(null)}
              className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-bold flex items-center justify-center flex-shrink-0"
            >
              ✕
            </button>
          </div>
        )}

        {generatingShareCard && (
          <div className="fixed inset-0 bg-black/45 backdrop-blur-xs z-50 flex flex-col items-center justify-center text-white">
            <div className="bg-slate-900 rounded-3xl p-6 flex flex-col items-center gap-3 border border-slate-800 shadow-2xl max-w-[280px]">
              <div className="w-8 h-8 rounded-full border-3 border-slate-700 border-t-white animate-spin" />
              <span className="text-xs font-bold text-slate-200">
                Generating share card...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
