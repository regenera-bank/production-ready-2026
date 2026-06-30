/*
|---------------------------------------------------------------------------------------|
|  --> REGENERA ENTERPRISE SYSTEM v4.0                                                  |
|---------------------------------------------------------------------------------------|

PROJECT:       Regenera Bank
CEO:           Raphaela Cerveski
DEVELOPER:     Don Paulo Ricardo
ID:            2098233287
COPYRIGHT:     Copyright (c) 2026 Regenera Corporate

LICENSE:       EULA (End-User License Agreement)
PROTECTION:    PROPRIEDADE INTELECTUAL RESTRITA

WARNING:       TODOS OS DIREITOS RESERVADOS. Proibida a cópia, distribuição,
               engenharia reversa ou modificação não autorizada.

|---------------------------------------------------------------------------------------|
|  --> CLASSIFICATION: PROPRIETARY // DEVELOPER MAINTAINED // REQUIRES SENIOR REVIEW          |
|---------------------------------------------------------------------------------------|
*/

import { chromium } from '@playwright/test';
import fs from 'fs';

(async () => {
  console.log("Launching Chromium...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    permissions: ['microphone'],
    viewport: { width: 375, height: 812 }, // mobile viewport matching mobile-first layout
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
  });

  // Inject SpeechRecognition mock
  await context.addInitScript(() => {
    console.log("Injecting Mock Speech Recognition...");
    class MockSpeechRecognition {
      constructor() {
        this.lang = 'pt-BR';
        this.continuous = false;
        this.interimResults = false;
        console.log("[MockSpeech] Instantiated MockSpeechRecognition");
      }
      start() {
        console.log("[MockSpeech] start() called");
        if (this.onstart) {
          this.onstart();
        }
        setTimeout(() => {
          console.log("[MockSpeech] Sending transcription result...");
          if (this.onresult) {
            this.onresult({
              results: [
                [
                  { transcript: "Analise minha saúde financeira e sugira alocação de ativos" }
                ]
              ]
            });
          }
          console.log("[MockSpeech] Sending end event...");
          if (this.onend) {
            this.onend();
          }
        }, 2000);
      }
      stop() {
        console.log("[MockSpeech] stop() called");
        if (this.onend) {
          this.onend();
        }
      }
    }
    window.webkitSpeechRecognition = MockSpeechRecognition;
    window.SpeechRecognition = MockSpeechRecognition;
  });

  const page = await context.newPage();

  const auditLog = {
    ourApp: {
      loginPageLoadMs: 0,
      loginSubmitMs: 0,
      homePageLoadMs: 0,
      aiChatSubmitMs: 0,
      aiResponseTimeMs: 0,
      aiResponseText: '',
      colors: {},
      errorLogs: []
    },
    refApp: {
      loginPageLoadMs: 0,
      homePageLoadMs: 0,
      aiChatSubmitMs: 0,
      aiResponseTimeMs: 0,
      aiResponseText: '',
      colors: {},
      errorLogs: []
    }
  };

  // Collect console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      auditLog.ourApp.errorLogs.push(msg.text());
    }
  });

  // --- 1. AUDIT OUR APP ---
  try {
    console.log("\n=================================");
    console.log("1. AUDITING OUR DEPLOYED APP...");
    console.log("=================================");

    const tStart = Date.now();
    await page.goto("https://regenera-bank-enterprise.vercel.app/login");
    await page.waitForLoadState('networkidle');
    auditLog.ourApp.loginPageLoadMs = Date.now() - tStart;
    console.log(`Login page loaded in ${auditLog.ourApp.loginPageLoadMs} ms`);

    // Capture computed colors of login screen
    auditLog.ourApp.colors.loginBg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    console.log(`Our App Login BG: ${auditLog.ourApp.colors.loginBg}`);

    // Select Email mode
    console.log("Clicking EMAIL mode...");
    await page.click('button:has-text("EMAIL")');
    await page.waitForTimeout(500);

    // Fill email & password
    console.log("Filling login credentials...");
    await page.fill('input[type="email"]', 'donpauloricardo@gmail.com');
    await page.fill('input[type="password"]', '270990@Cristo2');

    // Click Acessar Sistema
    const tSubmit = Date.now();
    await page.click('button:has-text("Acessar Sistema")');
    
    // Wait for redirect to /home
    await page.waitForURL('**/home', { timeout: 20000 });
    auditLog.ourApp.homePageLoadMs = Date.now() - tSubmit;
    console.log(`Logged in! Home page loaded in ${auditLog.ourApp.homePageLoadMs} ms`);

    // Capture computed colors of home screen
    auditLog.ourApp.colors.homeBg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    auditLog.ourApp.colors.balanceCardBg = await page.evaluate(() => {
      const card = document.querySelector('.group.border-white\\/10') || document.querySelector('.mx-4');
      return card ? window.getComputedStyle(card).backgroundImage : 'none';
    });
    console.log(`Our App Home BG: ${auditLog.ourApp.colors.homeBg}`);
    console.log(`Our App Balance Card BG: ${auditLog.ourApp.colors.balanceCardBg}`);

    // Navigate to /neural-core
    console.log("Navigating to Neural Core page...");
    const tNeuralStart = Date.now();
    // Locate and click Neural Core Banner
    await page.click('button:has-text("Neural Core")');
    await page.waitForURL('**/neural-core', { timeout: 15000 });
    console.log(`Neural Core page loaded in ${Date.now() - tNeuralStart} ms`);

    // Write prompt
    console.log("Typing prompt into Raphaela...");
    await page.fill('input[placeholder*="Mensagem"]', 'Analise minha saúde financeira e sugira alocação de ativos');
    const tAiSend = Date.now();
    auditLog.ourApp.aiChatSubmitMs = tAiSend;

    console.log("Submitting chat message and waiting for API response...");
    const responsePromise = page.waitForResponse(
      res => res.url().includes('/neural-core/chat') || res.url().includes('chat'),
      { timeout: 30000 }
    );

    await page.click('button[type="submit"]');

    const response = await responsePromise;
    auditLog.ourApp.aiResponseTimeMs = Date.now() - tAiSend;
    auditLog.ourApp.aiResponseStatus = response.status();
    auditLog.ourApp.aiResponseText = await response.text();
    console.log(`[Intercepted] Our App response received in ${auditLog.ourApp.aiResponseTimeMs} ms with status ${response.status()}`);

  } catch (err) {
    console.error("Error auditing our app:", err);
  }

  // --- 2. AUDIT REFERENCE APP ---
  const pageRef = await context.newPage();
  pageRef.on('console', msg => {
    if (msg.type() === 'error') {
      auditLog.refApp.errorLogs.push(msg.text());
    }
  });

  try {
    console.log("\n=================================");
    console.log("2. AUDITING REFERENCE APP...");
    console.log("=================================");

    const tStartRef = Date.now();
    await pageRef.goto("https://regenerabank.app/");
    await pageRef.waitForLoadState('domcontentloaded');
    auditLog.refApp.loginPageLoadMs = Date.now() - tStartRef;
    console.log(`Reference app loaded in ${auditLog.refApp.loginPageLoadMs} ms`);

    // Capture computed colors of reference intro screen
    auditLog.refApp.colors.introBg = await pageRef.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    console.log(`Ref App Intro BG: ${auditLog.refApp.colors.introBg}`);

    // Click "Pular Introdução" or "Acessar Conta"
    console.log("Waiting for Intro Screen and clicking Pular Introdução...");
    await pageRef.waitForSelector('text=Pular Introdução', { timeout: 5000 });
    await pageRef.click('text=Pular Introdução');

    // Wait for LoginScreen to start scanning
    console.log("Waiting for LoginScreen scan to start...");
    await pageRef.waitForSelector('text=Escaneando Íris...', { timeout: 5000 });

    // Capture computed colors of reference login screen
    auditLog.refApp.colors.loginBg = await pageRef.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    console.log(`Ref App Login BG: ${auditLog.refApp.colors.loginBg}`);

    // Wait 5-6 seconds for biometric auto-login and home page redirect
    console.log("Waiting for biometric auto-login to complete...");
    await pageRef.waitForSelector('text=Visão Geral', { timeout: 15000 });
    auditLog.refApp.homePageLoadMs = Date.now() - tStartRef;
    console.log(`Ref App Dashboard auto-loaded in ${auditLog.refApp.homePageLoadMs} ms`);

    // Capture computed colors of reference home screen
    auditLog.refApp.colors.homeBg = await pageRef.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    auditLog.refApp.colors.balanceCardBg = await pageRef.evaluate(() => {
      const card = document.querySelector('.group.transition-all') || document.querySelector('.mx-4');
      return card ? window.getComputedStyle(card).backgroundImage || window.getComputedStyle(card).backgroundColor : 'none';
    });
    console.log(`Ref App Home BG: ${auditLog.refApp.colors.homeBg}`);
    console.log(`Ref App Balance Card BG: ${auditLog.refApp.colors.balanceCardBg}`);

    // Trigger Raphaela AGI prompt via microphone orb click
    console.log("Triggering Raphaela AGI prompt via microphone orb click...");
    const tAiSendRef = Date.now();
    auditLog.refApp.aiChatSubmitMs = tAiSendRef;

    const refResponsePromise = pageRef.waitForResponse(
      res => res.url().includes('generativeLanguage.googleapis') || res.url().includes('gemini'),
      { timeout: 45000 }
    );

    // Click the central Orb
    await pageRef.click('[title="Ativar Raphaela AI"]').catch(async () => {
      // fallback
      await pageRef.click('.relative.w-16.h-16');
    });

    console.log("Orb clicked. Speech recognition mock will run for 2s, then send query...");

    const refResponse = await refResponsePromise;
    auditLog.refApp.aiResponseTimeMs = Date.now() - tAiSendRef;
    auditLog.refApp.aiResponseStatus = refResponse.status();
    auditLog.refApp.aiResponseText = await refResponse.text();

    console.log(`[Intercepted Ref] Direct Gemini API response received in ${auditLog.refApp.aiResponseTimeMs} ms with status ${refResponse.status()}`);

  } catch (err) {
    console.error("Error auditing reference app:", err);
  }

  // --- SAVE AUDIT RESULTS ---
  console.log("\nSaving results to audit_results.json...");
  fs.writeFileSync('/Users/regeneracorporateltdacopyright/Documents/ok deploy/regenera ultimo/ORGANIZAÇÃO/03-enterprise-web-platform/audit_results.json', JSON.stringify(auditLog, null, 2));
  console.log("Results saved successfully!");

  await browser.close();
  console.log("Chromium closed. Audit completed successfully.");
})();
