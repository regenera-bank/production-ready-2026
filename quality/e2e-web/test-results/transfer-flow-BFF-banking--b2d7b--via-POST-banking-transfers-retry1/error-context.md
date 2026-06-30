# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: transfer-flow.spec.ts >> BFF banking — transfer flow >> transfere entre contas homolog via POST /banking/transfers
- Location: tests/transfer-flow.spec.ts:10:3

# Error details

```
Error: register 60746948030 failed: 409 {"message":"CPF já cadastrado","error":"Conflict","statusCode":409}
```

# Test source

```ts
  1   | import type { APIRequestContext } from '@playwright/test';
  2   | 
  3   | const sampleAddress = {
  4   |   street: 'Rua das Flores',
  5   |   number: '100',
  6   |   neighborhood: 'Centro',
  7   |   city: 'São Paulo',
  8   |   state: 'SP',
  9   |   postalCode: '01310-100',
  10  | };
  11  | 
  12  | const homologImage = (fillByte = 0xab): string => {
  13  |   const payload = Buffer.alloc(12_000, fillByte);
  14  |   return `data:image/png;base64,${payload.toString('base64')}`;
  15  | };
  16  | 
  17  | export interface SessionDto {
  18  |   accessToken: string;
  19  |   userId: string;
  20  |   displayName: string;
  21  |   expiresAt: string;
  22  |   kycStatus: string;
  23  |   accountStatus: string;
  24  | }
  25  | 
  26  | export const authHeaders = (token: string): Record<string, string> => ({
  27  |   Authorization: `Bearer ${token}`,
  28  | });
  29  | 
  30  | export async function registerUser(
  31  |   request: APIRequestContext,
  32  |   document: string,
  33  |   displayName: string,
  34  | ): Promise<SessionDto> {
  35  |   const response = await request.post('auth/register', {
  36  |     data: {
  37  |       document,
  38  |       password: 'secret-e2e',
  39  |       displayName,
  40  |       email: `${document}@e2e.regenera.test`,
  41  |       phone: '11999990000',
  42  |       birthDate: '1990-05-15',
  43  |       address: sampleAddress,
  44  |     },
  45  |   });
  46  |   if (!response.ok()) {
> 47  |     throw new Error(`register ${document} failed: ${response.status()} ${await response.text()}`);
      |           ^ Error: register 60746948030 failed: 409 {"message":"CPF já cadastrado","error":"Conflict","statusCode":409}
  48  |   }
  49  |   return response.json() as Promise<SessionDto>;
  50  | }
  51  | 
  52  | export async function loginUser(
  53  |   request: APIRequestContext,
  54  |   document: string,
  55  |   password = 'secret-e2e',
  56  | ): Promise<SessionDto> {
  57  |   const response = await request.post('auth/session', {
  58  |     data: { document, password },
  59  |   });
  60  |   if (!response.ok()) {
  61  |     throw new Error(`login ${document} failed: ${response.status()} ${await response.text()}`);
  62  |   }
  63  |   return response.json() as Promise<SessionDto>;
  64  | }
  65  | 
  66  | export async function completeKycAndOpenAccount(
  67  |   request: APIRequestContext,
  68  |   token: string,
  69  | ): Promise<void> {
  70  |   const headers = authHeaders(token);
  71  |   const submit = await request.post('onboarding/kyc/submit', { headers });
  72  |   if (!submit.ok()) {
  73  |     throw new Error(`kyc/submit failed: ${submit.status()} ${await submit.text()}`);
  74  |   }
  75  | 
  76  |   const document = await request.post('onboarding/kyc/document', {
  77  |     headers,
  78  |     data: { fileBase64: homologImage(0xab), type: 'RG' },
  79  |   });
  80  |   if (!document.ok()) {
  81  |     throw new Error(`kyc/document failed: ${document.status()} ${await document.text()}`);
  82  |   }
  83  | 
  84  |   const selfie = await request.post('onboarding/kyc/selfie', {
  85  |     headers,
  86  |     data: { selfieBase64: homologImage(0xcd) },
  87  |   });
  88  |   if (!selfie.ok()) {
  89  |     throw new Error(`kyc/selfie failed: ${selfie.status()} ${await selfie.text()}`);
  90  |   }
  91  | 
  92  |   const open = await request.post('onboarding/account/open', { headers });
  93  |   if (!open.ok()) {
  94  |     throw new Error(`account/open failed: ${open.status()} ${await open.text()}`);
  95  |   }
  96  | }
  97  | 
  98  | export async function getDashboard(
  99  |   request: APIRequestContext,
  100 |   token: string,
  101 | ): Promise<{ balanceCents: string; availableCents: string }> {
  102 |   const response = await request.get('banking/dashboard', {
  103 |     headers: authHeaders(token),
  104 |   });
  105 |   if (!response.ok()) {
  106 |     throw new Error(`dashboard failed: ${response.status()} ${await response.text()}`);
  107 |   }
  108 |   return response.json() as Promise<{ balanceCents: string; availableCents: string }>;
  109 | }
```