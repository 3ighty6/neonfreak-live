import React from 'react'
import { Link } from 'react-router-dom'

const streamers = [
  { id: 1, name: "Luna", viewers: 4280, tags: ["Twerk", "Goth"], img: "https://picsum.photos/id/1011/400/300" },
  { id: 2, name: "Aaliyah", viewers: 3120, tags: ["VIP", "Private"], img: "https://picsum.photos/id/1005/400/300" },
  { id: 3, name: "Raven", viewers: 1890, tags: ["Pregnant", "Fetish"], img: "https://picsum.photos/id/1009/400/300" },
  { id: 4, name: "Karma", viewers: 5670, tags: ["Battle", "Live"], img: "https://picsum.photos/id/1012/400/300" },
]

export default function Home({ credits, setCredits, user }) {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-5xl font-bold tracking-[4px]">LIVE RIGHT NOW</h1>
          <p className="text-pink-400">32,784 STREAMERS ONLINE • 18+ ONLY</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-mono text-pink-400">{credits} CREDITS</div>
          <button onClick={() => setCredits(c => c + 500)} className="text-xs underline">BUY MORE</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {streamers.map(s => (
          <Link to={`/stream/${s.id}`} key={s.id} className="group block bg-zinc-950 border border-pink-500/20 rounded-2xl overflow-hidden hover:border-pink-500/60 transition">
            <div className="relative">
              <img src={s.img} className="w-full h-72 object-cover" />
              <div className="absolute top-3 right-3 bg-black/70 px-3 py-0.5 rounded text-xs flex items-center gap-1">
                🔴 LIVE • {s.viewers.toLocaleString()}
              </div>
            </div>
            <div className="p-4">
              <div className="flex justify-between">
                <div>
                  <div className="font-bold text-xl">{s.name}</div>
                  <div className="text-pink-400 text-sm">{s.tags.join(" • ")}</div>
                </div>
                <button className="text-xs px-3 py-1 bg-pink-600 hover:bg-pink-700 rounded self-start">WATCH</button>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12 text-center text-xs text-zinc-500">
        Battles • Private 1:1 • Gifts • Twerk Shows • Custom Requests
      </div>
    </div>
  )
}
