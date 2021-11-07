"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
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
    // Get the keys of the filters argument
    const filterKeys = Object.keys(filters);

    // Check for valid filters
    const validFilters = filterKeys.filter(f => f == 'name' || f == 'minEmployees' || f == 'maxEmployees');

    // Check to see if there are no vaild filters
    if(validFilters.length == 0) {
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

    // Construct an obj with the valid filters
    let validFiltersObj = {};
    for (let filter of validFilters) {
      // Setting the validFilters keys to the correct values from the filters obj
      // { validKey1: filters.validKey1 }
      validFiltersObj[filter] = filters[filter];
    }

    // Construct filter query
    let filterQueries = [];

    // Check for name filter
    if(validFiltersObj.hasOwnProperty('name')) {
      filterQueries.push(`name ILIKE '%${validFiltersObj['name']}%'`);
    }

    // Check for minEmployees filter
    if(validFiltersObj.hasOwnProperty('minEmployees')) {
      filterQueries.push(`num_employees >= ${validFiltersObj['minEmployees']}`);
    }

    // Check for maxEmployees filter
    if(validFiltersObj.hasOwnProperty('maxEmployees')) {
      filterQueries.push(`num_employees <= ${validFiltersObj['maxEmployees']}`);
    }

    // Final query
    let filterQuery = '';

    // Join all queries if more than one
    if(filterQueries.length > 1) {
      filterQuery = filterQueries.join(' AND ');
    } else {
      filterQuery = filterQueries[0];
    }

    const companiesRes = await db.query(
      `SELECT handle,
              name,
              description,
              num_employees AS "numEmployees",
              logo_url AS "logoUrl"
      FROM companies
      WHERE ${filterQuery}
      ORDER BY name`
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
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
        [handle]);

    const company = companyRes.rows[0];

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
