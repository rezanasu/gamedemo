// Router
const express = require("express")
const router = express.Router();
const {User, Game} = require("../models")
const bcrypt = require("bcrypt")
const salt = bcrypt.genSaltSync(10)
const jwt = require("jsonwebtoken")
const SECRET_KEY = "rahasia"

const {authentication, authorization} = require("../middlewares/auth.js")

// Users

// ----> Feature Register user baru
router.post("/register", async(req, res, next) => {
   
    // Menerima input data email, username sama password
    const {email, username, password} = req.body;

    // Password kemudian di hash menggunakan bcrypt
    const hashPassword = bcrypt.hashSync(password, salt);

    const createdUser = await User.create({
        email,
        username,
        password: hashPassword
    }, {returning: true})

    res.status(201).json(createdUser)
})

// ---> Feature Login user
router.post("/login", async(req, res, next) => {
    try {
        const {email, password} = req.body;

        // 1. Cari user di database
        const foundUser = await User.findOne({
            where: {
                email
            }
        })

        if(foundUser) {

            // 2. Check password
            const comparePassword = bcrypt.compareSync(password, foundUser.password)

            if(comparePassword) {

                // Generate token menggunakan jsonwebtoken
                const accessToken = jwt.sign({
                    email: foundUser.email,
                    username: foundUser.username
                }, SECRET_KEY)

                res.status(200).json({
                    message: "Login Sucessfully",
                    email: foundUser.email,
                    username: foundUser.username,
                    accessToken
                })
            } else {
                throw {name: "InvalidCredentials"}
            }

        } else {
            throw {name: "InvalidCredentials"}
        }
    } catch(err) {
        // Masuk ke middleware selanjutnya
        next(err)
    }
})

// Pengecekan login atau belum
router.use(authentication)
// Games

router.post("/games", async(req, res, next) => {
    try {
        const {title, year, publisher} = req.body;
        const {id} = req.loggedUser

        const game = await Game.create({
            title,
            year,
            publisher,
            user_id: id
        }, {returning: true})

        res.status(201).json({
            message: "Game created successfully",
            data: game
        })
    } catch(err) {
        next(err)
    }
})

// List All Games
router.get("/games", async(req, res, next) => {
    try {
        const games = await Game.findAll()

        res.status(200).json(games)
    } catch(err) {
        next(err)
    }
})

// Get Game Detail by ID
router.get("/games/:id", async(req, res, next) => {
    try {
        const {id} = req.params;

        const foundGame = await Game.findOne({
            where: {
                id
            },
            include: {
                model: User
            }
        })

        if(foundGame) {
            res.status(200).json(foundGame)
        } else {
            throw {name: "ErrorNotFound"}
        }
    } catch(err) {
        next(err);
    }
})

// Update Game by ID

// Tidak bisa update / delete game milik orang lain
// harus ada authorization
router.put("/games/:id", authorization, async(req, res, next) => {
    try {
        const {id} = req.params;
        const {title, year, publisher} = req.body;

        const foundGame = await Game.findOne({
            where: {
                id
            }
        })

        if(foundGame) {
            const updatedGame = await foundGame.update({
                title: title || foundGame.title,
                year: year || foundGame.year,
                publisher: publisher || foundGame.publisher
            }, {returning: true})

            res.status(200).json({
                message: "Game updated successfully",
                data: updatedGame
            })
        } else {
            throw {name: "ErrorNotFound"}
        }
    } catch(err) {
        next(err);
    }
})

router.delete("/games/:id", authorization, async (req, res, next) => {
    try {
        const {id} = req.params;

        const foundGame = await Game.findOne({
            where: {
                id
            }
        })

        if(foundGame) {
            await foundGame.destroy()

            res.status(200).json({
                message: "Game deleted successfully"
            })
        } else {
            throw {name: "ErrorNotFound"}
        }
    } catch(err) {
        next(err);
    }
})


module.exports = router;