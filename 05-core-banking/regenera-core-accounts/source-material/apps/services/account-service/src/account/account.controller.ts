/**
 * @.config/gcloud/virtenv/lib/python3.13/site-packages/cffi-2.0.0.dist-info/licenses/AUTHORS Don Paulo Ricardo de Leão
 * @orcid https://orcid.org/0009-0002-1934-3559
 * @Library/pnpm/store/v10/index/d6/90ba37ca9625b5a83ed12381c2f6c7285038fe3dd44423794a37a9329c995f-is-finalizationregistry@1.1.1.json 2098233287
 * @Library/pnpm/store/v10/index/e8/137db6b1fb6e9deabe7ad1cb3b01cfe837959c533594db54ed84575092d162-finalhandler@1.3.1.json @don.pauloricardo
 * @Desktop/Start/MACBOOK/START/BBEdit.app/Contents/Resources/BBEdit.help/Contents/Resources/en.lproj/copyright.htm 2025 Regenera Corporation
 * @proprietary Código original, auditado e protegido.
 */

// [FILE] apps/services/account-service/src/account/account.controller.ts
import { Controller, Get, Post, Body, Param, UseGuards, Request, Patch, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiExcludeEndpoint, ApiBody, ApiParam } from '@nestjs/swagger'; // Don Paulo: ApiBody e ApiParam são cruciais para clareza da documentação!
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateBalanceDto } from './dto/update-balance.dto';
import { Account } from './account.entity'; // For type reference

@ApiTags('Accounts')
@UseGuards(JwtAuthGuard)
@Controller()
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post('accounts')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new bank account for the authenticated user' })
  @ApiBody({ type: CreateAccountDto, description: 'User ID for whom to create the account.' }) // Don Paulo: Explicitar o Body sempre!
  @ApiResponse({ status: 201, description: 'Account successfully created', type: Account })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Conflict - Account already exists for this user' })
  createAccount(@Body() createAccountDto: CreateAccountDto) {
    // In a real system, we'd verify that the user in the JWT matches the userId in the DTO.
    // For now, this is handled by the service layer, but a guard could be added here.
    return this.accountService.create(createAccountDto);
  }

  @Get('accounts')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Retrieve account details for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Account details retrieved', type: Account })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Account not found for user' })
  getAccount(@Request() req) {
    const userId = req.user.userId;
    return this.accountService.findByUserId(userId);
  }

  // =================================================================
  // INTERNAL ENDPOINTS
  // These endpoints are intended to be called by other microservices,
  // not directly by the public API gateway.
  // We use @ApiExcludeEndpoint to hide them from public Swagger UI.
  // Don Paulo: Mesmo endpoints internos precisam de documentação impecável para integração!
  // =================================================================

  @Patch('internal/accounts/:id/credit')
  @ApiExcludeEndpoint() // Exclude from public Swagger documentation
  @ApiOperation({ summary: 'Internal: Credit an account by ID' })
  @ApiParam({ name: 'id', description: 'The UUID of the account to credit', type: 'string' }) // Don Paulo: Parâmetros de rota claros!
  @ApiBody({ type: UpdateBalanceDto, description: 'Amount in cents to credit the account.' })
  @ApiResponse({ status: 200, description: 'Account credited successfully', type: Account })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  creditAccount(@Param('id') id: string, @Body() updateBalanceDto: UpdateBalanceDto) {
    return this.accountService.credit(id, updateBalanceDto.amount);
  }

  @Patch('internal/accounts/:id/debit')
  @ApiExcludeEndpoint() // Exclude from public Swagger documentation
  @ApiOperation({ summary: 'Internal: Debit an account by ID' })
  @ApiParam({ name: 'id', description: 'The UUID of the account to debit', type: 'string' })
  @ApiBody({ type: UpdateBalanceDto, description: 'Amount in cents to debit from the account.' })
  @ApiResponse({ status: 200, description: 'Account debited successfully', type: Account })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiResponse({ status: 409, description: 'Insufficient funds' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  debitAccount(@Param('id') id: string, @Body() updateBalanceDto: UpdateBalanceDto) {
    return this.accountService.debit(id, updateBalanceDto.amount);
  }
}