import { beforeEach, describe, expect, test } from "@jest/globals";
import mockPinia from "./setupPiniaForTesting";
import { operatorFromString, Fraction } from "../functions";

describe("operator module - reduce fraction feature", () => {
    beforeEach(() => {
        mockPinia();
    });

    test("Single Operator Inputs", () => {
        expect(JSON.parse((operatorFromString("x/z") as Fraction).ReduceMODIFICATION().getSerializedStructure())).toMatchObject({
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
            JSON.parse((operatorFromString("(x*x*x)/(z*z)") as Fraction).ReduceMODIFICATION().getSerializedStructure())
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
            JSON.parse((operatorFromString("(123*x)/(123*x)") as Fraction).ReduceMODIFICATION().getSerializedStructure())
        ).toMatchObject({
            type: "number",
            value: "1",
            children: [],
        });
    });

    test("Outputs one element", () => {
        expect(
            JSON.parse((operatorFromString("(123*x)/(123)") as Fraction).ReduceMODIFICATION().getSerializedStructure())
        ).toMatchObject({
            type: "variable",
            value: "x",
            children: [],
        });
    });

    test("Outputs multiplication", () => {
        expect(
            JSON.parse((operatorFromString("(y*x*z*a)/(x*y)") as Fraction).ReduceMODIFICATION().getSerializedStructure())
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
            JSON.parse((operatorFromString("x/(x*y)") as Fraction).ReduceMODIFICATION().getSerializedStructure())
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
            JSON.parse((operatorFromString("(x*z)/(x*y)") as Fraction).ReduceMODIFICATION().getSerializedStructure())
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
            JSON.parse((operatorFromString("(a*x*z)/(x*y)") as Fraction).ReduceMODIFICATION().getSerializedStructure())
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
            JSON.parse((operatorFromString("(z)/(z*(1+x)*y)") as Fraction).ReduceMODIFICATION().getSerializedStructure())
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
            JSON.parse((operatorFromString("(h)/((1+x)*y)") as Fraction).ReduceMODIFICATION().getSerializedStructure())
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
            JSON.parse((operatorFromString("(n*m)/(l*k)") as Fraction).ReduceMODIFICATION().getSerializedStructure())
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
