import React from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center px-4">
          <div className="mr-8">
            <h1 className="text-xl font-bold">CRAM</h1>
          </div>
          <nav className="flex items-center space-x-4 lg:space-x-6">
            {/* Navigation items will be added here */}
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
} 