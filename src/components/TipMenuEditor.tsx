import { useState, useEffect } from 'react'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { supabase } from '../supabaseClient'

interface TipMenuItem {
  id: string
  label: string
  emoji: string
  amount_tokens: number
  sort_order: number
}

export default function TipMenuEditor({ userId }: { userId: string }) {
  const [items, setItems] = useState<TipMenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newLabel, setNewLabel] = useState('')
  const [newEmoji, setNewEmoji] = useState('💜')
  const [newAmount, setNewAmount] = useState(10)

  const load = async () => {
    const { data } = await supabase
      .from('tip_menu_items')
      .select('id, label, emoji, amount_tokens, sort_order')
      .eq('user_id', userId)
      .order('sort_order')
    setItems(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [userId])

  const seedDefaults = async () => {
    const defaults = [
      { label: 'Say Hi', emoji: '💬', amount_tokens: 1, sort_order: 0 },
      { label: 'Wave', emoji: '👋', amount_tokens: 5, sort_order: 1 },
      { label: 'Gift', emoji: '🎁', amount_tokens: 10, sort_order: 2 },
      { label: 'Love', emoji: '❤️', amount_tokens: 25, sort_order: 3 },
      { label: 'Fire', emoji: '🔥', amount_tokens: 50, sort_order: 4 },
    ]
    await supabase.from('tip_menu_items').insert(defaults.map((d) => ({ ...d, user_id: userId })))
    load()
  }

  const addItem = async () => {
    if (!newLabel.trim() || newAmount <= 0) return
    await supabase.from('tip_menu_items').insert({
      user_id: userId,
      label: newLabel.trim(),
      emoji: newEmoji || '💜',
      amount_tokens: newAmount,
      sort_order: items.length,
    })
    setNewLabel('')
    setNewAmount(10)
    load()
  }

  const removeItem = async (id: string) => {
    await supabase.from('tip_menu_items').delete().eq('id', id)
    load()
  }

  if (loading) return <div className="text-gray-400 text-sm">Loading...</div>

  return (
    <div>
      {items.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-gray-400 text-sm mb-4">No tip menu yet. Start with the standard set, then customize it.</p>
          <button
            onClick={seedDefaults}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded font-semibold text-sm transition"
          >
            Add Standard Tip Menu
          </button>
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 bg-gray-800 rounded px-3 py-2">
              <GripVertical size={16} className="text-gray-600" />
              <span className="text-lg">{item.emoji}</span>
              <span className="flex-1 text-sm">{item.label}</span>
              <span className="text-cyan-400 font-semibold text-sm">{item.amount_tokens} tokens</span>
              <button onClick={() => removeItem(item.id)} className="text-gray-500 hover:text-red-400 transition">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={newEmoji}
          onChange={(e) => setNewEmoji(e.target.value)}
          maxLength={4}
          className="w-14 bg-gray-800 border border-gray-700 rounded px-2 py-2 text-center"
        />
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Label (e.g. Flash)"
          className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
        />
        <input
          type="number"
          min={1}
          value={newAmount}
          onChange={(e) => setNewAmount(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-20 bg-gray-800 border border-gray-700 rounded px-2 py-2 text-sm"
        />
        <button
          onClick={addItem}
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-2 rounded font-semibold text-sm flex items-center gap-1 transition"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  )
}
