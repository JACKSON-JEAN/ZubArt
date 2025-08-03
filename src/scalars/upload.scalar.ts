import { Scalar } from '@nestjs/graphql';
import { GraphQLUpload } from 'graphql-upload-ts';

@Scalar('Upload', () => GraphQLUpload)
export class UploadScalar {}