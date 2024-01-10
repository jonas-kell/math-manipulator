import { describe, expect, test, jest } from "@jest/globals";
jest.useFakeTimers();
import mockPinia from "./setupPiniaForTesting";
import { operatorFromString, generateOperatorConfig } from "../functions";

describe("parser module Macros feature", () => {
    const testConfig = generateOperatorConfig();

    test("Setup helper", () => {
        expect(() => mockPinia()).not.toThrow();
        expect(() => mockPinia({ test: "asd" })).toThrow();
        expect(() => mockPinia({ test: "asd" }, testConfig)).not.toThrow();
    });

    test("Parsing if macro not defined", () => {
        mockPinia();
        expect(() => operatorFromString(testConfig, "test")).not.toThrow();
        expect(JSON.parse(operatorFromString(testConfig, "test").getSerializedStructure())).toMatchObject({
            type: "variable",
            value: "test",
            children: [],
        });
    });

    test("Parsing if macro defined", () => {
        mockPinia(
            {
                test: "\\mathrm{asdasd}",
            },
            testConfig
        );

        expect(() => operatorFromString(testConfig, "test")).not.toThrow();
        expect(JSON.parse(operatorFromString(testConfig, "test").getSerializedStructure())).toMatchObject({
            type: "defined_macro",
            value: "test",
            children: [],
        });
        expect(operatorFromString(testConfig, "test").getExportFormulaString()).toBe("\\mathrm{asdasd}");
    });

    test("Macro with one argument", () => {
        mockPinia(
            {
                test: "\\mathrm{#0}",
            },
            testConfig
        );

        expect(() => operatorFromString(testConfig, "test")).toThrow();
        expect(JSON.parse(operatorFromString(testConfig, "test(2)").getSerializedStructure())).toMatchObject({
            type: "defined_macro",
            value: "test",
            children: [{ type: "number", value: "2", children: [] }],
        });
        expect(JSON.parse(operatorFromString(testConfig, "test(2 2)").getSerializedStructure())).toMatchObject({
            type: "defined_macro",
            value: "test",
            children: [
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        { type: "number", value: "2", children: [] },
                        { type: "number", value: "2", children: [] },
                    ],
                },
            ],
        });
    });

    test("Macro with multiple arguments", () => {
        mockPinia(
            {
                test: "\\mathrm{#0}#1",
            },
            testConfig
        );

        expect(() => operatorFromString(testConfig, "test")).toThrow();
        expect(JSON.parse(operatorFromString(testConfig, "test(2 2)").getSerializedStructure())).toMatchObject({
            type: "defined_macro",
            value: "test",
            children: [
                { type: "number", value: "2", children: [] },
                { type: "number", value: "2", children: [] },
            ],
        });
        expect(() => operatorFromString(testConfig, "test(2 2 2)")).toThrow();
    });

    test("Multi argument rendering", () => {
        mockPinia(
            {
                test: "\\mathrm{#0 #2}#1#0#1",
            },
            testConfig
        );

        expect(operatorFromString(testConfig, "test(1 2 3)").getExportFormulaString()).toBe("\\mathrm{{1} {3}}{2}{1}{2}");
        expect(JSON.parse(operatorFromString(testConfig, "test(1 2 3)").getSerializedStructure())).toMatchObject({
            type: "defined_macro",
            value: "test",
            children: [
                { type: "number", value: "1", children: [] },
                { type: "number", value: "2", children: [] },
                { type: "number", value: "3", children: [] },
            ],
        });
    });

    test("Precedence Grouping mixing", () => {
        mockPinia(
            {
                test: "\\mathrm{asd}",
                testtest: "\\mathrm{#0}",
            },
            testConfig
        );

        expect(
            JSON.parse(operatorFromString(testConfig, "test testtest(2) asd testtest(2)test").getSerializedStructure())
        ).toMatchObject({
            type: "bracketed_multiplication",
            value: "",
            children: [
                { type: "defined_macro", value: "test", children: [] },
                { type: "defined_macro", value: "testtest", children: [{ type: "number", value: "2", children: [] }] },
                { type: "variable", value: "asd", children: [] },
                { type: "defined_macro", value: "testtest", children: [{ type: "number", value: "2", children: [] }] },
                { type: "defined_macro", value: "test", children: [] },
            ],
        });
    });

    test("Macro in Macro and straight macro parsing", () => {
        mockPinia(
            {
                test: "asd(#0)-1",
                asd: "\\mathrm{#0}",
                lulz: "z+1",
            },
            testConfig
        );

        expect(JSON.parse(operatorFromString(testConfig, 'test(fc("" lulz))').getSerializedStructure())).toMatchObject({
            type: "bracketed_sum",
            value: "",
            children: [
                {
                    type: "defined_macro",
                    value: "asd",
                    children: [
                        {
                            type: "fermionic_creation",
                            value: "c",
                            children: [
                                {
                                    type: "bracketed_sum",
                                    value: "",
                                    children: [
                                        { type: "variable", value: "z", children: [] },
                                        { type: "number", value: "1", children: [] },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                { type: "negation", value: "", children: [{ type: "number", value: "1", children: [] }] },
            ],
        });
    });

    test("Isolated Defined Macro Argument construction", () => {
        mockPinia();

        expect(() => operatorFromString(testConfig, "$DMASS$(a)")).toThrow();
    });
});
