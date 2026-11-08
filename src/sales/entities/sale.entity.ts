import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, JoinColumn } from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { SaleDetail } from './sale-detail.entity';

@Entity('sales')
export class Sale {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  saleDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ default: 'EFECTIVO' }) // EFECTIVO, TARJETA, YAPE, PLIN
  paymentMethod: string;

  @Column({ default: 'COMPLETADA' }) // COMPLETADA, ANULADA
  status: string;

  @ManyToOne(() => Customer, (customer) => customer.sales, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column({ nullable: true })
  customerId: number;

  @OneToMany(() => SaleDetail, (detail) => detail.sale, { cascade: true })
  details: SaleDetail[];
}

