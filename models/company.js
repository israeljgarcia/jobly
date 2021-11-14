"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { constructValidFilters, getValidFilters, constructFilterQuery } = require("../helpers/filter");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
          `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   * @param { name, minEmployees, maxEmployees } filters -> An obj that contains up to three filters for the query
   * 
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * 
   * */

  static async findAll(filters={}) {
    const validFilters = getValidFilters(filters, ['name', 'minEmployees', 'maxEmployees']);

    // Check to see if there are no vaild filters
    if(Object.keys(validFilters).length == 0) {
      // Do the regular query
      const companiesRes = await db.query(
        `SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
         FROM companies
         ORDER BY name`);
      return companiesRes.rows;
    }

    const filterQuery = constructFilterQuery([
      "name ILIKE '%_QUERY_%'", 
      "num_employees >= _QUERY_", 
      "num_employees <= _QUERY_"
    ], ['name', 'minEmployees', 'maxEmployees'], validFilters);

    console.log(Object.values(validFilters));

    const companiesRes = await db.query(
      `SELECT handle,
              name,
              description,
              num_employees AS "numEmployees",
              logo_url AS "logoUrl"
      FROM companies
      WHERE ${filterQuery}
      ORDER BY name`,
      [Object.values(validFilters)]
    );
    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
          `SELECT c.handle,
                  c.name,
                  c.description,
                  c.num_employees AS "numEmployees",
                  c.logo_url AS "logoUrl",
                  j.id,
                  j.title,
                  j.salary,
                  j.equity
           FROM companies AS c
           JOIN jobs AS j ON c.handle = j.company_handle
           WHERE handle = $1`,
        [handle]);

    const jobs = companyRes.rows.map(c => (
       {
         id: c.id,
         title: c.title,
         salary: c.salary,
         equity: c.equity
       } 
      ));

    const { name, description, numEmployees, logoUrl } = companyRes.rows[0];
    const company = { handle, name, description, numEmployees, logoUrl, jobs };

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
          `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
