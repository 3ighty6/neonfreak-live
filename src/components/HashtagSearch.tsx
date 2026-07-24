import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function HashtagSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setShowResults(false)
      return
    }

    const searchHashtags = async () => {
      setLoading(true)
      try {
        const hashtag = query.startsWith('#') ? query : `#${query}`
        const response = await fetch(`/api/search-hashtags?tag=${encodeURIComponent(hashtag)}`)
        
        if (response.ok) {
          const data = await response.json()
          setResults(data.results || [])
          setShowResults(true)
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(searchHashtags, 300) // Debounce
    return () => clearTimeout(timer)
  }, [query])

  const handleTagClick = (tag: string) => {
    navigate(`/search?tag=${encodeURIComponent(tag)}`)
    setQuery('')
    setShowResults(false)
  }

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search #hashtags..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-10 py-2 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setShowResults(false)
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-400">Searching...</div>
          ) : results.length > 0 ? (
            <div className="divide-y divide-gray-700">
              {results.map((result, idx) => (
                <button
                  key={idx}
                  onClick={() => handleTagClick(result.tag)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-800 transition flex items-center justify-between group"
                >
                  <div>
                    <div className="text-cyan-400 font-semibold">{result.tag}</div>
                    <div className="text-xs text-gray-400">{result.count} streams</div>
                  </div>
                  <div className="text-gray-500 group-hover:text-gray-300 transition">→</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-400">
              No hashtags found for &quot;{query}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  )
}
