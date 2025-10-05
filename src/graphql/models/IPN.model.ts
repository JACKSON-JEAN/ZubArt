import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class Ipn {
  @Field()
  ipn_id: string;

  @Field()
  url: string;

  @Field()
  ipn_notification_type: string;

  @Field()
  status: string;
}
