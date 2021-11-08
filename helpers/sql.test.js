const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

describe('Test Partial Update function', () => {
    test('returns correct columns and values', () => {
        const { setCols, values } = sqlForPartialUpdate(
            {
                 "firstName": "izzy",
                 "lastName": "garc"
            }, 
            {
                "firstName": "first_name",
                "lastName": "last_name"
            });
        expect(setCols).toEqual('"first_name"=$1, "last_name"=$2');
        expect(values).toEqual([ "izzy", "garc" ]);
    });

    test('returns BadRequestError for no data input', () => {
        const err = () => {
            sqlForPartialUpdate({}, {});
        }
        expect(err).toThrow(BadRequestError);
    });
});
