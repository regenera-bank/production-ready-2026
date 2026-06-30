# Segurança

- nenhum segredo real acompanha este pacote;
- certificados, tokens e chaves são injetados por secret manager;
- logs excluem senha, token, biometria, PAN, CVV, CPF completo e payload documental;
- produção exige TLS válido, pinning/attestation nos canais móveis e MFA adequado ao risco;
- release exige SAST, SCA, secret scanning, SBOM, assinatura do artefato e aprovação segregada;
- qualquer credencial previamente distribuída em ZIP deve ser considerada exposta e rotacionada.
