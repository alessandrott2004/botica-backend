import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Category } from './category.entity';
import { Batch } from './batch.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  barcode: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  activeIngredient: string; // Principio activo para sugerir alternativas

  @Column({ nullable: true })
  laboratory: string;

  @Column({ nullable: true })
  presentation: string; // Ej: Tabletas 500mg, Jarabe 120ml

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ type: 'int', default: 0 })
  currentStock: number;

  @Column({ type: 'int', default: 5 })
  minStock: number; // Umbral para alerta de reposición

  @ManyToOne(() => Category, (category) => category.products, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ nullable: true })
  categoryId: number;

  @OneToMany(() => Batch, (batch) => batch.product)
  batches: Batch[];
}

