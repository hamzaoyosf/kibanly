describe('Soft Glassmorphism & Bento Landing Page', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
  })

  it('renders floating navbar, interactive core, and bento grid', () => {
    // 1. Visit Landing Page
    cy.visit('/')

    // 2. Floating Navbar verification
    cy.contains('OBOiFY').should('be.visible')
    cy.contains('Go to App').should('be.visible')
    cy.contains('Sign In').should('be.visible')

    // 3. Hero Section & Interactive Core verification
    cy.contains('Your Mind,').should('be.visible')
    cy.contains('Systematized.').should('be.visible')
    cy.contains('Action Hub').should('exist')
    cy.contains('Recall Loop').should('exist')
    cy.contains('Focus').should('exist')
    cy.contains('CORE').should('be.visible')

    // 4. Hero CTAs
    cy.contains('Launch Command Deck').should('be.visible')
    cy.contains('Sign in with Google').should('be.visible')

    // 5. Scroll to Bento Grid
    cy.scrollTo(0, 800)
    cy.contains('Engineered for Zero Mental Friction').should('exist')

    // 6. Bento Cards Content verification
    cy.contains('Never forget again with automated spaced repetition.').should('exist')
    cy.contains('Capture instantly.').should('exist')
    cy.contains('Execute with precision.').should('exist')

    // 7. Click Launch Command Deck: Renders modern Soft-UI AuthModal overlay directly without leaving landing page
    cy.scrollTo('top')
    cy.contains('Launch Command Deck').click()
    cy.url().should('not.include', '/login')
    cy.contains('Sign In to OBOiFY').should('be.visible')
    cy.get('[data-testid="google-signin-btn"]').should('be.visible')

    // 8. Sign in via Google AuthModal and verify seamless navigation into /app
    cy.get('[data-testid="google-signin-btn"]').click()
    cy.url().should('include', '/app')
    cy.contains('Command Deck').should('be.visible')
  })
})
