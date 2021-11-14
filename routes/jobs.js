"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");

const express = require("express");
const { ensureLoggedIn, ensureAdmin, ensureAdminOrAuthUser } = require("../middleware/auth");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("../models/Job");
const jobNew = require("../schemas/jobNew.json");

const router = express.Router();

router.post("/", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(jobNew, req.body);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const job = await Job.create(req.body);
        return res.status(201).json({ job });
    } catch (err) {
        return next(err);
    }
});

router.get("/:id", async function (req, res, next) {
    try {
        const job = await Job.get(req.params.id);
        if(!job) {
            throw new NotFoundError("This job does not exist");
        }
        return res.status(201).json({ job });
    } catch (err) {
        return next(err);
    }
});

router.get("/", async function (req, res, next) {
    try {
        const filters = req.query;
        const jobs = await Job.findAll(filters);
        return res.status(201).json({ jobs });
    } catch (err) {
        return next(err);
    }
})

router.patch("/:id", async function (req, res, next) {
    try {
        const job = await Job.update(req.params.id, req.body);
        if(!job) {
            throw new NotFoundError("This job does not exist");
        }
        return res.status(201).json({ job });
    } catch (err) {
        return next(err);
    }
})

router.delete("/:id", async function (req, res, next) {
    try {
        await Job.remove(req.params.id);
        return res.status(201).json({ message: `Deleted job ${req.params.id}` });
    } catch (err) {
        return next(err);
    }
})

module.exports = router;