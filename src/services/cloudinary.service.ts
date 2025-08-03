import { Injectable, OnModuleInit } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { CloudinaryResponse } from 'src/graphql/models/cloudinary_response.model';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService implements OnModuleInit {
  onModuleInit() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });

  }
  async uploadFile(
    file: Express.Multer.File,
    folder = 'artwork_media'
  ): Promise<CloudinaryResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          quality: 'auto:good',
        },
        (error, result?: UploadApiResponse) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('Upload failed'));
          
          resolve(this.transformResponse(result));
        }
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  private transformResponse(response: UploadApiResponse): CloudinaryResponse {
    return {
      public_id: response.public_id,
      secure_url: response.secure_url,
      resource_type: response.resource_type as 'image' | 'video',
      width: response.width,
      height: response.height,
      duration: response.duration,
      format: response.format,
    };
  }

  async deleteFile(publicId: string, resourceType: 'image' | 'video') {
    return cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  }

  async getFileInfo(publicId: string) {
    return cloudinary.api.resource(publicId, {
      image_metadata: true,
    });
  }
}