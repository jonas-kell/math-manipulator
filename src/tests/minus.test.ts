import { beforeEach, describe, expect, test, jest } from "@jest/globals";
jest.useFakeTimers();
import mockPinia from "./setupPiniaForTesting";
import {
    operatorFromString,
    Numerical,
    BracketedMultiplication,
    Fraction,
    Negation,
    BracketedSum,
    generateOperatorConfig,
} from "../functions";

describe("operator module - pull out minus feature", () => {
    beforeEach(() => {
        mockPinia();
    });
    const testConfig = generateOperatorConfig();

    test("Pull out of number", () => {
        expect(JSON.parse(new Numerical(testConfig, 101).PullOutMinusMODIFICATION().getSerializedStructure())).toMatchObject({
            type: "number",
            value: "101",
            children: [],
        });
        expect(JSON.parse(new Numerical(testConfig, -101).PullOutMinusMODIFICATION().getSerializedStructure())).toMatchObject({
            type: "negation",
            value: "",
            children: [
                {
                    type: "number",
                    value: "101",
                    children: [],
                },
            ],
        });
    });

    test("Pull out of multiplication", () => {
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "x*y") as BracketedMultiplication)
                    .PullOutMinusMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
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
                    value: "y",
                    children: [],
                },
            ],
        });
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "-x*y*z") as BracketedMultiplication)
                    .PullOutMinusMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "negation",
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
                            value: "y",
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
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "x*y*-z") as BracketedMultiplication)
                    .PullOutMinusMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "negation",
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
                            value: "y",
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
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "-x*-y*-z") as BracketedMultiplication)
                    .PullOutMinusMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "negation",
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
                            value: "y",
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
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "-x*y*-z") as BracketedMultiplication)
                    .PullOutMinusMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
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
                    value: "y",
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

    test("Pull out of division", () => {
        expect(
            JSON.parse((operatorFromString(testConfig, "-1/x") as Fraction).PullOutMinusMODIFICATION().getSerializedStructure())
        ).toMatchObject({
            type: "negation",
            value: "",
            children: [
                {
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
                            value: "x",
                            children: [],
                        },
                    ],
                },
            ],
        });
        expect(
            JSON.parse((operatorFromString(testConfig, "1/-x") as Fraction).PullOutMinusMODIFICATION().getSerializedStructure())
        ).toMatchObject({
            type: "negation",
            value: "",
            children: [
                {
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
                            value: "x",
                            children: [],
                        },
                    ],
                },
            ],
        });
        expect(
            JSON.parse((operatorFromString(testConfig, "1/x") as Fraction).PullOutMinusMODIFICATION().getSerializedStructure())
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
                    value: "x",
                    children: [],
                },
            ],
        });
        expect(
            JSON.parse((operatorFromString(testConfig, "-1/-x") as Fraction).PullOutMinusMODIFICATION().getSerializedStructure())
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
                    value: "x",
                    children: [],
                },
            ],
        });
    });

    test("Pull out of negation", () => {
        expect(
            JSON.parse((operatorFromString(testConfig, "--1") as Negation).PullOutMinusMODIFICATION().getSerializedStructure())
        ).toMatchObject({
            type: "number",
            value: "1",
            children: [],
        });
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "-1") as BracketedMultiplication)
                    .PullOutMinusMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "negation",
            value: "",
            children: [
                {
                    type: "number",
                    value: "1",
                    children: [],
                },
            ],
        });
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "---1") as BracketedMultiplication)
                    .PullOutMinusMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "negation",
            value: "",
            children: [
                {
                    type: "number",
                    value: "1",
                    children: [],
                },
            ],
        });
    });

    test("Pull out of sum: manually", () => {
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "(-2-3)") as BracketedSum).PullOutMinusMODIFICATION().getSerializedStructure()
            )
        ).toMatchObject({
            type: "negation",
            value: "",
            children: [
                {
                    type: "bracketed_sum",
                    value: "",
                    children: [
                        {
                            type: "number",
                            value: "2",
                            children: [],
                        },
                        {
                            type: "number",
                            value: "3",
                            children: [],
                        },
                    ],
                },
            ],
        });
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "(2-3)") as BracketedSum).PullOutMinusMODIFICATION().getSerializedStructure()
            )
        ).toMatchObject({
            type: "negation",
            value: "",
            children: [
                {
                    type: "bracketed_sum",
                    value: "",
                    children: [
                        {
                            type: "negation",
                            value: "",
                            children: [
                                {
                                    type: "number",
                                    value: "2",
                                    children: [],
                                },
                            ],
                        },
                        {
                            type: "number",
                            value: "3",
                            children: [],
                        },
                    ],
                },
            ],
        });
        // Pulls out no matter what
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "(2+3)") as BracketedSum).PullOutMinusMODIFICATION().getSerializedStructure()
            )
        ).toMatchObject({
            type: "negation",
            value: "",
            children: [
                {
                    type: "bracketed_sum",
                    value: "",
                    children: [
                        {
                            type: "negation",
                            value: "",
                            children: [
                                {
                                    type: "number",
                                    value: "2",
                                    children: [],
                                },
                            ],
                        },
                        {
                            type: "negation",
                            value: "",
                            children: [
                                {
                                    type: "number",
                                    value: "3",
                                    children: [],
                                },
                            ],
                        },
                    ],
                },
            ],
        });
    });

    test("Pull out of sum: automatically", () => {
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "-1*(2+3)") as BracketedMultiplication)
                    .PullOutMinusMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "negation",
            value: "",
            children: [
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        {
                            type: "number",
                            value: "1",
                            children: [],
                        },
                        {
                            type: "bracketed_sum",
                            value: "",
                            children: [
                                {
                                    type: "number",
                                    value: "2",
                                    children: [],
                                },
                                {
                                    type: "number",
                                    value: "3",
                                    children: [],
                                },
                            ],
                        },
                    ],
                },
            ],
        });
        // ALL minus in sum -> gets pulled out automatically
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "-1*(-2-33-11)") as BracketedMultiplication)
                    .PullOutMinusMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_multiplication",
            value: "",
            children: [
                {
                    type: "number",
                    value: "1",
                    children: [],
                },
                {
                    type: "bracketed_sum",
                    value: "",
                    children: [
                        {
                            type: "number",
                            value: "2",
                            children: [],
                        },
                        {
                            type: "number",
                            value: "33",
                            children: [],
                        },
                        {
                            type: "number",
                            value: "11",
                            children: [],
                        },
                    ],
                },
            ],
        });
        // NOT all minus in sum -> gets NOT pulled out automatically
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "-1*(-2+33-11)") as BracketedMultiplication)
                    .PullOutMinusMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "negation",
            value: "",
            children: [
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        {
                            type: "number",
                            value: "1",
                            children: [],
                        },
                        {
                            type: "bracketed_sum",
                            value: "",
                            children: [
                                {
                                    type: "negation",
                                    value: "",
                                    children: [
                                        {
                                            type: "number",
                                            value: "2",
                                            children: [],
                                        },
                                    ],
                                },
                                {
                                    type: "number",
                                    value: "33",
                                    children: [],
                                },
                                {
                                    type: "negation",
                                    value: "",
                                    children: [
                                        {
                                            type: "number",
                                            value: "11",
                                            children: [],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        });
    });

    test("Pull out of complex: manually", () => {
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "complex(-1 -2)") as BracketedSum)
                    .PullOutMinusMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "negation",
            value: "",
            children: [
                {
                    type: "complex_operator_construct",
                    value: "",
                    children: [
                        { type: "number", value: "1", children: [] },
                        { type: "number", value: "2", children: [] },
                    ],
                },
            ],
        });
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "complex(1 -2)") as BracketedSum)
                    .PullOutMinusMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "negation",
            value: "",
            children: [
                {
                    type: "complex_operator_construct",
                    value: "",
                    children: [
                        { type: "negation", value: "", children: [{ type: "number", value: "1", children: [] }] },
                        { type: "number", value: "2", children: [] },
                    ],
                },
            ],
        });
        // Pulls out no matter what
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "complex(1 2)") as BracketedSum)
                    .PullOutMinusMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "negation",
            value: "",
            children: [
                {
                    type: "complex_operator_construct",
                    value: "",
                    children: [
                        { type: "negation", value: "", children: [{ type: "number", value: "1", children: [] }] },
                        { type: "negation", value: "", children: [{ type: "number", value: "2", children: [] }] },
                    ],
                },
            ],
        });
    });

    test("Pull out of complex: automatically", () => {
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "-1*complex(1 2)") as BracketedMultiplication)
                    .PullOutMinusMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "negation",
            value: "",
            children: [
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        { type: "number", value: "1", children: [] },
                        {
                            type: "complex_operator_construct",
                            value: "",
                            children: [
                                { type: "number", value: "1", children: [] },
                                { type: "number", value: "2", children: [] },
                            ],
                        },
                    ],
                },
            ],
        });
        // ALL minus in sum -> gets pulled out automatically
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "-1*complex(-1 -2)") as BracketedMultiplication)
                    .PullOutMinusMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_multiplication",
            value: "",
            children: [
                { type: "number", value: "1", children: [] },
                {
                    type: "complex_operator_construct",
                    value: "",
                    children: [
                        { type: "number", value: "1", children: [] },
                        { type: "number", value: "2", children: [] },
                    ],
                },
            ],
        });
        // NOT all minus in sum -> gets NOT pulled out automatically
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "-1*complex(1 -2)") as BracketedMultiplication)
                    .PullOutMinusMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "negation",
            value: "",
            children: [
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        { type: "number", value: "1", children: [] },
                        {
                            type: "complex_operator_construct",
                            value: "",
                            children: [
                                { type: "number", value: "1", children: [] },
                                { type: "negation", value: "", children: [{ type: "number", value: "2", children: [] }] },
                            ],
                        },
                    ],
                },
            ],
        });
    });

    test("Still works if children cannot pull out stuff", () => {
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "exp(-1)/-1") as Fraction).PullOutMinusMODIFICATION().getSerializedStructure()
            )
        ).toMatchObject({
            type: "negation",
            value: "",
            children: [
                {
                    type: "fraction",
                    value: "",
                    children: [
                        {
                            type: "exp_function",
                            value: "",
                            children: [
                                {
                                    type: "negation",
                                    value: "",
                                    children: [
                                        {
                                            type: "number",
                                            value: "1",
                                            children: [],
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "number",
                            value: "1",
                            children: [],
                        },
                    ],
                },
            ],
        });
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "exp(-1)/exp(-2)") as Fraction)
                    .PullOutMinusMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "fraction",
            value: "",
            children: [
                {
                    type: "exp_function",
                    value: "",
                    children: [
                        {
                            type: "negation",
                            value: "",
                            children: [
                                {
                                    type: "number",
                                    value: "1",
                                    children: [],
                                },
                            ],
                        },
                    ],
                },
                {
                    type: "exp_function",
                    value: "",
                    children: [
                        {
                            type: "negation",
                            value: "",
                            children: [
                                {
                                    type: "number",
                                    value: "2",
                                    children: [],
                                },
                            ],
                        },
                    ],
                },
            ],
        });
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "-exp(22)") as Negation).PullOutMinusMODIFICATION().getSerializedStructure()
            )
        ).toMatchObject({
            type: "negation",
            value: "",
            children: [
                {
                    type: "exp_function",
                    value: "",
                    children: [
                        {
                            type: "number",
                            value: "22",
                            children: [],
                        },
                    ],
                },
            ],
        });

        expect(
            JSON.parse(
                (operatorFromString(testConfig, "exp(33)*1") as BracketedMultiplication)
                    .PullOutMinusMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_multiplication",
            value: "",
            children: [
                {
                    type: "exp_function",
                    value: "",
                    children: [
                        {
                            type: "number",
                            value: "33",
                            children: [],
                        },
                    ],
                },
                {
                    type: "number",
                    value: "1",
                    children: [],
                },
            ],
        });

        expect(
            JSON.parse(
                (operatorFromString(testConfig, "-1*(exp(33)+exp(-2))") as BracketedMultiplication)
                    .PullOutMinusMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "negation",
            value: "",
            children: [
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        {
                            type: "number",
                            value: "1",
                            children: [],
                        },
                        {
                            type: "bracketed_sum",
                            value: "",
                            children: [
                                {
                                    type: "exp_function",
                                    value: "",
                                    children: [
                                        {
                                            type: "number",
                                            value: "33",
                                            children: [],
                                        },
                                    ],
                                },
                                {
                                    type: "exp_function",
                                    value: "",
                                    children: [
                                        {
                                            type: "negation",
                                            value: "",
                                            children: [
                                                {
                                                    type: "number",
                                                    value: "2",
                                                    children: [],
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        });

        expect(
            JSON.parse(
                (operatorFromString(testConfig, "-1*(-exp(33)+exp(-2))") as BracketedMultiplication)
                    .PullOutMinusMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "negation",
            value: "",
            children: [
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        {
                            type: "number",
                            value: "1",
                            children: [],
                        },
                        {
                            type: "bracketed_sum",
                            value: "",
                            children: [
                                {
                                    type: "negation",
                                    value: "",
                                    children: [
                                        {
                                            type: "exp_function",
                                            value: "",
                                            children: [
                                                {
                                                    type: "number",
                                                    value: "33",
                                                    children: [],
                                                },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    type: "exp_function",
                                    value: "",
                                    children: [
                                        {
                                            type: "negation",
                                            value: "",
                                            children: [
                                                {
                                                    type: "number",
                                                    value: "2",
                                                    children: [],
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        });

        expect(
            JSON.parse(
                (operatorFromString(testConfig, "-1*(-exp(33)-exp(-2))") as BracketedMultiplication)
                    .PullOutMinusMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_multiplication",
            value: "",
            children: [
                {
                    type: "number",
                    value: "1",
                    children: [],
                },
                {
                    type: "bracketed_sum",
                    value: "",
                    children: [
                        {
                            type: "exp_function",
                            value: "",
                            children: [
                                {
                                    type: "number",
                                    value: "33",
                                    children: [],
                                },
                            ],
                        },
                        {
                            type: "exp_function",
                            value: "",
                            children: [
                                {
                                    type: "negation",
                                    value: "",
                                    children: [
                                        {
                                            type: "number",
                                            value: "2",
                                            children: [],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        });

        expect(
            JSON.parse(
                (operatorFromString(testConfig, "exp(33)-exp(-2)") as BracketedMultiplication)
                    .PullOutMinusMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "negation",
            value: "",
            children: [
                {
                    type: "bracketed_sum",
                    value: "",
                    children: [
                        {
                            type: "negation",
                            value: "",
                            children: [
                                {
                                    type: "exp_function",
                                    value: "",
                                    children: [
                                        {
                                            type: "number",
                                            value: "33",
                                            children: [],
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "exp_function",
                            value: "",
                            children: [
                                {
                                    type: "negation",
                                    value: "",
                                    children: [
                                        {
                                            type: "number",
                                            value: "2",
                                            children: [],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        });
    });
});
