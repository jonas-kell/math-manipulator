import { describe, expect, test } from "@jest/globals";
import { operatorFromString } from "./../functions/parser";

describe("parser module end-to-end", () => {
    test("default variable parsing", () => {
        expect(() => operatorFromString("asd")).not.toThrow();
        expect(operatorFromString("asd").exportFormulaString()).toBe("{asd}");
        expect(JSON.parse(operatorFromString("asd").serializeStructure())).toMatchObject({
            children: [],
            type: "variable",
            value: "asd",
        });
    });
});
