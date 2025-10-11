import { Field, Float, InputType, Int, registerEnumType } from "@nestjs/graphql";
import { Category } from "generated/prisma";


registerEnumType(Category, {
    name: "Category"
})

@InputType()
export class UpdateArtworkInput {
    @Field(()=> String, {nullable: true})
    title?: string

    @Field(()=> String, {nullable: true})
    description?: string

    @Field(()=> String, {nullable: true})
    material?: string

    @Field(()=> String, {nullable: true})
    imageHash?: string

    @Field(()=> Int, {nullable: true})
    yearCreated?: number

    @Field(()=> Category, {nullable: true})
    category?: Category

    @Field(()=> Float, {nullable: true})
    widthCm?: number

    @Field(()=> Float, {nullable: true})
    heightCm?: number

    @Field(()=> Float, {nullable: true})
    weightKg?: number

    @Field(()=> Boolean, {defaultValue: true, nullable: true})
    isUnique?: boolean

    @Field(()=> Boolean, {defaultValue: true, nullable: true})
    isAvailable?: boolean

    @Field(()=> Boolean, {defaultValue: false, nullable: true})
    isFeatured?: boolean

    @Field(()=> String, {nullable: true})
    culturalOrigin?: string

    @Field(()=> Int, {nullable: true})
    artisanId?: number

    @Field(()=> Float, {nullable: true})
    price?: number

    @Field(()=> String, {nullable: true})
    currency?: string
}