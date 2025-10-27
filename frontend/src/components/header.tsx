import Link from 'next/link'

export function Header() {
  return (
    <header className="bg-gradient-to-r from-[#112444] to-[#1a365d] text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Link href="/" className="inline-block">
          <h1 className="text-2xl font-bold hover:text-blue-200 transition-colors">
            EIU TestLab
          </h1>
        </Link>
      </div>
    </header>
  )
}
