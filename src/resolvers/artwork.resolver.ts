import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { AddArtworkInput } from "../graphql/input/add_artwork.input";
import { SearchArtworkInput } from "../graphql/input/search_artwork.input";
import { UpdateArtworkInput } from "../graphql/input/update_artwork.input";
import { ArtworkModel } from "../graphql/models/artwork.model";
import { ArtworkService } from "../services/artwork.service";

@Resolver(()=> ArtworkModel)
export class ArtworkResolver{
    constructor(private artworkService: ArtworkService){}

    @Mutation(() => ArtworkModel)
    async addArtwork(@Args("addArtworkInput") addArtworkInput: AddArtworkInput){
        return await this.artworkService.AddArtwork(addArtworkInput)
    }

    @Query(()=> [ArtworkModel])
    async getArtwork(@Args('searchInput') searchInput: SearchArtworkInput){
        return await this.artworkService.getArtwork(searchInput)
    }
    
    @Query(()=> [ArtworkModel])
    async getNewArrivals(){
        return await this.artworkService.getNewArrivals()
    }

    @Query(() => ArtworkModel)
    async getArtworkById(@Args("artworkId") artworkId: number){
        return await this.artworkService.getArtworkById(artworkId)
    }

    @Mutation(() => ArtworkModel)
    async updateArtwork(@Args("artworkId") artworkId: number, @Args("updateArtworkInput") updateArtworkInput: UpdateArtworkInput){
        return await this.artworkService.updateArtwork(artworkId, updateArtworkInput)
    }

    @Mutation(() => String)
    async deleteArtwork(@Args("artworkId") artworkId: number){
        return await this.artworkService.deleteArtwork(artworkId)
    }
}