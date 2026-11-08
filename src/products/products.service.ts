import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Product } from './entities/product.entity';
import { Batch } from './entities/batch.entity';
import { Category } from './entities/category.entity';
import { CreateProductDto, AddBatchDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Batch)
    private readonly batchRepository: Repository<Batch>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async findAll(search?: string): Promise<Product[]> {
    if (!search) {
      return this.productRepository.find({
        relations: { category: true, batches: true },
        order: { name: 'ASC' },
      });
    }

    // Búsqueda inteligente: nombre comercial, principio activo o código de barra
    return this.productRepository.find({
      where: [
        { name: Like(`%${search}%`) },
        { activeIngredient: Like(`%${search}%`) },
        { barcode: Like(`%${search}%`) },
      ],
      relations: { category: true, batches: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: { category: true, batches: true },
    });
    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }
    return product;
  }

  async findByBarcode(barcode: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { barcode },
      relations: { category: true, batches: true },
    });
    if (!product) {
      throw new NotFoundException(`Producto con código de barras ${barcode} no encontrado`);
    }
    return product;
  }

  // Sugerir equivalentes por principio activo (ej. cuando no hay stock del solicitado)
  async findEquivalents(activeIngredient: string, excludeId?: number): Promise<Product[]> {
    if (!activeIngredient) return [];

    const query = this.productRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.batches', 'batches')
      .leftJoinAndSelect('p.category', 'category')
      .where('LOWER(p.activeIngredient) = LOWER(:activeIngredient)', { activeIngredient })
      .andWhere('p.currentStock > 0');

    if (excludeId) {
      query.andWhere('p.id != :excludeId', { excludeId });
    }

    return query.getMany();
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create(createProductDto);
    return this.productRepository.save(product);
  }

  // Agregar lote y actualizar stock consolidado
  async addBatch(productId: number, addBatchDto: AddBatchDto): Promise<Batch> {
    const product = await this.findOne(productId);

    const batch = this.batchRepository.create({
      ...addBatchDto,
      productId: product.id,
    });
    const savedBatch = await this.batchRepository.save(batch);

    // Actualizar stock consolidado del producto
    product.currentStock += addBatchDto.quantity;
    await this.productRepository.save(product);

    return savedBatch;
  }

  // Alertas de reposición: productos con stock igual o inferior al stock mínimo
  async getLowStockAlerts(): Promise<Product[]> {
    return this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.currentStock <= product.minStock')
      .orderBy('product.currentStock', 'ASC')
      .getMany();
  }
}
