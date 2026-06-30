/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Cypress E2E Test - Auth Flow
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] /Users/admin/Downloads/NOVO REGENERA/cypress/e2e/auth.cy.ts
describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/login'); // Assuming /login is the path to your login page
  });

  it('should allow a user to register and then log in', () => {
    const timestamp = Date.now();
    const email = `testuser-${timestamp}@example.com`;
    const password = 'password123';
    const fullName = `Test User ${timestamp}`;

    // Navigate to register page
    cy.contains('Crie uma agora').click();
    cy.url().should('include', '/register');

    // Register a new user
    cy.get('input[placeholder="Nome Completo"]').type(fullName);
    cy.get('input[placeholder="seu@email.com"]').type(email);
    cy.get('input[placeholder="sua senha"]').type(password);
    cy.contains('Criar Conta').click();

    // Should be redirected to dashboard after registration and auto-login
    cy.url().should('include', '/dashboard');
    cy.contains(`Bem-vindo, ${email}`); // Check if user email is displayed

    // Log out
    cy.contains('Sair').click();
    cy.url().should('include', '/login');

    // Log in with the newly registered user
    cy.get('input[placeholder="seu@email.com"]').type(email);
    cy.get('input[placeholder="sua senha"]').type(password);
    cy.contains('Entrar').click();

    // Should be redirected to dashboard again
    cy.url().should('include', '/dashboard');
    cy.contains(`Bem-vindo, ${email}`);
  });

  it('should show an error for invalid login credentials', () => {
    cy.get('input[placeholder="seu@email.com"]').type('nonexistent@example.com');
    cy.get('input[placeholder="sua senha"]').type('wrongpassword');
    cy.contains('Entrar').click();
    cy.contains('Falha no login. Verifique suas credenciais.').should('be.visible');
  });
});
/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/
