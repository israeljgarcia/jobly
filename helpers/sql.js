const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.

/**
 * 
 * @param {...requestData} dataToUpdate -> An obj that contains the columns to be updated
 * @param {...jsToSql} jsToSql -> An obj that maps the js column names to Sql column names
 * @returns { setCols: '"data1"=$1, "data2"=$1', values: [data1.value, data2.value] }
 */
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  // Gets all of the keys form the dataToUpdate obj as an array
  const keys = Object.keys(dataToUpdate);

  // Checks for no input
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      // Returns an array of strings that is SQL compatible
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    // Joins the array into a single string
    setCols: cols.join(", "),
    // Returns an array of the values of the keys
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
