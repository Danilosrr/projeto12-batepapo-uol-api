import { MongoClient } from "mongodb";
import dotenv from "dotenv";

import express, { json } from 'express';
import cors from 'cors';
import joi from 'joi';

const app = express();
app.use(cors());
app.use(json());
dotenv.config();

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
const serverPromise = mongoClient.connect();
serverPromise.then(() => {
	db = mongoClient.db("projeto12-batepapo-uol-api");
});
serverPromise.catch(error => console.log("error during connection to mongodb", error));

const messageSchema = joi.object({
    from: joi.string().required(),
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().required(),
    time: joi.string().required()
});

setInterval(inativeParticipants,15000);

async function inativeParticipants(){
    const inativeParticipants = await db.collection("participantes").find( { lastStatus: { $lte: (Date.now()-10000) } } ).toArray();
    try {
        inativeParticipants.forEach(participant => {
            db.collection("participantes").deleteOne({ _id: participant._id });
            db.collection("mensagens").insertOne({ from: participant.name , to: 'Todos' , text: "sai da sala..." , type: 'status' , time: new Date().toLocaleTimeString() });
        });
    } catch (error) {
        console.log(error);
    };
};

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
    const username = req.headers.user;
    const AllMessages = await db.collection("mensagens").find({}).toArray(); 

    let filteredMessages = AllMessages.filter( message =>(message.from === username || message.to === username || message.type === 'message'));
    
    try {
        
        res.status(200).send(filteredMessages.slice(-renderLimit));
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
        const searchUsername = await db.collection("participantes").find({ name: username }).toArray();
        if (!!searchUsername){
            await db.collection("participantes").updateOne({ name: username },{$set: { lastStatus: Date.now() }});
            res.sendStatus(200);
        };
    }catch (error) {
       console.log(error);
       res.sendStatus(404);
   }
});

app.post('/messages', async (req,res) => {
    const { to, text, type } = req.body;
    const from  = req.headers.user; 

    let message = { from, to, text, type, time: new Date().toLocaleTimeString()};
    let participants = await db.collection("participantes").find({}).toArray();
    let checkParticipant = participants.some( participant => participant.name === message.from )

    const validation = messageSchema.validate(message,{ abortEarly: true });
    if (validation.error || checkParticipant === false) {
        res.sendStatus(422);
        console.log(validation);
    };

    try {
        const sendMessage = await db.collection("mensagens").insertOne( message );
        console.log(sendMessage);
        res.sendStatus(201);
    } catch (error) {
        console.log(error);
        res.sendStatus(422);
    };
});

app.listen(5000, () => {console.log("Servidor iniciado")} );