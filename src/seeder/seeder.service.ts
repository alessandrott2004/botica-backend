import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../products/entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { Batch } from '../products/entities/batch.entity';
import { Customer } from '../customers/entities/customer.entity';

@Injectable()
export class SeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Batch)
    private readonly batchRepo: Repository<Batch>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
  ) {}

  async onApplicationBootstrap() {
    const categoriesCount = await this.categoryRepo.count();
    if (categoriesCount > 0) {
      this.logger.log('Base de datos ya cuenta con datos iniciales.');
      return;
    }

    this.logger.log('Iniciando sembrado de datos (Seeder) para la botica "Nova Salud"...');

    // 1. Categorías
    const catAnalgesicos = await this.categoryRepo.save({
      name: 'Analgésicos y Antipiréticos',
      description: 'Medicamentos para aliviar el dolor y reducir la fiebre',
    });

    const catAntibioticos = await this.categoryRepo.save({
      name: 'Antibióticos',
      description: 'Tratamiento de infecciones bacterianas',
    });

    const catAntiinflamatorios = await this.categoryRepo.save({
      name: 'Antiinflamatorios',
      description: 'Reducción de inflamación y dolor',
    });

    const catGastro = await this.categoryRepo.save({
      name: 'Gastroenterología',
      description: 'Antiácidos y protectores gástricos',
    });

    // 2. Clientes
    await this.customerRepo.save([
      { documentNumber: '47891234', fullName: 'Carlos Ramos Pérez', phone: '987654321', email: 'carlos.ramos@gmail.com' },
      { documentNumber: '71234567', fullName: 'María Elena Flores', phone: '912345678', email: 'maria.flores@outlook.com' },
    ]);

    // 3. Productos y Lotes
    // Paracetamol Genérico
    const p1 = await this.productRepo.save({
      barcode: '7750001001',
      name: 'Paracetamol 500mg (Genérico)',
      activeIngredient: 'Paracetamol',
      laboratory: 'Laboratorios Portugal',
      presentation: 'Caja x 100 Tabletas',
      price: 0.50,
      currentStock: 60,
      minStock: 20,
      categoryId: catAnalgesicos.id,
    });
    await this.batchRepo.save([
      { batchNumber: 'LOT-PAR-2024A', expiryDate: '2027-05-15', quantity: 30, productId: p1.id },
      { batchNumber: 'LOT-PAR-2024B', expiryDate: '2027-11-20', quantity: 30, productId: p1.id },
    ]);

    // Panadol (Marca comercial con mismo principio activo para probar sugerencias de equivalentes)
    const p2 = await this.productRepo.save({
      barcode: '7750001002',
      name: 'Panadol Forte 500mg',
      activeIngredient: 'Paracetamol',
      laboratory: 'GSK',
      presentation: 'Caja x 24 Tabletas',
      price: 2.20,
      currentStock: 4, // Stock bajo a propósito para disparar alerta!
      minStock: 10,
      categoryId: catAnalgesicos.id,
    });
    await this.batchRepo.save([
      { batchNumber: 'LOT-PAN-9921', expiryDate: '2026-12-30', quantity: 4, productId: p2.id },
    ]);

    // Amoxicilina
    const p3 = await this.productRepo.save({
      barcode: '7750001003',
      name: 'Amoxicilina 500mg',
      activeIngredient: 'Amoxicilina',
      laboratory: 'Medifarma',
      presentation: 'Caja x 50 Cápsulas',
      price: 1.20,
      currentStock: 45,
      minStock: 15,
      categoryId: catAntibioticos.id,
    });
    await this.batchRepo.save([
      { batchNumber: 'LOT-AMX-501', expiryDate: '2028-01-10', quantity: 45, productId: p3.id },
    ]);

    // Ibuprofeno
    const p4 = await this.productRepo.save({
      barcode: '7750001004',
      name: 'Ibuprofeno 400mg',
      activeIngredient: 'Ibuprofeno',
      laboratory: 'Farmindustria',
      presentation: 'Caja x 100 Tabletas',
      price: 0.80,
      currentStock: 80,
      minStock: 25,
      categoryId: catAntiinflamatorios.id,
    });
    await this.batchRepo.save([
      { batchNumber: 'LOT-IBU-102', expiryDate: '2027-08-01', quantity: 80, productId: p4.id },
    ]);

    // Omeprazol
    const p5 = await this.productRepo.save({
      barcode: '7750001005',
      name: 'Omeprazol 20mg',
      activeIngredient: 'Omeprazol',
      laboratory: 'Hersil',
      presentation: 'Caja x 30 Cápsulas',
      price: 1.50,
      currentStock: 2, // Stock crítico para probar alerta de reposición
      minStock: 12,
      categoryId: catGastro.id,
    });
    await this.batchRepo.save([
      { batchNumber: 'LOT-OME-004', expiryDate: '2026-12-15', quantity: 2, productId: p5.id },
    ]);

    this.logger.log('Sembrado inicial completado con éxito.');
  }
}

