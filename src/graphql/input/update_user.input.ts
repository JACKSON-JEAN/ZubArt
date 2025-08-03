import { Field, InputType, registerEnumType } from "@nestjs/graphql";
import { Role } from "generated/prisma";

registerEnumType(Role, {
    name: "Role"
})

@InputType()
export class UpdateUserInput {
    @Field(()=> String, {nullable: true})
    fullName?: string

    @Field(()=> String, {nullable: true})
    email?: string

    @Field(()=> String, {nullable: true})
    phone?: string

    @Field(()=> String, {nullable: true})
    password?: string

    @Field(()=> Role, {nullable: true, defaultValue: Role.CUSTOMER})
    role?: Role

    @Field(()=> Boolean, {nullable: true, defaultValue: true})
    isActive?: boolean
}