import { Injectable, NotFoundException } from '@nestjs/common';

export interface CaseDto {
  readonly caseId: string;
  readonly title: string;
  readonly status: 'OPEN' | 'IN_PROGRESS' | 'ESCALATED' | 'CLOSED';
  readonly priority: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly assignee?: string;
}

export interface CreateCaseInput {
  readonly title: string;
  readonly priority?: CaseDto['priority'];
}

@Injectable()
export class CasesService {
  private readonly cases: CaseDto[] = [
    {
      caseId: 'CASE-1001',
      title: 'AML alert — unusual Pix pattern',
      status: 'OPEN',
      priority: 'HIGH',
    },
    {
      caseId: 'CASE-1002',
      title: 'KYC document mismatch',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      assignee: 'analyst-02',
    },
  ];

  list(): CaseDto[] {
    return this.cases.map((item) => ({ ...item }));
  }

  get(caseId: string): CaseDto {
    const found = this.cases.find((item) => item.caseId === caseId);
    if (!found) {
      throw new NotFoundException({ code: 'CASE_NOT_FOUND', message: caseId });
    }
    return { ...found };
  }

  create(input: CreateCaseInput): CaseDto {
    const created: CaseDto = {
      caseId: `CASE-${1000 + this.cases.length + 1}`,
      title: input.title,
      status: 'OPEN',
      priority: input.priority ?? 'MEDIUM',
    };
    this.cases.push(created);
    return { ...created };
  }

  assign(caseId: string, assignee: string): CaseDto {
    const item = this.get(caseId);
    const updated: CaseDto = { ...item, assignee, status: 'IN_PROGRESS' };
    this.replace(caseId, updated);
    return updated;
  }

  escalate(caseId: string): CaseDto {
    const item = this.get(caseId);
    const updated: CaseDto = { ...item, status: 'ESCALATED', priority: 'HIGH' };
    this.replace(caseId, updated);
    return updated;
  }

  close(caseId: string): CaseDto {
    const item = this.get(caseId);
    const updated: CaseDto = { ...item, status: 'CLOSED' };
    this.replace(caseId, updated);
    return updated;
  }

  private replace(caseId: string, updated: CaseDto): void {
    const index = this.cases.findIndex((item) => item.caseId === caseId);
    this.cases[index] = updated;
  }
}