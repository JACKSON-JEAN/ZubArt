import { Field, InputType, Int } from '@nestjs/graphql';
import { MediaType } from 'generated/prisma';
import { FileUpload, GraphQLUpload } from 'graphql-upload-ts';
import { IsEnum, IsInt, IsNotEmpty } from 'class-validator';

@InputType()
export class AddArtworkMediaInput {
  @Field(() => GraphQLUpload)
  @IsNotEmpty()
  file: Promise<FileUpload>;

  @Field(() => Int)
  @IsInt()
  @IsNotEmpty()
  artworkId: number;

  @Field(() => MediaType)
  @IsEnum(MediaType)
  type: MediaType;
}