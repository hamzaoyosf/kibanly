describe('Authentication & Soft-UI Hybrid Auth Gateway', () => {
  beforeEach(() => {
    // Clear state & storage to ensure fresh visitor state
    cy.clearLocalStorage()
    cy.window().then((win) => {
      win.sessionStorage.clear()
    })
  })

  it('blocks unauthenticated direct access to /app, shows no dashboard, and redirects to /login', () => {
    // 1. Attempt to navigate directly to /app without being signed in
    cy.visit('/app')

    // 2. Strict gatekeeper redirects immediately to /login
    cy.url().should('include', '/login')
    cy.contains('Sign In to OBOiFY').should('be.visible')

    // 3. Command Deck and dashboard shell must NOT be exposed
    cy.contains('Command Deck').should('not.exist')
    cy.get('button').contains('Quick Capture').should('not.exist')
    cy.contains('Continue as Local Guest').should('not.exist')

    // 4. Authenticate via Google Sign-In button
    cy.get('[data-testid="google-signin-btn"]').click()

    // 5. Successfully authenticated: redirected to /app dashboard
    cy.url().should('include', '/app')
    cy.contains('Command Deck').should('be.visible')
  })

  it('allows user to sign in with Google on /login and verifies clean slate with zero mock data', () => {
    // 1. Visit Login page
    cy.visit('/login')
    cy.contains('Sign In to OBOiFY').should('be.visible')
    cy.get('[data-testid="google-signin-btn"]').should('be.visible')
    cy.contains('Continue as Local Guest').should('not.exist')

    // 2. Click Google Sign-In
    cy.get('[data-testid="google-signin-btn"]').click()

    // 3. Verify redirected to /app dashboard
    cy.url().should('include', '/app')
    cy.contains('Command Deck').should('be.visible')

    // 4. Verify Clean Slate: Top summary metrics show zero mock data
    cy.contains('0 completed today').should('be.visible')
    cy.contains('0 Next Actions pending').should('be.visible')
    cy.contains('$0.00').should('be.visible')
    cy.contains('0 / 0 habits logged').should('be.visible')

    // 5. Verify Schedule strip displays clean empty state
    cy.contains('No blocks scheduled for today').should('be.visible')
  })

  it('redirects unauthenticated user from /app/action to /login and deep-links back to /app/action after login', () => {
    // 1. Attempt to access protected route directly without auth
    cy.visit('/app/action')

    // 2. Gatekeeper redirects to /login
    cy.url().should('include', '/login')
    cy.contains('Sign In to OBOiFY').should('be.visible')

    // 3. Sign in with Google
    cy.get('[data-testid="google-signin-btn"]').click()

    // 4. Verify redirected directly to original deep link destination: /app/action
    cy.url().should('include', '/app/action')
    cy.contains('Action Hub').should('be.visible')
  })

  it('redirects unauthenticated user from /app/capital to /login and deep-links back to /app/capital after login', () => {
    // 1. Attempt to access /app/capital directly
    cy.visit('/app/capital')

    // 2. Gatekeeper redirects to /login
    cy.url().should('include', '/login')
    cy.contains('Sign In to OBOiFY').should('be.visible')

    // 3. Sign in with Google
    cy.get('[data-testid="google-signin-btn"]').click()

    // 4. Verify redirected directly to original deep link destination: /app/capital
    cy.url().should('include', '/app/capital')
    cy.contains('Capital Hub').should('be.visible')
  })

  it('renders user profile and sign out in AppLayout with zero Sign In buttons', () => {
    // 1. Visit Login and authenticate
    cy.visit('/login')
    cy.get('[data-testid="google-signin-btn"]').click()
    cy.url().should('include', '/app')

    // 2. Verify AppLayout has NO "Sign In" button anywhere
    cy.contains('Sign In').should('not.exist')

    // 3. Verify User Profile button exists and opens dropdown with Sign Out
    cy.get('[data-testid="user-profile-btn"]').filter(':visible').first().click()
    cy.get('[data-testid="sign-out-btn"]').filter(':visible').should('be.visible')

    // 4. Clicking Sign Out immediately purges session and ejects to /login
    cy.get('[data-testid="sign-out-btn"]').filter(':visible').click()
    cy.url().should('include', '/login')
    cy.contains('Sign In to OBOiFY').should('be.visible')
  })

  it('opens modern Soft-UI AuthModal overlay directly on Landing Page and dismisses on close', () => {
    // 1. Visit Landing Page
    cy.visit('/')

    // 2. Click "Sign In" in Floating Navbar -> opens modal overlay without leaving landing page
    cy.get('[data-testid="navbar-signin-btn"]').click()
    cy.url().should('not.include', '/login')
    cy.contains('Sign In to OBOiFY').should('be.visible')
    cy.get('[data-testid="google-signin-btn"]').should('be.visible')

    // 3. Click close button on modal
    cy.get('[data-testid="close-auth-modal-btn"]').click()
    cy.contains('Sign In to OBOiFY').should('not.exist')

    // 4. Click "Launch Command Deck" in Hero section -> opens modal overlay
    cy.get('[data-testid="hero-launch-btn"]').click()
    cy.contains('Sign In to OBOiFY').should('be.visible')

    // 5. Sign in from the modal overlay -> seamlessly proceeds to /app
    cy.get('[data-testid="google-signin-btn"]').click()
    cy.url().should('include', '/app')
    cy.contains('Command Deck').should('be.visible')
  })
})
