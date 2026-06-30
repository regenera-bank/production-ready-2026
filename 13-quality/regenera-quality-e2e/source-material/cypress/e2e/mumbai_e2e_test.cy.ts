// cypress/e2e/mumbai_e2e_test.cy.ts
/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - E2E TEST (MUMBAI TESTNET)
  Feature: On-Chain Transaction Flow
   
  Developer: Don Paulo Ricardo
   
  Nota: Este é um teste E2E que simula um fluxo de usuário real na nossa aplicação
  conectada à testnet Polygon Mumbai. Ele depende de um ambiente de teste funcional.
  O ideal é que os dados de teste (usuário, saldo inicial) sejam semeados
  no banco de dados antes da execução do teste.
═══════════════════════════════════════════════════════════════════════════════
*/

describe('Fluxo de Transação On-Chain (Mumbai)', () => {
  const TEST_USER = {
    email: 'test-user-mumbai@regenera.bank',
    password: 'password-segura-de-teste',
    walletAddress: '0x1234...AbCd', // Endereço de carteira para o teste
  };
  const RECIPIENT_ADDRESS = '0x5678...EfGh';
  const TRANSFER_AMOUNT = '0.01'; // Em MATIC

  beforeEach(() => {
    // Mock da resposta da API de login para não depender de um token real sempre.
    // Em um cenário real, poderíamos ter um endpoint de teste para gerar tokens.
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        accessToken: 'mock-jwt-token-for-testing',
        user: { email: TEST_USER.email, id: 'uuid-test-user' },
      },
    }).as('loginRequest');

    // Visita a página e faz login
    cy.visit('/login');
    cy.get('[data-cy="email-input"]').type(TEST_USER.email);
    cy.get('[data-cy="password-input"]').type(TEST_USER.password);
    cy.get('[data-cy="login-button"]').click();
    cy.wait('@loginRequest');

    // Navega para o dashboard após o login
    cy.url().should('include', '/dashboard');
  });

  it('deve realizar uma transferência, simular a assinatura e verificar o histórico', () => {
    // 1. Navegar para a página de transferência
    cy.get('[data-cy="transfer-nav-link"]').click();
    cy.url().should('include', '/transfer');

    // 2. Preencher os dados da transferência
    cy.get('[data-cy="recipient-address-input"]').type(RECIPIENT_ADDRESS);
    cy.get('[data-cy="transfer-amount-input"]').type(TRANSFER_AMOUNT);
    
    // Intercepta a chamada para o backend que inicia a transação
    cy.intercept('POST', '/api/transactions/initiate', {
      statusCode: 201,
      body: {
        transactionId: `mock-tx-${Date.now()}`,
        unsignedTxData: '0x_mock_unsigned_transaction_data',
      },
    }).as('initiateTransaction');

    cy.get('[data-cy="initiate-transfer-button"]').click();
    cy.wait('@initiateTransaction');

    // 3. Simulação da interação com a carteira (Metamask)
    // O Cypress não pode controlar o Metamask diretamente.
    // O front-end, em modo de teste (CYPRESS=true), deve detectar isso
    // e "assinar" a transação automaticamente, sem abrir o popup.
    cy.log('//-- SIMULAÇÃO DE ASSINATURA DE CARTEIRA --//');
    // O front-end, ao receber o 'unsignedTxData', chamaria o provedor da carteira.
    // Em teste, ele pularia isso e iria direto para o próximo passo.
    
    // Intercepta a chamada de broadcast da transação assinada
    cy.intercept('POST', '/api/transactions/broadcast', (req) => {
      expect(req.body.signedTxData).to.exist;
      req.reply({
        statusCode: 200,
        body: {
          transactionHash: `0x_mock_mumbai_tx_hash_${Date.now()}`,
          status: 'PENDING',
        },
      });
    }).as('broadcastTransaction');

    // O front-end faria essa chamada após a "assinatura".
    // Para o teste, podemos simular o evento que dispara isso.
    cy.window().trigger('mock_wallet_signed', { signedTxData: '0x_mock_signed_data' });
    cy.wait('@broadcastTransaction');
    
    // 4. Verificar se o usuário foi redirecionado para a tela de sucesso
    cy.get('[data-cy="transfer-success-message"]').should('be.visible');
    cy.get('[data-cy="transaction-hash-link"]')
      .should('have.attr', 'href')
      .and('include', 'mumbai.polygonscan.com/tx/');

    // 5. Verificar se a transação aparece no histórico
    cy.get('[data-cy="history-nav-link"]').click();
    cy.url().should('include', '/history');

    cy.get('[data-cy="transaction-list"]')
      .children()
      .first()
      .should('contain', RECIPIENT_ADDRESS)
      .and('contain', `${TRANSFER_AMOUNT} MATIC`)
      .and('contain', 'PENDING'); // Ou 'COMPLETED' dependendo da velocidade da testnet
  });
});
