import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { AddReviewsInput } from "../graphql/input/add_reviews.input";
import { UpdateReviewsInput } from "../graphql/input/update_reviews.input";

@Injectable()
export class ReviewsService {
    constructor(private prismaService: PrismaService) {}

    async addReviews(addReviewsInput: AddReviewsInput) {
        const {rating, artworkId, customerId} = addReviewsInput
        if(!rating || !artworkId) {
            throw new BadRequestException("Please fill all the neccessary fields")
        }

        try {
            const addedReviews = await this.prismaService.review.create({
                data: {
                    rating: addReviewsInput.rating,
                    comment: addReviewsInput.comment,
                    artworkId: addReviewsInput.artworkId,
                    customerId: addReviewsInput.customerId,
                    clientName: addReviewsInput.clientName,
                    isActive: addReviewsInput.isActive || false
                }
            })
            return addedReviews

        } catch (error) {
            throw new InternalServerErrorException("There was an error when adding reviews")
        }
    }

    async getReviews() {
        try {
            return await this.prismaService.review.findMany({
                where: {
                    isActive: true,
                },
                include: {
                    artwork: true,
                    customer: true
                }
            })
        } catch (error) {
            throw new InternalServerErrorException("There was an error when fetching reviews")
        }
    }

    async getReviewsById(reviewsId: number) {
        const reviews = await this.prismaService.review.findUnique({
            where: {id: reviewsId},
            include: {
                artwork: true,
                customer: true
            }
        })

        if(!reviews) {
            throw new NotFoundException(`Reviews with ID: ${reviewsId} was not found`)
        }

        return reviews
    }

    async updateReviews(reviewsId: number, updateReviewsInput: UpdateReviewsInput) {
        const reviews = await this.prismaService.review.findUnique({
            where: {id: reviewsId}
        })

        if(!reviews) {
            throw new NotFoundException(`Reviews with ID: ${reviewsId} was not found`)
        }

        try {
            const updatedReviews = await this.prismaService.review.update({
                where: {id: reviewsId},
                data: updateReviewsInput
            })
            return updatedReviews
        } catch (error) {
            throw new InternalServerErrorException("There was an error when updating reviews")
        }
    }

    async deleteReviews(reviewsId: number) {
        const reviews = await this.prismaService.review.findUnique({
            where: {id: reviewsId}
        })

        if(!reviews) {
            throw new NotFoundException(`Reviews with ID: ${reviewsId} was not found`)
        }

        try {
            await this.prismaService.review.delete({
                where: {id: reviewsId}
            })
            return "Reviews were deleted successfully"
        } catch (error) {
            throw new InternalServerErrorException("There was an error when deleting reviews")
        }
    }
}