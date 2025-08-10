import { PrismaClient } from '@prisma/client';
import { EmailService } from './EmailService.js';

export class ReminderService {
  private prisma: PrismaClient;
  private emailService: EmailService;
  private reminderInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.prisma = new PrismaClient();
    this.emailService = new EmailService();
    this.startReminderService();
  }

  /**
   * Start the reminder service (checks every hour)
   */
  startReminderService(): void {
    console.log('🕒 Starting booking reminder service...');
    
    // Check immediately on startup
    this.checkAndSendReminders();
    
    // Then check every hour
    this.reminderInterval = setInterval(() => {
      this.checkAndSendReminders();
    }, 60 * 60 * 1000); // 1 hour
  }

  /**
   * Stop the reminder service
   */
  stopReminderService(): void {
    if (this.reminderInterval) {
      clearInterval(this.reminderInterval);
      this.reminderInterval = null;
      console.log('🛑 Booking reminder service stopped');
    }
  }

  /**
   * Check for bookings that need reminders and send them
   */
  private async checkAndSendReminders(): Promise<void> {
    try {
      console.log('🔍 Checking for bookings that need reminders...');

      // Get tomorrow's date (24 hours from now)
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Start and end of tomorrow
      const tomorrowStart = new Date(tomorrow);
      tomorrowStart.setHours(0, 0, 0, 0);
      
      const tomorrowEnd = new Date(tomorrow);
      tomorrowEnd.setHours(23, 59, 59, 999);

      // Find confirmed bookings for tomorrow that haven't received a reminder yet
      const bookingsNeedingReminder = await this.prisma.booking.findMany({
        where: {
          date: {
            gte: tomorrowStart,
            lte: tomorrowEnd
          },
          status: 'CONFIRMED',
          reminderSent: false
        },
        include: {
          user: true,
          service: true,
          staff: true
        }
      });

      console.log(`📧 Found ${bookingsNeedingReminder.length} bookings needing reminders`);

      // Send reminders for each booking
      for (const booking of bookingsNeedingReminder) {
        try {
          await this.sendBookingReminder(booking);
          
          // Mark reminder as sent
          await this.prisma.booking.update({
            where: { id: booking.id },
            data: { reminderSent: true }
          });

          console.log(`✅ Reminder sent for booking ${booking.id}`);
        } catch (error) {
          console.error(`❌ Failed to send reminder for booking ${booking.id}:`, error);
        }
      }

      if (bookingsNeedingReminder.length === 0) {
        console.log('✨ No reminders needed at this time');
      }

    } catch (error) {
      console.error('❌ Error in reminder service:', error);
    }
  }

  /**
   * Send reminder for a specific booking
   */
  private async sendBookingReminder(booking: any): Promise<void> {
    const bookingDetails = {
      id: booking.id,
      serviceName: booking.service.name,
      date: booking.date.toISOString(),
      time: booking.startTime, // Use startTime from database
      therapistName: booking.staff.firstName + ' ' + booking.staff.lastName,
      duration: booking.service.duration,
      notes: booking.notes
    };

    await this.emailService.sendBookingReminder(
      booking.user.email,
      booking.user.firstName,
      bookingDetails
    );
  }

  /**
   * Manually send reminder for a specific booking (for testing)
   */
  async sendManualReminder(bookingId: string): Promise<void> {
    try {
      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          user: true,
          service: true,
          staff: true
        }
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      await this.sendBookingReminder(booking);
      
      // Mark reminder as sent
      await this.prisma.booking.update({
        where: { id: bookingId },
        data: { reminderSent: true }
      });

      console.log(`✅ Manual reminder sent for booking ${bookingId}`);
    } catch (error) {
      console.error(`❌ Failed to send manual reminder for booking ${bookingId}:`, error);
      throw error;
    }
  }

  /**
   * Reset reminder status for a booking (useful for testing)
   */
  async resetReminderStatus(bookingId: string): Promise<void> {
    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { reminderSent: false }
    });
    console.log(`🔄 Reminder status reset for booking ${bookingId}`);
  }

  /**
   * Get statistics about reminders
   */
  async getReminderStats(): Promise<{
    totalBookings: number;
    remindersSent: number;
    pendingReminders: number;
  }> {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const tomorrowStart = new Date(tomorrow);
    tomorrowStart.setHours(0, 0, 0, 0);
    
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    const totalBookings = await this.prisma.booking.count({
      where: {
        date: {
          gte: tomorrowStart,
          lte: tomorrowEnd
        },
        status: 'CONFIRMED'
      }
    });

    const remindersSent = await this.prisma.booking.count({
      where: {
        date: {
          gte: tomorrowStart,
          lte: tomorrowEnd
        },
        status: 'CONFIRMED',
        reminderSent: true
      }
    });

    return {
      totalBookings,
      remindersSent,
      pendingReminders: totalBookings - remindersSent
    };
  }
}

// Export singleton instance
export const reminderService = new ReminderService();
