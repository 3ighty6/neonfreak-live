import { useState, useEffect } from 'react'
import { Users, TrendingUp, Shield, AlertCircle, Check, X, BadgeCheck, Tag, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../supabaseClient'

interface UserRow {
  id: string
  username: string
  email: string
  is_admin: boolean
  is_verified: boolean
  token_balance: number
  created_at: string
}

interface ReportRow {
  id: string
  reason: string
  details: string | null
  status: string
  created_at: string
  reporter: { username: string } | null
  reported: { username: string } | null
}

interface CategoryRow {
  id: string
  name: string
  description: string | null
  icon: string | null
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<'overview' | 'users' | 'reports' | 'categories' | 'identity'>('overview')
  const [stats, setStats] = useState({ totalUsers: 0, activeStreams: 0, totalRevenue: 0, pendingReports: 0 })
  const [users, setUsers] = useState<UserRow[]>([])
  const [reports, setReports] = useState<ReportRow[]>([])
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [verifications, setVerifications] = useState<any[]>([])
  const [verificationUrls, setVerificationUrls] = useState<Record<string, { id: string; selfie: string }>>({})
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryIcon, setNewCategoryIcon] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchStats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/admin/stats', {
        headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
      })
      const data = await response.json()
      if (response.ok) setStats(data)
      else setError(data.error || 'Failed to load stats')
    } catch {
      setError('Failed to load stats')
    }
  }

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('users')
      .select('id, username, email, is_admin, is_verified, token_balance, created_at')
      .order('created_at', { ascending: false })
    setUsers(data || [])
  }

  const fetchReports = async () => {
    const { data } = await supabase
      .from('reports')
      .select('id, reason, details, status, created_at, reporter:reporter_id(username), reported:reported_user_id(username)')
      .order('created_at', { ascending: false })
    setReports((data as any) || [])
  }

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('id, name, description, icon').order('name')
    setCategories(data || [])
  }

  const fetchVerifications = async () => {
    const { data } = await supabase
      .from('id_verification_submissions')
      .select('id, user_id, id_document_path, selfie_path, status, created_at, users:user_id(username, email)')
      .eq('status', 'pending')
      .order('created_at')
    setVerifications(data || [])

    const urls: Record<string, { id: string; selfie: string }> = {}
    for (const v of data || []) {
      const [idSigned, selfieSigned] = await Promise.all([
        supabase.storage.from('id-verification').createSignedUrl(v.id_document_path, 600),
        supabase.storage.from('id-verification').createSignedUrl(v.selfie_path, 600),
      ])
      urls[v.id] = { id: idSigned.data?.signedUrl || '', selfie: selfieSigned.data?.signedUrl || '' }
    }
    setVerificationUrls(urls)
  }

  const reviewVerification = async (submission: any, approve: boolean) => {
    const { data: { session } } = await supabase.auth.getSession()
    await supabase
      .from('id_verification_submissions')
      .update({ status: approve ? 'approved' : 'rejected', reviewed_by: session?.user.id, reviewed_at: new Date().toISOString() })
      .eq('id', submission.id)
    await supabase
      .from('users')
      .update({ id_verification_status: approve ? 'approved' : 'rejected' })
      .eq('id', submission.user_id)
    fetchVerifications()
  }

  useEffect(() => {
    Promise.all([fetchStats(), fetchUsers(), fetchReports(), fetchCategories(), fetchVerifications()]).finally(() => setLoading(false))
  }, [])

  const addCategory = async () => {
    if (!newCategoryName.trim()) return
    await supabase.from('categories').insert({ name: newCategoryName.trim(), icon: newCategoryIcon.trim() || null })
    setNewCategoryName('')
    setNewCategoryIcon('')
    fetchCategories()
  }

  const deleteCategory = async (id: string) => {
    await supabase.from('categories').delete().eq('id', id)
    fetchCategories()
  }

  const toggleVerified = async (u: UserRow) => {
    await supabase.from('users').update({ is_verified: !u.is_verified }).eq('id', u.id)
    fetchUsers()
  }

  const resolveReport = async (id: string, status: 'reviewed' | 'dismissed') => {
    const { data: { session } } = await supabase.auth.getSession()
    await supabase
      .from('reports')
      .update({ status, reviewed_by: session?.user.id, reviewed_at: new Date().toISOString() })
      .eq('id', id)
    fetchReports()
    fetchStats()
  }

  const pendingReports = reports.filter((r) => r.status === 'pending')

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">
          Admin Dashboard
        </h1>
        <p className="text-gray-400 mb-6">Platform overview and management</p>

        <div className="flex gap-2 mb-8">
          {(['overview', 'users', 'reports', 'categories', 'identity'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-full font-semibold capitalize transition ${
                tab === t ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {t}
              {t === 'reports' && pendingReports.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {pendingReports.length}
                </span>
              )}
              {t === 'identity' && verifications.length > 0 && (
                <span className="ml-2 bg-yellow-500 text-black text-xs px-1.5 py-0.5 rounded-full">
                  {verifications.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center text-gray-400">Loading...</div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded p-4 text-red-300">{error}</div>
        ) : tab === 'overview' ? (
          <div className="grid md:grid-cols-4 gap-4">
            <StatCard icon={<Users className="text-cyan-400" size={24} />} label="Total Users" value={stats.totalUsers} />
            <StatCard icon={<TrendingUp className="text-green-400" size={24} />} label="Active Streams" value={stats.activeStreams} />
            <StatCard icon={<TrendingUp className="text-yellow-400" size={24} />} label="Total Revenue" value={`$${stats.totalRevenue}`} />
            <StatCard icon={<AlertCircle className="text-red-400" size={24} />} label="Pending Reports" value={pendingReports.length} />
          </div>
        ) : tab === 'users' ? (
          <div className="bg-gray-900 border border-cyan-500/20 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-950 text-gray-400 text-left">
                <tr>
                  <th className="p-3">Username</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Tokens</th>
                  <th className="p-3">Joined</th>
                  <th className="p-3">Verified</th>
                  <th className="p-3">Admin</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-gray-800">
                    <td className="p-3 font-semibold">{u.username}</td>
                    <td className="p-3 text-gray-400">{u.email}</td>
                    <td className="p-3">{u.token_balance}</td>
                    <td className="p-3 text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="p-3">
                      <button
                        onClick={() => toggleVerified(u)}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition ${
                          u.is_verified ? 'bg-cyan-500/20 text-cyan-400' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        <BadgeCheck size={14} /> {u.is_verified ? 'Verified' : 'Verify'}
                      </button>
                    </td>
                    <td className="p-3">{u.is_admin && <Shield size={16} className="text-yellow-400" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : tab === 'reports' ? (
          <div className="space-y-3">
            {reports.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No reports yet.</div>
            ) : (
              reports.map((r) => (
                <div key={r.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-semibold text-red-400">{r.reason}</span>
                      <span className="text-gray-500 text-sm ml-2">
                        {r.reporter?.username || 'unknown'} reported {r.reported?.username || 'unknown'}
                      </span>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        r.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : r.status === 'reviewed'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-700 text-gray-400'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                  {r.details && <p className="text-sm text-gray-400 mb-3">{r.details}</p>}
                  <div className="text-xs text-gray-600 mb-3">{new Date(r.created_at).toLocaleString()}</div>
                  {r.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => resolveReport(r.id, 'reviewed')}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm font-semibold flex items-center gap-1 transition"
                      >
                        <Check size={14} /> Mark Reviewed
                      </button>
                      <button
                        onClick={() => resolveReport(r.id, 'dismissed')}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded text-sm font-semibold flex items-center gap-1 transition"
                      >
                        <X size={14} /> Dismiss
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : tab === 'categories' ? (
          <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="text-cyan-400" size={20} />
              <h2 className="text-lg font-bold">Stream Categories</h2>
            </div>

            <div className="flex gap-2 mb-6">
              <input
                value={newCategoryIcon}
                onChange={(e) => setNewCategoryIcon(e.target.value)}
                placeholder="🎮"
                maxLength={4}
                className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-2 text-center"
              />
              <input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                placeholder="New category name"
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2"
              />
              <button
                onClick={addCategory}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded font-semibold flex items-center gap-1 transition"
              >
                <Plus size={16} /> Add
              </button>
            </div>

            <div className="space-y-2">
              {categories.map((c) => (
                <div key={c.id} className="flex items-center justify-between bg-gray-800 rounded px-4 py-2.5">
                  <span>
                    {c.icon} {c.name}
                  </span>
                  <button onClick={() => deleteCategory(c.id)} className="text-gray-500 hover:text-red-400 transition">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {verifications.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No pending verifications.</div>
            ) : (
              verifications.map((v) => (
                <div key={v.id} className="bg-gray-900 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="font-semibold">{v.users?.username || 'Unknown'}</span>
                      <span className="text-gray-500 text-sm ml-2">{v.users?.email}</span>
                    </div>
                    <span className="text-xs text-gray-600">{new Date(v.created_at).toLocaleString()}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">ID Document</div>
                      {verificationUrls[v.id]?.id ? (
                        <img src={verificationUrls[v.id].id} alt="ID document" className="w-full rounded border border-gray-800" />
                      ) : (
                        <div className="text-xs text-gray-600">Loading...</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Selfie</div>
                      {verificationUrls[v.id]?.selfie ? (
                        <img src={verificationUrls[v.id].selfie} alt="Selfie" className="w-full rounded border border-gray-800" />
                      ) : (
                        <div className="text-xs text-gray-600">Loading...</div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => reviewVerification(v, true)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-semibold flex items-center justify-center gap-1 transition"
                    >
                      <Check size={14} /> Approve
                    </button>
                    <button
                      onClick={() => reviewVerification(v, false)}
                      className="flex-1 bg-red-700 hover:bg-red-800 text-white px-3 py-2 rounded text-sm font-semibold flex items-center justify-center gap-1 transition"
                    >
                      <X size={14} /> Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-400 text-sm font-semibold">{label}</h3>
        {icon}
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
    </div>
  )
}
