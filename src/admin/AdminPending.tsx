import { auth } from "../firebase"

interface AdminPendingProps {
  userProfile: any
  onLogout: () => void
}

export function AdminPendingPage({ userProfile, onLogout }: AdminPendingProps) {
  return (
    <div className="flex-1 bg-[#f8fafc] min-h-screen text-slate-800 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center text-3xl mb-6 shadow-md animate-pulse">
        ⏳
      </div>
      <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 mb-3 shadow-sm">
        ADMIN APPROVAL REQUIRED
      </span>
      <h2 className="text-xl font-black text-slate-800 mb-2">
        Account Pending Approval
      </h2>
      <p className="text-xs text-slate-500 max-w-xs leading-relaxed mb-6">
        Your admin account for{" "}
        <strong className="text-slate-800">
          {userProfile?.email || "admin"}
        </strong>{" "}
        has been registered in Firestore.
      </p>

      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm w-full max-w-sm text-left mb-6 flex flex-col gap-2.5">
        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
          Firestore Activation Info
        </div>
        <div className="text-xs text-slate-600">
          <strong className="text-slate-700">Collection:</strong>{" "}
          <code className="bg-slate-50 px-1.5 py-0.5 rounded text-blue-655 border border-slate-100 font-mono">
            admins
          </code>
        </div>
        <div className="text-xs text-slate-600">
          <strong className="text-slate-700">Document ID:</strong>{" "}
          <code className="bg-slate-50 px-1.5 py-0.5 rounded text-emerald-650 border border-slate-100 font-mono select-all">
            {userProfile?.uid || auth.currentUser?.uid}
          </code>
        </div>
        <div className="text-xs text-slate-600">
          <strong className="text-slate-700">Required Action:</strong> Set field{" "}
          <code className="bg-slate-50 px-1.5 py-0.5 rounded text-amber-700 border border-amber-100 font-mono">
            isAdmin = true
          </code>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-blue-655 font-medium mb-8 bg-blue-50 px-4 py-2.5 rounded-full border border-blue-100 shadow-sm">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
        Listening for real-time Firestore database updates…
      </div>

      <button
        onClick={onLogout}
        className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold transition cursor-pointer border border-slate-200 shadow-sm"
      >
        Sign Out 🚪
      </button>
    </div>
  )
}

export default AdminPendingPage
