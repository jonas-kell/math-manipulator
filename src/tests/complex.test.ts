import { beforeEach, describe, expect, test, jest } from "@jest/globals";
jest.useFakeTimers();
import mockPinia from "./setupPiniaForTesting";
import {
    operatorFromString,
    generateOperatorConfig,
    ComplexOperatorConstruct,
    BracketedMultiplication,
    BracketedSum,
    ComplexIConstant,
} from "../functions";

describe("operator module - complex numbers feature", () => {
    beforeEach(() => {
        mockPinia();
    });
    const testConfig = generateOperatorConfig();

    test("simplify to real", () => {
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "complex(x 0)") as ComplexOperatorConstruct)
                    .getCopyWithGottenRidOfUnnecessaryTerms()
                    .getSerializedStructure()
            )
        ).toMatchObject({ type: "variable", value: "x", children: [] });
    });

    test("multiply complex numbers", () => {
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "complex(x y) *3") as BracketedMultiplication)
                    .MultiplyComplexNumbersMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "complex_operator_construct",
            value: "",
            children: [
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        { type: "number", value: "3", children: [] },
                        { type: "variable", value: "x", children: [] },
                    ],
                },
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        { type: "number", value: "3", children: [] },
                        { type: "variable", value: "y", children: [] },
                    ],
                },
            ],
        });
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "complex(x y) *2*i") as BracketedMultiplication)
                    .MultiplyComplexNumbersMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "complex_operator_construct",
            value: "",
            children: [
                {
                    type: "negation",
                    value: "",
                    children: [
                        {
                            type: "bracketed_multiplication",
                            value: "",
                            children: [
                                { type: "number", value: "2", children: [] },
                                { type: "variable", value: "y", children: [] },
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
                    ],
                },
            ],
        });

        expect(
            JSON.parse(
                (operatorFromString(testConfig, "3*z*complex(x y)") as BracketedMultiplication)
                    .MultiplyComplexNumbersMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "complex_operator_construct",
            value: "",
            children: [
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        { type: "number", value: "3", children: [] },
                        { type: "variable", value: "z", children: [] },
                        { type: "variable", value: "x", children: [] },
                    ],
                },
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        { type: "number", value: "3", children: [] },
                        { type: "variable", value: "z", children: [] },
                        { type: "variable", value: "y", children: [] },
                    ],
                },
            ],
        });

        expect(
            JSON.parse(
                (operatorFromString(testConfig, "complex(v w)complex(x y)") as BracketedMultiplication)
                    .MultiplyComplexNumbersMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "complex_operator_construct",
            value: "",
            children: [
                {
                    type: "bracketed_sum",
                    value: "",
                    children: [
                        {
                            type: "bracketed_multiplication",
                            value: "",
                            children: [
                                { type: "variable", value: "v", children: [] },
                                { type: "variable", value: "x", children: [] },
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
                                        { type: "variable", value: "w", children: [] },
                                        { type: "variable", value: "y", children: [] },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    type: "bracketed_sum",
                    value: "",
                    children: [
                        {
                            type: "bracketed_multiplication",
                            value: "",
                            children: [
                                { type: "variable", value: "v", children: [] },
                                { type: "variable", value: "y", children: [] },
                            ],
                        },
                        {
                            type: "bracketed_multiplication",
                            value: "",
                            children: [
                                { type: "variable", value: "w", children: [] },
                                { type: "variable", value: "x", children: [] },
                            ],
                        },
                    ],
                },
            ],
        });
    });

    test("add complex numbers", () => {
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "complex(x y) + complex(z 0) + l + i") as BracketedSum)
                    .CombineComplexNumbersMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "complex_operator_construct",
            value: "",
            children: [
                {
                    type: "bracketed_sum",
                    value: "",
                    children: [
                        { type: "variable", value: "x", children: [] },
                        { type: "variable", value: "z", children: [] },
                        { type: "variable", value: "l", children: [] },
                    ],
                },
                {
                    type: "bracketed_sum",
                    value: "",
                    children: [
                        { type: "number", value: "1", children: [] },
                        { type: "variable", value: "y", children: [] },
                    ],
                },
            ],
        });
    });

    test("upcast to i", () => {
        expect(operatorFromString(testConfig, "complex(0 1)") instanceof ComplexIConstant).toBeTruthy();
        expect(operatorFromString(testConfig, "complex(1 0)") instanceof ComplexIConstant).toBeFalsy();
        expect(operatorFromString(testConfig, "complex(1 1)") instanceof ComplexIConstant).toBeFalsy();
        expect(operatorFromString(testConfig, "i") instanceof ComplexIConstant).toBeTruthy();
    });

    test("split into sum", () => {
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "complex(v*a w)") as ComplexOperatorConstruct)
                    .SplitIntoSumMODIFICATION()
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
                        { type: "variable", value: "v", children: [] },
                        { type: "variable", value: "a", children: [] },
                    ],
                },
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        {
                            type: "complex_operator_construct",
                            value: "",
                            children: [
                                { type: "number", value: "0", children: [] },
                                { type: "number", value: "1", children: [] },
                            ],
                        },
                        { type: "variable", value: "w", children: [] },
                    ],
                },
            ],
        });
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "complex(v*a 1)") as ComplexOperatorConstruct)
                    .SplitIntoSumMODIFICATION()
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
                        { type: "variable", value: "v", children: [] },
                        { type: "variable", value: "a", children: [] },
                    ],
                },
                {
                    type: "complex_operator_construct",
                    value: "",
                    children: [
                        { type: "number", value: "0", children: [] },
                        { type: "number", value: "1", children: [] },
                    ],
                },
            ],
        });
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "complex(v*a 0)") as ComplexOperatorConstruct)
                    .SplitIntoSumMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_multiplication",
            value: "",
            children: [
                { type: "variable", value: "v", children: [] },
                { type: "variable", value: "a", children: [] },
            ],
        });
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "complex(0 2)") as ComplexOperatorConstruct)
                    .SplitIntoSumMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_multiplication",
            value: "",
            children: [
                { type: "number", value: "2", children: [] },
                {
                    type: "complex_operator_construct",
                    value: "",
                    children: [
                        { type: "number", value: "0", children: [] },
                        { type: "number", value: "1", children: [] },
                    ],
                },
            ],
        });
    });

    test("Rendering of complex special cases", () => {
        expect(operatorFromString(testConfig, "complex(0 2)").getExportFormulaString()).toEqual("2i");
        expect(operatorFromString(testConfig, "complex(0 0)").getExportFormulaString()).toEqual("0");
        expect(operatorFromString(testConfig, "complex(0 1)").getExportFormulaString()).toEqual("i");
        expect(operatorFromString(testConfig, "complex(0 x)").getExportFormulaString()).toEqual("i\\cdot {x}");
        expect(operatorFromString(testConfig, "complex(2 0)").getExportFormulaString()).toEqual("2");
        expect(operatorFromString(testConfig, "complex(2 1)").getExportFormulaString()).toEqual("\\left(2+i\\right)");
        expect(operatorFromString(testConfig, "complex(2 2)").getExportFormulaString()).toEqual("\\left(2+2i\\right)");
        expect(operatorFromString(testConfig, "complex(y x)").getExportFormulaString()).toEqual("\\left({y}+i\\cdot {x}\\right)");
        expect(operatorFromString(testConfig, "complex(y+x x)").getExportFormulaString()).toEqual(
            "\\left(\\left({y}+{x}\\right)+i\\cdot {x}\\right)"
        );
        expect(operatorFromString(testConfig, "complex((y+x);(y-x))").getExportFormulaString()).toEqual(
            "\\left(\\left({y}+{x}\\right)+i\\cdot \\left({y}-{x}\\right)\\right)"
        );
    });
});
