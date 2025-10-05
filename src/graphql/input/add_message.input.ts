import { Field, InputType, Int, registerEnumType } from '@nestjs/graphql';
import { IsEmail } from 'class-validator';
import { MessageStatus } from 'generated/prisma';

registerEnumType(MessageStatus, {
  name: 'MessageStatus',
});

@InputType()
export class AddMessageInput {
  @Field(() => String)
  fullName: string;

  @Field(() => String)
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @Field(() => String)
  message: string;

  @Field(() => MessageStatus, { defaultValue: MessageStatus.Unread })
  status: MessageStatus;
}
