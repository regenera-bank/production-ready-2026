import { BadRequestException } from '@nestjs/common';
import { ChannelAncillaryService } from '@regenera/channel-persistence';
import { ConsentService } from './consent.service';

describe('ConsentService', () => {
  let service: ConsentService;
  let ancillary: ChannelAncillaryService;

  beforeEach(() => {
    process.env.CHANNEL_IDENTITY_MEMORY = 'true';
    ancillary = new ChannelAncillaryService();
    ancillary.onModuleInit();
    ancillary.reset();
    service = new ConsentService(ancillary);
  });

  it('exige TERMS e PRIVACY antes de complete', async () => {
    const initial = service.status('user-1');
    expect(initial.complete).toBe(false);
    expect(initial.pending).toEqual(['TERMS_OF_USE', 'PRIVACY_POLICY']);
    await service.accept('user-1', { type: 'TERMS_OF_USE' });
    expect(service.status('user-1').complete).toBe(false);
    await service.accept('user-1', { type: 'PRIVACY_POLICY' });
    expect(service.status('user-1').complete).toBe(true);
  });

  it('revoga consentimento opcional', async () => {
    await service.accept('user-1', { type: 'TERMS_OF_USE' });
    await service.accept('user-1', { type: 'PRIVACY_POLICY' });
    await service.accept('user-1', { type: 'MARKETING' });
    await service.revoke('user-1', 'MARKETING');
    const status = service.status('user-1');
    expect(status.complete).toBe(true);
    expect(status.accepted.map((item) => item.type)).not.toContain('MARKETING');
  });

  it('requireMandatory bloqueia sem consentimentos', () => {
    expect(() => service.requireMandatory('user-1')).toThrow(BadRequestException);
  });
});