/// <reference types="cypress" />
/// <reference types="@testing-library/cypress" />

// Import commands.js using ES2015 syntax:
import '@testing-library/cypress/add-commands';

declare global {
  namespace Cypress {
    interface Chainable {
      // Add custom commands here if needed
    }
  }
} 