import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { AddArtisanInput } from "../graphql/input/add_artisan.input";
import { SearchArtisanInput } from "../graphql/input/search_artisan.input";
import { UpdateArtisanInput } from "../graphql/input/update_artisan.input";
import { ArtisanModel } from "../graphql/models/artisan.model";
import { ArtisanService } from "../services/artisan.service";

@Resolver(() => ArtisanModel)
export class ArtisanResolver {
    constructor(private artisanService: ArtisanService) {}

    @Mutation(() => ArtisanModel)
    async addArtisan(@Args("addArtisanInput") addArtisanInput: AddArtisanInput) {
        return await this.artisanService.addArtisan(addArtisanInput)
    }

    @Query(() => [ArtisanModel])
    async getArtisans(@Args("searchInput") searchInput: SearchArtisanInput) {
        return await this.artisanService.getArtisans(searchInput)
    }

    @Query(() => ArtisanModel)
    async getArtisanById(@Args("artisanId") artisanId: number) {
        return await this.artisanService.getArtisanById(artisanId)
    }

    @Mutation(() => ArtisanModel)
    async updateArtisan(@Args("artisanId") artisanId: number, @Args("updateArtisanInput") updateArtisanInput: UpdateArtisanInput) {
        return await this.artisanService.updateArtisan(artisanId, updateArtisanInput)
    }

    @Mutation(() => String)
    async deleteArtisan(@Args("artisanId") artisanId: number ) {
        return await this.artisanService.deleteArtisan(artisanId)
    }
}