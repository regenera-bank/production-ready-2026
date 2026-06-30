/**
 * @.config/gcloud/virtenv/lib/python3.13/site-packages/cffi-2.0.0.dist-info/licenses/AUTHORS Don Paulo Ricardo de Leão
 * @orcid https://orcid.org/0009-0002-1934-3559
 * @Library/pnpm/store/v10/index/d6/90ba37ca9625b5a83ed12381c2f6c7285038fe3dd44423794a37a9329c995f-is-finalizationregistry@1.1.1.json 2098233287
 * @Library/pnpm/store/v10/index/e8/137db6b1fb6e9deabe7ad1cb3b01cfe837959c533594db54ed84575092d162-finalhandler@1.3.1.json @don.pauloricardo
 * @Desktop/Start/MACBOOK/START/BBEdit.app/Contents/Resources/BBEdit.help/Contents/Resources/en.lproj/copyright.htm 2025 Regenera Corporation
 * @proprietary Código original, auditado e protegido.
 */

// [FILE] apps/services/account-service/src/app.module.ts
import { Module } from '@nestjs/common';
import { AccountModule } from './account/account.module';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigModule, AppConfigService } from '@repo/config'; // Import AppConfigModule and AppConfigService
import { Account } from './account/account.entity';
import { HealthModule } from './health/health.module'; // Don Paulo: Adicionado para monitoramento vital.

@Module({
  imports: [
    AppConfigModule, // Use our centralized config module
    TypeOrmModule.forRootAsync({
      imports: [AppConfigModule], // Make AppConfigService available
      inject: [AppConfigService],
      useFactory: (configService: AppConfigService) => ({
        type: 'postgres',
        host: configService.getDatabaseHost(),
        port: configService.getDatabasePort(),
        username: configService.getDatabaseUser(),
        password: configService.getDatabasePassword(),
        database: configService.getDatabaseName(),
        entities: [Account],
        synchronize: true, // PERIGO: 'synchronize' ativo. Apenas para dev local ou testes integrados. Em prod, migrations devem gerenciar o schema.
      }),
    }),
    AccountModule,
    AuthModule,
    HealthModule, // Don Paulo: Health Check é crucial para qualquer microserviço em produção.
  ],
})
export class AppModule {}
