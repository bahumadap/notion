import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-200 mb-4">404</h1>
        <p className="text-gray-500 mb-6">Page not found</p>
        <Link
          href="/"
          className="text-indigo-600 hover:text-indigo-700 font-medium"
        >
          ← Go home
        </Link>
      </div>
    </div>
  )
}
