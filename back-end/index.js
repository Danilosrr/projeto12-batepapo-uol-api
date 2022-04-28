import { MongoClient } from "mongodb";
import dotenv from "dotenv";

import express, { json } from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(json());
dotenv.config();

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

mongoClient.connect().then(() => {
	db = mongoClient.db("projeto12-batepapo-uol-api");
});

app.get('/participants', async (req,res) => {

    try{
        const participants = await db.collection("participantes").find({}).toArray();
        res.status(200).send(participants);
    }catch(error){
        console.log(error);
        res.sendStatus(422);
    }
});

app.get('/messages', async (req,res) => {
    const renderLimit = req.query.limit;

    try {
        const getAllMessages = await db.collection("mensagens").find({}).toArray(); 
        res.status(200).send(getAllMessages.slice(0,renderLimit));
    } catch (error) {
        console.log(error);
        res.sendStatus(422);
    };
    
});

app.post('/participants', async (req,res) => {

    try {
        const sendUser = await db.collection("participantes").insertOne( { name: req.body.name , lastStatus: Date.now() } );
        res.sendStatus(201);
    } catch (error) {
        console.log(error);
        res.sendStatus(422);
    };
});

app.post('/status', async (req,res) => {
   const username = req.headers.user;
    try {
        const searchUsername = await db.collection("participantes").findOne({ name: username });
        if (!!searchUsername){
            db.collection("participantes").updateOne({ name: username },{$set: { lastStatus: Date.now() }});
            console.log("Status atualizado");
        };
    }catch (error) {
       console.log(error);
       res.sendStatus(404);
   }
});

app.post('/messages', async (req,res) => {
    const { to, text, type } = req.body;
    const from  = req.headers.user; 

    try {
        const sendMessage = await db.collection("mensagens").insertOne( { from: from , to: to , text: text , type: type } );
        console.log(sendMessage);
        res.sendStatus(201);
    } catch (error) {
        console.log(error);
        res.sendStatus(422);
    };
});

app.listen(5000);