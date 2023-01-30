const express = require("express");
const cors = require("cors")
require("dotenv").config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express()
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json());

const jwt = require('jsonwebtoken')



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.msatzvk.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const run = async () => {
    try {
        const userCollection = client.db("BillingExpert").collection("users")
        const billCollection = client.db("BillingExpert").collection("billContainer")



        // user registration 

        app.post('/api/registration', async (req, res) => {
            const { email, password, name } = req.body;

            const query = {
                email: email,
                password: password,
                name: name
            }

            const useremail = await userCollection.findOne(query)

            if (useremail) {
                return res.send({
                    status: "error",
                    message: "email already exists",
                });
            }

            const result = await userCollection.insertOne(query)

            const token = jwt.sign(result, process.env.ACCESS_TOKEN_SECRET);

            res.send({
                status: "success",
                message: "Congratulation Account Created Successfully",
                data: result,
                token: token
            })
        })





        // user login 

        app.post('/api/login', async (req, res) => {
            const { email, password } = req.body;

            const query = {
                email: email,
                password: password,
            }

            const studentInfo = await userCollection.findOne(query)

            if (!studentInfo) {
                return res.send({
                    status: "error",
                    message: "User does not exists",
                });
            }

            const isPasswordCorrectUser = await userCollection.findOne(query)

            if (!isPasswordCorrectUser) {
                return res.send({
                    status: "error",
                    message: "Invalid credintials",
                });
            }

            delete isPasswordCorrectUser.password;

            const token = jwt.sign(isPasswordCorrectUser, process.env.ACCESS_TOKEN_SECRET);

            res.send({
                status: "success",
                message: "Wellcome Back",
                data: isPasswordCorrectUser,
                token: token
            })
        })


        // bill adding

        app.post('/api/add-billing', async (req, res) => {
            const billData = req.body
            const result = await billCollection.insertOne(billData);
            res.send(result)
        })


        // get bill all 

        app.get('/api/billing-list', async (req, res) => {
            const result = await billCollection.find().toArray()
            res.send(result)
        })


        // all bill for pagination

        app.get('/api/billing-list', async (req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);
            const query = {}
            const cursor = billCollection.find(query)
            const billings = await cursor.skip(page * size).limit(size).toArray();
            const count = await billCollection.estimatedDocumentCount();
            res.send({ count, billings })
        })



        // update bill 
        app.put('/api/update-billing/:id', async (req, res) => {
            const id = req.params.id
            const bill = req.body
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true }
            const updateDoc = {
                $set: bill,
            }
            const result = await billCollection.updateOne(filter, updateDoc, options)
            console.log(result)

            res.send(result)
        })

        // bill delete
        app.delete('/api/delete-billing/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await billCollection.deleteOne(filter)
            res.send(result)
        })





    } catch (error) {
        console.log(error)
    }
}

run()

app.get('/', (req, res) => {
    res.send("BillingExpert is running")
})

app.listen(port, () => {
    console.log(`BillingExpert is Running on ${port}`)
})

