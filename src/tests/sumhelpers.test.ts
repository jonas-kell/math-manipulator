import { describe, expect, test, jest } from "@jest/globals";
jest.useFakeTimers();
import mockPinia from "./setupPiniaForTesting";
import { BracketedSum, generateOperatorConfig, operatorFromString } from "../functions";

describe("operator module - Advanced operations on sums", () => {
    const testConfig = generateOperatorConfig();

    test("Order all operator strings in sum", () => {
        mockPinia(
            {
                "c#": 'fc("" #0)',
                c: 'fa("" #0)',
            },
            testConfig
        );

        expect(
            JSON.parse(
                (
                    operatorFromString(
                        testConfig,
                        "c#(3)c#(1)c(3)c(2)+c#(1)c#(2)e c(3)c(1)+c#(3)exp(a)c(3)c(1)-(c#(3)exp(a)c(4)c(1))-sum({}{}{})"
                    ) as BracketedSum
                )
                    .AllSummandsOrderOperatorStringMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_sum",
            value: "",
            children: [
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        { type: "fermionic_annihilation", value: "c", children: [{ type: "number", value: "2", children: [] }] },
                        { type: "fermionic_creation", value: "c", children: [{ type: "number", value: "1", children: [] }] },
                    ],
                },
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        { type: "fermionic_annihilation", value: "c", children: [{ type: "number", value: "2", children: [] }] },
                        { type: "fermionic_annihilation", value: "c", children: [{ type: "number", value: "3", children: [] }] },
                        { type: "fermionic_creation", value: "c", children: [{ type: "number", value: "1", children: [] }] },
                        { type: "fermionic_creation", value: "c", children: [{ type: "number", value: "3", children: [] }] },
                    ],
                },
                {
                    type: "negation",
                    value: "",
                    children: [
                        {
                            type: "bracketed_multiplication",
                            value: "",
                            children: [
                                { type: "constant_e", value: "", children: [] },
                                {
                                    type: "fermionic_annihilation",
                                    value: "c",
                                    children: [{ type: "number", value: "3", children: [] }],
                                },
                                {
                                    type: "fermionic_creation",
                                    value: "c",
                                    children: [{ type: "number", value: "2", children: [] }],
                                },
                            ],
                        },
                    ],
                },
                {
                    type: "negation",
                    value: "",
                    children: [
                        {
                            type: "bracketed_multiplication",
                            value: "",
                            children: [
                                { type: "constant_e", value: "", children: [] },
                                {
                                    type: "fermionic_annihilation",
                                    value: "c",
                                    children: [{ type: "number", value: "1", children: [] }],
                                },
                                {
                                    type: "fermionic_annihilation",
                                    value: "c",
                                    children: [{ type: "number", value: "3", children: [] }],
                                },
                                {
                                    type: "fermionic_creation",
                                    value: "c",
                                    children: [{ type: "number", value: "1", children: [] }],
                                },
                                {
                                    type: "fermionic_creation",
                                    value: "c",
                                    children: [{ type: "number", value: "2", children: [] }],
                                },
                            ],
                        },
                    ],
                },
                {
                    type: "negation",
                    value: "",
                    children: [
                        {
                            type: "bracketed_multiplication",
                            value: "",
                            children: [
                                {
                                    type: "fermionic_creation",
                                    value: "c",
                                    children: [{ type: "number", value: "3", children: [] }],
                                },
                                { type: "exp_function", value: "", children: [{ type: "variable", value: "a", children: [] }] },
                                {
                                    type: "fermionic_annihilation",
                                    value: "c",
                                    children: [{ type: "number", value: "1", children: [] }],
                                },
                                {
                                    type: "fermionic_annihilation",
                                    value: "c",
                                    children: [{ type: "number", value: "3", children: [] }],
                                },
                            ],
                        },
                    ],
                },
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        { type: "fermionic_creation", value: "c", children: [{ type: "number", value: "3", children: [] }] },
                        { type: "exp_function", value: "", children: [{ type: "variable", value: "a", children: [] }] },
                        { type: "fermionic_annihilation", value: "c", children: [{ type: "number", value: "1", children: [] }] },
                        { type: "fermionic_annihilation", value: "c", children: [{ type: "number", value: "4", children: [] }] },
                    ],
                },
                {
                    type: "negation",
                    value: "",
                    children: [
                        {
                            type: "big_sum",
                            value: "",
                            children: [
                                { type: "empty_argument", value: "", children: [] },
                                { type: "empty_argument", value: "", children: [] },
                                { type: "empty_argument", value: "", children: [] },
                            ],
                        },
                    ],
                },
            ],
        });
    });

    test("Group equal elements in sum", () => {
        mockPinia();

        expect(
            JSON.parse(
                (operatorFromString(testConfig, "x+y+x+z-z+2+y*y+3*x+h-(4 h)-h") as BracketedSum)
                    .GroupEqualElementsMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_sum",
            value: "",
            children: [
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        { type: "number", value: "5", children: [] },
                        { type: "variable", value: "x", children: [] },
                    ],
                },
                { type: "variable", value: "y", children: [] },
                { type: "number", value: "2", children: [] },
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        { type: "variable", value: "y", children: [] },
                        { type: "variable", value: "y", children: [] },
                    ],
                },
                {
                    type: "negation",
                    value: "",
                    children: [
                        {
                            type: "bracketed_multiplication",
                            value: "",
                            children: [
                                { type: "number", value: "4", children: [] },
                                { type: "variable", value: "h", children: [] },
                            ],
                        },
                    ],
                },
            ],
        });
    });

    test("Order summands", () => {
        mockPinia();

        expect(
            JSON.parse(
                (operatorFromString(testConfig, "-(x*y)+(x*y)+(x*y*z)-(y*y)-(x*y)+z+x+(z*z*z)") as BracketedSum)
                    .OrderSummandsMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_sum",
            value: "",
            children: [
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        { type: "variable", value: "x", children: [] },
                        { type: "variable", value: "y", children: [] },
                    ],
                },
                {
                    type: "negation",
                    value: "",
                    children: [
                        {
                            type: "bracketed_multiplication",
                            value: "",
                            children: [
                                { type: "variable", value: "x", children: [] },
                                { type: "variable", value: "y", children: [] },
                            ],
                        },
                    ],
                },
                {
                    type: "negation",
                    value: "",
                    children: [
                        {
                            type: "bracketed_multiplication",
                            value: "",
                            children: [
                                { type: "variable", value: "x", children: [] },
                                { type: "variable", value: "y", children: [] },
                            ],
                        },
                    ],
                },
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        { type: "variable", value: "x", children: [] },
                        { type: "variable", value: "y", children: [] },
                        { type: "variable", value: "z", children: [] },
                    ],
                },
                {
                    type: "negation",
                    value: "",
                    children: [
                        {
                            type: "bracketed_multiplication",
                            value: "",
                            children: [
                                { type: "variable", value: "y", children: [] },
                                { type: "variable", value: "y", children: [] },
                            ],
                        },
                    ],
                },
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        { type: "variable", value: "z", children: [] },
                        { type: "variable", value: "z", children: [] },
                        { type: "variable", value: "z", children: [] },
                    ],
                },
                { type: "variable", value: "x", children: [] },
                { type: "variable", value: "z", children: [] },
            ],
        });
    });

    test("Factor out left from sum", () => {
        mockPinia();

        expect(
            JSON.parse(
                (
                    operatorFromString(
                        testConfig,
                        "(2*x*y)+(2*x*z)-(2*x*exp(t))+(y z)-(y 2)+(y f)+(y a)+exp(1)-exp(1)"
                    ) as BracketedSum
                )
                    .FactorOutLeftMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_sum",
            value: "",
            children: [
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        { type: "variable", value: "y", children: [] },
                        {
                            type: "bracketed_sum",
                            value: "",
                            children: [
                                { type: "variable", value: "z", children: [] },
                                { type: "negation", value: "", children: [{ type: "number", value: "2", children: [] }] },
                                { type: "variable", value: "f", children: [] },
                                { type: "variable", value: "a", children: [] },
                            ],
                        },
                    ],
                },
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        { type: "number", value: "2", children: [] },
                        { type: "variable", value: "x", children: [] },
                        { type: "variable", value: "y", children: [] },
                    ],
                },
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        { type: "number", value: "2", children: [] },
                        { type: "variable", value: "x", children: [] },
                        { type: "variable", value: "z", children: [] },
                    ],
                },
                {
                    type: "negation",
                    value: "",
                    children: [
                        {
                            type: "bracketed_multiplication",
                            value: "",
                            children: [
                                { type: "number", value: "2", children: [] },
                                { type: "variable", value: "x", children: [] },
                                { type: "exp_function", value: "", children: [{ type: "variable", value: "t", children: [] }] },
                            ],
                        },
                    ],
                },
                { type: "exp_function", value: "", children: [{ type: "number", value: "1", children: [] }] },
                {
                    type: "negation",
                    value: "",
                    children: [{ type: "exp_function", value: "", children: [{ type: "number", value: "1", children: [] }] }],
                },
            ],
        });

        expect(
            JSON.parse(
                (operatorFromString(testConfig, "(y*2)+(2*y)-(x)+(z x)") as BracketedSum)
                    .FactorOutLeftMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_sum",
            value: "",
            children: [
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        { type: "variable", value: "y", children: [] },
                        { type: "number", value: "2", children: [] },
                    ],
                },
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        { type: "number", value: "2", children: [] },
                        { type: "variable", value: "y", children: [] },
                    ],
                },
                { type: "negation", value: "", children: [{ type: "variable", value: "x", children: [] }] },
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        { type: "variable", value: "z", children: [] },
                        { type: "variable", value: "x", children: [] },
                    ],
                },
            ],
        });
    });
});
