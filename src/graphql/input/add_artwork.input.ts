import { Field, Float, InputType, Int, registerEnumType } from "@nestjs/graphql";
import { Category } from "generated/prisma";


registerEnumType(Category, {
    name: "Category"
})

@InputType()
export class AddArtworkInput {

    @Field(()=> String)
    title: string

    @Field(()=> String)
    description: string

    @Field(()=> String, {nullable: true})
    material?: string

    @Field(()=> Int, {nullable: true})
    yearCreated?: number

    @Field(()=> Category)
    category: Category

    @Field(()=> Float, {nullable: true})
    widthCm?: number

    @Field(()=> Float, {nullable: true})
    heightCm?: number

    @Field(()=> Float, {nullable: true})
    weightKg?: number

    @Field(()=> Boolean, {defaultValue: true})
    isUnique: boolean

    @Field(()=> Boolean, {defaultValue: true})
    isAvailable: boolean

    @Field(()=> Boolean, {defaultValue: false})
    isFeatured: boolean

    @Field(()=> String)
    culturalOrigin: string

    @Field(()=> Int, {nullable: true})
    artisanId?: number

    @Field(()=> Float)
    price: number

    @Field(()=> String)
    currency: string
}