import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { BaselineGuard } from './baseline.guard';
import { BaselineService } from './baseline.service';

@Controller('baseline')
@UseGuards(BaselineGuard)
export class BaselineController {
  constructor(private readonly baseline: BaselineService) {}

  @Get('manifest')
  manifest() {
    return this.baseline.manifest();
  }

  @Post('kyc/:userId/approve')
  approveKyc(
    @Param('userId') userId: string,
    @Body() body: { checkerId: string },
  ) {
    return this.baseline.approveKycReview(userId, body.checkerId ?? 'checker');
  }

  @Post('financial/probes')
  async financialProbes() {
    return this.baseline.runFinancialProbes();
  }
}