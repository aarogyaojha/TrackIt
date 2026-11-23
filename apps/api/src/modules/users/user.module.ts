import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailModule } from '../email/email.module';
import { RolesModule } from '../roles/role.module';
import { SubscriptionsModule } from '../subscriptions/subscription.module';
import { UsersController } from './user.controller';
import { UsersRepository } from './user.repository';
import { User, UserSchema } from './user.schema';
import { UsersService } from './user.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    EmailModule,
    forwardRef(() => RolesModule),
    forwardRef(() => SubscriptionsModule),
  ],
  controllers: [UsersController],
  providers: [UsersRepository, UsersService],
  exports: [UsersRepository, UsersService],
})
export class UsersModule {}
