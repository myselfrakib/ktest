import { useState, useEffect } from "react"
import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

import { auth, db, storage } from "../firebase"
import type { Gig, Creator, Brand, Event } from "../types"
import { AdminHeader } from "./AdminHeader"

function formatBudget(budget: string, type: string) {
  if (!budget) return type === "Paid" ? "₹0" : type
  if (type === "Paid" || /^\d[\d,\s-\-\.]*$/.test(budget)) return `₹${budget}`
  return budget
}

export function AdminDashboardPage({
  gigs,
  events,
  creators,
  brands,
  onLogout,
  onSwitchToPlatform,
}: {
  gigs: Gig[]
  events: Event[]
  creators: Creator[]
  brands: Brand[]
  onLogout: () => void
  onSwitchToPlatform?: () => void
}) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "events" | "gigs" | "admins" | "users" | "notifications"
  >("overview")

  const [notifTitle, setNotifTitle] = useState(
    "View what Priya Sengupta posted 🌟",
  )

  const [notifMessage, setNotifMessage] = useState(
    "Check out the new Ethnic Fashion reel collab in Kolkata.",
  )

  const [notifLink, setNotifLink] = useState("/explore")

  const [targetType, setTargetType] = useState<
    "all" | "creators" | "brands" | "selected"
  >("all")

  const [selectedUserUids, setSelectedUserUids] = useState<string[]>([])

  const [targetUserSearch, setTargetUserSearch] = useState("")

  const [sendingNotif, setSendingNotif] = useState(false)

  const [notifSuccessToast, setNotifSuccessToast] = useState<string | null>(
    null,
  )

  const [showCreateEventModal, setShowCreateEventModal] = useState(false)
  const [adminsList, setAdminsList] = useState<any[]>([])
  const [selectedAdminGig, setSelectedAdminGig] = useState<Gig | null>(null)
  const [selectedAdminEvent, setSelectedAdminEvent] = useState<Event | null>(
    null,
  )
  const [selectedAdminUser, setSelectedAdminUser] = useState<{
    user: any
    role: "creator" | "brand"
  } | null>(null)

  const [editingGigTitle, setEditingGigTitle] = useState(false)
  const [editGigTitleVal, setEditGigTitleVal] = useState("")
  const [editingEventTitle, setEditingEventTitle] = useState(false)
  const [editEventTitleVal, setEditEventTitleVal] = useState("")
  const [gigSearch, setGigSearch] = useState("")
  const [eventSearch, setEventSearch] = useState("")
  const [userSearch, setUserSearch] = useState("")
  const [confirmDelete, setConfirmDelete] = useState<{
    type: string
    id: string
    col: string
  } | null>(null)

  const [eventTitle, setEventTitle] = useState("")
  const [eventSubtitle, setEventSubtitle] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [eventTime, setEventTime] = useState("5:00 PM")
  const [eventVenue, setEventVenue] = useState("")
  const [eventLocation, setEventLocation] = useState("Kolkata, WB")
  const [eventTag, setEventTag] = useState("Featured Event")
  const [eventImage, setEventImage] = useState("")
  const [eventFile, setEventFile] = useState<File | null>(null)
  const [eventPreviewUrl, setEventPreviewUrl] = useState<string | null>(null)
  const [eventDescription, setEventDescription] = useState("")
  const [eventOrganizer, setEventOrganizer] = useState(
    "Kreator Kolkata Community",
  )
  const [eventEntryFee, setEventEntryFee] = useState("Free RSVP")
  const [eventIsPaid, setEventIsPaid] = useState<boolean>(false)
  const [eventPrice, setEventPrice] = useState<string>("499")
  const [eventSpeakers, setEventSpeakers] = useState("")
  const [creatingEvent, setCreatingEvent] = useState(false)

  // Canvas Image Cropper States
  const [zoom, setZoom] = useState(1.0)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [originalImage, setOriginalImage] = useState<string | null>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPanX(e.clientX - dragStart.x)
    setPanY(e.clientY - dragStart.y)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const getCroppedImageBlob = (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const container = document.querySelector(".event-crop-container")
      const rect = container?.getBoundingClientRect()
      const previewW = rect?.width || 400
      const previewH = rect?.height || 200
      const scaleX = 800 / previewW
      const scaleY = 400 / previewH

      const img = new Image()
      img.src = originalImage!
      img.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = 800
        canvas.height = 400
        const ctx = canvas.getContext("2d")
        if (!ctx) return reject(new Error("No canvas context"))

        ctx.fillStyle = "#0f1d38"
        ctx.fillRect(0, 0, 800, 400)
        ctx.save()
        ctx.translate(400 + panX * scaleX, 200 + panY * scaleY)
        ctx.scale(zoom, zoom)
        ctx.drawImage(img, -img.width / 2, -img.height / 2)
        ctx.restore()

        canvas.toBlob((blob) => {
          if (blob) resolve(blob)
          else reject(new Error("Canvas toBlob failed"))
        }, "image/jpeg", 0.85)
      }
      img.onerror = (err) => reject(err)
    })
  }

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "admins"),
      (snap) => {
        const list = snap.docs.map((d) => ({ uid: d.id, ...d.data() }))
        setAdminsList(list)
      },
      (err) => console.warn("Admin list error:", err),
    )
    return () => unsub()
  }, [])

  const handleApproveAdmin = async (adminUid: string) => {
    try {
      await updateDoc(doc(db, "admins", adminUid), {
        isAdmin: true,
        approvedAt: new Date().toISOString(),
      })
    } catch (err: any) {
      alert(err.message || "Failed to approve admin")
    }
  }

  const handleToggleFeatureGig = async (gig: Gig) => {
    const docId = String(gig.id)
    const newStatus = !(gig as any).isFeatured
    try {
      await updateDoc(doc(db, "gigs", docId), { isFeatured: newStatus })
      setSelectedAdminGig((prev) =>
        prev ? { ...prev, isFeatured: newStatus } : null,
      )
    } catch (err: any) {
      alert(err.message || "Failed to toggle feature")
    }
  }

  const handleSaveGigTitle = async (gig: Gig) => {
    if (!editGigTitleVal.trim()) return
    const docId = String(gig.id)
    try {
      await updateDoc(doc(db, "gigs", docId), {
        title: editGigTitleVal.trim(),
      })
      setSelectedAdminGig((prev) =>
        prev ? { ...prev, title: editGigTitleVal.trim() } : null,
      )
      setEditingGigTitle(false)
    } catch (err: any) {
      alert(err.message || "Failed to update title")
    }
  }

  const handleDeleteItem = async () => {
    if (!confirmDelete) return
    const { id, col } = confirmDelete
    try {
      await deleteDoc(doc(db, col, id))
      setConfirmDelete(null)
      setSelectedAdminGig(null)
      setSelectedAdminEvent(null)
      setSelectedAdminUser(null)
    } catch (err: any) {
      alert(err.message || "Failed to delete")
    }
  }

  const handleToggleFeatureEvent = async (ev: Event) => {
    const docId = String(ev.id)
    const newStatus = !(ev as any).isFeatured
    try {
      await updateDoc(doc(db, "events", docId), { isFeatured: newStatus })
      setSelectedAdminEvent((prev) =>
        prev ? { ...prev, isFeatured: newStatus } : null,
      )
    } catch (err: any) {
      alert(err.message || "Failed to toggle feature")
    }
  }

  const handleSaveEventTitle = async (ev: Event) => {
    if (!editEventTitleVal.trim()) return
    const docId = String(ev.id)
    try {
      await updateDoc(doc(db, "events", docId), {
        title: editEventTitleVal.trim(),
      })
      setSelectedAdminEvent((prev) =>
        prev ? { ...prev, title: editEventTitleVal.trim() } : null,
      )
      setEditingEventTitle(false)
    } catch (err: any) {
      alert(err.message || "Failed to update event title")
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0]
      setEventFile(f)
      const reader = new FileReader()
      reader.onload = () => {
        setOriginalImage(reader.result as string)
        setEventPreviewUrl(reader.result as string)
        setZoom(1.0)
        setPanX(0)
        setPanY(0)
      }
      reader.readAsDataURL(f)
    }
  }

  const resetEventForm = () => {
    setEventTitle("")
    setEventSubtitle("")
    setEventDate("")
    setEventTime("5:00 PM")
    setEventVenue("")
    setEventLocation("Kolkata, WB")
    setEventTag("Featured Event")
    setEventImage("")
    setEventFile(null)
    setEventPreviewUrl(null)
    setOriginalImage(null)
    setEventDescription("")
    setEventOrganizer("Kreator Kolkata Community")
    setEventEntryFee("Free RSVP")
    setEventIsPaid(false)
    setEventPrice("499")
    setEventSpeakers("")
    setZoom(1.0)
    setPanX(0)
    setPanY(0)
  }

  const handleCreateEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventTitle.trim() || !eventDate.trim() || !eventVenue.trim()) {
      alert("Please fill in Event Title, Date, and Venue.")
      return
    }
    setCreatingEvent(true)
    try {
      let finalImageUrl = eventImage.trim()

      if (originalImage) {
        try {
          const blob = await getCroppedImageBlob()
          const storageRef = ref(
            storage,
            `events/${Date.now()}_cropped_banner.jpg`,
          )
          await uploadBytes(storageRef, blob)
          finalImageUrl = await getDownloadURL(storageRef)
        } catch (cropErr) {
          console.warn("Cropper upload error, fallback to raw file:", cropErr)
          if (eventFile) {
            const storageRef = ref(
              storage,
              `events/${Date.now()}_${eventFile.name}`,
            )
            await uploadBytes(storageRef, eventFile)
            finalImageUrl = await getDownloadURL(storageRef)
          }
        }
      }

      if (!finalImageUrl) {
        finalImageUrl =
          "https://images.unsplash.com/photo-1648440108249-30567222448a?w=400&h=200&fit=crop&auto=format"
      }

      const parsedDate = new Date(eventDate)
      const dayStr = isNaN(parsedDate.getDate())
        ? "10"
        : String(parsedDate.getDate())
      const monthNames = [
        "JAN",
        "FEB",
        "MAR",
        "APR",
        "MAY",
        "JUN",
        "JUL",
        "AUG",
        "SEP",
        "OCT",
        "NOV",
        "DEC",
      ]
      const monthStr = isNaN(parsedDate.getMonth())
        ? "AUG"
        : monthNames[parsedDate.getMonth()]

      const parsedSpeakers = eventSpeakers
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)

      const newId = Date.now()
      const newEventData = {
        id: newId,
        title: eventTitle.trim(),
        subtitle: eventSubtitle.trim() || undefined,
        date: eventDate,
        day: dayStr,
        month: monthStr,
        time: eventTime.trim() || "5:00 PM",
        venue: eventVenue.trim(),
        location: eventLocation.trim() || "Kolkata, WB",
        attendees: 1,
        tag: eventTag.trim() || "Event",
        color: "#3b5bdb",
        image: finalImageUrl,
        description:
          eventDescription.trim() ||
          "Join Kolkata's premier creator networking meetup!",
        organizer: eventOrganizer.trim() || "Kreator Kolkata Community",
        entryFee: eventIsPaid ? `₹${eventPrice}` : "Free RSVP",
        isPaid: eventIsPaid,
        price: eventIsPaid ? (Number(eventPrice) || 499) : 0,
        speakers:
          parsedSpeakers.length > 0
            ? parsedSpeakers
            : ["Kreator Kolkata Team"],
        isFeatured: true,
        createdBy: auth.currentUser?.uid || "admin",
        createdAt: new Date().toISOString(),
      }

      await setDoc(doc(db, "events", String(newId)), newEventData)
      setShowCreateEventModal(false)
      resetEventForm()
    } catch (err: any) {
      alert(err.message || "Failed to create event")
    } finally {
      setCreatingEvent(false)
    }
  }

  const pendingAdmins = adminsList.filter((a) => a.isAdmin === false)

  const filteredGigs = gigs.filter(
    (g) =>
      g.title.toLowerCase().includes(gigSearch.toLowerCase()) ||
      (g.brand || g.creatorName || "")
        .toLowerCase()
        .includes(gigSearch.toLowerCase()),
  )

  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(eventSearch.toLowerCase()),
  )

  const allUsers = [
    ...creators.map((c) => ({ user: c, role: "creator" as const })),
    ...brands.map((b) => ({ user: b, role: "brand" as const })),
  ].filter(({ user }) =>
    (user.name || "").toLowerCase().includes(userSearch.toLowerCase()),
  )

  const ConfirmModal = () =>
    confirmDelete ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-slate-100 shadow-xl flex flex-col gap-4">
          <div className="text-center">
            <div className="text-3xl mb-3">🗑️</div>
            <div className="text-base font-bold text-slate-800 mb-1">
              Confirm Delete
            </div>
            <div className="text-xs text-slate-500">
              Are you sure you want to delete this {confirmDelete.type}? This action cannot be undone.
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmDelete(null)}
              className="flex-1 py-3 rounded-2xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteItem}
              className="flex-1 py-3 rounded-2xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition cursor-pointer shadow-md shadow-rose-200"
            >
              Yes, Delete
            </button>
          </div>
        </div>
      </div>
    ) : null

  if (selectedAdminGig) {
    const gig = selectedAdminGig
    return (
      <div className="flex-1 bg-[#f8fafc] min-h-screen text-slate-800 flex flex-col">
        <div className="bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <button
            onClick={() => setSelectedAdminGig(null)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
          >
            ← Back to Gigs
          </button>
          <span className="text-xs font-bold text-slate-400">Gig Detail</span>
        </div>
        <div className="p-5 flex flex-col gap-4 pb-24">
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={gig.avatar}
                  alt=""
                  className="w-12 h-12 rounded-2xl object-cover border border-slate-200"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    {gig.creatorName || gig.brand}
                  </div>
                  <div className="text-[10px] text-slate-400">{gig.handle}</div>
                </div>
              </div>
              <button
                onClick={() => handleToggleFeatureGig(gig)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                  (gig as any).isFeatured
                    ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {(gig as any).isFeatured ? "⭐ Featured" : "+ Feature"}
              </button>
            </div>
            <div>
              {editingGigTitle ? (
                <div className="flex gap-2">
                  <input
                    value={editGigTitleVal}
                    onChange={(e) => setEditGigTitleVal(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-bold text-slate-800 outline-none"
                  />
                  <button
                    onClick={() => handleSaveGigTitle(gig)}
                    className="bg-[#3b5bdb] text-white text-xs font-bold px-3 py-1.5 rounded-xl"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 flex-1">
                    {gig.title}
                  </h3>
                  <button
                    onClick={() => {
                      setEditGigTitleVal(gig.title)
                      setEditingGigTitle(true)
                    }}
                    className="text-xs text-[#3b5bdb] font-bold"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {gig.description}
            </p>
          </div>
        </div>
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-[#f8fafc] border-t border-slate-100 px-5 py-4 z-20">
          <button
            onClick={() =>
              setConfirmDelete({
                type: "gig",
                id: String(gig.id),
                col: "gigs",
              })
            }
            className="w-full py-3.5 rounded-2xl text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 cursor-pointer flex items-center justify-center gap-2 transition shadow-sm"
          >
            Delete Gig
          </button>
        </div>
        <ConfirmModal />
      </div>
    )
  }

  if (selectedAdminEvent) {
    const ev = selectedAdminEvent
    return (
      <div className="flex-1 bg-[#f8fafc] min-h-screen text-slate-800 flex flex-col">
        <div className="bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <button
            onClick={() => setSelectedAdminEvent(null)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
          >
            ← Back to Events
          </button>
          <span className="text-xs font-bold text-slate-400">Event Detail</span>
        </div>
        <div className="p-5 flex flex-col gap-4 pb-24">
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col gap-4">
            <img
              src={ev.image}
              alt=""
              className="w-full h-40 object-cover rounded-2xl border border-slate-100"
            />
            <div className="flex items-start justify-between gap-3">
              <div>
                {editingEventTitle ? (
                  <div className="flex gap-2">
                    <input
                      value={editEventTitleVal}
                      onChange={(e) => setEditEventTitleVal(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-bold text-slate-800 outline-none"
                    />
                    <button
                      onClick={() => handleSaveEventTitle(ev)}
                      className="bg-[#3b5bdb] text-white text-xs font-bold px-3 py-1.5 rounded-xl"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {ev.title}
                    </h3>
                    <button
                      onClick={() => {
                        setEditEventTitleVal(ev.title)
                        setEditingEventTitle(true)
                      }}
                      className="text-xs text-[#3b5bdb] font-bold"
                    >
                      Edit
                    </button>
                  </div>
                )}
                <div className="text-xs text-slate-400 mt-1">
                  {ev.date} - {ev.venue}
                </div>
              </div>
              <button
                onClick={() => handleToggleFeatureEvent(ev)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                  (ev as any).isFeatured
                    ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {(ev as any).isFeatured ? "⭐ Featured" : "+ Feature"}
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {ev.description}
            </p>
          </div>
        </div>
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-[#f8fafc] border-t border-slate-100 px-5 py-4 z-20">
          <button
            onClick={() =>
              setConfirmDelete({
                type: "event",
                id: String(ev.id),
                col: "events",
              })
            }
            className="w-full py-3.5 rounded-2xl text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 cursor-pointer flex items-center justify-center gap-2 transition shadow-sm"
          >
            Delete Event
          </button>
        </div>
        <ConfirmModal />
      </div>
    )
  }

  if (selectedAdminUser) {
    const { user, role } = selectedAdminUser
    const isCreator = role === "creator"
    const avatar = isCreator ? user.avatar : user.logo
    return (
      <div className="flex-1 bg-[#f8fafc] min-h-screen text-slate-800 flex flex-col">
        <div className="bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <button
            onClick={() => setSelectedAdminUser(null)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
          >
            ← Back to Users
          </button>
          <span className="text-xs font-bold text-slate-400">
            {isCreator ? "Creator Detail" : "Brand Detail"}
          </span>
        </div>
        <div className="p-5 flex flex-col gap-4 pb-24">
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
            <img
              src={avatar}
              alt=""
              className="w-16 h-16 rounded-2xl object-cover border border-slate-200"
            />
            <div>
              <h3 className="text-base font-bold text-slate-900">{user.name}</h3>
              <div className="text-xs text-slate-500 mt-0.5">
                {isCreator ? user.handle : user.industry}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col gap-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Bio / Details
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">{user.bio}</p>
          </div>
        </div>
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-[#f8fafc] border-t border-slate-100 px-5 py-4 z-20">
          <button
            onClick={() =>
              setConfirmDelete({
                type: "user",
                id: String(user.id),
                col: isCreator ? "creators" : "brands",
              })
            }
            className="w-full py-3.5 rounded-2xl text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 cursor-pointer flex items-center justify-center gap-2 transition shadow-sm"
          >
            Delete Account
          </button>
        </div>
        <ConfirmModal />
      </div>
    )
  }

  return (
    <div className="flex-1 bg-[#f8fafc] min-h-screen text-slate-800 flex flex-col pb-20">
      <AdminHeader
        onLogout={onLogout}
        onSwitchToPlatform={onSwitchToPlatform}
      />
      <div className="p-5 flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: "Total Users",
              value: creators.length + brands.length,
              sub: `${creators.length} Creators, ${brands.length} Brands`,
              border: "border-slate-100 shadow-sm bg-white",
            },
            {
              label: "Live Gigs",
              value: gigs.length,
              sub: `${gigs.filter((g) => (g as any).isFeatured).length} featured`,
              border: "border-slate-100 shadow-sm bg-white",
            },
            {
              label: "Events",
              value: events.length,
              sub: `${events.filter((e) => (e as any).isFeatured).length} featured`,
              border: "border-slate-100 shadow-sm bg-white",
            },
            {
              label: "Pending Admins",
              value: pendingAdmins.length,
              sub: pendingAdmins.length > 0 ? "Needs approval" : "All clear",
              border:
                pendingAdmins.length > 0
                  ? "border-amber-200 bg-amber-50 shadow-sm"
                  : "border-slate-100 shadow-sm bg-white",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className={`rounded-3xl p-4 border flex flex-col justify-between ${stat.border}`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {stat.label}
              </div>
              <div className="text-2xl font-black text-slate-800 my-1">
                {stat.value}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                {stat.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Tab Pills */}
        <div className="flex gap-1.5 bg-slate-100 p-1 rounded-2xl overflow-x-auto scrollbar-hide">
          {(
            [
              { id: "overview", label: "Overview" },
              { id: "gigs", label: "Gigs" },
              { id: "events", label: "Events" },
              { id: "users", label: "Users" },
              {
                id: "admins",
                label:
                  pendingAdmins.length > 0
                    ? `Admins (${pendingAdmins.length})`
                    : "Admins",
              },
              { id: "notifications", label: "Push Notifications" },
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 py-2.5 px-2 rounded-xl text-[11px] font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === id
                  ? "bg-[#3b5bdb] text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="flex flex-col gap-4">
            {pendingAdmins.length > 0 && (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center justify-between gap-2 shadow-sm">
                <span className="text-xs font-bold text-amber-700">
                  {pendingAdmins.length} pending admin approval
                </span>
                <button
                  onClick={() => setActiveTab("admins")}
                  className="text-[10px] font-black uppercase text-amber-700 underline tracking-wider"
                >
                  View
                </button>
              </div>
            )}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 flex flex-col gap-3 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Recent Gigs
                </h3>
                <button
                  onClick={() => setActiveTab("gigs")}
                  className="text-[10px] font-bold text-[#3b5bdb]"
                >
                  See all
                </button>
              </div>
              {gigs.slice(0, 4).map((gig) => (
                <div
                  key={gig.id}
                  className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex items-center gap-3 cursor-pointer hover:border-slate-300 transition"
                  onClick={() => setSelectedAdminGig(gig)}
                >
                  <img
                    src={gig.avatar}
                    alt=""
                    className="w-9 h-9 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-800 truncate">
                      {gig.title}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {formatBudget(gig.budget, gig.type)} - {gig.type}
                    </div>
                  </div>
                  {(gig as any).isFeatured && (
                    <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Featured
                    </span>
                  )}
                  <span className="text-slate-400">{"→"}</span>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-100 flex flex-col gap-3 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Recent Events
                </h3>
                <button
                  onClick={() => setActiveTab("events")}
                  className="text-[10px] font-bold text-[#3b5bdb]"
                >
                  See all
                </button>
              </div>
              {events.slice(0, 4).map((ev) => (
                <div
                  key={ev.id}
                  className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex items-center gap-3 cursor-pointer hover:border-slate-300 transition"
                  onClick={() => setSelectedAdminEvent(ev)}
                >
                  <img
                    src={ev.image}
                    alt=""
                    className="w-9 h-9 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-800 truncate">
                      {ev.title}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {ev.date} - {ev.venue}
                    </div>
                  </div>
                  {(ev as any).isFeatured && (
                    <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Featured
                    </span>
                  )}
                  <span className="text-slate-400">{"→"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "gigs" && (
          <div className="flex flex-col gap-4">
            <div className="flex gap-2 items-center">
              <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 shadow-sm">
                <input
                  value={gigSearch}
                  onChange={(e) => setGigSearch(e.target.value)}
                  placeholder="Search gigs..."
                  className="flex-1 bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400"
                />
              </div>
              <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">
                {filteredGigs.length} total
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {filteredGigs.map((gig) => (
                <div
                  key={gig.id}
                  className="bg-white rounded-3xl p-4 border border-slate-100 hover:border-slate-300 shadow-sm transition cursor-pointer"
                  onClick={() => setSelectedAdminGig(gig)}
                >
                  <div className="flex gap-3 items-start">
                    <img
                      src={gig.avatar}
                      alt=""
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-200 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-800 truncate">
                        {gig.title}
                      </h4>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {gig.creatorName || gig.brand}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "events" && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Events ({filteredEvents.length})
              </h3>
              <button
                onClick={() => {
                  resetEventForm()
                  setShowCreateEventModal(true)
                }}
                className="bg-[#3b5bdb] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md cursor-pointer"
              >
                + Create Event
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {filteredEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="bg-white rounded-3xl p-4 border border-slate-100 hover:border-slate-300 shadow-sm transition cursor-pointer flex gap-3 items-center"
                  onClick={() => setSelectedAdminEvent(ev)}
                >
                  <img
                    src={ev.image}
                    alt=""
                    className="w-12 h-12 rounded-2xl object-cover border border-slate-200 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 truncate">
                      {ev.title}
                    </h4>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {ev.date} · {ev.venue}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="flex flex-col gap-4">
            <div className="flex gap-2 items-center">
              <input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users..."
                className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 outline-none"
              />
              <span className="text-[10px] font-bold text-slate-500">
                {allUsers.length} total
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              {allUsers.map(({ user, role }) => {
                const isCreator = role === "creator"
                const avatar = isCreator ? user.avatar : user.logo
                return (
                  <div
                    key={`${role}-${user.id}`}
                    className="bg-white rounded-2xl p-3 border border-slate-100 hover:border-slate-300 shadow-sm transition flex items-center gap-3 cursor-pointer"
                    onClick={() => setSelectedAdminUser({ user, role })}
                  >
                    <img
                      src={avatar}
                      alt={user.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-200 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate">
                        {user.name}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        {isCreator ? user.handle : user.industry}
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        isCreator
                          ? "bg-blue-50 text-blue-600 border border-blue-100"
                          : "bg-rose-50 text-rose-600 border border-rose-100"
                      }`}
                    >
                      {role}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === "admins" && (
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Admin User Management
            </h3>
            <div className="flex flex-col gap-3">
              {adminsList.map((a) => (
                <div
                  key={a.uid}
                  className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-2xl bg-[#3b5bdb]/10 flex items-center justify-center text-[#3b5bdb] font-black flex-shrink-0">
                    {(a.name || "A")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 truncate">
                      {a.name || "Admin User"}
                    </h4>
                    <div className="text-xs text-slate-500 truncate">
                      {a.email}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`text-[9px] font-black px-2.5 py-0.5 rounded-full ${
                        a.isAdmin
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : "bg-amber-50 text-amber-600 border border-amber-100"
                      }`}
                    >
                      {a.isAdmin ? "ACTIVE" : "PENDING"}
                    </span>
                    {!a.isAdmin && (
                      <button
                        onClick={() => handleApproveAdmin(a.uid)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer transition shadow-sm"
                      >
                        Approve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="flex flex-col gap-6">
            {notifSuccessToast && (
              <div className="bg-emerald-600 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl flex items-center justify-between">
                <span>{notifSuccessToast}</span>
                <button
                  onClick={() => setNotifSuccessToast(null)}
                  className="text-white/80 hover:text-white font-bold ml-3"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col gap-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-black text-[#3b5bdb] uppercase tracking-widest mb-1">
                  <span>🔔 FCM Broadcast Manager</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 leading-tight">
                  Create Custom Push Notification
                </h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Notification Title
                    </label>
                    <input
                      type="text"
                      value={notifTitle}
                      onChange={(e) => setNotifTitle(e.target.value)}
                      placeholder='e.g., "View what Priya Sengupta posted 🌟"'
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-800 font-medium outline-none focus:border-[#3b5bdb]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Message / Body Text
                    </label>
                    <textarea
                      rows={3}
                      value={notifMessage}
                      onChange={(e) => setNotifMessage(e.target.value)}
                      placeholder="e.g., Check out the new Ethnic Fashion reel collab in Kolkata."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-800 font-medium outline-none focus:border-[#3b5bdb]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Redirect Page / Link
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {[
                        { label: "✨ Explore", value: "/explore" },
                        { label: "💼 Browse Gigs", value: "/gigs" },
                        { label: "🎉 Events", value: "/events" },
                        { label: "👤 Profile", value: "/profile" },
                        { label: "💬 Messages", value: "/messages" },
                      ].map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => setNotifLink(preset.value)}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition cursor-pointer ${
                            notifLink === preset.value
                              ? "bg-[#3b5bdb] text-white shadow-sm"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={notifLink}
                      onChange={(e) => setNotifLink(e.target.value)}
                      placeholder="Custom link (e.g., /gigs)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 font-medium outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Target Audience
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "all", label: "🌐 All Users (Broadcast)" },
                        { id: "creators", label: "🎨 Creators Only" },
                        { id: "brands", label: "🏢 Brands Only" },
                        { id: "selected", label: "👤 Selected Individuals" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTargetType(t.id as any)}
                          className={`p-3 rounded-2xl border text-left text-xs font-bold transition cursor-pointer ${
                            targetType === t.id
                              ? "border-[#3b5bdb] bg-[#3b5bdb]/5 text-[#3b5bdb]"
                              : "border-slate-200 bg-white text-slate-600"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {targetType === "selected" && (
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">
                          Select Recipients ({selectedUserUids.length} selected)
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedUserUids(
                                allUsers.map((u) => u.user.uid || String(u.user.id)),
                              )
                            }
                            className="text-[10px] font-bold text-[#3b5bdb] hover:underline"
                          >
                            Select All
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => setSelectedUserUids([])}
                            className="text-[10px] font-bold text-slate-500 hover:underline"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={targetUserSearch}
                        onChange={(e) => setTargetUserSearch(e.target.value)}
                        placeholder="Filter users by name..."
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 outline-none"
                      />
                      <div className="max-h-48 overflow-y-auto flex flex-col gap-1.5 pr-1 scrollbar-hide">
                        {allUsers
                          .filter(({ user }) =>
                            (user.name || "")
                              .toLowerCase()
                              .includes(targetUserSearch.toLowerCase()),
                          )
                          .map(({ user, role }) => {
                            const uid = user.uid || String(user.id)
                            const isSelected = selectedUserUids.includes(uid)
                            const avatar = role === "creator" ? user.avatar : user.logo
                            return (
                              <div
                                key={`${role}-${uid}`}
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedUserUids((prev) =>
                                      prev.filter((id) => id !== uid),
                                    )
                                  } else {
                                    setSelectedUserUids((prev) => [...prev, uid])
                                  }
                                }}
                                className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                                  isSelected
                                    ? "bg-blue-50/80 border-blue-200"
                                    : "bg-white border-slate-100 hover:bg-slate-100/50"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {}}
                                    className="rounded border-slate-300 text-[#3b5bdb]"
                                  />
                                  <img
                                    src={avatar}
                                    alt={user.name}
                                    className="w-7 h-7 rounded-full object-cover border border-slate-200 flex-shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold text-slate-800 truncate">
                                      {user.name}
                                    </div>
                                    <div className="text-[10px] text-slate-400 truncate">
                                      {role === "creator"
                                        ? user.handle
                                        : user.industry}
                                    </div>
                                  </div>
                                </div>
                                <span
                                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                    role === "creator"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-rose-100 text-rose-700"
                                  }`}
                                >
                                  {role}
                                </span>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={sendingNotif}
                    onClick={async () => {
                      if (!notifTitle.trim() || !notifMessage.trim()) {
                        alert("Please provide both title and message text.")
                        return
                      }
                      setSendingNotif(true)
                      try {
                        let recipientList: string[] = []
                        if (targetType === "all") {
                          recipientList = ["all"]
                        } else if (targetType === "creators") {
                          recipientList = creators
                            .map((c) => c.uid || String(c.id))
                            .filter(Boolean)
                        } else if (targetType === "brands") {
                          recipientList = brands
                            .map((b) => b.uid || String(b.id))
                            .filter(Boolean)
                        } else if (targetType === "selected") {
                          recipientList = selectedUserUids
                        }

                        if (recipientList.length === 0) {
                          alert("No recipient users found for selected audience!")
                          setSendingNotif(false)
                          return
                        }

                        const promises = recipientList.map((uid) =>
                          addDoc(collection(db, "notifications"), {
                            recipientUid: uid,
                            title: notifTitle.trim(),
                            message: notifMessage.trim(),
                            link: notifLink.trim(),
                            actionText: "View Now",
                            type: "custom",
                            category: "announcement",
                            createdAt: new Date().toISOString(),
                            senderName: "Kreator Kolkata Admin",
                            senderAvatar:
                              "https://images.unsplash.com/photo-1624610261655-777af2f586d7?w=80&h=80&fit=crop&auto=format",
                            read: false,
                          }),
                        )

                        await Promise.all(promises)

                        const recipientDesc =
                          targetType === "all"
                            ? "all registered users"
                            : targetType === "creators"
                              ? "all creators"
                              : targetType === "brands"
                                ? "all brands"
                                : `${recipientList.length} selected user(s)`

                        setNotifSuccessToast(
                          `🚀 Real-time Push Notification sent to ${recipientDesc}!`,
                        )
                        setTimeout(() => setNotifSuccessToast(null), 5000)

                        setNotifTitle("View what Priya Sengupta posted 🌟")
                        setNotifMessage(
                          "Check out the new Ethnic Fashion reel collab in Kolkata.",
                        )
                        setNotifLink("/explore")
                      } catch (err: any) {
                        console.error("Push error:", err)
                        alert("Error sending notification: " + err.message)
                      } finally {
                        setSendingNotif(false)
                      }
                    }}
                    className={`w-full py-4 rounded-2xl font-black text-xs text-white shadow-lg transition cursor-pointer flex items-center justify-center gap-2 ${
                      sendingNotif
                        ? "bg-slate-400 cursor-not-allowed shadow-none"
                        : "bg-[#3b5bdb] hover:bg-blue-700 shadow-blue-200 active:scale-98"
                    }`}
                  >
                    {sendingNotif ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>Sending Push Notification...</span>
                      </>
                    ) : (
                      <>
                        <span>🚀 Send Push Notification</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex flex-col gap-4 bg-slate-50 rounded-3xl p-5 border border-slate-200">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">
                    📱 Live Devices Preview
                  </h4>
                  <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-xl border border-slate-800">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        System Push Notification
                      </span>
                      <span>Now</span>
                    </div>
                    <div className="flex gap-3 items-start">
                      <img
                        src="https://images.unsplash.com/photo-1624610261655-777af2f586d7?w=80&h=80&fit=crop&auto=format"
                        alt="Logo"
                        className="w-10 h-10 rounded-xl object-cover border border-slate-700 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white truncate leading-tight">
                          {notifTitle || "Notification Title"}
                        </div>
                        <div className="text-[11px] text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                          {notifMessage || "Notification message content..."}
                        </div>
                        <div className="text-[10px] font-bold text-[#3b5bdb] mt-2 flex items-center gap-1">
                          <span>Target Action: {notifLink || "/"}</span>
                          <span>→</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showCreateEventModal && (
        <div className="fixed inset-0 z-50 bg-[#f8fafc] flex flex-col min-h-screen text-slate-800">
          <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 py-4 flex items-center justify-between shadow-sm">
            <button
              onClick={() => setShowCreateEventModal(false)}
              className="text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              ✕ Close
            </button>
            <span className="text-xs font-bold text-slate-800">Create Event</span>
            <div className="w-6" />
          </div>
          <form
            onSubmit={handleCreateEventSubmit}
            className="p-5 flex flex-col gap-4 max-w-md mx-auto w-full pb-20 overflow-y-auto"
          >
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Event Title *
              </label>
              <input
                required
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="e.g. Kreator Meetup #4"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Subtitle
              </label>
              <input
                value={eventSubtitle}
                onChange={(e) => setEventSubtitle(e.target.value)}
                placeholder="e.g. Network. Collaborate. Create."
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Date *
                </label>
                <input
                  required
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Time
                </label>
                <input
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  placeholder="5:30 PM"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Venue *
              </label>
              <input
                required
                value={eventVenue}
                onChange={(e) => setEventVenue(e.target.value)}
                placeholder="Max Mueller Bhavan"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Registration Type
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEventIsPaid(false)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    !eventIsPaid
                      ? "bg-[#3b5bdb] text-white border-[#3b5bdb] shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Free
                </button>
                <button
                  type="button"
                  onClick={() => setEventIsPaid(true)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    eventIsPaid
                      ? "bg-[#3b5bdb] text-white border-[#3b5bdb] shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Paid
                </button>
              </div>
            </div>
            {eventIsPaid && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Registration Amount (₹ INR) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2 text-xs font-bold text-slate-500">
                    ₹
                  </span>
                  <input
                    required
                    type="number"
                    min="1"
                    value={eventPrice}
                    onChange={(e) => setEventPrice(e.target.value)}
                    placeholder="499"
                    className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-800 outline-none font-bold"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Banner Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-xs text-slate-600"
              />
            </div>

            {originalImage && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-700">
                  Crop Banner Image
                </span>
                <div
                  className="event-crop-container relative w-full h-48 bg-slate-900 rounded-2xl overflow-hidden cursor-move border border-slate-300"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <img
                    src={originalImage}
                    alt=""
                    draggable={false}
                    className="absolute max-w-none select-none"
                    style={{
                      transform: `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px)) scale(${zoom})`,
                      top: "50%",
                      left: "50%",
                    }}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 font-bold">Zoom:</span>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="flex-1"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="Event description..."
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={creatingEvent}
              className="w-full py-3.5 rounded-2xl bg-[#3b5bdb] text-white font-bold text-xs shadow-md mt-2"
            >
              {creatingEvent ? "Creating Event..." : "Publish Event"}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export default AdminDashboardPage
