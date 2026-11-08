import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity('batches')
export class Batch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  batchNumber: string;

  @Column({ type: 'date' })
  expiryDate: string; // YYYY-MM-DD

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @ManyToOne(() => Product, (product) => product.batches, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  productId: number;
}

