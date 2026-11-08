import { Controller, Get, Post, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, AddBatchDto } from './dto/create-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.productsService.findAll(search);
  }

  @Get('alerts/low-stock')
  getLowStockAlerts() {
    return this.productsService.getLowStockAlerts();
  }

  @Get('barcode/:barcode')
  findByBarcode(@Param('barcode') barcode: string) {
    return this.productsService.findByBarcode(barcode);
  }

  @Get('equivalents')
  findEquivalents(
    @Query('activeIngredient') activeIngredient: string,
    @Query('excludeId') excludeId?: string,
  ) {
    const id = excludeId ? parseInt(excludeId, 10) : undefined;
    return this.productsService.findEquivalents(activeIngredient, id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Post(':id/batches')
  addBatch(
    @Param('id', ParseIntPipe) id: number,
    @Body() addBatchDto: AddBatchDto,
  ) {
    return this.productsService.addBatch(id, addBatchDto);
  }
}

