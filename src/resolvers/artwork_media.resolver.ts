import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ArtworkMediaModel } from '../graphql/models/artworkMedia.model';
import { ArtworkMediaService } from '../services/artwork_media.service';
import { AddArtworkMediaInput } from '../graphql/input/add_artworkMedia.input';

@Resolver(() => ArtworkMediaModel)
export class ArtworkMediaResolver {
  constructor(private readonly mediaService: ArtworkMediaService) {}

  @Mutation(() => ArtworkMediaModel)
  async addArtworkMedia(
    @Args('addMediaInput') input: AddArtworkMediaInput
  ) {
    return this.mediaService.addArtworkMedia(input);
  }

  @Query(() => [ArtworkMediaModel])
async artworkMedia(
  @Args('artworkId', { type: () => Int }) artworkId: number
) {
  console.log('Received artworkId:', artworkId, typeof artworkId);
  return this.mediaService.getArtworkMedia(artworkId);
}

  @Mutation(() => ArtworkMediaModel)
  async deleteArtworkMedia(@Args('id') id: number) {
    return this.mediaService.deleteArtworkMedia(id);
  }
}