import { MongoClient } from 'mongodb';

async function run() {
  const uri = 'mongodb+srv://idealplayabacus20_db_user:Sanjay14@cluster0.8j0zt2f.mongodb.net/arka_kids?retryWrites=true&w=majority&appName=Cluster0';
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  
  const allBatches = await db.collection('batches').find({}).toArray();
  const sahhbBatches = allBatches.filter(b => (b.studentNames || []).some(n => n.includes("sahhb") || n.includes("Test student 3")));
  console.log("Batches with sahhb or Test student 3:", JSON.stringify(sahhbBatches.map(b => b.code), null, 2));
  
  const sahhb = await db.collection('students').find({ name: { $regex: /sahhb/i } }).toArray();
  console.log("sahhb STUDENT:", JSON.stringify(sahhb, null, 2));

  await client.close();
}
run().catch(console.error);
