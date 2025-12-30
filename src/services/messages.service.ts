import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AddMessageInput } from 'src/graphql/input/add_message.input';
import { MessageStatus } from 'generated/prisma';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);
  private readonly resend: Resend;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.resend = new Resend(this.config.get<string>('RESEND_API_KEY'));
  }

  private async sendNotificationEmail(message: any) {
    try {
      const adminEmail = this.config.get<string>('ADMIN_EMAIL');
      const emailFrom = this.config.get<string>('EMAIL_FROM');

      await this.resend.emails.send({
        from: emailFrom!,
        to: adminEmail!,
        subject: `New Message from ${message.fullName}`,
        html: `
          <h2>New Message Received</h2>
          <p><strong>From:</strong> ${message.fullName} (${message.email})</p>
          <p><strong>Message:</strong></p>
          <p>${message.message}</p>
          <p><strong>Status:</strong> ${message.status}</p>
          <p>Received at: ${new Date(message.createdAt).toLocaleString()}</p>
        `,
      });

      this.logger.log(`Notification email sent for message ID ${message.id}`);
    } catch (error) {
      this.logger.error(
        'Failed to send notification email',
        error?.message || error,
      );
    }
  }

  async sendMessage(messageInput: AddMessageInput) {
    const { fullName, email, message, status } = messageInput;

    if (!fullName || !email || !message) {
      throw new BadRequestException('Please enter all the required fields');
    }

    try {
      const sentMessage = await this.prismaService.message.create({
        data: {
          fullName,
          email,
          message,
          status: status || MessageStatus.Unread,
        },
      });

      // 🔔 Send admin email
      await this.sendNotificationEmail(sentMessage);

      return sentMessage;
    } catch (error) {
      this.logger.error(
        'An error occurred when sending message',
        error.message,
      );
      throw new InternalServerErrorException(
        'An error occurred when sending message',
      );
    }
  }

  async readMessages() {
    try {
      return await this.prismaService.message.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      this.logger.error(
        'An error occurred when loading messages',
        error.message,
      );
      throw new InternalServerErrorException(
        'An error occurred when loading messages',
      );
    }
  }
}
