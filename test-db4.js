const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://idealplayabacus20_db_user:Sanjay14@cluster0.8j0zt2f.mongodb.net/arka_kids?retryWrites=true&w=majority&appName=Cluster0')
  .then(async () => {
    const Journal = mongoose.models.Journal || mongoose.model('Journal', new mongoose.Schema({}, { strict: false }));
    await Journal.create({
      className: "Nursery",
      tenantId: "Arka Salem",
      date: new Date().toISOString().slice(0, 10),
      photos: [],
      content: "This is a test from Antigravity!",
      postedBy: "System Admin"
    });
    console.log("Created test journal");
    mongoose.disconnect();
  });
