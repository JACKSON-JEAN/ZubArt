import { ObjectType, Field, Int } from '@nestjs/graphql';
import { ArtworkModel } from './artwork.model';

@ObjectType()
export class ArtworkConnection {
  @Field(() => [ArtworkModel])
  artworks: ArtworkModel[];

  @Field(() => Int, { nullable: true })
  nextCursor?: number;
}
