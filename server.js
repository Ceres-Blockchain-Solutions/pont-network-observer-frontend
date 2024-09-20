// server.js
import express from 'express';
import {MongoClient} from 'mongodb';
import cors from 'cors';

const app = express();
const port = 5000; // You can choose any port

app.use(cors());

const uri = "mongodb://localhost:27017"; // Replace with your MongoDB connection string
const client = new MongoClient(uri);

app.get('/api/data', async (req, res) => {
  try {
    await client.connect();
    const database = client.db('pontNetwork'); // Replace with your database name
    const collection = database.collection('dataFingerprints'); // Replace with your collection name
    const data = await collection.find({}).toArray();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching data');
  } finally {
    await client.close();
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});