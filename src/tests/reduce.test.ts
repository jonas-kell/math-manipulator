import { beforeEach, describe, expect, test, jest } from "@jest/globals";
jest.useFakeTimers();
import mockPinia from "./setupPiniaForTesting";
import { operatorFromString, Fraction, generateOperatorConfig } from "../functions";

describe("operator module - reduce fraction feature", () => {
    beforeEach(() => {
        mockPinia();
    });
    const testConfig = generateOperatorConfig();

    test("Single Operator Inputs", () => {
        expect(
            JSON.parse((operatorFromString(testConfig, "x/z") as Fraction).ReduceMODIFICATION().getSerializedStructure())
        ).toMatchObject({
            type: "fraction",
            value: "",
            children: [
                {
                    type: "variable",
                    value: "x",
                    children: [],
                },
                {
                    type: "variable",
                    value: "z",
                    children: [],
                },
            ],
        });
    });

    test("Multiplication Inputs", () => {
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "(x*x*x)/(z*z)") as Fraction).ReduceMODIFICATION().getSerializedStructure()
            )
        ).toMatchObject({
            type: "fraction",
            value: "",
            children: [
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        {
                            type: "variable",
                            value: "x",
                            children: [],
                        },
                        {
                            type: "variable",
                            value: "x",
                            children: [],
                        },
                        {
                            type: "variable",
                            value: "x",
                            children: [],
                        },
                    ],
                },
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        {
                            type: "variable",
                            value: "z",
                            children: [],
                        },
                        {
                            type: "variable",
                            value: "z",
                            children: [],
                        },
                    ],
                },
            ],
        });
    });

    test("Outputs One (all reduced)", () => {
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "(123*x)/(123*x)") as Fraction).ReduceMODIFICATION().getSerializedStructure()
            )
        ).toMatchObject({
            type: "number",
            value: "1",
            children: [],
        });
    });

    test("Outputs one element", () => {
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "(123*x)/(123)") as Fraction).ReduceMODIFICATION().getSerializedStructure()
            )
        ).toMatchObject({
            type: "variable",
            value: "x",
            children: [],
        });
    });

    test("Outputs multiplication", () => {
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "(y*x*z*a)/(x*y)") as Fraction).ReduceMODIFICATION().getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_multiplication",
            value: "",
            children: [
                {
                    type: "variable",
                    value: "z",
                    children: [],
                },
                {
                    type: "variable",
                    value: "a",
                    children: [],
                },
            ],
        });
    });

    test("Outputs one over one element", () => {
        expect(
            JSON.parse((operatorFromString(testConfig, "x/(x*y)") as Fraction).ReduceMODIFICATION().getSerializedStructure())
        ).toMatchObject({
            type: "fraction",
            value: "",
            children: [
                {
                    type: "number",
                    value: "1",
                    children: [],
                },
                {
                    type: "variable",
                    value: "y",
                    children: [],
                },
            ],
        });
    });

    test("Outputs one element over one element", () => {
        expect(
            JSON.parse((operatorFromString(testConfig, "(x*z)/(x*y)") as Fraction).ReduceMODIFICATION().getSerializedStructure())
        ).toMatchObject({
            type: "fraction",
            value: "",
            children: [
                {
                    type: "variable",
                    value: "z",
                    children: [],
                },
                {
                    type: "variable",
                    value: "y",
                    children: [],
                },
            ],
        });
    });

    test("Outputs multiplication over one element", () => {
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "(a*x*z)/(x*y)") as Fraction).ReduceMODIFICATION().getSerializedStructure()
            )
        ).toMatchObject({
            type: "fraction",
            value: "",
            children: [
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        {
                            type: "variable",
                            value: "a",
                            children: [],
                        },
                        {
                            type: "variable",
                            value: "z",
                            children: [],
                        },
                    ],
                },
                {
                    type: "variable",
                    value: "y",
                    children: [],
                },
            ],
        });
    });

    test("Outputs one over multiplication", () => {
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "(z)/(z*(1+x)*y)") as Fraction).ReduceMODIFICATION().getSerializedStructure()
            )
        ).toMatchObject({
            type: "fraction",
            value: "",
            children: [
                {
                    type: "number",
                    value: "1",
                    children: [],
                },
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        {
                            type: "bracketed_sum",
                            value: "",
                            children: [
                                {
                                    type: "number",
                                    value: "1",
                                    children: [],
                                },
                                {
                                    type: "variable",
                                    value: "x",
                                    children: [],
                                },
                            ],
                        },
                        {
                            type: "variable",
                            value: "y",
                            children: [],
                        },
                    ],
                },
            ],
        });
    });

    test("Outputs one element over multiplication", () => {
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "(h)/((1+x)*y)") as Fraction).ReduceMODIFICATION().getSerializedStructure()
            )
        ).toMatchObject({
            type: "fraction",
            value: "",
            children: [
                {
                    type: "variable",
                    value: "h",
                    children: [],
                },
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        {
                            type: "bracketed_sum",
                            value: "",
                            children: [
                                {
                                    type: "number",
                                    value: "1",
                                    children: [],
                                },
                                {
                                    type: "variable",
                                    value: "x",
                                    children: [],
                                },
                            ],
                        },
                        {
                            type: "variable",
                            value: "y",
                            children: [],
                        },
                    ],
                },
            ],
        });
    });

    test("Outputs multiplication over multiplication", () => {
        expect(
            JSON.parse((operatorFromString(testConfig, "(n*m)/(l*k)") as Fraction).ReduceMODIFICATION().getSerializedStructure())
        ).toMatchObject({
            type: "fraction",
            value: "",
            children: [
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        {
                            type: "variable",
                            value: "n",
                            children: [],
                        },
                        {
                            type: "variable",
                            value: "m",
                            children: [],
                        },
                    ],
                },
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        {
                            type: "variable",
                            value: "l",
                            children: [],
                        },
                        {
                            type: "variable",
                            value: "k",
                            children: [],
                        },
                    ],
                },
            ],
        });
    });
});
