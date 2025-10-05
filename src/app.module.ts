import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FeatureModule } from './modules/feature.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule } from '@nestjs/config';


@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true, envFilePath: '.env'}),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      csrfPrevention: false,///
      autoSchemaFile: "src/shema.gql",
      playground: true,
      introspection: true,
      context: ({ req}) => ({req}),
      uploads: false,
    } as any),
    ...FeatureModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
