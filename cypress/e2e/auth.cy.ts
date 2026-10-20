describe('Authentication & Guest Mode Clean Slate', () => {
  beforeEach(() => {
    // Clear localStorage to ensure fresh visitor state
    cy.clearLocalStorage()
  })

  it('allows user to continue as local guest and verifies clean slate with zero mock data', () => {
    // 1. Visit Login page
    cy.visit('/login')
    cy.contains('Sign In to OBOiFY').should('be.visible')
    cy.contains('Continue as Local Guest').should('be.visible')

    // 2. Click "Continue as Local Guest"
    cy.get('[data-testid="guest-mode-btn"]').click()

    // 3. Verify redirected to /app dashboard
    cy.url().should('include', '/app')
    cy.contains('Command Deck').should('be.visible')

    // 4. Verify local guest mode is set in localStorage
    cy.window().then((win) => {
      expect(win.localStorage.getItem('oboify_guest_mode')).to.eq('true')
    })

    // 5. Verify Clean Slate: Top summary metrics show zero mock data
    cy.contains('0 completed today').should('be.visible')
    cy.contains('0 Next Actions pending').should('be.visible')
    cy.contains('$0.00').should('be.visible')
    cy.contains('0 / 0 habits logged').should('be.visible')

    // 6. Verify Schedule strip displays clean empty state
    cy.contains('No blocks scheduled for today').should('be.visible')
  })
})
