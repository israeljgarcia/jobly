/**
 * 
 * @param [ validKey1, validKey2, ... ] validFilters 
 * @param { filterKey1: filterVal1, ... } filters 
 * 
 * Returns an obj containing the validKey validVal pairs
 * { name: "exampleName", minEmployees: 2, ... }
 * 
 */
function constructValidFilters(validFilters, filters) {
    let validFiltersObj = {};
    for (let filter of validFilters) {
        // Setting the validFilters keys to the correct values from the filters obj
        // { validKey1: filters.validKey1 }
        validFiltersObj[filter] = filters[filter];
    }

    return validFiltersObj;
}

/**
 * 
 * @param filters -> { obj containing all query args from query string } 
 * @param validKeys -> [ array of valid keys ] 
 * 
 * Returns { obj containing all valid filter key-value pairs }
 * 
 */
function getValidFilters(filters, validKeys) {
    // Get the keys of the filters argument
    const filterKeys = Object.keys(filters);

    // Check for valid filters
    const validFilters = filterKeys.filter(f => validKeys.includes(f));

    // Construct the filters obj of the valid key-value pairs
    const validFiltersObj = constructValidFilters(validFilters, filters);

    return validFiltersObj;
}

/** Creates a SQL query based on the queries, filters, and obj given respectively
 * 
 * @param {An array of queries with the keyword '_QUERY_' in place of the value to use} arrQueries -> []
 * @param {An array of values to check if they are keys of validFilters} arrFilters -> []
 * @param {An obj containing all valid key-value pairs for the query} validFilters -> {}
 * 
 * Note: This will only create queries equal to the amount of filters in validFilters
 * 
 * @returns final query to be executed: String
 * 
 */
function constructFilterQuery(arrQueries, arrFiltersToCheck, validFilters) {
    // An array to hold all queries
    let filterQueries = [];

    // Loop through all filters to check for
    for(let i = 0; i < arrFiltersToCheck.length; i++) {
        // Check if validFilters has a certain filter as a key
        if(validFilters.hasOwnProperty(arrFiltersToCheck[i])) {            
            // Add the query to the obj
            filterQueries.push(arrQueries[i]);
        }
    }

    // Final query
    let filterQuery = '';

    for (let [indx, query] of filterQueries.entries()) {
        if(filterQuery.length > 0) {
            filterQuery += ' AND ';
        }
        const newQuery = query.replace("_QUERY_", `$${indx+1}`);
        filterQuery += newQuery;
    }

    console.log(filterQuery);
    

    // Join all queries if more than one
    // if(filterQueries.length > 1) {
    //     filterQuery = filterQueries.join(' AND ');
    // } else {
    //     filterQuery = filterQueries[0];
    // }

    return filterQuery;
}

module.exports = {
    constructValidFilters,
    getValidFilters,
    constructFilterQuery
};