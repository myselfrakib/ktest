import React, { useState } from "react"
import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  increment,
} from "firebase/firestore"
import { auth, db } from "../firebase"
import type {
  ChatThread,
  Conversation,
  LiveMessage,
  Creator,
  Brand,
} from "../types"

function ArrowLeftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

function VideoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  )
}

function MapPinIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

interface ChatPageProps {
  chats?: ChatThread[]
  setChats: React.Dispatch<React.SetStateAction<ChatThread[]>>
  activeChatId: number | null
  setActiveChatId: (id: number | null) => void
  handleOpenChat: (id: number) => void
  userProfile?: any
  gigs?: any[]
  conversations?: Conversation[]
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>
  activeConvoId: string | null
  setActiveConvoId: (id: string | null) => void
  activeMessages?: LiveMessage[]
  currentUser?: any
  creators?: Creator[]
  brands?: Brand[]
  onStartCall?: (type: "audio" | "video") => void
}

export function ChatPage({
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
}: ChatPageProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [inputText, setInputText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showGigPanel, setShowGigPanel] = useState(false)
  const [gigPanelApps, setGigPanelApps] = useState<any[]>([])
  const [gigPanelLoading, setGigPanelLoading] = useState(false)
  const [gigPanelAction, setGigPanelAction] = useState<
    Record<number, "accepting" | "rejecting" | "accepted" | "rejected">
  >({})
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
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSendMessage()
  }

  if (activeConvoId || activeChatId) {
    const messagesToRender = activeConvoId
      ? activeMessages
      : activeChat?.messages || []
    return (
      <div className="flex-1 bg-slate-50 flex flex-col h-[100dvh] relative overflow-hidden">
        {/* Header (Constant Topbar) */}
        <div className="px-4 pt-12 pb-3 bg-white border-b border-slate-100 flex items-center justify-between absolute top-0 inset-x-0 z-20 shadow-xs">
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
            >
              <PhoneIcon />
            </button>
            <button
              onClick={() => onStartCall?.("video")}
              className="w-9.5 h-9.5 rounded-full bg-slate-50 hover:bg-[#e8edff] text-slate-600 hover:text-[#3b5bdb] flex items-center justify-center active:scale-95 transition cursor-pointer border border-slate-100 shadow-2xs"
            >
              <VideoIcon />
            </button>
          </div>
        </div>

        {/* Message Thread List (Scrollable Area) */}
        <div className="flex-1 overflow-y-auto px-4 pt-[104px] pb-[96px] flex flex-col gap-3.5 scrollbar-hide">
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
        </div>

        {/* Message Input Panel (Constant Bottom Input) */}
        <div className="absolute bottom-0 inset-x-0 bg-white border-t border-slate-100 px-4 py-4 pb-6 flex items-center gap-2 z-20 shadow-md">
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
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
        {filteredChats.map((thread) => (
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
            <img
              src={thread.avatar}
              alt={thread.name}
              className="w-12 h-12 rounded-full object-cover border border-slate-100 shadow-sm"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-bold text-slate-900 truncate">
                  {thread.name}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">
                  {thread.lastMessageTime}
                </span>
              </div>
              <p className="text-[11px] truncate text-slate-500 font-medium">
                {thread.lastMessageText}
              </p>
            </div>
          </div>
        ))}
        {filteredChats.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-[#3b5bdb]/10 flex items-center justify-center text-3xl mb-4">
              💬
            </div>
            <h3 className="text-sm font-black text-slate-800 mb-1">No messages yet</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-[220px]">
              Start a conversation by visiting a creator or brand profile and tapping <strong>Message</strong>.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatPage
