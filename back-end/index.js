import { MongoClient } from "mongodb";

import express, { json } from 'express';
import cors from 'cors';

const mongoClient = new MongoClient("mongodb://localhost:27017");
let db;

mongoClient.connect().then(() => {
	db = mongoClient.db("projeto12-batepapo-uol-api");
});

const app = express();
app.use(cors());
app.use(json());

app.get('/participants', (req,res) => {
    res.status(200).send([]);
});

app.get('/messages', (req,res) => {
    res.status(200).send([]);
});

app.post('/participants', (req,res) => {

    if(req.headers.name != ""){
        db.collection("participantes").insertOne(
            {name: req.headers.name , lastStatus: Date.now()}
            ).then(() => {
            res.sendStatus(201);
        });   
    }else{
        res.sendStatus(422);    
    };
    
});

app.post('/status', (req,res) => {

});

app.post('/messages', (req,res) => {

});

app.listen(5000);