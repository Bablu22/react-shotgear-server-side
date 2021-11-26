const express = require('express')
require("dotenv").config();
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId
// const admin = require("firebase-admin");
const fileUpload = require('express-fileupload')
const app = express()
const port = process.env.PORT || 5000
const cors = require('cors')

// This is a sample test API key.
const stripe = require('stripe')(process.env.STRIPE_SECRET);

app.use(express.static("public"));
app.use(cors())
app.use(express.json())
app.use(fileUpload())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sqmxk.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        client.connect()
        // create database
        const database = client.db("SHORTGEAR");
        const servicesCollection = database.collection("services");
        const priceCollection = database.collection("pricing");
        const ordersCollection = database.collection("orders");
        const reviewsCollection = database.collection("reviews");
        const usersCollection = database.collection("users");



        // get all service api
        app.get('/services', async (req, res) => {
            const cursor = servicesCollection.find({})
            const service = await cursor.toArray()
            res.json(service)
        })
        // get all price api
        app.get('/prices', async (req, res) => {
            const cursor = priceCollection.find({})
            const prices = await cursor.toArray()
            res.json(prices)
        })
        // Get price by single id 
        app.get('/prices/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await priceCollection.findOne(query)
            res.json(result)
        })

        app.get('/orders/:email/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await ordersCollection.findOne(query)
            res.json(result)
        })

        // get all orders by email 
        app.get('/orders/:email', async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const result = await ordersCollection.find(query).toArray()

            res.send(result)
        })


        // get all reviews api
        app.get('/reviews', async (req, res) => {
            const cursor = reviewsCollection.find({})
            const result = await cursor.toArray()
            res.json(result)
        })

        // get all orders api
        app.get('/orders', async (req, res) => {
            const cursor = ordersCollection.find({})
            const result = await cursor.toArray()
            res.json(result)

        })
        // get paymentable orders by id



        // post orders api
        app.post('/orders', async (req, res) => {
            const data = req.body
            const orders = await ordersCollection.insertOne(data)
            res.json(orders)
        })

        //post reviews api
        app.post('/reviews', async (req, res) => {
            const data = req.body
            const result = await reviewsCollection.insertOne(data)
            res.json(result)
        })

        // POST SERVICE API
        app.post('/services', async (req, res) => {

            const name = req.body.name
            const description = req.body.description
            const pic = req.files.image;
            const picData = pic.data
            const encodedPic = picData.toString('base64')
            const image = Buffer.from(encodedPic, 'base64')

            const service = {
                name,
                description,
                img: image
            }
            const result = await servicesCollection.insertOne(service)
            res.json(result)

        })



        //................ Admin.....................//
        app.post('/users', async (req, res) => {
            const data = req.body
            const result = await usersCollection.insertOne(data)
            res.json(result)
        })
        app.get('/users', async (req, res) => {
            const cursor = usersCollection.find({})
            const result = await cursor.toArray()
            res.json(result)
        })
        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user }
            const result = await usersCollection.updateOne(filter, updateDoc, options)

            res.json(result)
        })

        // Make admin
        app.put('/users/admin', async (req, res) => {
            const user = req.body
            const filter = { email: user.email }
            const updateDoc = { $set: { role: 'admin' } }
            const result = await usersCollection.updateOne(filter, updateDoc)
            res.json(result)
            console.log(result);
        })

        app.get('/users/:email', async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const user = await usersCollection.findOne(query)
            let isAdmin = false
            if (user?.role === 'admin') {
                isAdmin = true
            }
            res.json({ admin: isAdmin })
        })


        // Delete products Api
        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await ordersCollection.deleteOne(query)
            res.send(result)
        })
        app.delete('/services/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await servicesCollection.deleteOne(query)
            res.send(result)
        })


        // paymrnt gateway
        app.post("/create-payment-intent", async (req, res) => {
            const paymentInfo = req.body;
            const amount = paymentInfo.price * 100

            // Create a PaymentIntent with the order amount and currency
            const paymentIntent = await stripe.paymentIntents.create({
                currency: "usd",
                amount: amount,
                automatic_payment_methods: ['card']
            });
            console.log(amount);
            res.json({
                clientSecret: paymentIntent.client_secret,
            });
        });



    }










    catch {
        // client.close()
    }
}
run().catch(console.dir)



app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})