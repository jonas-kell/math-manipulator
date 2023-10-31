import { describe, expect, test } from "@jest/globals";
import { operatorFromString } from "../functions/parser";
import { Numerical, StructuralContainer, StructuralVariable, Variable } from "../functions/operator";

describe("operator module - numerical folding feature", () => {
    test("default sum folding", () => {
        expect(JSON.parse(operatorFromString("2+3+4").getCopyWithNumbersFolded().getSerializedStructure())).toMatchObject({
            type: "number",
            value: "9",
            children: [],
        });
    });

    test("default multiplication folding", () => {
        expect(JSON.parse(operatorFromString("1 2 3").getCopyWithNumbersFolded().getSerializedStructure())).toMatchObject({
            type: "number",
            value: "6",
            children: [],
        });
    });

    test("Unfoldable stuff does not get folded", () => {
        expect(JSON.parse(operatorFromString("x").getCopyWithNumbersFolded().getSerializedStructure())).toMatchObject({
            type: "variable",
            value: "x",
            children: [],
        });
    });

    test("Multi level Fold", () => {
        expect(
            JSON.parse(operatorFromString("1+8/2+3*2**(1+1)").getCopyWithNumbersFolded().getSerializedStructure())
        ).toMatchObject({
            type: "number",
            value: "17",
            children: [],
        });
    });

    test("Partial folding on unfoldable", () => {
        expect(
            JSON.parse(operatorFromString("1+8/2+3*x**(1+1)").getCopyWithNumbersFolded().getSerializedStructure())
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
        expect(JSON.parse(operatorFromString("1/y-2-z+1").getCopyWithNumbersFolded().getSerializedStructure())).toMatchObject({
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
        expect(JSON.parse(operatorFromString("1/y-2-z+1").getCopyWithNumbersFolded().getSerializedStructure())).toMatchObject({
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
                operatorFromString("exp(-inf)+exp(z)+sin(pi)+sin(x)+cos(pi)+cos(y)")
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
                new StructuralContainer([
                    new StructuralVariable("A", new Variable("x")),
                    new StructuralVariable("B", new Numerical(1)),
                ])
                    .getCopyWithNumbersFolded()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            children: [
                {
                    children: [
                        {
                            children: [],
                            type: "variable",
                            value: "x",
                        },
                    ],
                    type: "structural_variable",
                    value: "A",
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

    // TODO replacement tests
});
