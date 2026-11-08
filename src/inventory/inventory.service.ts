import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { Batch } from '../products/entities/batch.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Batch)
    private readonly batchRepository: Repository<Batch>,
  ) {}

  async getDashboardSummary() {
    const products = await this.productRepository.find({ relations: { batches: true, category: true } });

    const totalProducts = products.length;
    let totalStockUnits = 0;
    let totalInventoryValue = 0;
    let lowStockCount = 0;

    for (const p of products) {
      totalStockUnits += p.currentStock;
      totalInventoryValue += p.currentStock * Number(p.price);
      if (p.currentStock <= p.minStock) {
        lowStockCount++;
      }
    }

    return {
      totalProducts,
      totalStockUnits,
      totalInventoryValue: Number(totalInventoryValue.toFixed(2)),
      lowStockCount,
    };
  }

  // Alertas de productos bajo o igual al stock mínimo
  async getLowStockAlerts() {
    return this.productRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'cat')
      .where('p.currentStock <= p.minStock')
      .orderBy('p.currentStock', 'ASC')
      .getMany();
  }

  // Lotes por vencer dentro de los próximos N días (por defecto 60)
  async getExpiringBatches(days: number = 60) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    const targetDateStr = targetDate.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];

    return this.batchRepository
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.product', 'prod')
      .where('b.quantity > 0')
      .andWhere('b.expiryDate <= :targetDate', { targetDate: targetDateStr })
      .andWhere('b.expiryDate >= :today', { today: todayStr })
      .orderBy('b.expiryDate', 'ASC')
      .getMany();
  }
}
