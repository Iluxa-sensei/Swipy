import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const TABS = [
  { id: 'terms', label: 'Terms of Service' },
  { id: 'privacy', label: 'Privacy Policy' },
]

const LegalPage = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])
  const initialTab = searchParams.get('tab') === 'privacy' ? 'privacy' : 'terms'
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(initialTab)

  // Ensure URL always has a tab param for shareable links
  useEffect(() => {
    const urlTab = searchParams.get('tab')
    const normalizedUrlTab = urlTab === 'privacy' ? 'privacy' : 'terms'
    if (!urlTab || normalizedUrlTab !== activeTab) {
      // Sync state to URL on first load or external navigation
      setActiveTab(normalizedUrlTab)
    }
  }, [activeTab, searchParams])

  const handleTabChange = (tabId: string) => {
    const params = new URLSearchParams(location.search)
    params.set('tab', tabId)
    navigate({ pathname: location.pathname, search: params.toString() }, { replace: false })
    setActiveTab(tabId === 'privacy' ? 'privacy' : 'terms')
  }

  return (
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
            Back to landing
          </button>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Legal</h1>
          <p className="text-sm md:text-base text-text-secondary max-w-2xl mx-auto">
            Please review these Terms of Service and our Privacy Policy carefully. By using Swipy, you
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
                  onClick={() => handleTabChange(tab.id as 'terms' | 'privacy')}
                  className={`flex-1 px-4 md:px-6 py-1.5 md:py-2 text-xs md:text-sm rounded-full transition-all text-center ${
                    isActive
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
                      <p className="font-semibold text-text-primary">support@example.com</p>
                    </div>
                  </div>
                </section>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default LegalPage


