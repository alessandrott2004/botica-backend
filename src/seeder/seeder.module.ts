import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../products/entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { Batch } from '../products/entities/batch.entity';
import { Customer } from '../customers/entities/customer.entity';
import { SeederService } from './seeder.service';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Product, Batch, Customer])],
  providers: [SeederService],
})
export class SeederModule {}

