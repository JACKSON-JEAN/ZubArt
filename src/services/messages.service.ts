import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AddMessageInput } from 'src/graphql/input/add_message.input';
import { MessageStatus } from 'generated/prisma';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);
  constructor(
    private readonly prismaService: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private async sendNotificationEmail(message: any) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: this.config.get<string>('EMAIL_USER'),
          pass: this.config.get<string>('EMAIL_PASS'),
        },
      });

      const adminEmail = this.config.get<string>('MERCHANT_EMAIL'); // set in your .env

      const htmlContent = `
            <h2>New Message Received</h2>
            <p><strong>From:</strong> ${message.fullName} (${message.email})</p>
            <p><strong>Message:</strong></p>
            <p>${message.message}</p>
            <p><strong>Status:</strong> ${message.status}</p>
            <p>Received at: ${message.createdAt}</p>
        `;

      await transporter.sendMail({
        from: `"Website Contact" <${this.config.get('EMAIL_USER')}>`,
        to: adminEmail,
        subject: `New Message from ${message.fullName}`,
        html: htmlContent,
      });

      this.logger.log(`Notification email sent for message ID ${message.id}`);
    } catch (err) {
      this.logger.error('Failed to send notification email', err);
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

      await this.sendNotificationEmail(sentMessage);
      
      return sentMessage;
    } catch (error) {
      this.logger.error('An error occured when sending message', error.message);
      throw new InternalServerErrorException(
        'An error occured when sending message',
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
      this.logger.error('An error occured when loading message', error.message);
      throw new InternalServerErrorException(
        'An error occured when loading message',
      );
    }
  }
}
