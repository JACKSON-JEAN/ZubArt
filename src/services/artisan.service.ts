import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { AddArtisanInput } from "../graphql/input/add_artisan.input";
import { UpdateArtisanInput } from "../graphql/input/update_artisan.input";
import { SearchArtisanInput } from "../graphql/input/search_artisan.input";

@Injectable()
export class ArtisanService {
    constructor(private prismaService: PrismaService) {}

    async addArtisan(addArtisanInput: AddArtisanInput){
        const { fullName, country, biography} = addArtisanInput

        if(!fullName || !country || !biography) {
            throw new BadRequestException("Please fill all the necessary fields")
        }

        try {
            const addedArtisan = await this.prismaService.artisan.create({
                data: {
                    fullName: addArtisanInput.fullName,
                    country: addArtisanInput.country,
                    biography: addArtisanInput.biography
                }
            })

            return addedArtisan
            
        } catch (error) {
            throw new InternalServerErrorException("There was an error when adding an artisan")
        }
    }

    async getArtisans(searchInput: SearchArtisanInput) {
        const {fullName, country} = searchInput
        try {
            return await this.prismaService.artisan.findMany({
                where: {
                    AND: [
                        fullName ? {fullName: {contains: fullName, mode: 'insensitive'}} : {},
                        country ? {country: {contains: country, mode: 'insensitive'}} : {}
                    ]
                },
                include: {
                    artwork: true
                }
            })
        } catch (error) {
            throw new InternalServerErrorException("There was an error when fetching artisans")
        }
    }

    async getArtisanById(artisanId: number){
        const artisan = await this.prismaService.artisan.findUnique({
            where: {id: artisanId},
            include: {
                artwork: true
            }
        })

        if(!artisan){
            throw new NotFoundException(`Artisan whith ID: ${artisanId} not found`)
        }
        return artisan
    }

    async updateArtisan(artisanId: number, updateArtisanInput: UpdateArtisanInput){
        const artisan = await this.prismaService.artisan.findUnique({
            where: {id: artisanId}
        })

        if(!artisan){
            throw new NotFoundException(`Artisan whith ID: ${artisanId} not found`)
        }

        try {
            const updatedArtisan = await this.prismaService.artisan.update({
                where: {id: artisanId},
                data: updateArtisanInput
            })
            return updatedArtisan
            
        } catch (error) {
            throw new InternalServerErrorException("There was an error when updating artisan")
        }
    }

    async deleteArtisan(artisanId: number) {
        const artisan = await this.prismaService.artisan.findUnique({
            where: {id: artisanId},
        })

        if(!artisan){
            throw new NotFoundException(`Artisan whith ID: ${artisanId} not found`)
        }

        try {
            await this.prismaService.artisan.delete({ where: {id: artisanId}})
            return "Artisan deleted successfully"
            
        } catch (error) {
            throw new InternalServerErrorException("There was an error when deleting an artisan")
        }
    }
}