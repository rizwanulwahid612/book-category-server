const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();

app.use(express.static('dist'))
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.d6f547g.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, { serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true, } });

async function run() {
    try {
        const booksCollection = client.db('books-category-servics').collection('books');
        const usersCollection = client.db('books-category-servics').collection('user');
        const addNewCollection = client.db('books-category-servics').collection('addnew');

        app.get('/api/books', async (req, res) => {
            const cursor = booksCollection.find({});
            const product = await cursor.toArray();

            res.send({ status: true, data: product });
        });
        app.post('/api/book', async (req, res) => {
            const product = req.body;

            const result = await booksCollection.insertOne(product);

            res.send(result);
        });
        app.post('/api/addnew', async (req, res) => {
            const product = req.body;

            const existing = await addNewCollection.findOne({ _id: product._id });
            if (existing) {
                res.status(409).send({ error: 'Id already exists' });
            } else {
                const result = await addNewCollection.insertOne(product);

                res.send(result);
            }
        });
        app.delete('/api/adddeletbook/:id', async (req, res) => {
            const id = req.params.id;

            const result = await addNewCollection.deleteOne({ _id: id });
            console.log(result);
            res.send(result);
        });


        app.get('/api/getaddnew', async (req, res) => {
            const cursor = addNewCollection.find({});
            const product = await cursor.toArray();

            res.send({ status: true, data: product });
        });
        app.get('/api/getaddbooksingle/:id', async (req, res) => {
            const title = req.params.id;
            const query = { _id: title }
            const result = await addNewCollection.findOne(query);
            console.log(result);
            res.send(result);
        });
        app.put('/api/editbook/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: id }
            const projectBody = req.body
            const options = { upsert: true }
            const updateProject = {
                $set: {
                    title: projectBody.title,
                    author: projectBody.author,
                    genre: projectBody.genre,
                    publicationdate: projectBody.publicationdate,
                    rating: projectBody.rating,
                }
            }
            const result = await addNewCollection.updateOne(query, updateProject, options)
            res.send(result)
        })
        app.post('/api/signup', async (req, res) => {
            const user = req.body;
            const existingUser = await usersCollection.findOne({ email: user.email });

            if (existingUser) {
                res.status(409).send({ error: 'Email already exists' });
            } else {
                const result = await usersCollection.insertOne(user);
                res.send(result);
            }
        });


        app.get('/api/users', async (req, res) => {
            const users = usersCollection.find({});
            const userdata = await users.toArray();
            res.send({ data: userdata });
        });

        app.get('/api/book/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await booksCollection.findOne(query);
            console.log(result);
            res.send(result);
        });


        app.post('/api/review/:id', async (req, res) => {
            const bookId = req.params.id;
            const review = req.body.review;

            console.log(bookId);
            console.log(review);

            const result = await booksCollection.updateOne(
                { _id: new ObjectId(bookId) },
                { $push: { reviews: review } }
            );

            console.log(result);

            if (result.modifiedCount !== 1) {
                console.error('Book is not found or review not added');
                res.json({ error: 'Book is not found or review not added' });
                return;
            }

            console.log('Book added successfully');
            res.json({ message: 'Book added successfully' });
        });
        app.get('/api/review/:id', async (req, res) => {
            const bookId = req.params.id;

            const result = await booksCollection.findOne(
                { _id: new ObjectId(bookId) },
                { projection: { _id: 0, reviews: 1 } }
            );

            if (result) {
                res.json(result);
            } else {
                res.status(404).json({ error: 'Book is not found' });
            }
        });


    } finally {

    }
}
run().catch((err) => console.log(err));

app.get('/api', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
