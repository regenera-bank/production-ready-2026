import { Injectable } from '@nestjs/common';

@Injectable()
export class DataValidClient {
  async validate(document: string) {
    return { valid: true };
  }

  async matchFacialBiometrics(data: any) {
    return { score: 0.99, match: true };
  }
}
