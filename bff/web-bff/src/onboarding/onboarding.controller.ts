import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { SessionGuard } from '../auth/session.guard';
import { SessionRecord } from '../auth/auth.service';
import { BankingService } from '../banking/banking.service';
import { OnboardingService } from './onboarding.service';
import {
  resolveDocumentContent,
  resolveSelfieContent,
  type KycDocumentBody,
  type KycSelfieBody,
} from './onboarding-kyc-contract';

type AuthedRequest = Request & { session: SessionRecord };

interface ProfileBody {
  document: string;
  displayName: string;
  email: string;
  phone: string;
  birthDate: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    postalCode: string;
  };
}

@Controller('onboarding')
export class OnboardingController {
  constructor(
    private readonly onboarding: OnboardingService,
    private readonly banking: BankingService,
  ) {}

  @Get('status')
  @UseGuards(SessionGuard)
  status(@Req() req: AuthedRequest) {
    return this.onboarding.getStatus(req.session.userId);
  }

  @Post('profile')
  @UseGuards(SessionGuard)
  updateProfile(@Req() req: AuthedRequest, @Body() body: ProfileBody) {
    return this.onboarding.updateProfile(req.session.userId, body);
  }

  @Post('kyc/submit')
  @UseGuards(SessionGuard)
  submitKyc(@Req() req: AuthedRequest) {
    return this.onboarding.submitKyc(req.session.userId);
  }

  @Post('kyc/retry')
  @UseGuards(SessionGuard)
  retryKyc(@Req() req: AuthedRequest) {
    return this.onboarding.resetCadastralKyc(req.session.userId);
  }

  @Post('kyc/retry-biometric')
  @UseGuards(SessionGuard)
  retryBiometricKyc(@Req() req: AuthedRequest) {
    return this.onboarding.resetBiometricKyc(req.session.userId);
  }

  @Post('kyc/document')
  @UseGuards(SessionGuard)
  submitDocument(@Req() req: AuthedRequest, @Body() body: KycDocumentBody) {
    return this.onboarding.submitDocument(
      req.session.userId,
      resolveDocumentContent(body),
      body.type ?? 'RG',
    );
  }

  @Post('kyc/selfie')
  @UseGuards(SessionGuard)
  submitSelfie(@Req() req: AuthedRequest, @Body() body: KycSelfieBody) {
    return this.onboarding.submitSelfie(
      req.session.userId,
      resolveSelfieContent(body),
    );
  }

  @Post('kyc/didit/session')
  @UseGuards(SessionGuard)
  createDiditSession(
    @Req() req: AuthedRequest,
    @Body()
    body: {
      documentType?: 'RG' | 'CNH';
      documentFormat?: 'physical' | 'digital';
      forceNew?: boolean;
    },
  ) {
    return this.createDiditSessionForUser(req, body);
  }

  /** Compatível com regenera-real-flow-html-v2 */
  @Post('didit/session')
  @UseGuards(SessionGuard)
  createDiditSessionV2(
    @Req() req: AuthedRequest,
    @Body()
    body: {
      documentType?: 'RG' | 'CNH';
      documentFormat?: 'physical' | 'digital';
      journeyId?: string;
      vendorData?: string;
      customerDraftId?: string;
      channel?: string;
      callback?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    return this.createDiditSessionForUser(req, body);
  }

  @Post('kyc/didit/sync')
  @UseGuards(SessionGuard)
  syncDiditKyc(@Req() req: AuthedRequest) {
    return this.onboarding.syncDiditKyc(req.session.userId);
  }

  @Post('kyc/didit/retry')
  @UseGuards(SessionGuard)
  retryDiditKyc(@Req() req: AuthedRequest) {
    return this.onboarding.resetDiditKyc(req.session.userId);
  }

  /** Compatível com regenera-real-flow-html-v2 — GET ?journeyId= */
  @Get('didit/status')
  @UseGuards(SessionGuard)
  async syncDiditKycV2(
    @Req() req: AuthedRequest,
    @Query('journeyId') journeyId?: string,
  ) {
    const status = await this.onboarding.syncDiditKyc(req.session.userId);
    return {
      journeyId: journeyId?.trim() || undefined,
      diditStatus: status.diditStatus,
      diditDecision: status.diditDecision,
      diditWebhookTrust: status.diditWebhookTrust,
      diditSessionId: status.diditSessionId,
      kycStatus: status.kycStatus,
      kycStep: status.kycStep,
    };
  }

  private async createDiditSessionForUser(
    req: AuthedRequest,
    body: {
      documentType?: 'RG' | 'CNH';
      documentFormat?: 'physical' | 'digital';
      forceNew?: boolean;
    },
  ) {
    const session = await this.onboarding.createDiditSession(req.session.userId, {
      documentType: body.documentType,
      documentFormat: body.documentFormat,
      forceNew: body.forceNew,
    });
    return {
      ...session,
      providerSessionId: session.sessionId,
      session_url: session.url,
      verificationUrl: session.url,
    };
  }

  @Post('account/open')
  @UseGuards(SessionGuard)
  async openAccount(@Req() req: AuthedRequest) {
    this.onboarding.requireKycApproved(req.session.userId);
    const opened = await this.banking.openCustomerAccount(req.session.userId);
    this.onboarding.markAccountActive(req.session.userId);
    const welcomeCents = BigInt(opened.welcomeCreditCents);
    return {
      accountId: opened.accountId,
      accountStatus: 'ACTIVE' as const,
      welcomeCreditCents: opened.welcomeCreditCents,
      message:
        welcomeCents > 0n
          ? 'Conta aberta com R$ 1,00 de crédito homolog — pronta para operar'
          : 'Conta aberta — pronta para operar',
    };
  }
}