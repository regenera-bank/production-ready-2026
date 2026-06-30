import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { RequirePermission } from '../auth/require-permission.decorator';
import { CasesService, CreateCaseInput } from './cases.service';

@Controller('cases')
@RequirePermission('cases:manage')
export class CasesController {
  constructor(private readonly cases: CasesService) {}

  @Get()
  list() {
    return this.cases.list();
  }

  @Get(':caseId')
  get(@Param('caseId') caseId: string) {
    return this.cases.get(caseId);
  }

  @Post()
  create(@Body() body: CreateCaseInput) {
    return this.cases.create(body);
  }

  @Patch(':caseId/assign')
  assign(@Param('caseId') caseId: string, @Body() body: { assignee: string }) {
    return this.cases.assign(caseId, body.assignee);
  }

  @Patch(':caseId/escalate')
  escalate(@Param('caseId') caseId: string) {
    return this.cases.escalate(caseId);
  }

  @Patch(':caseId/close')
  close(@Param('caseId') caseId: string) {
    return this.cases.close(caseId);
  }
}