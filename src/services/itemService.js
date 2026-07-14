const prisma = require('../utils/prisma');
const { convertBigIntToString } = require('../utils/helpers');
const wasabiService = require('./wasabiService');



class ItemService {
  // Helper function to add pre-signed URLs to item images
  addImageUrl(item) {
    if (item.imageLink) {
      item.imageUrl = wasabiService.generatePreSignedUrl(item.imageLink);
    }
    return item;
  }

  // Helper function to add pre-signed URLs to array of items
  addImageUrlsToArray(items) {
    return items.map(item => this.addImageUrl(item));
  }

  // Create item
  async createItem(vendorId, itemData, photo, tenantId) {
    const { name, description, price, sizes } = itemData;

    // Verify vendor exists
    const vendor = await prisma.vendor.findFirst({
      where: {
        id: BigInt(vendorId),
        tenantId
      }
    });

    if (!vendor) {
      throw new Error('Vendor not found');
    }

    // Upload photo to Wasabi
    if (!photo) {
      throw new Error('Photo is required');
    }
    if (!photo.buffer) {
      throw new Error('Invalid photo file');
    }

    // Upload to Wasabi and get URL
    const photoUrl = await wasabiService.uploadItemImage(photo.buffer, vendorId);

    const item = await prisma.item.create({
      data: {
        tenantId,
        vendorId: BigInt(vendorId),
        name,
        description,
        price: parseFloat(price),
        imageLink: photoUrl,
        isAvailable: true,
        sizes: sizes && sizes.length > 0 ? {
          create: sizes.map(s => ({
            name: s.name,
            price: parseFloat(s.price),
            discountPrice: s.discountPrice != null ? parseFloat(s.discountPrice) : null,
            isAvailable: s.isAvailable !== false
          }))
        } : undefined
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        imageLink: true,
        isAvailable: true,
        vendorId: true,
        sizes: true
      }
    });

    return this.addImageUrl(convertBigIntToString(item));
  }

  // Update item
  async updateItem(itemId, vendorId, itemData, photo, tenantId) {
    const { name, description, price, isAvailable, sizes } = itemData;

    // Verify item belongs to vendor
    const existingItem = await prisma.item.findFirst({
      where: {
        id: BigInt(itemId),
        vendorId: BigInt(vendorId),
        tenantId
      }
    });

    if (!existingItem) {
      throw new Error('Item not found or does not belong to this vendor');
    }

    let photoUrl = existingItem.imageLink;

    // If new photo is provided, upload it
    if (photo && photo.buffer) {
      // Delete old image from Wasabi if it exists
      if (existingItem.imageLink) {
        try {
          const oldFileKey = wasabiService.extractFileKeyFromUrl(existingItem.imageLink);
          if (oldFileKey) {
            // await wasabiService.deleteImage(oldFileKey);
          }
        } catch (deleteError) {
          console.error('Error deleting old image from Wasabi:', deleteError);
          // Continue with upload even if old image deletion fails
        }
      }

      // Upload new photo to Wasabi and get URL
      photoUrl = await wasabiService.uploadItemImage(photo.buffer, vendorId);
    }
    const isAvailableBool =
      isAvailable === true ||
      isAvailable === 'true'

    const updatedItem = await prisma.item.update({
      where: {
        id_tenantId: {
          id: BigInt(itemId),
          tenantId
        }
      },
      data: {
        name: name !== undefined ? name : existingItem.name,
        description: description !== undefined ? description : existingItem.description,
        price: price !== undefined ? parseFloat(price) : existingItem.price,
        imageLink: photoUrl,
        isAvailable: isAvailableBool !== undefined ? isAvailableBool : existingItem.isAvailable,
        sizes: sizes !== undefined ? {
          deleteMany: {},
          create: sizes.map(s => ({
            name: s.name,
            price: parseFloat(s.price),
            discountPrice: s.discountPrice != null ? parseFloat(s.discountPrice) : null,
            isAvailable: s.isAvailable !== false
          }))
        } : undefined
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        imageLink: true,
        isAvailable: true,
        vendorId: true,
        sizes: true
      }
    });

    return this.addImageUrl(convertBigIntToString(updatedItem));
  }

  // Delete item
  async deleteItem(itemId, vendorId, tenantId) {
    // Verify item belongs to vendor
    const existingItem = await prisma.item.findFirst({
      where: {
        id: BigInt(itemId),
        vendorId: BigInt(vendorId),
        tenantId
      }
    });

    if (!existingItem) {
      throw new Error('Item not found or does not belong to this vendor');
    }

    // Delete from Wasabi if imageLink exists
    if (existingItem.imageLink) {
      try {
        const fileKey = wasabiService.extractFileKeyFromUrl(existingItem.imageLink);
        if (fileKey) {
          await wasabiService.deleteImage(fileKey);
        }
      } catch (deleteError) {
        console.error('Error deleting image from Wasabi:', deleteError);
        // Continue with database deletion even if Wasabi deletion fails
      }
    }

    await prisma.item.delete({
      where: {
        id_tenantId: {
          id: BigInt(itemId),
          tenantId
        }
      }
    });

    return { message: 'Item deleted successfully' };
  }

  // Get items by vendor
  async getItemsByVendor(vendorId, tenantId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where: {
          vendorId: BigInt(vendorId),
          tenantId
        },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          imageLink: true,
          isAvailable: true,
          vendorId: true,
          sizes: true
        },
        skip,
        take: parseInt(limit)
      }),
      prisma.item.count({
        where: {
          vendorId: BigInt(vendorId),
          tenantId
        }
      })
    ]);

    const itemsWithUrls = this.addImageUrlsToArray(convertBigIntToString(items));

    return {
      items: itemsWithUrls,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = new ItemService();
