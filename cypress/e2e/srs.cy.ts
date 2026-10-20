describe('Spaced Repetition System (SRS) GTD Workflow', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    // Enter as local guest
    cy.visit('/login')
    cy.get('[data-testid="guest-mode-btn"]').click()
    cy.url().should('include', '/app')
  })

  it('captures thought in inbox and converts to task with SRS enabled', () => {
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
    cy.contains('Enable Spaced Repetition (SRS)').should('be.visible')

    // 6. Check "Enable Spaced Repetition (SRS)" checkbox
    cy.get('input[type="checkbox"]').check()

    // 7. Verify live preview of 4 tasks (Parent, 24h, 2 weeks, 2 months)
    cy.contains('Automated SRS Review Schedule:').should('be.visible')
    cy.contains('1st Review (24h): Master Quantum Computing Basics').should('be.visible')
    cy.contains('2nd Review (2 weeks): Master Quantum Computing Basics').should('be.visible')
    cy.contains('3rd Review (2 months): Master Quantum Computing Basics').should('be.visible')

    // 8. Submit conversion
    cy.contains('Convert with SRS (4 Tasks)').click()

    // 9. Go to Action Hub
    cy.visit('/action')
    cy.contains('Action Hub').should('be.visible')

    // 10. Verify SRS cards exist and have the SRS badge
    cy.contains('Master Quantum Computing Basics').should('be.visible')
    cy.contains('SRS').should('be.visible')
  })
})
