import { Args, Mutation, Resolver } from '@nestjs/graphql';
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

  @Mutation(() => ArtworkMediaModel)
  async deleteArtworkMedia(@Args('id') id: number) {
    return this.mediaService.deleteArtworkMedia(id);
  }
}