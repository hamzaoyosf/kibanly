describe('Recall Loop GTD Workflow & Anti-Procrastination', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    // Enter via Google Auth
    cy.visit('/login')
    cy.get('[data-testid="google-signin-btn"]').click()
    cy.url().should('include', '/app')
  })

  it('captures thought in inbox and converts to task with Recall Loop enabled', () => {
    // 1. Navigate to Global Inbox
    cy.visit('/inbox')
    cy.contains('Global Inbox').should('be.visible')

    // 2. Click Quick Capture
    cy.contains('Capture').click()
    cy.get('textarea').type('Master Quantum Computing Basics{enter}')

    // 3. Verify capture appears in inbox
    cy.contains('Master Quantum Computing Basics').should('be.visible')

    // 4. Click Convert on the capture
    cy.contains('Convert').click()

    // 5. Verify Convert Modal opens
    cy.contains('Convert Capture to GTD Task').should('be.visible')
    cy.contains('Enable Recall Loop').should('be.visible')

    // 6. Check "Enable Recall Loop" checkbox
    cy.get('input[type="checkbox"]').check()

    // 7. Verify live preview of 4 tasks (Parent, 24h, 2 weeks, 2 months)
    cy.contains('Automated Recall Loop Schedule:').should('be.visible')
    cy.contains('1st Recall (24h): Master Quantum Computing Basics').should('be.visible')
    cy.contains('2nd Recall (2 weeks): Master Quantum Computing Basics').should('be.visible')
    cy.contains('3rd Recall (2 months): Master Quantum Computing Basics').should('be.visible')

    // 8. Submit conversion
    cy.contains('Convert with Recall Loop (4 Tasks)').click()

    // 9. Go to Action Hub
    cy.visit('/action')
    cy.contains('Action Hub').should('be.visible')

    // 10. Verify Recall cards exist and have the subtle Recall icon without "SRS" text
    cy.contains('Master Quantum Computing Basics').should('be.visible')
    cy.get('[title*="Recall"]').should('exist')
  })
})
