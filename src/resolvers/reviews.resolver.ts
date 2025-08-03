import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { ReviewsModel } from "../graphql/models/review.model";
import { ReviewsService } from "../services/reviews.service";
import { AddReviewsInput } from "../graphql/input/add_reviews.input";
import { UpdateReviewsInput } from "../graphql/input/update_reviews.input";

@Resolver(() => ReviewsModel)
export class ReviewsResolver {
    constructor(private reviewsService: ReviewsService) {}

    @Mutation(() => ReviewsModel)
    async addReviews(@Args("addReviewsInput") addReviewsInput: AddReviewsInput) {
        return await this.reviewsService.addReviews(addReviewsInput)
    }

    @Query(() => [ReviewsModel])
    async getReviews() {
        return await this.reviewsService.getReviews()
    }

    @Query(() => ReviewsModel)
    async getReviewsById(@Args("reviewsId") reviewsId: number) {
        return await this.reviewsService.getReviewsById(reviewsId)
    }

    @Mutation(() => ReviewsModel)
    async updateReviews(@Args("reviewsId") reviewsId: number, @Args("updateReviewsInput") updateReviewsInput: UpdateReviewsInput) {
        return await this.reviewsService.updateReviews(reviewsId, updateReviewsInput)
    }

    @Mutation(() => String)
    async deleteReviews(@Args("reviewsId") reviewsId: number) {
        return await this.reviewsService.deleteReviews(reviewsId)
    }
}