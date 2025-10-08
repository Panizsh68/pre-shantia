import { connect, connection } from 'mongoose';
import { OrderSchema } from '../src/features/orders/entities/order.entity';

async function ensureIndexes() {
  await connect(process.env.MONGO_URI || 'mongodb://localhost:27017/practice');
  const Order = connection.model('Order', OrderSchema);
  console.log('Ensuring indexes for Order...');
  try {
    await Order.createIndexes();
    console.log('Order indexes ensured');
  } catch (err) {
    console.error('Failed to ensure indexes', err);
    process.exit(1);
  } finally {
    await connection.close();
  }
}

if (require.main === module) {
  ensureIndexes();
}
