const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json())






const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lyu72pb.mongodb.net/?retryWrites=true&w=majority`;

console.log(uri);

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const houseCollection = client.db('houseDB').collection('houseOwner');


    app.get('/house', async(req, res)=>{
        const cursor = houseCollection.find()
        const result = await cursor.toArray();
        res.send(result);
    })

    app.get('/house/:id', async(req, res)=>{
        const id = req.params.id;
        const bookings = await houseCollection.findOne({ _id: new ObjectId(id) })
        res.send(bookings)
    })

    app.post('/house', async(req, res)=>{
        const newHouse = req.body;
        const result = await houseCollection.insertOne(newHouse);
        res.send(result);
    })

    app.put('/house/:id', async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const options = { upsert: true };
        const updatedHouse = req.body;
        const house = {
          $set: updatedHouse
        }
        const result = await houseCollection.updateOne(filter, house, options)
        res.send(result)
      })

      app.delete("/house/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await houseCollection.deleteOne(query);
        res.send(result);
      });




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('house hunter server is running')
  })
  
  app.listen(port, () => {
    console.log(`house hunter server is running on port ${port}`)
  })