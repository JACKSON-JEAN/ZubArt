import { Field, ObjectType } from '@nestjs/graphql';
import { UserModel } from './user.model';

@ObjectType({ description: 'authentication response' })
export class AuthResponse {
  @Field({ description: 'auth access_token' })
  accessToken: string;

  @Field({ description: 'auth refresh_token' })
  refreshToken: string;

  @Field(() => UserModel)
  user: UserModel;
}