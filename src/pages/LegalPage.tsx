import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const TABS = [
  { id: 'guide', label: 'User Guide' },
  { id: 'terms', label: 'Terms of Service' },
  { id: 'privacy', label: 'Privacy Policy' },
]

const LegalPage = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])
  const urlTab = searchParams.get('tab')
  const initialTab = urlTab === 'privacy' ? 'privacy' : urlTab === 'guide' ? 'guide' : 'terms'
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'guide'>(initialTab)

  // Enable scrolling for legal page
  useEffect(() => {
    document.documentElement.classList.add('legal-page-active')
    document.body.classList.add('legal-page-active')

    return () => {
      document.documentElement.classList.remove('legal-page-active')
      document.body.classList.remove('legal-page-active')
    }
  }, [])

  // Ensure URL always has a tab param for shareable links
  useEffect(() => {
    const urlTab = searchParams.get('tab')
    const normalizedUrlTab = urlTab === 'privacy' ? 'privacy' : urlTab === 'guide' ? 'guide' : 'terms'
    if (!urlTab || normalizedUrlTab !== activeTab) {
      // Sync state to URL on first load or external navigation
      setActiveTab(normalizedUrlTab)
    }
  }, [activeTab, searchParams])

  const handleTabChange = (tabId: string) => {
    const params = new URLSearchParams(location.search)
    params.set('tab', tabId)
    navigate({ pathname: location.pathname, search: params.toString() }, { replace: false })
    if (tabId === 'privacy') {
      setActiveTab('privacy')
    } else if (tabId === 'guide') {
      setActiveTab('guide')
    } else {
      setActiveTab('terms')
    }
  }

  return (
    <>
      <style>{`
        /* Override global styles for legal page to enable scrolling */
        html.legal-page-active {
          overflow-x: hidden !important;
          overflow-y: auto !important;
          height: auto !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        body.legal-page-active {
          overflow: visible !important;
          position: relative !important;
          height: auto !important;
          min-height: 100vh !important;
          width: 100% !important;
          top: unset !important;
          left: unset !important;
          margin: 0 !important;
          padding: 0 !important;
          -webkit-overflow-scrolling: touch;
        }
        
        body.legal-page-active #root {
          overflow: visible !important;
          position: relative !important;
          height: auto !important;
          min-height: 100vh !important;
          width: 100% !important;
        }
      `}</style>
      <div className="min-h-screen bg-[#0b0c10] text-text-primary px-4 py-10 md:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Header */}
          <header className="mb-6 md:mb-8">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center text-sm text-text-secondary hover:text-text-primary mb-4 transition-colors"
            >
              <i className="fa-solid fa-arrow-left mr-2" />
              Back
            </button>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Legal & Help</h1>
            <p className="text-sm md:text-base text-text-secondary max-w-2xl mx-auto">
              Learn how to use Swipy, review our Terms of Service and Privacy Policy. By using Swipy, you
              agree to be bound by these terms and consent to the practices described here.
            </p>
          </header>

          {/* Top-level tab controls for clarity on all viewports */}
          <div className="mb-6 md:mb-8 flex justify-center">
            <div className="inline-flex rounded-full bg-bg-secondary/80 border border-glass-border p-1 shadow-light w-full max-w-md">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex-1 px-4 md:px-6 py-1.5 md:py-2 text-xs md:text-sm rounded-full transition-all text-center ${isActive
                      ? 'bg-accent-primary text-white shadow-md'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/60'
                      }`}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Shell with sticky sidebar / tabs */}
          <div className="flex justify-center">
            {/* Main content */}
            <main className="text-sm md:text-base leading-relaxed w-full text-left">
              <div
                key={activeTab}
                className="space-y-10 md:space-y-12 animate-fade-in"
              >
                {activeTab === 'terms' && (
                  <section
                    id="terms-of-service"
                    className="bg-bg-secondary/80 border border-glass-border rounded-2xl p-5 md:p-7 shadow-light text-left"
                  >
                    <header className="mb-4 md:mb-6 text-left">
                      <p className="text-xs uppercase tracking-[0.15em] text-text-secondary mb-2">
                        Terms of Service
                      </p>
                      <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Swipy Terms of Service</h2>
                      <p className="text-xs md:text-sm text-text-secondary mt-1">
                        Last updated: {new Date().toLocaleDateString()}
                      </p>
                    </header>

                    <div className="space-y-5 md:space-y-6 text-text-secondary">
                      <div>
                        <h3 className="text-base md:text-lg font-semibold text-text-primary mb-2">
                          1. Acceptance of Terms
                        </h3>
                        <p>
                          By accessing or using Swipy (the &quot;Service&quot;), you agree to be bound by these
                          Terms of Service (the &quot;Terms&quot;). If you do not agree to these Terms, you may
                          not access or use the Service. If you use the Service on behalf of a company or other
                          legal entity, you represent that you have authority to bind that entity and that entity
                          accepts these Terms.
                        </p>
                      </div>

                      <div>
                        <h3 className="text-base md:text-lg font-semibold text-text-primary mb-2">
                          2. User Accounts &amp; Authentication
                        </h3>
                        <p className="mb-2">
                          To use certain features of the Service, you must create an account. Authentication and
                          account management are powered by Supabase Auth. You agree to provide accurate,
                          complete, and up-to-date information and to maintain and promptly update your account
                          information as necessary.
                        </p>
                        <p>
                          You are solely responsible for maintaining the confidentiality of your login
                          credentials and for all activities that occur under your account. Swipy is not liable
                          for any loss or damage arising from unauthorized access to your account resulting from
                          your failure to safeguard your credentials. You agree to notify us immediately of any
                          suspected unauthorized use of your account.
                        </p>
                      </div>

                      <div>
                        <h3 className="text-base md:text-lg font-semibold text-text-primary mb-2">
                          3. Acceptable Use
                        </h3>
                        <p className="mb-2">
                          You agree to use the Service only for lawful purposes and in a manner consistent with
                          these Terms. You must not, and must not attempt to:
                        </p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>engage in any illegal, fraudulent, or unauthorized activity;</li>
                          <li>
                            access, scrape, crawl, or harvest data from the Service using automated means
                            (including bots, spiders, or scrapers) without our prior written consent;
                          </li>
                          <li>
                            harass, abuse, threaten, or harm other users, founders, investors, or any person
                            whose information appears on the Service;
                          </li>
                          <li>
                            interfere with or disrupt the integrity or performance of the Service, including by
                            attempting to circumvent security or rate-limiting mechanisms;
                          </li>
                          <li>
                            upload or transmit any viruses, malware, or other malicious code, or content that is
                            defamatory, obscene, discriminatory, or otherwise objectionable.
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h3 className="text-base md:text-lg font-semibold text-text-primary mb-2">
                          4. Intellectual Property
                        </h3>
                        <p className="mb-2">
                          Swipy, including all software, designs, logos, branding, text, graphics, and other
                          materials provided by us (collectively, &quot;Swipy Content&quot;), is owned by or
                          licensed to us and is protected by copyright, trademark, and other intellectual
                          property laws. Except as expressly permitted by us, you may not copy, modify,
                          distribute, sell, or create derivative works of any Swipy Content.
                        </p>
                        <p>
                          You retain all rights in and to the content, data, and materials you submit, upload, or
                          display through the Service (&quot;User Content&quot;). By submitting User Content, you
                          grant Swipy a non-exclusive, worldwide, royalty-free license to host, store, display,
                          and use such User Content solely for the purpose of operating and improving the
                          Service. You represent that you have all rights necessary to grant this license and
                          that your User Content does not infringe any third-party rights.
                        </p>
                      </div>

                      <div>
                        <h3 className="text-base md:text-lg font-semibold text-text-primary mb-2">
                          5. Termination &amp; Suspension
                        </h3>
                        <p>
                          We reserve the right, in our sole discretion and without prior notice, to suspend or
                          terminate your access to the Service (including your account) if we reasonably believe
                          that you have violated these Terms, pose a security or legal risk, or are causing harm
                          to other users or to the integrity of the Service. Upon termination, your right to use
                          the Service will cease immediately. We may retain and use certain information as
                          described in our Privacy Policy and as required by law.
                        </p>
                      </div>

                      <div>
                        <h3 className="text-base md:text-lg font-semibold text-text-primary mb-2">
                          6. Disclaimer &amp; Limitation of Liability
                        </h3>
                        <p className="mb-2">
                          The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis,
                          without warranties of any kind, whether express, implied, or statutory, including
                          without limitation any implied warranties of merchantability, fitness for a particular
                          purpose, title, or non-infringement. We do not guarantee that the Service will be
                          uninterrupted, error-free, secure, or free of harmful components.
                        </p>
                        <p>
                          To the maximum extent permitted by law, Swipy and its affiliates, officers, employees,
                          and agents shall not be liable for any indirect, incidental, special, consequential, or
                          punitive damages, or for any loss of profits, revenues, data, or goodwill, arising out
                          of or related to your use of or inability to use the Service, even if we have been
                          advised of the possibility of such damages. Our total aggregate liability for all
                          claims arising out of or relating to the Service shall not exceed the amount (if any)
                          you paid to us for the Service in the six (6) months preceding the event giving rise to
                          the claim.
                        </p>
                      </div>
                    </div>
                  </section>
                )}

                {activeTab === 'privacy' && (
                  <section
                    id="privacy-policy"
                    className="bg-bg-secondary/80 border border-glass-border rounded-2xl p-5 md:p-7 shadow-light text-left"
                  >
                    <header className="mb-4 md:mb-6 text-left">
                      <p className="text-xs uppercase tracking-[0.15em] text-text-secondary mb-2">
                        Privacy Policy
                      </p>
                      <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Swipy Privacy Policy</h2>
                      <p className="text-xs md:text-sm text-text-secondary mt-1">
                        Last updated: {new Date().toLocaleDateString()}
                      </p>
                    </header>

                    <div className="space-y-5 md:space-y-6 text-text-secondary">
                      <div>
                        <h3 className="text-base md:text-lg font-semibold text-text-primary mb-2">
                          1. Data We Collect
                        </h3>
                        <p className="mb-2">
                          We collect information to provide, secure, and improve Swipy. The data we collect may
                          include:
                        </p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>
                            <span className="font-semibold text-text-primary">Account &amp; contact data:</span>{' '}
                            such as your email address, name, username, and profile information you choose to
                            provide. Account creation and authentication are powered by Supabase.
                          </li>
                          <li>
                            <span className="font-semibold text-text-primary">Usage data:</span> logs of how you
                            interact with the Service, including pages viewed, actions taken (e.g., swipes,
                            messages), device information, approximate location, and timestamps.
                          </li>
                          <li>
                            <span className="font-semibold text-text-primary">Cookies &amp; similar
                              technologies:</span>{' '}
                            small data files stored on your device that help us remember your preferences,
                            maintain sessions, and understand how the Service is used.
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h3 className="text-base md:text-lg font-semibold text-text-primary mb-2">
                          2. How We Use Your Data
                        </h3>
                        <p className="mb-2">
                          We use the information we collect for the following purposes:
                        </p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>
                            <span className="font-semibold text-text-primary">Service delivery:</span> to operate,
                            maintain, and improve the core features of Swipy, including account authentication,
                            profile management, matching, messaging, and notifications.
                          </li>
                          <li>
                            <span className="font-semibold text-text-primary">Communication:</span> to send you
                            transactional emails (for example, account verification, security alerts, password
                            resets) and, where permitted, product updates or relevant announcements.
                          </li>
                          <li>
                            <span className="font-semibold text-text-primary">Security &amp; abuse prevention:</span>{' '}
                            to monitor for and prevent fraud, abuse, unauthorized access, and other harmful
                            activity, including enforcing our Terms of Service.
                          </li>
                          <li>
                            <span className="font-semibold text-text-primary">Analytics &amp; product
                              improvement:</span>{' '}
                            to understand how users engage with Swipy, diagnose performance issues, and make
                            informed decisions about new features and improvements.
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h3 className="text-base md:text-lg font-semibold text-text-primary mb-2">
                          3. Third-Party Services &amp; Integrations
                        </h3>
                        <p className="mb-2">
                          We rely on trusted third-party providers to power parts of Swipy. These providers
                          process data on our behalf in accordance with our instructions and applicable data
                          protection laws:
                        </p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>
                            <span className="font-semibold text-text-primary">Supabase:</span> used for
                            authentication (Supabase Auth), database storage, and related backend services.
                          </li>
                          <li>
                            <span className="font-semibold text-text-primary">Stripe (if enabled):</span> used to
                            process payments and subscriptions in a secure, PCI-compliant manner. We do not store
                            full payment card details on our own servers.
                          </li>
                          <li>
                            <span className="font-semibold text-text-primary">Analytics tools (e.g., Google
                              Analytics):</span>{' '}
                            used to collect aggregated, pseudonymized usage statistics to help us understand how
                            Swipy is used and improve the product.
                          </li>
                        </ul>
                        <p className="mt-2">
                          These third parties are only permitted to use your information as necessary to provide
                          services to us and are not allowed to use it for their own marketing purposes without
                          your consent.
                        </p>
                      </div>

                      <div>
                        <h3 className="text-base md:text-lg font-semibold text-text-primary mb-2">
                          4. Your Data Rights
                        </h3>
                        <p className="mb-2">
                          Depending on your location and applicable law, you may have certain rights with respect
                          to your personal data. These may include:
                        </p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>the right to access the personal data we hold about you;</li>
                          <li>the right to request correction of inaccurate or incomplete data;</li>
                          <li>
                            the right to request deletion of your data, subject to our legal and contractual
                            obligations;
                          </li>
                          <li>the right to object to or restrict certain types of processing; and</li>
                          <li>the right to data portability in certain circumstances.</li>
                        </ul>
                        <p className="mt-2">
                          To exercise these rights, please contact us using the email address provided below. We
                          may ask you to verify your identity before responding to your request.
                        </p>
                      </div>

                      <div>
                        <h3 className="text-base md:text-lg font-semibold text-text-primary mb-2">
                          5. Data Retention &amp; Security
                        </h3>
                        <p className="mb-2">
                          We retain your personal data for as long as necessary to provide the Service, comply
                          with our legal obligations, resolve disputes, and enforce our agreements. The specific
                          retention period may vary depending on the type of data and the context in which it was
                          collected.
                        </p>
                        <p>
                          We implement technical and organizational measures designed to protect your data
                          against unauthorized access, loss, misuse, or alteration. However, no method of
                          transmission over the internet or method of electronic storage is completely secure,
                          and we cannot guarantee absolute security.
                        </p>
                      </div>

                      <div>
                        <h3 className="text-base md:text-lg font-semibold text-text-primary mb-2">
                          6. Contact Us
                        </h3>
                        <p className="mb-2">
                          If you have any questions about these Terms, this Privacy Policy, or how we handle your
                          data, or if you would like to exercise your data rights, you can reach us at:
                        </p>
                        <p className="font-semibold text-text-primary">support@swipy.space</p>
                      </div>
                    </div>
                  </section>
                )}

                {activeTab === 'guide' && (
                  <section
                    id="user-guide"
                    className="bg-bg-secondary/80 border border-glass-border rounded-2xl p-5 md:p-7 shadow-light text-left"
                  >
                    <header className="mb-4 md:mb-6 text-left">
                      <p className="text-xs uppercase tracking-[0.15em] text-text-secondary mb-2">
                        User Guide
                      </p>
                      <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Swipy User Guide</h2>
                      <p className="text-xs md:text-sm text-text-secondary mt-1">
                        Everything you need to know to get started and make the most of Swipy
                      </p>
                    </header>

                    <div className="space-y-5 md:space-y-6 text-text-secondary">
                      {/* Introduction */}
                      <div>
                        <h3 className="text-base md:text-lg font-semibold text-text-primary mb-2">
                          What is Swipy?
                        </h3>
                        <p className="mb-2">
                          Swipy is a platform that connects founders and investors, making it easy to discover startups, 
                          find investment opportunities, and build meaningful connections. Think of it as &quot;Tinder for Startups&quot; 
                          - you swipe through startup profiles, and when there&apos;s a mutual match, you can start chatting directly.
                        </p>
                        <p>
                          Whether you&apos;re a founder looking to showcase your startup or an investor seeking the next big opportunity, 
                          Swipy helps you find the perfect match.
                        </p>
                      </div>

                      {/* Getting Started */}
                      <div>
                        <h3 className="text-base md:text-lg font-semibold text-text-primary mb-2">
                          Getting Started
                        </h3>
                        <p className="mb-2">
                          <span className="font-semibold text-text-primary">1. Create an Account:</span> Click &quot;Sign Up&quot; 
                          on the landing page. You can create an account using your email and password, or sign in with Google for 
                          a quicker setup.
                        </p>
                        <p className="mb-2">
                          <span className="font-semibold text-text-primary">2. Complete Onboarding:</span> After signing up, 
                          you&apos;ll go through a brief onboarding process where you&apos;ll:
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>Enter your full name and choose a username</li>
                          <li>Write a short bio about yourself</li>
                          <li>Select your location</li>
                          <li>Choose your role: Founder or Investor</li>
                          <li>Select your interests (AI/ML, FinTech, HealthTech, etc.)</li>
                        </ul>
                        <p className="mt-2">
                          <span className="font-semibold text-text-primary">3. Start Exploring:</span> Once your profile is set up, 
                          you&apos;ll be taken to the Home page where you can start swiping through startups!
                        </p>
                      </div>

                      {/* Navigation Guide */}
                      <div>
                        <h3 className="text-base md:text-lg font-semibold text-text-primary mb-2">
                          Navigation Guide
                        </h3>
                        <p className="mb-2">
                          <span className="font-semibold text-text-primary">Mobile Navigation:</span> On mobile devices, you&apos;ll 
                          see a bottom navigation bar with four main sections:
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li><span className="font-semibold text-text-primary">Home:</span> The main swipe interface where you discover startups</li>
                          <li><span className="font-semibold text-text-primary">Add:</span> (Founders only) Create and add your startup to the platform</li>
                          <li><span className="font-semibold text-text-primary">Chat:</span> View and manage your conversations</li>
                          <li><span className="font-semibold text-text-primary">Profile:</span> Access your profile, settings, and saved items</li>
                        </ul>
                        <p className="mt-2 mb-2">
                          <span className="font-semibold text-text-primary">Desktop Navigation:</span> On desktop, you&apos;ll see a 
                          sidebar menu with the same options, plus additional features like Notifications and Settings.
                        </p>
                        <p className="mb-2">
                          <span className="font-semibold text-text-primary">Header Buttons:</span> At the top of most pages, you&apos;ll find:
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li><span className="font-semibold text-text-primary">Filter icon:</span> Adjust your search preferences</li>
                          <li><span className="font-semibold text-text-primary">Bookmark icon:</span> View your saved/liked startups</li>
                          <li><span className="font-semibold text-text-primary">Search bar:</span> Search for startups or users by typing or using @username</li>
                        </ul>
                      </div>

                      {/* Page-by-Page Guide */}
                      <div>
                        <h3 className="text-base md:text-lg font-semibold text-text-primary mb-2">
                          Page-by-Page Guide
                        </h3>
                        
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm md:text-base font-semibold text-text-primary mb-1">
                              Home Page (Swipe Interface)
                            </h4>
                            <p className="mb-1">
                              This is where you discover startups. You&apos;ll see startup cards that you can:
                            </p>
                            <ul className="list-disc list-inside space-y-1 ml-4">
                              <li><span className="font-semibold text-text-primary">Swipe right or tap the heart:</span> Like the startup</li>
                              <li><span className="font-semibold text-text-primary">Swipe left or tap the X:</span> Pass on the startup</li>
                              <li><span className="font-semibold text-text-primary">Swipe down or tap the card:</span> View more details about the startup</li>
                            </ul>
                            <p className="mt-1">
                              Each card shows the startup name, location, industry, team size, and description. When you like a startup 
                              and they like you back, it&apos;s a match! You&apos;ll be able to start chatting.
                            </p>
                          </div>

                          <div>
                            <h4 className="text-sm md:text-base font-semibold text-text-primary mb-1">
                              Startup Detail Page
                            </h4>
                            <p>
                              View comprehensive information about a startup including full description, funding stage, team details, 
                              and more. From here, you can like the startup, save it for later, or start a conversation if you&apos;ve matched.
                            </p>
                          </div>

                          <div>
                            <h4 className="text-sm md:text-base font-semibold text-text-primary mb-1">
                              Profile Page
                            </h4>
                            <p className="mb-1">
                              Your profile shows your information, stats, and activity. You can:
                            </p>
                            <ul className="list-disc list-inside space-y-1 ml-4">
                              <li>View your profile views, matches, and applications</li>
                              <li>Edit your profile information</li>
                              <li>Manage your startups (if you&apos;re a founder)</li>
                              <li>Access settings and preferences</li>
                            </ul>
                          </div>

                          <div>
                            <h4 className="text-sm md:text-base font-semibold text-text-primary mb-1">
                              Chat Page
                            </h4>
                            <p>
                              See all your conversations in one place. Chats are organized by startup or person. Unread messages are 
                              highlighted. Tap any conversation to open it and continue chatting.
                            </p>
                          </div>

                          <div>
                            <h4 className="text-sm md:text-base font-semibold text-text-primary mb-1">
                              Chat Detail (Conversations)
                            </h4>
                            <p>
                              This is where you have one-on-one conversations. Type your message and send it. You&apos;ll see when messages 
                              are delivered and read. You can also view the other person&apos;s profile or the startup details from here.
                            </p>
                          </div>

                          <div>
                            <h4 className="text-sm md:text-base font-semibold text-text-primary mb-1">
                              Saved Page
                            </h4>
                            <p>
                              View all the startups you&apos;ve liked or passed on. Switch between &quot;Liked&quot; and &quot;Passed&quot; tabs 
                              to see your history. You can remove items from your saved list if needed.
                            </p>
                          </div>

                          <div>
                            <h4 className="text-sm md:text-base font-semibold text-text-primary mb-1">
                              Add Startup Page (Founders Only)
                            </h4>
                            <p>
                              Create and add your startup to the platform. Fill in details like name, description, industry, location, 
                              funding stage, and upload a logo. Once added, your startup will appear in the swipe feed for investors to discover.
                            </p>
                          </div>

                          <div>
                            <h4 className="text-sm md:text-base font-semibold text-text-primary mb-1">
                              Filters Page
                            </h4>
                            <p>
                              Customize what startups you see by setting filters for industry, location, funding stage, team size, and more. 
                              Adjust these anytime to refine your discovery experience.
                            </p>
                          </div>

                          <div>
                            <h4 className="text-sm md:text-base font-semibold text-text-primary mb-1">
                              Notifications Page
                            </h4>
                            <p>
                              Stay updated with all your activity - new matches, messages, profile views, and other important updates. 
                              Tap any notification to go directly to the relevant page.
                            </p>
                          </div>

                          <div>
                            <h4 className="text-sm md:text-base font-semibold text-text-primary mb-1">
                              Settings Page
                            </h4>
                            <p>
                              Manage your account settings, privacy preferences, notification preferences, and more. You can also 
                              update your password, email, and other account details here.
                            </p>
                          </div>

                          <div>
                            <h4 className="text-sm md:text-base font-semibold text-text-primary mb-1">
                              Support Page
                            </h4>
                            <p>
                              Get help, report issues, or contact our support team. You&apos;ll find answers to common questions and 
                              ways to reach out if you need assistance.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Core Features */}
                      <div>
                        <h3 className="text-base md:text-lg font-semibold text-text-primary mb-2">
                          Core Features Explained
                        </h3>
                        
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm md:text-base font-semibold text-text-primary mb-1">
                              Swiping (Like/Pass)
                            </h4>
                            <p>
                              The core of Swipy is the swipe interface. Swipe right (or tap the heart) to like a startup, swipe left 
                              (or tap the X) to pass. Your preferences help our algorithm learn what you&apos;re interested in and show 
                              you more relevant startups.
                            </p>
                          </div>

                          <div>
                            <h4 className="text-sm md:text-base font-semibold text-text-primary mb-1">
                              Matching System
                            </h4>
                            <p>
                              When you like a startup and the founder likes you back (or vice versa), it&apos;s a match! You&apos;ll both 
                              receive a notification, and you can start chatting immediately. Matches are mutual, ensuring both parties 
                              are interested in connecting.
                            </p>
                          </div>

                          <div>
                            <h4 className="text-sm md:text-base font-semibold text-text-primary mb-1">
                              Messaging
                            </h4>
                            <p>
                              Once you&apos;ve matched, you can send messages directly through Swipy. No need to exchange emails or phone numbers 
                              upfront. Messages are real-time, so you can have natural conversations and build relationships.
                            </p>
                          </div>

                          <div>
                            <h4 className="text-sm md:text-base font-semibold text-text-primary mb-1">
                              Saving Startups
                            </h4>
                            <p>
                              When you like a startup, it&apos;s automatically saved to your &quot;Liked&quot; list. You can revisit these 
                              anytime from the Saved page. This helps you keep track of startups you&apos;re interested in.
                            </p>
                          </div>

                          <div>
                            <h4 className="text-sm md:text-base font-semibold text-text-primary mb-1">
                              Filtering and Search
                            </h4>
                            <p>
                              Use filters to narrow down startups by industry, location, funding stage, and more. The search bar lets you 
                              find specific startups by name or search for users by typing @username. This makes it easy to find exactly 
                              what you&apos;re looking for.
                            </p>
                          </div>

                          <div>
                            <h4 className="text-sm md:text-base font-semibold text-text-primary mb-1">
                              Profile Customization
                            </h4>
                            <p>
                              Make your profile stand out by adding a bio, skills, portfolio items, and social links. A complete profile 
                              helps others understand who you are and what you&apos;re looking for, increasing your chances of making 
                              meaningful connections.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Tips and Best Practices */}
                      <div>
                        <h3 className="text-base md:text-lg font-semibold text-text-primary mb-2">
                          Tips and Best Practices
                        </h3>
                        
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm md:text-base font-semibold text-text-primary mb-1">
                              Creating an Attractive Profile
                            </h4>
                            <ul className="list-disc list-inside space-y-1 ml-4">
                              <li>Write a clear, engaging bio that explains who you are and what you&apos;re looking for</li>
                              <li>Add a professional photo or avatar</li>
                              <li>List your skills and experience</li>
                              <li>Include links to your portfolio, LinkedIn, or website</li>
                              <li>Keep your information up to date</li>
                            </ul>
                          </div>

                          <div>
                            <h4 className="text-sm md:text-base font-semibold text-text-primary mb-1">
                              Writing Effective Messages
                            </h4>
                            <ul className="list-disc list-inside space-y-1 ml-4">
                              <li>Be genuine and authentic in your conversations</li>
                              <li>Reference something specific from their profile or startup</li>
                              <li>Ask thoughtful questions to show genuine interest</li>
                              <li>Respond in a timely manner to keep the conversation going</li>
                              <li>Be respectful and professional</li>
                            </ul>
                          </div>

                          <div>
                            <h4 className="text-sm md:text-base font-semibold text-text-primary mb-1">
                              Finding Relevant Startups/Investors
                            </h4>
                            <ul className="list-disc list-inside space-y-1 ml-4">
                              <li>Use filters to narrow down to your specific interests</li>
                              <li>Be selective but not too restrictive - you might discover something unexpected</li>
                              <li>Check the Saved page regularly to review startups you&apos;ve liked</li>
                              <li>Use search to find specific companies or people you&apos;ve heard about</li>
                              <li>Update your interests in your profile to get better recommendations</li>
                            </ul>
                          </div>

                          <div>
                            <h4 className="text-sm md:text-base font-semibold text-text-primary mb-1">
                              Profile Optimization Tips
                            </h4>
                            <ul className="list-disc list-inside space-y-1 ml-4">
                              <li>Complete all sections of your profile for better visibility</li>
                              <li>Use keywords related to your industry or interests</li>
                              <li>Add portfolio items or links to showcase your work</li>
                              <li>Keep your location accurate for location-based matching</li>
                              <li>Regularly update your profile to reflect your current status</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Troubleshooting */}
                      <div>
                        <h3 className="text-base md:text-lg font-semibold text-text-primary mb-2">
                          Troubleshooting
                        </h3>
                        
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm md:text-base font-semibold text-text-primary mb-1">
                              Common Issues and Solutions
                            </h4>
                            <ul className="list-disc list-inside space-y-1 ml-4">
                              <li>
                                <span className="font-semibold text-text-primary">Can&apos;t log in:</span> Make sure you&apos;re using 
                                the correct email and password. Try resetting your password if needed.
                              </li>
                              <li>
                                <span className="font-semibold text-text-primary">Not seeing any startups:</span> Check your filters - 
                                they might be too restrictive. Try clearing filters or adjusting them.
                              </li>
                              <li>
                                <span className="font-semibold text-text-primary">Messages not sending:</span> Check your internet connection. 
                                If the problem persists, try refreshing the page or logging out and back in.
                              </li>
                              <li>
                                <span className="font-semibold text-text-primary">Profile not updating:</span> Make sure you&apos;ve saved 
                                your changes. If changes don&apos;t appear, try refreshing the page.
                              </li>
                              <li>
                                <span className="font-semibold text-text-primary">Can&apos;t find a specific startup:</span> Use the search 
                                function with the startup name, or try searching for the founder&apos;s username.
                              </li>
                            </ul>
                          </div>

                          <div>
                            <h4 className="text-sm md:text-base font-semibold text-text-primary mb-1">
                              How to Get Help
                            </h4>
                            <p className="mb-1">
                              If you&apos;re experiencing issues or have questions:
                            </p>
                            <ul className="list-disc list-inside space-y-1 ml-4">
                              <li>Visit the Support page from your profile menu</li>
                              <li>Check the FAQ section for common questions</li>
                              <li>Contact our support team at support@swipy.space</li>
                              <li>Report bugs or issues through the Support page</li>
                            </ul>
                          </div>

                          <div>
                            <h4 className="text-sm md:text-base font-semibold text-text-primary mb-1">
                              Account Management
                            </h4>
                            <p className="mb-1">
                              Manage your account settings:
                            </p>
                            <ul className="list-disc list-inside space-y-1 ml-4">
                              <li>Update your email, password, or profile information in Settings</li>
                              <li>Adjust notification preferences to control what alerts you receive</li>
                              <li>Manage privacy settings to control who can see your profile</li>
                              <li>Delete your account if needed (contact support for assistance)</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Closing */}
                      <div className="pt-4 border-t border-glass-border">
                        <p className="text-text-secondary">
                          We hope this guide helps you make the most of Swipy! If you have any questions or feedback, 
                          don&apos;t hesitate to reach out to our support team. Happy swiping!
                        </p>
                      </div>
                    </div>
                  </section>
                )}
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  )
}

export default LegalPage


