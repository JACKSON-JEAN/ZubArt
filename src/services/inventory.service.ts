import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from './prisma.service';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private prismaService: PrismaService) {}

  @Cron('*/5 * * * *') // Run every 5 minutes
  async releaseExpiredReservations() {
    this.logger.log('Checking for expired artwork reservations...');
    
    try {
      const result = await this.prismaService.artwork.updateMany({
        where: {
          reservedUntil: { lte: new Date() }, // Reservation expired
          isAvailable: false // Still marked as reserved
        },
        data: {
          reservedUntil: null,
          isAvailable: true
        }
      });

      if (result.count > 0) {
        this.logger.log(`Released ${result.count} expired reservations`);
      }
    } catch (error) {
      this.logger.error('Failed to release expired reservations:', error);
    }
  }
}