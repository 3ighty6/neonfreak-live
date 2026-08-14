export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-gray-800 bg-black/50 px-4 py-6 text-sm text-gray-500">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>© {year} NeonLights. 18+ only.</div>
        <div className="flex gap-6">
          <a href="/terms" className="hover:text-gray-300 transition">
            Terms of Service
          </a>
          <a href="/privacy" className="hover:text-gray-300 transition">
            Privacy Policy
          </a>
        </div>
      </div>
    </footer>
  )
}
