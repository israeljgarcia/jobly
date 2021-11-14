"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./Job.js");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u4Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /companies */

describe("create", function () {
    test("works", async function () {
        const newJob = await Job.create({
            title: "Software Dev",
            salary: 60000.00,
            equity: .1,
            companyHandle: "c2"
        });
        expect(newJob.title).toEqual("Software Dev");
        expect(newJob.salary).toEqual(60000.00);
    });

})

describe("findAll", function () {
    test("works", async function () {
        const results = await Job.findAll();
        expect(results.length).toEqual(6);
    });

    test("works with title filter", async function() {
        const results = await Job.findAll({ title: "software" });
        expect(results.length).toEqual(2);
    });

    test("works with minSalary", async function () {
        const results = await Job.findAll({ minSalary: 60000.00 });
        expect(results.length).toEqual(4);
    });

    test("works with equity", async function () {
        const results = await Job.findAll({ hasEquity: true });
        expect(results.length).toEqual(4);
    });

    test("works with multiple filters", async function () {
        const results = await Job.findAll({ title: "engineer", minSalary: 60000.00, hasEquity: true });
        expect(results.length).toEqual(2);
    })
});

describe("get", function () {
    test("works", async function () {
        const job = await db.query(
            `SELECT id, title, salary, equity, company_handle AS companyHandle
             FROM jobs`
        );
        const result = await Job.get(job.rows[0].id);
        expect(result).toEqual({
            id: job.rows[0].id,
            title: "software engineer",
            salary: 60000.00,
            equity: "0.1"
        })
    })
})

describe("update", function () {
    test("works", async function () {
        const job = await db.query(
            `SELECT id, title, salary, equity, company_handle AS companyHandle
             FROM jobs`
        );
        const result = await Job.update(job.rows[0].id, { title: "updated title", salary: 30000.00, equity: .3 })
        expect(result).toEqual({
            id: job.rows[0].id,
            title: "updated title",
            salary: 30000.00,
            equity: "0.3"
        })
    });
})

describe("remove", function () {
    test("works", async function () {
        const job = await db.query(
            `SELECT id, title, salary, equity, company_handle AS companyHandle
             FROM jobs`
        );
        await Job.remove(job.rows[0].id);
        const result = await db.query(
            `SELECT title
             FROM jobs
             WHERE id=$1`,
             [job.rows[0].id]
        );
        expect(result.rows.length).toEqual(0);
    })
})