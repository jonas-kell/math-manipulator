import { beforeEach, describe, expect, test, jest } from "@jest/globals";
jest.useFakeTimers();
import mockPinia from "./setupPiniaForTesting";
import {
    operatorFromString,
    Numerical,
    StructuralContainer,
    Variable,
    BracketedSum,
    generateOperatorConfig,
    Braket,
} from "../functions";

describe("operator module - numerical folding feature", () => {
    beforeEach(() => {
        mockPinia();
    });
    const testConfig = generateOperatorConfig();

    test("default sum folding", () => {
        expect(
            JSON.parse(operatorFromString(testConfig, "2+3+4").getCopyWithNumbersFolded().getSerializedStructure())
        ).toMatchObject({
            type: "number",
            value: "9",
            children: [],
        });
    });

    test("default multiplication folding", () => {
        expect(
            JSON.parse(operatorFromString(testConfig, "1 2 3").getCopyWithNumbersFolded().getSerializedStructure())
        ).toMatchObject({
            type: "number",
            value: "6",
            children: [],
        });
    });

    test("Unfoldable stuff does not get folded", () => {
        expect(JSON.parse(operatorFromString(testConfig, "x").getCopyWithNumbersFolded().getSerializedStructure())).toMatchObject(
            {
                type: "variable",
                value: "x",
                children: [],
            }
        );
    });

    test("Multi level Fold", () => {
        expect(
            JSON.parse(operatorFromString(testConfig, "1+8/2+3*2**(1+1)").getCopyWithNumbersFolded().getSerializedStructure())
        ).toMatchObject({
            type: "number",
            value: "17",
            children: [],
        });
    });

    test("Partial folding on unfoldable", () => {
        expect(
            JSON.parse(operatorFromString(testConfig, "1+8/2+3*x**(1+1)").getCopyWithNumbersFolded().getSerializedStructure())
        ).toMatchObject({
            type: "bracketed_sum",
            value: "",
            children: [
                {
                    type: "number",
                    value: "5",
                    children: [],
                },
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        {
                            type: "number",
                            value: "3",
                            children: [],
                        },
                        {
                            type: "power",
                            value: "",
                            children: [
                                {
                                    type: "variable",
                                    value: "x",
                                    children: [],
                                },
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
    });

    test("Rest of the implemented calculation options", () => {
        expect(
            JSON.parse(operatorFromString(testConfig, "1/y-2-z+1").getCopyWithNumbersFolded().getSerializedStructure())
        ).toMatchObject({
            type: "bracketed_sum",
            value: "",
            children: [
                {
                    type: "number",
                    value: "-1",
                    children: [],
                },
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
                            value: "y",
                            children: [],
                        },
                    ],
                },
                {
                    type: "negation",
                    value: "",
                    children: [
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
            JSON.parse(operatorFromString(testConfig, "1/y-2-z+1").getCopyWithNumbersFolded().getSerializedStructure())
        ).toMatchObject({
            type: "bracketed_sum",
            value: "",
            children: [
                {
                    type: "number",
                    value: "-1",
                    children: [],
                },
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
                            value: "y",
                            children: [],
                        },
                    ],
                },
                {
                    type: "negation",
                    value: "",
                    children: [
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
                operatorFromString(testConfig, "exp(-inf)+exp(z)+sin(pi)+sin(x)+cos(pi)+cos(y)")
                    .getCopyWithNumbersFolded()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_sum",
            value: "",
            children: [
                {
                    type: "number",
                    value: "-1",
                    children: [],
                },
                {
                    type: "exp_function",
                    value: "",
                    children: [
                        {
                            type: "variable",
                            value: "z",
                            children: [],
                        },
                    ],
                },
                {
                    type: "sin",
                    value: "",
                    children: [
                        {
                            type: "variable",
                            value: "x",
                            children: [],
                        },
                    ],
                },
                {
                    type: "cos",
                    value: "",
                    children: [
                        {
                            type: "variable",
                            value: "y",
                            children: [],
                        },
                    ],
                },
            ],
        });
        expect(
            JSON.parse(
                new StructuralContainer(testConfig, [
                    new Variable(testConfig, "x"),
                    new BracketedSum(testConfig, [new Numerical(testConfig, 1), new Numerical(testConfig, 0)]),
                ])
                    .getCopyWithNumbersFolded()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            children: [
                {
                    children: [],
                    type: "variable",
                    value: "x",
                },
                {
                    children: [],
                    type: "number",
                    value: "1",
                },
            ],
            type: "structural_container",
            value: "",
        });
    });

    test("Rendering of folded infinity", () => {
        expect(
            // ; in input required, this is wanted
            JSON.parse(operatorFromString(testConfig, "int (inf ;-inf 0 0 )").getCopyWithNumbersFolded().getSerializedStructure())
        ).toMatchObject({
            type: "big_int",
            value: "",
            children: [
                {
                    type: "number",
                    value: "Infinity",
                    children: [],
                },
                {
                    type: "number",
                    value: "-Infinity",
                    children: [],
                },
                {
                    type: "number",
                    value: "0",
                    children: [],
                },
                {
                    type: "number",
                    value: "0",
                    children: [],
                },
            ],
        });
        expect(
            operatorFromString(testConfig, "int (inf; -inf 0 0 )").getCopyWithNumbersFolded().getExportFormulaString()
        ).toEqual("\\int\\limits_{\\infty}^{-\\infty}0\\mathrm{d}0");
    });

    test("Sum folding omit zero", () => {
        expect(
            JSON.parse(operatorFromString(testConfig, "0+x+0+x").getCopyWithNumbersFolded().getSerializedStructure())
        ).toMatchObject({
            type: "bracketed_sum",
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
            ],
        });
        expect(
            JSON.parse(operatorFromString(testConfig, "1+x-1").getCopyWithNumbersFolded().getSerializedStructure())
        ).toMatchObject({
            type: "variable",
            value: "x",
            children: [],
        });
    });

    test("Product folding omit one", () => {
        expect(
            JSON.parse(operatorFromString(testConfig, "0.5 x 2 x").getCopyWithNumbersFolded().getSerializedStructure())
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
                    value: "x",
                    children: [],
                },
            ],
        });
        expect(
            JSON.parse(operatorFromString(testConfig, "x*1").getCopyWithNumbersFolded().getSerializedStructure())
        ).toMatchObject({
            type: "variable",
            value: "x",
            children: [],
        });
    });

    test("More constants folding", () => {
        expect(
            JSON.parse(operatorFromString(testConfig, "e *pi * sqrt2").getCopyWithNumbersFolded().getSerializedStructure())
        ).toMatchObject({ type: "number", value: "12.077", children: [] });
        expect(
            JSON.parse(operatorFromString(testConfig, "e + pi + sqrt2").getCopyWithNumbersFolded().getSerializedStructure())
        ).toMatchObject({ type: "number", value: "7.2741", children: [] });
    });

    test("Percent folding", () => {
        expect(
            JSON.parse(operatorFromString(testConfig, "12%").getCopyWithNumbersFolded().getSerializedStructure())
        ).toMatchObject({ type: "number", value: "0.12", children: [] });
        expect(
            JSON.parse(operatorFromString(testConfig, "x%").getCopyWithNumbersFolded().getSerializedStructure())
        ).toMatchObject({ type: "percent", value: "", children: [{ type: "variable", value: "x", children: [] }] });
    });

    test("Faculty folding", () => {
        expect(
            JSON.parse(operatorFromString(testConfig, "0!").getCopyWithNumbersFolded().getSerializedStructure())
        ).toMatchObject({ type: "number", value: "1", children: [] });
        expect(
            JSON.parse(operatorFromString(testConfig, "1!").getCopyWithNumbersFolded().getSerializedStructure())
        ).toMatchObject({ type: "number", value: "1", children: [] });
        expect(
            JSON.parse(operatorFromString(testConfig, "12!").getCopyWithNumbersFolded().getSerializedStructure())
        ).toMatchObject({ type: "number", value: "479001600", children: [] });
        expect(
            JSON.parse(operatorFromString(testConfig, "x!").getCopyWithNumbersFolded().getSerializedStructure())
        ).toMatchObject({ type: "faculty", value: "", children: [{ type: "variable", value: "x", children: [] }] });
        expect(
            JSON.parse(operatorFromString(testConfig, "200!").getCopyWithNumbersFolded().getSerializedStructure())
        ).toMatchObject({ type: "number", value: "Infinity", children: [] });
    });

    test("BraKet and arrows", () => {
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "braket((up;down;up)(up;down;down))") as Braket)
                    .OrthoNormalEvalMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({ type: "number", value: "0", children: [] });
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "braket((up;down;up)(up;down;up))") as Braket)
                    .OrthoNormalEvalMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({ type: "number", value: "1", children: [] });
        expect(operatorFromString(testConfig, "up down").getCopyWithNumbersFolded(true).getExportFormulaString()).toBe(
            "\\left(\\uparrow \\cdot \\downarrow\\right)"
        );
    });
});
