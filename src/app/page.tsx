import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle } from 'lucide-react'

const features = [
  'Streamlined ticket management',
  'Real-time updates and notifications',
  'Team collaboration tools',
  'Knowledge base integration',
  'Priority-based routing',
  'Analytics and reporting'
]

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="container z-40 bg-background">
        <div className="flex h-20 items-center justify-between py-6">
          <div className="flex gap-6 md:gap-10">
            <Link href="/" className="flex items-center space-x-2">
              <span className="inline-block font-bold">Cram Support</span>
            </Link>
          </div>
          <div className="flex gap-4">
            <Link href="/signin">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link href="/signup">
              <Button>Create account</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
          <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
            <h1 className="font-bold text-3xl sm:text-5xl md:text-6xl lg:text-7xl">
              Customer Support{' '}
              <span className="text-primary">Made Simple</span>
            </h1>
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
              Streamline your customer support with our powerful ticketing system. 
              Manage requests, collaborate with your team, and deliver exceptional service.
            </p>
            <div className="space-x-4">
              <Link href="/signup">
                <Button size="lg" className="gap-2">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
        <section className="container space-y-6 bg-slate-50 py-8 dark:bg-transparent md:py-12 lg:py-24">
          <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature}
                className="relative overflow-hidden rounded-lg border bg-background p-2"
              >
                <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                  <CheckCircle className="h-12 w-12 text-primary" />
                  <div className="space-y-2">
                    <h3 className="font-bold">{feature}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
