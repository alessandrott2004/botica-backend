import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Sale } from './entities/sale.entity';
import { SaleDetail } from './entities/sale-detail.entity';
import { Product } from '../products/entities/product.entity';
import { Batch } from '../products/entities/batch.entity';
import { CreateSaleDto } from './dto/create-sale.dto';

export interface LowStockAlert {
  productId: number;
  productName: string;
  remainingStock: number;
  minStock: number;
  message: string;
}

export interface SaleResponse {
  sale: Sale;
  lowStockAlerts: LowStockAlert[];
}

@Injectable()
export class SalesService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
  ) {}

  async findAll(): Promise<Sale[]> {
    return this.saleRepository.find({
      relations: {
        customer: true,
        details: {
          product: true,
          batch: true,
        },
      },
      order: { saleDate: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Sale> {
    const sale = await this.saleRepository.findOne({
      where: { id },
      relations: {
        customer: true,
        details: {
          product: true,
          batch: true,
        },
      },
    });
    if (!sale) {
      throw new NotFoundException(`Venta con ID ${id} no encontrada`);
    }
    return sale;
  }

  /**
   * Registro transaccional de venta con estrategia FEFO (First Expired, First Out)
   * y verificación de umbral de stock mínimo en tiempo real.
   */
  async createSale(dto: CreateSaleDto): Promise<SaleResponse> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('La venta debe incluir al menos un producto');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let totalAmount = 0;
      const detailsToSave: SaleDetail[] = [];
      const lowStockAlerts: LowStockAlert[] = [];

      for (const item of dto.items) {
        // Bloqueo y obtención del producto
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: item.productId },
          relations: { batches: true },
        });

        if (!product) {
          throw new NotFoundException(`Producto con ID ${item.productId} no existe`);
        }

        if (product.currentStock < item.quantity) {
          throw new BadRequestException(
            `Stock insuficiente para "${product.name}". Solicitado: ${item.quantity}, disponible: ${product.currentStock}`,
          );
        }

        // FEFO: Ordenar lotes por fecha de caducidad ascendente (los más próximos a vencer salen primero)
        const sortedBatches = (product.batches || [])
          .filter((b) => b.quantity > 0)
          .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

        let remainingToDeduct = item.quantity;

        // Descuento en lotes según FEFO
        for (const batch of sortedBatches) {
          if (remainingToDeduct <= 0) break;

          const deductFromBatch = Math.min(batch.quantity, remainingToDeduct);
          batch.quantity -= deductFromBatch;
          remainingToDeduct -= deductFromBatch;

          await queryRunner.manager.save(Batch, batch);

          // Crear detalle asociado a este lote
          const subtotal = deductFromBatch * Number(product.price);
          const detail = queryRunner.manager.create(SaleDetail, {
            productId: product.id,
            batchId: batch.id,
            quantity: deductFromBatch,
            unitPrice: product.price,
            subtotal: Number(subtotal.toFixed(2)),
          });
          detailsToSave.push(detail);
        }

        // Si no hubiera lotes asignados pero sí currentStock
        if (remainingToDeduct > 0) {
          const subtotal = remainingToDeduct * Number(product.price);
          const detail = queryRunner.manager.create(SaleDetail, {
            productId: product.id,
            batchId: undefined,
            quantity: remainingToDeduct,
            unitPrice: product.price,
            subtotal: Number(subtotal.toFixed(2)),
          });
          detailsToSave.push(detail);
        }

        // Actualizar stock consolidado del producto
        product.currentStock -= item.quantity;
        await queryRunner.manager.save(Product, product);

        totalAmount += item.quantity * Number(product.price);

        // Comprobación de alerta de reposición
        if (product.currentStock <= product.minStock) {
          lowStockAlerts.push({
            productId: product.id,
            productName: product.name,
            remainingStock: product.currentStock,
            minStock: product.minStock,
            message: `¡ALERTA DE REPOSICIÓN! El producto "${product.name}" llegó a ${product.currentStock} unidades (mínimo: ${product.minStock}).`,
          });
        }
      }

      // Guardar cabecera de la venta
      const sale = queryRunner.manager.create(Sale, {
        customerId: dto.customerId ?? undefined,
        paymentMethod: dto.paymentMethod,
        total: Number(totalAmount.toFixed(2)),
        status: 'COMPLETADA',
      });
      const savedSale = await queryRunner.manager.save(Sale, sale);

      // Vincular y guardar detalles
      for (const detail of detailsToSave) {
        detail.saleId = savedSale.id;
      }
      await queryRunner.manager.save(SaleDetail, detailsToSave);

      // Commit atómico
      await queryRunner.commitTransaction();

      // Devolver venta completa con relaciones
      const fullSale = await this.findOne(savedSale.id);

      return {
        sale: fullSale,
        lowStockAlerts,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
