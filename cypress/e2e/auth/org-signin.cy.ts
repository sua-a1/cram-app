describe('Organization Signin Form', () => {
  beforeEach(() => {
    // Visit the Storybook story for OrgSignInForm
    cy.visit('/iframe.html?id=auth-orgsigninform--default');
    // Wait for the form to be mounted and visible
    cy.get('form[role="form"]').should('be.visible');
  });

  it('should display validation errors', () => {
    // Try to submit without filling form
    cy.findByRole('button', { name: /sign in/i }).click();

    // Check validation messages
    cy.findByText(/invalid email address/i).should('exist');
    cy.findByText(/password must be at least 6 characters/i).should('exist');
  });

  it('should handle successful signin', () => {
    // Fill form
    cy.findByLabelText(/work email/i).type('test@example.com');
    cy.findByLabelText(/^password$/i).type('Test123!@#');

    // Get the submit button
    cy.findByRole('button', { name: /sign in/i }).as('submitButton');
    
    // Click the button
    cy.get('@submitButton').click();
    
    // Verify button becomes disabled
    cy.get('@submitButton').should('be.disabled');
    
    // Verify loading spinner appears
    cy.get('@submitButton').find('.animate-spin').should('exist');
    
    // Check success message in toast
    cy.findByRole('status').within(() => {
      cy.findByText(/success/i).should('exist');
      cy.findByText(/welcome back/i).should('exist');
    });
  });

  it('should show forgot password link', () => {
    cy.findByText(/forgot password/i)
      .should('exist')
      .should('have.attr', 'href', '/org/org-auth/reset-password');
  });
}); 

