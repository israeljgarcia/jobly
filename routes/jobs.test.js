"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u4Token,
} = require("./_testCommon");
const Job = require("../models/job");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
    test("ok for admins", async function () {
        const resp = await request(app)
        .post("/jobs")
        .send({
            title: "this is the new test job",
            salary: 5000.00,
            equity: .005,
            companyHandle: "c2"
        })
        .set("authorization", `Bearer ${u4Token}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body.job.title).toEqual("this is the new test job");
    });

    test("401 for unauth", async function () {
        const resp = await request(app)
        .post("/jobs")
        .send({
            title: "this is the new test job",
            salary: 5000.00,
            equity: .005,
            companyHandle: "c2"
        })
        .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("401 for anon", async function () {
        const resp = await request(app)
        .post("/jobs")
        .send({
            title: "this is the new test job",
            salary: 5000.00,
            equity: .005,
            companyHandle: "c2"
        });
        expect(resp.statusCode).toEqual(401);
    });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
    test("ok no filters", async function () {
        const resp = await request(app).get("/jobs");
        expect(resp.statusCode).toEqual(201);
        expect(resp.body.jobs.length).toEqual(5);
    });
});

describe("GET /jobs/id", function() {
    test("ok for anon", async function () {
        const jobs = await Job.findAll();
        const jobId = jobs[0].id;
        const url = `/jobs/${jobId}`;
        console.log(url);
        const resp = await request(app)
        .get(url);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body.job.id).toEqual(jobId);
    });

    test("404 for id that does not exist", async function () {
        const resp = await request(app).get("/jobs/-1");
        expect(resp.statusCode).toEqual(404);
    });
});

/************************************** PATCH /jobs */

describe("PATCH /jobs/id", function () {
    test("ok for admin or auth user", async function () {
        const jobs = await Job.findAll();
        const jobId = jobs[0].id;
        const resp = await request(app)
        .patch(`/jobs/${jobId}`)
        .send({ title: "new title" });
        expect(resp.statusCode).toEqual(201);
        expect(resp.body.job.id).toEqual(jobId);
        expect(resp.body.job.title).toEqual("new title");
    });

    test("404 for invalid id", async function () {
        const resp = await request(app)
        .patch("/jobs/-1")
        .send({ title: "new title" });
        expect(resp.statusCode).toEqual(404);
    });

    test("400 for no data", async function () {
        const jobs = await Job.findAll();
        const jobId = jobs[0].id;
        const resp = await request(app)
        .patch(`/jobs/${jobId}`);
        expect(resp.statusCode).toEqual(400);
    })
});

/************************************** DELETE /jobs */

describe("DELETE /jobs/id", function () {
    test("ok for admin and auth user", async function () {
        const jobs = await Job.findAll();
        const jobId = jobs[0].id;
        const resp = await request(app)
        .delete(`/jobs/${jobId}`);
        expect(resp.statusCode).toEqual(201);
    });
});