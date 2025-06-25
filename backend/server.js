const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
        .then(()=>{
            console.log("DB connection successful.");
        })
        .catch((err)=>{
            console.log(`DB connection error:${err}`);
        });

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/passwords', require('./routes/passwords'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));