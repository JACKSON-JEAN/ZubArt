import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AddUserInput } from '../graphql/input/add_user.input';
import * as bcrypt from 'bcrypt';
import { Role } from 'generated/prisma';
import { SigInInput } from '../graphql/input/signIn.input';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuid } from 'uuid';

import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async signUp(addUserInput: AddUserInput) {
    const { fullName, email, password } = addUserInput;
    if (!fullName || !email || !password) {
      throw new BadRequestException('Please enter all required fields');
    }

    const existingUser = await this.prismaService.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    try {
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const newUser = await this.prismaService.user.create({
        data: {
          fullName,
          email,
          phone: addUserInput.phone || null,
          password: hashedPassword,
          role: addUserInput.role || Role.CUSTOMER,
          isActive: true,
        },
      });

      const { password: _, ...result } = newUser;
      return result;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async signIn(signInInput: SigInInput) {
    const { email, password } = signInInput;
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (
      !user ||
      !user.isActive ||
      !(await bcrypt.compare(password, user.password))
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    try {
      await this.prismaService.refreshToken.deleteMany({
        where: { userId: user.id },
      });

      const tokens = await this.generateTokens({
        id: user.id,
        name: user.fullName,
        email: user.email,
        role: user.role,
      });

      return {
        ...tokens,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Login failed');
    }
  }

  async generateTokens(user: {
    id: number;
    name: string;
    email: string;
    role: string;
  }) {
    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      { expiresIn: (process.env.JWT_EXPIRY_DATE ?? '15m') as any },
    );

    const refreshToken = uuid();

    await this.storeRefreshToken(refreshToken, user.id);

    return {
      accessToken,
      refreshToken,
    };
  }

  async storeRefreshToken(token: string, userId: number) {
    const expiryDate = new Date();
    expiryDate.setDate(
      expiryDate.getDate() +
        parseInt(process.env.REFRESH_TOKEN_EXPIRY_DAYS || '3', 10),
    );

    try {
      return await this.prismaService.refreshToken.create({
        data: {
          token,
          userId,
          expiryDate,
        },
      });
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Failed to store refresh token');
    }
  }

  async refreshTokens(refreshToken: string) {
    const tokenRecord = await this.prismaService.refreshToken.findFirst({
      where: {
        token: refreshToken,
        expiryDate: { gte: new Date() },
      },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    try {
      await this.prismaService.refreshToken.delete({
        where: { id: tokenRecord.id },
      });

      const user = await this.prismaService.user.findUnique({
        where: { id: tokenRecord.userId },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return await this.generateTokens({
        id: user.id,
        name: user.fullName,
        email: user.email,
        role: user.role,
      });
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Failed to refresh tokens');
    }
  }

  async logout(refreshToken: string) {
    const tokenRecord = await this.prismaService.refreshToken.findFirst({
      where: { token: refreshToken },
    });

    if (!tokenRecord) {
      throw new NotFoundException('Refresh token not found');
    }

    try {
      await this.prismaService.refreshToken.delete({
        where: { id: tokenRecord.id },
      });
      return { success: true };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Logout failed');
    }
  }

  private async sendResetPasswordEmail(
    email: string,
    fullName: string,
    resetLink: string,
  ) {
    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_PASS,
      },
    });

    try {
      const info = await transporter.sendMail({
        from: `"Pearl Art Galleries" <no-reply@pearlartgalleries.com>`,
        to: email,
        subject: 'Reset Your Password',
        html: `
    <p>Hello <b>${fullName}</b>,</p>
    <p>Click the link below to reset your password:</p>
    <p><a href="${resetLink}">Reset Password</a></p>
    <p>This link expires in 15 minutes.</p>
  `,
      });

      console.log('Email sent:', info.messageId);
    } catch (error) {
      console.error('EMAIL FAILED ⛔', error?.response || error);
      console.error('Full error object:', error);
      throw error;
    }
  }

  async forgotPassword(email: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    // Prevent user enumeration
    if (!user) {
      return 'If the email exists, a reset link has been sent';
    }

    await this.prismaService.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    const token = uuid();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    await this.prismaService.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    const resetLink = `${this.config.get(
      'FRONT_URL',
    )}/reset-password?token=${token}`;

    await this.sendResetPasswordEmail(user.email, user.fullName, resetLink);

    return 'If the email exists, a reset link has been sent';
  }

  async resetPassword(token: string, newPassword: string) {
    const resetToken = await this.prismaService.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken || resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired token');
    }

    const hashedPassword = await bcrypt.hash(
      newPassword,
      parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
    );

    await this.prismaService.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    await this.prismaService.passwordResetToken.delete({
      where: { id: resetToken.id },
    });

    return 'Password reset successful';
  }
}
