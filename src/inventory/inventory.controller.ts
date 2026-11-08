import { Controller, Get, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('dashboard')
  getDashboardSummary() {
    return this.inventoryService.getDashboardSummary();
  }

  @Get('alerts/low-stock')
  getLowStockAlerts() {
    return this.inventoryService.getLowStockAlerts();
  }

  @Get('alerts/expiring')
  getExpiringBatches(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 60;
    return this.inventoryService.getExpiringBatches(daysNum);
  }
}

