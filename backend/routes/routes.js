const express = require("express");
const router = express.Router();

const login = require("../controllers/login");
const signup = require("../controllers/signup");

const auth = require("../protected/auth");
const all = require("../protected/all-machines");
const existing = require("../protected/existing-machine");
const newM = require("../protected/new-machine");

router.post("/login", login);
router.post("/signup", signup);

router.get("/all-machines", auth, all);
router.post("/existing-machine", auth, existing);
router.post("/new-machine", auth, newM);

module.exports = router;