import { useState } from "react"
import type { Creator, Brand, Gig } from "../types"

function ArrowLeftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}

export function PublicProfilePage({
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
  const [activeTab, setActiveTab] = useState<"portfolio" | "reviews">("portfolio")
  const [copied, setCopied] = useState(false)
  const isFollowing = followedCreators.has(creator.id)

  const handleShare = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const followersCount =
    (creator as any).instagram?.followersFormatted || creator.followers

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide pb-28 bg-slate-50 flex flex-col min-h-screen">
      <div className="px-5 pt-12 pb-4 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 active:scale-95 transition cursor-pointer border border-slate-100"
        >
          <ArrowLeftIcon />
        </button>
        <div className="text-center">
          <h1 className="text-sm font-bold text-slate-900">{creator.name}</h1>
          <div className="text-[10px] text-slate-400">{creator.handle}</div>
        </div>
        <button
          onClick={handleShare}
          className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 active:scale-95 transition cursor-pointer border border-slate-100"
        >
          <ShareIcon />
        </button>
      </div>

      <div className="p-5 flex flex-col items-center text-center">
        <img
          src={creator.avatar}
          alt={creator.name}
          className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md mb-3"
        />
        <h2 className="text-lg font-black text-slate-900">{creator.name}</h2>
        <span className="text-xs font-bold text-[#3b5bdb] bg-blue-50 px-3 py-1 rounded-full my-1">
          {creator.niche}
        </span>
        <p className="text-xs text-slate-600 max-w-xs mt-2 leading-relaxed">
          {creator.bio}
        </p>

        <div className="flex items-center gap-6 my-4 bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
          <div>
            <div className="text-base font-black text-slate-900">{followersCount}</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Followers
            </div>
          </div>
          <div className="w-px h-6 bg-slate-100" />
          <div>
            <div className="text-base font-black text-slate-900">{creator.engagement}</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Engagement
            </div>
          </div>
        </div>

        <div className="flex gap-3 w-full max-w-xs">
          <button
            onClick={() => toggleFollowCreator(creator.id)}
            className={`flex-1 py-3 rounded-2xl text-xs font-bold transition shadow-sm cursor-pointer ${
              isFollowing
                ? "bg-slate-100 text-slate-600"
                : "bg-[#3b5bdb] text-white shadow-blue-200"
            }`}
          >
            {isFollowing ? "Following" : "+ Follow"}
          </button>
          <button
            onClick={() => onMessageCreator(creator)}
            className="flex-1 py-3 rounded-2xl text-xs font-bold bg-[#f76707] text-white shadow-sm shadow-orange-200 transition cursor-pointer"
          >
             Message
          </button>
        </div>
      </div>
    </div>
  )
}

export function PublicBrandProfilePage({
  brand,
  onBack,
  followedBrands,
  toggleFollowBrand,
  onMessageBrand,
  onApply,
  gigs = [],
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
  const isFollowing = followedBrands.has(brand.id)
  const brandGigs = gigs.filter((g) => g.brand === brand.name || g.creatorName === brand.name)

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide pb-28 bg-slate-50 flex flex-col min-h-screen">
      <div className="px-5 pt-12 pb-4 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 active:scale-95 transition cursor-pointer border border-slate-100"
        >
          <ArrowLeftIcon />
        </button>
        <h1 className="text-sm font-bold text-slate-900">{brand.name}</h1>
        <div className="w-10" />
      </div>

      <div className="p-5 flex flex-col items-center text-center">
        <img
          src={brand.logo}
          alt={brand.name}
          className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-md mb-3"
        />
        <h2 className="text-lg font-black text-slate-900">{brand.name}</h2>
        <div className="text-xs font-bold text-slate-400 mb-2">{brand.industry}</div>
        <p className="text-xs text-slate-600 max-w-xs leading-relaxed mb-4">{brand.bio}</p>

        <div className="flex gap-3 w-full max-w-xs mb-6">
          <button
            onClick={() => toggleFollowBrand(brand.id)}
            className={`flex-1 py-3 rounded-2xl text-xs font-bold transition shadow-sm cursor-pointer ${
              isFollowing
                ? "bg-slate-100 text-slate-600"
                : "bg-[#3b5bdb] text-white shadow-blue-200"
            }`}
          >
            {isFollowing ? "Following" : "+ Follow Brand"}
          </button>
          <button
            onClick={() => onMessageBrand(brand)}
            className="flex-1 py-3 rounded-2xl text-xs font-bold bg-[#f76707] text-white shadow-sm shadow-orange-200 transition cursor-pointer"
          >
             Message
          </button>
        </div>

        {brandGigs.length > 0 && (
          <div className="w-full text-left">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Brand Campaigns ({brandGigs.length})
            </h3>
            <div className="flex flex-col gap-3">
              {brandGigs.map((gig) => (
                <div
                  key={gig.id}
                  onClick={() => onApply(gig)}
                  className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm cursor-pointer hover:border-slate-200 transition"
                >
                  <div className="text-xs font-bold text-slate-900 mb-1">{gig.title}</div>
                  <div className="text-[10px] text-[#3b5bdb] font-bold">{gig.budget}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PublicProfilePage
