// Landing page seed - webdev landing-page skill.
// Replace placeholder copy with values from the design brief before rendering.
// Section order and structure can stay; words and feature mapping are the work.

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header />
      <Hero />
      <Features />
      <SocialProof />
      <Pricing />
      <FinalCta />
      <Footer />
    </main>
  );
}

function Header() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <span className="text-base font-semibold tracking-tight">Product</span>
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#pricing" className="hover:text-foreground">Pricing</a>
          <a href="#faq" className="hover:text-foreground">FAQ</a>
        </nav>
        <div className="flex items-center gap-3">
          <a href="#signin" className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline">Sign in</a>
          <a
            href="#start"
            className="rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            Start free
          </a>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="max-w-3xl">
          <p className="mb-5 inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            Replace with brief tagline
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl lg:text-6xl">
            One clear headline that says what this is.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Subhead in plain language. Who it is for, what it does, why it is different. Two
            sentences at most.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#start"
              className="rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Start free
            </a>
            <a
              href="#demo"
              className="rounded-md border border-border bg-card px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              See a demo
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  // Replace these three with concrete goals from the brief.
  // Add a fourth only if the brief warrants it; do not pad.
  const features = [
    {
      title: "Feature one",
      body: "Concrete outcome the user gets, in one sentence. Anchor it to the brief.",
    },
    {
      title: "Feature two",
      body: "What the product removes, automates, or makes possible. Not what it has.",
    },
    {
      title: "Feature three",
      body: "Proof that the product respects the user's time, money, or attention.",
    },
  ];

  return (
    <section id="features" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            What changes when you use it.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Three things, each tied to a real goal in the brief.
          </p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-lg border border-border bg-card p-6">
              <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-primary">
                {/* Replace with a meaningful icon. Lucide is available in the template. */}
                <span className="text-sm font-semibold">.</span>
              </div>
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SocialProof() {
  // Pick ONE: a real customer quote, a real logo strip, or omit this section.
  // Do not invent customer names, logos, or numerical claims.
  return (
    <section className="border-b border-border bg-secondary/40">
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <blockquote className="text-2xl font-medium leading-snug tracking-tight md:text-3xl">
          "A real quote from a real user, kept short and specific. Cut placeholder
          superlatives - they signal generated copy."
        </blockquote>
        <p className="mt-6 text-sm text-muted-foreground">
          Real name, real role, real company. Omit this section if you do not have one.
        </p>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Pricing built around what you actually use.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Two tiers if you can name them honestly. Three only if the difference is real.
          </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="text-lg font-semibold">Starter</h3>
            <p className="mt-1 text-sm text-muted-foreground">For one person trying it out.</p>
            <p className="mt-6 text-3xl font-semibold tracking-tight">
              Free
              <span className="text-base font-normal text-muted-foreground"> forever</span>
            </p>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li>One real, useful capability</li>
              <li>Another real one</li>
              <li>A third</li>
            </ul>
            <a
              href="#start"
              className="mt-8 inline-flex w-full items-center justify-center rounded-md border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              Start free
            </a>
          </div>
          <div className="rounded-lg border-2 border-primary bg-card p-6">
            <h3 className="text-lg font-semibold">
              Team
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                Most teams
              </span>
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              For groups that need shared state.
            </p>
            <p className="mt-6 text-3xl font-semibold tracking-tight">
              $X
              <span className="text-base font-normal text-muted-foreground"> per seat / mo</span>
            </p>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li>Everything in Starter</li>
              <li>The unlock that makes a team tier honest</li>
              <li>The other one</li>
            </ul>
            <a
              href="#start"
              className="mt-8 inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Start a team trial
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section id="start" className="border-b border-border">
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Concrete next step, in plain words.
        </h2>
        <p className="mt-3 text-muted-foreground">
          Reuse a clear verb from the hero. Do not invent urgency.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#start"
            className="rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Start free
          </a>
          <a
            href="#demo"
            className="rounded-md border border-border bg-card px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Talk to us
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer>
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-6 py-10 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>(c) {new Date().getFullYear()} Product. Replace with real entity.</p>
        <nav className="flex items-center gap-6">
          <a href="#privacy" className="hover:text-foreground">Privacy</a>
          <a href="#terms" className="hover:text-foreground">Terms</a>
          <a href="#contact" className="hover:text-foreground">Contact</a>
        </nav>
      </div>
    </footer>
  );
}
