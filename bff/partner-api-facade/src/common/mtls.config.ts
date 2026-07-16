export type MtlsConfigSpec = {
  required: boolean;
  minTlsVersion: 'TLSv1.2' | 'TLSv1.3';
  requestClientCert: boolean;
  rejectUnauthorized: boolean;
  certificateBinding: 'x5t#S256';
  notes: string[];
};

export function mtlsConfigSpec(): MtlsConfigSpec {
  const sandbox = process.env.PARTNER_SANDBOX_MODE?.trim().toLowerCase() !== 'false';
  const required =
    process.env.PARTNER_MTLS_REQUIRED?.trim().toLowerCase() === 'true' || !sandbox;

  return {
    required,
    minTlsVersion: 'TLSv1.2',
    requestClientCert: true,
    rejectUnauthorized: required,
    certificateBinding: 'x5t#S256',
    notes: [
      'Access tokens MUST bind to client certificate thumbprint via JWT cnf.x5t#S256 claim.',
      'Production terminates TLS at ingress with client certificate validation.',
      'Sandbox allows PARTNER_MTLS_REQUIRED=false for local developer portal testing.',
    ],
  };
}