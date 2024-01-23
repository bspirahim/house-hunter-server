const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');

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



// verify jwt
function verifyJWT(req, res, next) {
    const authorization = req.headers.authorization;
    if (authorization) {
        const token = authorization.split(" ")[1];
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
            if (error) {
                return res.status(401).send({ error: true, message: "unauthorized access" });
            }
            req.decoded = decoded;
            next();
        });
    } else {
        return res.status(401).send({ error: true, message: "unauthorized access" });
    }
}

//JWT Token Create
const CreateJWT = function (user) {
    delete user.password;
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "24h",
    });
    return token;
};


async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        //await client.connect();

        const houseCollection = client.db('houseDB').collection('houseOwner');
        const usersCollection = client.db('houseDB').collection('users');

        app.get('/house', async (req, res) => {
            const cursor = houseCollection.find()
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/house/:id', async (req, res) => {
            const id = req.params.id;
            const bookings = await houseCollection.findOne({ _id: new ObjectId(id) })
            res.send(bookings);
        })

        app.post('/house', verifyJWT, async (req, res) => {
            const newHouse = req.body;
            const result = await houseCollection.insertOne(newHouse);
            res.send(result);
        })

        app.put('/house/:id', verifyJWT, async (req, res) => {
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

        app.delete("/house/:id", verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await houseCollection.deleteOne(query);
            res.send(result);
        });


        app.post("/auth-status", verifyJWT, async (req, res) => {
            res.send({ user: req.decoded });
        });
        //login
        app.post("/auth", async (req, res) => {
            const data = req.body;
            try {
                const user = await usersCollection.findOne({ email: data.email });
                console.log(user);
                if (data.task == 'login') {
                    if (!user._id) {
                        res.status(401).json({ error: "User not found!" });
                    } else {
                        if (user.password === data.password) {
                            const retrievedToken = CreateJWT(user);
                            res.status(200).json({
                                error: "Login successful.",
                                user: user,
                                token: retrievedToken,
                            });
                        } else {
                            res.status(401).json({ error: "Invalid credentials." });
                        }
                    }
                } else {
                    if (user) {
                        res.status(401).json({ error: "User found, try another email!" });
                    } else {
                        delete data.task;
                        const newUser = await usersCollection.insertOne(data);
                        // console.log(newUser);
                        if (!newUser) {
                            res.status(401).json({ error: "Signup failed!" });
                        } else {
                            const retrievedToken = CreateJWT(newUser);
                            res.status(201).json({
                                error: "Signup successful.",
                                user: newUser,
                                token: retrievedToken,
                            });
                        }
                    }
                }
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });


        // Send a ping to confirm a successful connection
        //await client.db("admin").command({ ping: 1 });
        //console.log("Pinged your deployment. You successfully connected to MongoDB!");
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