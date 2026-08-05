import React, { useState } from "react"
import type { Gig, Creator, Brand, Event } from "../types"

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
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

function MapPinIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

interface ExplorePageProps {
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
  setActiveFilter: (filter: "all" | "creators" | "brands" | "gigs" | "events") => void
  gigs?: Gig[]
  creators?: Creator[]
  brands?: Brand[]
  events?: Event[]
  userProfile?: any
  onProfileClick?: () => void
  onSelectEvent?: (event: Event) => void
  onShareGig?: (gig: Gig) => void
  userAppliedGigIds?: Set<number>
}

export function ExplorePage({
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
  gigs = [],
  creators = [],
  brands = [],
  events = [],
  userProfile,
  onProfileClick,
  onSelectEvent,
  onShareGig,
  userAppliedGigIds,
}: ExplorePageProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery)

  const userAvatar =
    userProfile?.avatar ||
    userProfile?.logo ||
    "https://images.unsplash.com/photo-1624610261655-777af2f586d7?w=80&h=80&fit=crop&auto=format"

  const filteredCreators = creators.filter(
    (c) =>
      c.name.toLowerCase().includes(localSearch.toLowerCase()) ||
      c.handle.toLowerCase().includes(localSearch.toLowerCase()) ||
      c.niche.toLowerCase().includes(localSearch.toLowerCase()),
  )

  const filteredBrands = brands.filter(
    (b) =>
      b.name.toLowerCase().includes(localSearch.toLowerCase()) ||
      b.industry.toLowerCase().includes(localSearch.toLowerCase()),
  )

  const filteredGigs = gigs.filter(
    (g) =>
      g.title.toLowerCase().includes(localSearch.toLowerCase()) ||
      g.niche.toLowerCase().includes(localSearch.toLowerCase()) ||
      g.tags.some((t) => t.toLowerCase().includes(localSearch.toLowerCase())),
  )

  const filteredEvents = events.filter(
    (e) =>
      e.title.toLowerCase().includes(localSearch.toLowerCase()) ||
      e.venue.toLowerCase().includes(localSearch.toLowerCase()) ||
      e.tag.toLowerCase().includes(localSearch.toLowerCase()),
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setSearchQuery(localSearch)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide pb-28 bg-slate-50 flex flex-col min-h-screen">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-0.5">
            <MapPinIcon />
            <span>Kolkata, WB</span>
          </div>
          <h1 className="font-display text-[22px] font-black text-slate-900 leading-tight tracking-tight">
            Explore <span className="text-[#3b5bdb]">Kolkata Network</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onBellClick}
            className="relative w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 active:scale-95 transition"
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

      {/* Search Input */}
      <div className="px-5 py-4 bg-white border-b border-slate-100 mb-2">
        <div className="flex items-center gap-2.5 bg-slate-50 rounded-2xl px-4 py-2.5 border border-slate-100">
          <span className="text-slate-400">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search creators, brands, gigs, events…"
            className="flex-1 text-sm text-slate-700 placeholder:text-slate-400 outline-none bg-transparent font-medium"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-5 py-2 flex gap-2 overflow-x-auto scrollbar-hide mb-2">
        {[
          { id: "all", label: "All" },
          { id: "creators", label: "🎨 Creators" },
          { id: "brands", label: "🏢 Brands" },
          { id: "gigs", label: "💼 Gigs" },
          { id: "events", label: "🎉 Events" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as any)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeFilter === tab.id
                ? "bg-[#3b5bdb] text-white shadow-md shadow-blue-200"
                : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Results Content */}
      <div className="flex-1 px-5 flex flex-col gap-6 py-2">
        {/* Creators Section */}
        {(activeFilter === "all" || activeFilter === "creators") &&
          filteredCreators.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
                <span>Featured Creators ({filteredCreators.length})</span>
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {filteredCreators.map((creator) => (
                  <div
                    key={creator.id}
                    onClick={() => onCreatorClick(creator.name)}
                    className="bg-white rounded-3xl p-3.5 border border-slate-100 shadow-sm cursor-pointer hover:border-blue-200 transition flex flex-col items-center text-center"
                  >
                    <img
                      src={creator.avatar}
                      alt={creator.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-[#e8edff] mb-2"
                    />
                    <div className="text-xs font-bold text-slate-900 truncate w-full">
                      {creator.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium mb-1">
                      {creator.handle}
                    </div>
                    <span className="text-[9px] font-bold text-[#3b5bdb] bg-blue-50 px-2.5 py-0.5 rounded-full mb-2">
                      {creator.niche}
                    </span>
                    <div className="text-[10px] text-[#e4405f] font-bold flex items-center gap-1">
                      <InstagramIcon />
                      <span>{creator.followers}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Brands Section */}
        {(activeFilter === "all" || activeFilter === "brands") &&
          filteredBrands.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
                <span>Leading Brands ({filteredBrands.length})</span>
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {filteredBrands.map((brand) => {
                  const isFollowing = followedBrands.has(brand.id)
                  return (
                    <div
                      key={brand.id}
                      onClick={() => onBrandClick(brand)}
                      className="bg-white rounded-3xl p-3.5 border border-slate-100 shadow-sm cursor-pointer hover:border-blue-200 transition flex flex-col items-center text-center"
                    >
                      <img
                        src={brand.logo}
                        alt={brand.name}
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-100 mb-2 shadow-xs"
                      />
                      <div className="text-xs font-bold text-slate-900 truncate w-full">
                        {brand.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium mb-2">
                        {brand.industry}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFollowBrand(brand.id)
                        }}
                        className={`w-full py-1.5 rounded-xl text-[10px] font-bold transition cursor-pointer ${
                          isFollowing
                            ? "bg-slate-100 text-slate-600"
                            : "bg-[#3b5bdb] text-white shadow-sm"
                        }`}
                      >
                        {isFollowing ? "Following" : "+ Follow"}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        {/* Gigs Section */}
        {(activeFilter === "all" || activeFilter === "gigs") &&
          filteredGigs.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-slate-900 mb-3">
                Live Gigs ({filteredGigs.length})
              </h2>
              <div className="flex flex-col gap-3">
                {filteredGigs.map((gig) => (
                  <div
                    key={gig.id}
                    onClick={() => onApply(gig)}
                    className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm cursor-pointer hover:border-slate-200 transition"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <img
                        src={gig.avatar}
                        alt={gig.creatorName}
                        className="w-10 h-10 rounded-full object-cover border border-slate-100"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {gig.creatorName || gig.brand}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {gig.handle}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-slate-900 mb-1">
                      {gig.title}
                    </div>
                    <div className="text-[10px] text-[#3b5bdb] font-bold mb-2">
                      {gig.budget} · {gig.type}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Events Section */}
        {(activeFilter === "all" || activeFilter === "events") &&
          filteredEvents.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-slate-900 mb-3">
                Upcoming Events ({filteredEvents.length})
              </h2>
              <div className="flex flex-col gap-3">
                {filteredEvents.map((event) => {
                  const isRsvp = rsvpEvents.has(event.id)
                  return (
                    <div
                      key={event.id}
                      onClick={() => onSelectEvent && onSelectEvent(event)}
                      className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm cursor-pointer hover:border-slate-200 transition flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900 mb-0.5">
                          {event.title}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {event.date} · {event.venue}
                        </div>
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
                        {isRsvp
                          ? "✓ Registered"
                          : (event as any).isPaid || (event as any).price
                            ? `Register Now · ₹${(event as any).price}`
                            : "Register Now"}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
      </div>
    </div>
  )
}

export default ExplorePage
