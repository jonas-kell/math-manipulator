import { beforeEach, describe, expect, test, jest } from "@jest/globals";
jest.useFakeTimers();
import mockPinia from "./setupPiniaForTesting";
import { operatorFromString, generateOperatorConfig } from "../functions";

describe("parser module end-to-end", () => {
    beforeEach(() => {
        mockPinia();
    });
    const testConfig = generateOperatorConfig();

    test("Strings can be parsed and are separated from brackets and operators", () => {
        expect(() => operatorFromString(testConfig, '"')).toThrow();
        expect(() => operatorFromString(testConfig, '"asd" "')).toThrow();

        expect(() => operatorFromString(testConfig, '"asd"')).not.toThrow();
        expect(() => operatorFromString(testConfig, '""')).not.toThrow();
        expect(() => operatorFromString(testConfig, '"a" f "b" f "e"')).not.toThrow();

        expect(() => operatorFromString(testConfig, '"asd"a b ""')).toThrow(); // a b implies multiplicate, but string doesn't (//TODO could be fixed)
        expect(() => operatorFromString(testConfig, '"asd"* a * b * ""')).not.toThrow();

        expect(() => operatorFromString(testConfig, '( "asd)"')).toThrow(); // closing bracket missing as it is in the string
        expect(() => operatorFromString(testConfig, '( "asd)" )')).not.toThrow();

        expect(JSON.parse(operatorFromString(testConfig, '"a"a a').getSerializedStructure())).toMatchObject({
            type: "structural_container",
            value: "",
            children: [
                { type: "string", value: "a", children: [] },
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        { type: "variable", value: "a", children: [] },
                        { type: "variable", value: "a", children: [] },
                    ],
                },
            ],
        });
    });

    test("Strings in operator arguments", () => {
        expect(JSON.parse(operatorFromString(testConfig, 'exp("h" + a)').getSerializedStructure())).toMatchObject({
            type: "exp_function",
            value: "",
            children: [
                {
                    type: "bracketed_sum",
                    value: "",
                    children: [
                        { type: "string", value: "h", children: [] },
                        { type: "variable", value: "a", children: [] },
                    ],
                },
            ],
        });
        expect(JSON.parse(operatorFromString(testConfig, 'fc("h" n + 1)').getSerializedStructure())).toMatchObject({
            type: "fermionic_creation",
            value: "h",
            children: [
                {
                    type: "bracketed_sum",
                    value: "",
                    children: [
                        { type: "variable", value: "n", children: [] },
                        { type: "number", value: "1", children: [] },
                    ],
                },
            ],
        });
        expect(JSON.parse(operatorFromString(testConfig, 'fc("" n + 1)').getSerializedStructure())).toMatchObject({
            type: "fermionic_creation",
            value: "c",
            children: [
                {
                    type: "bracketed_sum",
                    value: "",
                    children: [
                        { type: "variable", value: "n", children: [] },
                        { type: "number", value: "1", children: [] },
                    ],
                },
            ],
        });

        expect(() => operatorFromString(testConfig, "fc(n 1)")).toThrow(); // argument needs to be string
    });
});
