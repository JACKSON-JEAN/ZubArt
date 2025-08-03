import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'refresh_tokens response' })
export class AuthRefreshResponse {
  @Field({ description: 'auth access_token' })
  accessToken: string;

  @Field({ description: 'auth refresh_token' })
  refreshToken: string;
}