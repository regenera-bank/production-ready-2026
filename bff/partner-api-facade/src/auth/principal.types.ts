export type PartnerPrincipal = {
  subject: string;
  clientId: string;
  scopes: Set<string>;
  certificateThumbprint?: string;
};