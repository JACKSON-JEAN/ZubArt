import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { AddArtworkInput } from "src/graphql/input/add_artwork.input";
import { UpdateArtworkInput } from "src/graphql/input/update_artwork.input";
import { SearchArtworkInput } from "src/graphql/input/search_artwork.input";

@Injectable()
export class ArtworkService {
    constructor(private prismaService: PrismaService){}

    async AddArtwork(artworkinput: AddArtworkInput){
        const {title, description, category, culturalOrigin, price, currency} = artworkinput

        if(!title || !description || !category || !culturalOrigin || !price || !currency){
            throw new BadRequestException("Please enter all the required fields")
        }
        try {
            const addedArtwork = await this.prismaService.artwork.create({
                data: {
                    title: artworkinput.title,
                    description: artworkinput.description,
                    yearCreated: artworkinput.yearCreated || null,
                    category: artworkinput.category,
                    widthCm: artworkinput.widthCm || null,
                    heightCm: artworkinput.heightCm || null,
                    weightKg: artworkinput.weightKg || null,
                    isUnique: artworkinput.isUnique || true,
                    isAvailable: artworkinput.isAvailable || true,
                    isFeatured: artworkinput.isFeatured || false,
                    culturalOrigin: artworkinput.culturalOrigin,
                    artisanId: artworkinput.artisanId || null,
                    price: artworkinput.price,
                    currency: artworkinput.currency
                }
            })
            return addedArtwork

        } catch (error) {
            throw new InternalServerErrorException("An error occured when adding artwork")
        }
    }

    async getArtwork(searchInput: SearchArtworkInput){
        const {keyword, category, yearCreated, minPrice, maxPrice, isAvailable = true, isFeatured } = searchInput

        try {
            return await this.prismaService.artwork.findMany({
                where: {
                    AND: [
                        {isAvailable},
                        category ? {category} : {},
                        yearCreated ? {yearCreated} : {},
                        isFeatured !== undefined ? {isFeatured} : {},
                        minPrice !== undefined ? {price: {gte: minPrice}} : {},
                        maxPrice !== undefined ? {price: {lte: maxPrice}} : {},
                        keyword 
                           ? {
                            OR: [
                                {title: {contains: keyword, mode: 'insensitive'}},
                                {culturalOrigin: {contains: keyword, mode: 'insensitive'}},
                                {
                                    artisan: {
                                        fullName: {contains: keyword, mode: 'insensitive'}
                                    }
                                }
                            ]
                           } : {}
                    ]
                },
                include: {
                    media: true,
                    artisan: true,
                    reviews: true,
                },
                orderBy: {createdAt: 'desc'}
            })
        } catch (error) {
          throw new InternalServerErrorException("There was an error when fetching artwork")  
        }
    }

    async getNewArrivals() {
        try {
            return await this.prismaService.artwork.findMany({
                where: {isAvailable: true},
                orderBy: {
                    createdAt: "desc"
                },
                include: {
                    media: true,
                    artisan: true,
                    reviews: true
                },
                take: 4
            })
        } catch (error) {
            throw new InternalServerErrorException("There was an error when fetching data")
        }
    }

    async getArtworkById(artworkId: number){
        const artwork = await this.prismaService.artwork.findUnique({
            where: {id: artworkId, isAvailable: true},
            include: {
                media: true,
                artisan: true,
                reviews: true
            }
        })

        if(!artwork){
            throw new NotFoundException(`No artwork with ID: ${artworkId} found!`)
        }

        return artwork
    }

    async updateArtwork(artworkId: number, updateInput: UpdateArtworkInput) {
        const artwork = await this.prismaService.artwork.findUnique({
            where: {id: artworkId}
        })

        if(!artwork){
            throw new NotFoundException(`No artwork with ID: ${artworkId} found`)
        } 

        try {
            const updatedArtwork = await this.prismaService.artwork.update({
                where: {id: artworkId},
                data: updateInput
            })

            return updatedArtwork
        } catch (error) {
            throw new InternalServerErrorException("There was an error when updating artwork")
        }
    }

    async deleteArtwork(artworkId: number){
        const artwork = await this.prismaService.artwork.findUnique({
            where: {id: artworkId}
        })

        if(!artwork){
            throw new NotFoundException(`No artwork with ID: ${artworkId} found`)
        } 

        try {
            await this.prismaService.artwork.delete({ where: { id: artworkId}})
            return "Artwork deleted successfully"
            
        } catch (error) {
            throw new InternalServerErrorException("There was an error when deleting artwork")
        }
    }
}