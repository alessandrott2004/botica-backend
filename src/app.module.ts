import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from './products/products.module';
import { CustomersModule } from './customers/customers.module';
import { SalesModule } from './sales/sales.module';
import { InventoryModule } from './inventory/inventory.module';
import { SeederModule } from './seeder/seeder.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'botica.db',
      autoLoadEntities: true,
      synchronize: true, // Sincronización automática de entidades para SQLite en desarrollo
      logging: false,
    }),
    ProductsModule,
    CustomersModule,
    SalesModule,
    InventoryModule,
    SeederModule,
  ],
})
export class AppModule {}
