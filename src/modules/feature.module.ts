import { AddressModule } from "./address.module";
import { ArtisanModule } from "./artisan.module";
import { ArtworkModule } from "./artwork.module";
import { ArtworkMediaModule } from "./artworkMedia.module";
import { AuthModule } from "./auth.module";
import { CartModule } from "./cart.module";
import { CartItemModule } from "./cartItem.module";
import { CloudinaryModule } from "./cloudinary.module";
import { OrderModule } from "./order.module";
import { OrderItemModule } from "./order_item.module";
import { PrismaModule } from "./prisma.module";
import { ReviewModule } from "./review.module";
import { SubscriberModule } from "./subscriber.module";
import { UsersModule } from "./users.module";
import { WishListModule } from "./wishList.module";

export const FeatureModule = [
    PrismaModule,
    ArtworkModule,
    ArtisanModule,
    ArtworkMediaModule,
    WishListModule,
    OrderItemModule,
    OrderModule,
    ReviewModule,
    AddressModule,
    AuthModule,
    UsersModule,
    CloudinaryModule,
    CartItemModule,
    CartModule,
    SubscriberModule,
]