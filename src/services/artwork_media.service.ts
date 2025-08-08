import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AddArtworkMediaInput } from '../graphql/input/add_artworkMedia.input';
import { CloudinaryService } from './cloudinary.service';
import { MediaType } from 'generated/prisma';
import { ArtworkMedia } from 'generated/prisma';

@Injectable()
export class ArtworkMediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService
  ) {}

  async addArtworkMedia(input: AddArtworkMediaInput): Promise<ArtworkMedia> {
    console.log('Starting upload for artwork:', input.artworkId);
    // 1. Validate Artwork exists
    const artworkExists = await this.prisma.artwork.findUnique({
      where: { id: input.artworkId },
    });
    
    if (!artworkExists) {
      throw new NotFoundException(`Artwork with ID ${input.artworkId} not found`);
    }

    // 2. Process file upload
    let uploadResult;
    try {
      const { createReadStream, filename, mimetype } = await input.file;
      const buffer = await this.streamToBuffer(createReadStream());
      

      uploadResult = await this.cloudinary.uploadFile({
        buffer,
        originalname: filename,
        mimetype,
      } as Express.Multer.File);
    } catch (error) {
      throw new BadRequestException(`File upload failed: ${error.message}`);
    }

    // 3. Save to database
    try {
      return await this.prisma.artworkMedia.create({
        data: {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          type: this.mapResourceType(uploadResult.resource_type),
          width: uploadResult.width,
          height: uploadResult.height,
          duration: uploadResult.duration,
          format: uploadResult.format,
          artworkId: input.artworkId,
        },
        include: {
          artwork: true,
        },
      });
    } catch (error) {
      // Rollback Cloudinary upload if DB fails
      await this.cloudinary.deleteFile(
        uploadResult.public_id,
        uploadResult.resource_type
      );
      throw new BadRequestException('Failed to create media record');
    }
  }

  async getArtworkMedia(artworkId: number): Promise<ArtworkMedia[]> {
    // Validate artwork exists
    const artworkExists = await this.prisma.artwork.findUnique({
      where: { id: artworkId },
    });
    
    if (!artworkExists) {
      throw new NotFoundException(`Artwork with ID ${artworkId} not found`);
    }
  
    // Fetch all media for this artwork
    return this.prisma.artworkMedia.findMany({
      where: { artworkId },
      orderBy: { createdAt: 'desc' }, // Newest first
      include: {
        artwork: true // Include related artwork data if needed
      }
    });
  }

  async deleteArtworkMedia(id: number): Promise<ArtworkMedia> {
    // 1. Find the media record
    const media = await this.prisma.artworkMedia.findUnique({
      where: { id },
    });

    if (!media) {
      throw new NotFoundException(`Media with ID ${id} not found`);
    }

    // 2. Delete from Cloudinary
    try {
      await this.cloudinary.deleteFile(
        media.publicId,
        media.type === MediaType.VIDEO ? 'video' : 'image'
      );
    } catch (error) {
      throw new BadRequestException(
        `Cloudinary deletion failed: ${error.message}`
      );
    }

    // 3. Delete from database
    return this.prisma.artworkMedia.delete({
      where: { id },
    });
  }

  // --- Helper Methods ---
  private async streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream
        .on('data', (chunk) => {
          console.log('Received chunk:', chunk.length); // Debug log
          chunks.push(chunk);
        })
        .on('end', () => {
          console.log('Total size:', Buffer.concat(chunks).length); // Debug log
          resolve(Buffer.concat(chunks));
        })
        .on('error', reject);
    });
  }

  private mapResourceType(
    resourceType: 'image' | 'video'
  ): MediaType {
    return resourceType === 'video' ? MediaType.VIDEO : MediaType.IMAGE;
  }
}