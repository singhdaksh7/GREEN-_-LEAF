-- AlterTable
ALTER TABLE `BlogPost` MODIFY `coverImage` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `Category` MODIFY `image` TEXT NULL;

-- AlterTable
ALTER TABLE `OrderItem` MODIFY `productImage` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `PaymentIntentLine` MODIFY `image` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `ProductImage` MODIFY `url` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `VariantImage` MODIFY `url` TEXT NOT NULL;
