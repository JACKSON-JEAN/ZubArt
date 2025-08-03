import { Field, InputType, registerEnumType } from "@nestjs/graphql";
import { Role } from "generated/prisma";
import { IsEmail, IsEnum, IsNotEmpty, Matches, MaxLength, MinLength } from "class-validator"

registerEnumType(Role, {
    name: "Role"
})

@InputType()
export class AddUserInput {
    @Field(()=> String)
    @IsNotEmpty({ message: "Full name is required" })
    @MinLength(3, { message: "Full name must be at least 3 characters" })
    @MaxLength(50, { message: "Full name is too long" })
    fullName: string

    @Field(()=> String)
    @IsEmail({}, {message: "Invalid email format"})
    email: string

    @Field(()=> String, {nullable: true})
    phone?: string

    @Field(()=> String)
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,{
        message: "Password is too weak. Must contain uppercase, lowercase, number/special char.",
    })
    password: string

    @Field(()=> Role, {defaultValue: Role.CUSTOMER})
    @IsEnum(Role, {message: "role is required"})
    role: Role

    @Field(()=> Boolean, {defaultValue: true})
    isActive: boolean
}