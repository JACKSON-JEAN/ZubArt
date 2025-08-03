import { Field, InputType, registerEnumType } from "@nestjs/graphql";
import { Role } from "generated/prisma";

registerEnumType(Role, {
    name: "Role"
})

@InputType()
export class SearchUsersInput {
    @Field(()=> String, {nullable: true})
    keyword?: string

    @Field(()=> Role, {nullable: true})
    role?: Role
}