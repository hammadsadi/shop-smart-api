const express = require("express");
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// Init Express
const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);

// MongoDB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@syedsadibd.a5hvdhf.mongodb.net/?retryWrites=true&w=majority&appName=syedsadibd`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });

    // Collections
    const queriesCollection = client.db("queriesDB").collection("queries");

    // Create Queries
    app.post("/queries", async (req, res) => {
      const queryData = req.body;
      const result = await queriesCollection.insertOne(queryData);
      res.send(result);
    });

    // Get All Queries
    app.get("/queries", async (req, res) => {
      const result = await queriesCollection.find().toArray();
      res.send(result);
    });

    // Get Single Queries
    app.get("/queries/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await queriesCollection.findOne(query);
      res.send(result);
    });

    // Get User Added Query
    app.get("/user-query/:email", async (req, res) => {
      const { email } = req.params;
      const options = {
        // Sort returned documents in ascending order by title (A->Z)
        sort: { "user.date": -1 },
      };
      const query = { "user.email": email };
      const result = await queriesCollection.find(query, options).toArray();
      res.send(result);
    });

    // Update Query
    app.put("/update-query/:id", async (req, res) => {
      const { id } = req.params;
      const updateData = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          ...updateData,
        },
      };
      const result = await queriesCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // Delete Own Query
    app.delete("/delete-query/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await queriesCollection.deleteOne(query);
      res.send(result);
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello");
});

// Listen Server
app.listen(port, () => {
  console.log(`Server is Running On PORT ${port}`);
});
