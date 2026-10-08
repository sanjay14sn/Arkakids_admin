const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://idealplayabacus20_db_user:Sanjay14@cluster0.8j0zt2f.mongodb.net/arka_kids?retryWrites=true&w=majority&appName=Cluster0')
  .then(async () => {
    const Journal = mongoose.models.Journal || mongoose.model('Journal', new mongoose.Schema({}, { strict: false }));
    const journals = await Journal.find().lean();
    console.log("Journals length:", journals.length);
    console.log("Latest journals:", JSON.stringify(journals.slice(-3), null, 2));
    mongoose.disconnect();
  });
