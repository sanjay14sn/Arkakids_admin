const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();
  const batches = await db.collection('batches').find({}).toArray();
  console.log(JSON.stringify(batches, null, 2));
  await client.close();
}
run();
