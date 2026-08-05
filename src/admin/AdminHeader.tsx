interface AdminHeaderProps {
  onLogout: () => void
}

export function AdminHeader({ onLogout }: AdminHeaderProps) {
  return (
    <div className="bg-white border-b border-slate-100 px-6 py-5 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3b5bdb] to-[#5c7cfa] flex items-center justify-center text-base shadow-lg shadow-blue-500/20">
          ⚡
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-slate-800 leading-none">
              Admin Panel
            </h2>
            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
              CONTROL CENTER
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">
            Kreator Kolkata Management
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onLogout}
          className="text-xs font-bold bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 px-3.5 py-2 rounded-xl transition cursor-pointer shadow-sm hover:border-slate-300"
        >
          Sign Out 🚪
        </button>
      </div>
    </div>
  )
}

export default AdminHeader
