"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { getValidFilters, constructFilterQuery } = require("../helpers/filter");
const { sqlForPartialUpdate } = require("../helpers/sql");

// Related functions for Jobs

class Job {
    /** Create a Job from data, update db, return new Job data
     * 
     * data should be { title, salary, equity, companyHandle }
     * 
     * Returns { id, title, salary, equity }
     * 
     * Throw BadRequestError if job already in the database
     * 
     */
    static async create({ title, salary, equity, companyHandle }) {
        const result = await db.query(
            `INSERT INTO jobs (title, salary, equity, company_handle)
             VALUES($1, $2, $3, $4)
             RETURNING id, title, salary, equity`,
             [
              title, 
              salary, 
              equity, 
              companyHandle
            ]
        );
        return result.rows[0];
    }

    /** Query all jobs from database
     * 
     * @param {title, minSalary, hasEquity} filters 
     * The filters are optional, but if used, they will filter
     * for job title, minimum salary, and/or if the company provides
     * equity or not
     * 
     * Returns { [ {job1}, {job2}, ... ] }
     * 
     */
    static async findAll(filters={}) {
        const validFilters = getValidFilters(filters, ['title', 'minSalary', 'hasEquity']);

        if(Object.keys(validFilters).length == 0) {
            const results = await db.query(
                `SELECT id, title, salary, equity, company_handle AS companyHandle
                 FROM jobs`
            );
    
            return results.rows;
        }

        let equityQuery = "";

        if (validFilters.hasOwnProperty('hasEquity')) {
            equityQuery = validFilters['hasEquity'] ? "equity > 0" : "equity = 0";
        }

        const filterQuery = constructFilterQuery(
            [
                "title ILIKE _QUERY_",
                "salary >= _QUERY_",
                equityQuery
            ],
            ['title', 'minSalary', 'hasEquity'],
            validFilters
        );

        const results = await db.query(
            `SELECT id,
                    title,
                    salary,
                    equity,
                    company_handle AS companyHandle
            FROM jobs
            WHERE ${filterQuery}
            ORDER BY title`,
            [Object.values(validFilters)]
          );
          return results.rows;
    }

    /** Query's a job by id
     * 
     * @param id -> Job id
     * 
     * Returns { id, title, salary, equity }
     * 
     */
    static async get(id) {
        const result = await db.query(
            `SELECT id, title, salary, equity
             FROM jobs
             WHERE id=$1`,
             [id]
        );

        return result.rows[0];
    }

    /** Updates job with data provided 
     * 
     * @param id -> Job id
     * @param data -> obj of column values
     * 
     * Returns { id, title, salary, equity }
     * 
     */
    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(data, {});
        const idVarIdx = "$" + (values.length + 1);

        const querySql = `UPDATE jobs
        SET ${setCols}
        WHERE id=${idVarIdx}
        RETURNING id, title, salary, equity`

        const result = await db.query(querySql, [...values, id]);

        return result.rows[0];
    }

    /** Deletes job from database
     * 
     * @param id
     * 
     * Returns success message or error message
     *  
     */
    static async remove(id) {
        const result = await db.query(
            `DELETE FROM jobs
             WHERE id=$1
             RETURNING title`,
             [id]
        );
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);
    }
}

module.exports = Job;