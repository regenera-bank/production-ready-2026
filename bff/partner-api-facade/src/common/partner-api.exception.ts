export class PartnerApiException extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
    public readonly correlationId?: string,
  ) {
    super(message);
    this.name = 'PartnerApiException';
  }
}