import { connect, connection } from 'mongoose';
import { CartSchema } from '../features/carts/entities/cart.entity';

/**
 * Migrates the legacy unique userId index. A user can have many checked-out
 * carts, but only one active cart at a time.
 */
export async function ensureCartIndexes(): Promise<void> {
  const mongoUrl = process.env.MONGO_URL || process.env.MONGO_URI;
  if (!mongoUrl) throw new Error('MONGO_URL is required to ensure cart indexes');

  // Do not let model initialization try to create indexes before the legacy
  // unique index has been removed.
  CartSchema.set('autoIndex', false);
  CartSchema.set('autoCreate', false);
  await connect(mongoUrl);

  try {
    const Cart = connection.model('Cart', CartSchema);
    const indexes = await Cart.collection.indexes();
    for (const index of indexes) {
      const keys = index.key ? Object.keys(index.key) : [];
      const isLegacyUserIndex = keys.length === 1
        && keys[0] === 'userId'
        && index.unique === true
        && !index.partialFilterExpression;
      if (isLegacyUserIndex && index.name) {
        await Cart.collection.dropIndex(index.name);
        console.log(`Dropped legacy cart index ${index.name}`);
      }
    }

    await Cart.createIndexes();
    console.log('Cart indexes ensured');
  } finally {
    await connection.close();
  }
}

if (require.main === module) {
  ensureCartIndexes().catch((error) => {
    console.error('Failed to ensure cart indexes', error);
    process.exit(1);
  });
}
