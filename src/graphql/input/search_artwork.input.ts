import { Field, Float, InputType, Int, registerEnumType } from "@nestjs/graphql";
import { Category } from "generated/prisma";


registerEnumType(Category, {
    name: "Category"
})

@InputType()
export class SearchArtworkInput {
  @Field(() => String, { nullable: true })
  keyword?: string; // replaces title & origin

  @Field(() => Category, { nullable: true })
  category?: Category;

  @Field(() => Int, { nullable: true })
  yearCreated?: number;

  @Field(() => Float, { nullable: true })
  minPrice?: number;

  @Field(() => Float, { nullable: true })
  maxPrice?: number;

  @Field(() => Boolean, { nullable: true, defaultValue: true })
  isAvailable?: boolean;

  @Field(() => Boolean, { nullable: true })
  isFeatured?: boolean;
}
