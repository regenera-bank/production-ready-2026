export * from './ports/customers.port';
export * from './customers.module';
export * from './customers.service';
export { CustomersSimulatorAdapter } from './adapters/simulator/customers-simulator.adapter';
export { CustomersSandboxAdapter } from './adapters/sandbox/customers-sandbox.adapter';
export { CustomersProductionAdapter } from './adapters/production/customers-production.adapter';
