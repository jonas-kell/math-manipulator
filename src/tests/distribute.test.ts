import { beforeEach, describe, expect, test, jest } from "@jest/globals";
jest.useFakeTimers();
import mockPinia from "./setupPiniaForTesting";
import { BracketedMultiplication, operatorFromString } from "../functions";

describe("DistributeMODIFICATION", () => {
    beforeEach(() => {
        mockPinia();
    });

    test("Working Distribute Examples", () => {
        expect(
            JSON.parse(
                (operatorFromString("(a+x+z)*(1+2)") as BracketedMultiplication).DistributeMODIFICATION().getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_sum",
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
                            type: "number",
                            value: "1",
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
                            value: "a",
                            children: [],
                        },
                        {
                            type: "number",
                            value: "2",
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
                            value: "x",
                            children: [],
                        },
                        {
                            type: "number",
                            value: "1",
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
                            type: "number",
                            value: "1",
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
                            type: "number",
                            value: "2",
                            children: [],
                        },
                    ],
                },
            ],
        });
        expect(
            (operatorFromString("(a+x+z)*(1+2+4+3)*(g+h+l)") as BracketedMultiplication)
                .DistributeMODIFICATION()
                .getExportFormulaString()
        ).toBe(
            "\\left(\\left({a} \\cdot 1 \\cdot {g}\\right)+\\left({a} \\cdot 1 \\cdot {h}\\right)+\\left({a} \\cdot 1 \\cdot {l}\\right)+\\left({a} \\cdot 2 \\cdot {g}\\right)+\\left({a} \\cdot 2 \\cdot {h}\\right)+\\left({a} \\cdot 2 \\cdot {l}\\right)+\\left({a} \\cdot 4 \\cdot {g}\\right)+\\left({a} \\cdot 4 \\cdot {h}\\right)+\\left({a} \\cdot 4 \\cdot {l}\\right)+\\left({a} \\cdot 3 \\cdot {g}\\right)+\\left({a} \\cdot 3 \\cdot {h}\\right)+\\left({a} \\cdot 3 \\cdot {l}\\right)+\\left({x} \\cdot 1 \\cdot {g}\\right)+\\left({x} \\cdot 1 \\cdot {h}\\right)+\\left({x} \\cdot 1 \\cdot {l}\\right)+\\left({x} \\cdot 2 \\cdot {g}\\right)+\\left({x} \\cdot 2 \\cdot {h}\\right)+\\left({x} \\cdot 2 \\cdot {l}\\right)+\\left({x} \\cdot 4 \\cdot {g}\\right)+\\left({x} \\cdot 4 \\cdot {h}\\right)+\\left({x} \\cdot 4 \\cdot {l}\\right)+\\left({x} \\cdot 3 \\cdot {g}\\right)+\\left({x} \\cdot 3 \\cdot {h}\\right)+\\left({x} \\cdot 3 \\cdot {l}\\right)+\\left({z} \\cdot 1 \\cdot {g}\\right)+\\left({z} \\cdot 1 \\cdot {h}\\right)+\\left({z} \\cdot 1 \\cdot {l}\\right)+\\left({z} \\cdot 2 \\cdot {g}\\right)+\\left({z} \\cdot 2 \\cdot {h}\\right)+\\left({z} \\cdot 2 \\cdot {l}\\right)+\\left({z} \\cdot 4 \\cdot {g}\\right)+\\left({z} \\cdot 4 \\cdot {h}\\right)+\\left({z} \\cdot 4 \\cdot {l}\\right)+\\left({z} \\cdot 3 \\cdot {g}\\right)+\\left({z} \\cdot 3 \\cdot {h}\\right)+\\left({z} \\cdot 3 \\cdot {l}\\right)\\right)"
        );
    });

    test("Default self return", () => {
        expect(
            JSON.parse((operatorFromString("x*3") as BracketedMultiplication).DistributeMODIFICATION().getSerializedStructure())
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
                    type: "number",
                    value: "3",
                    children: [],
                },
            ],
        });
    });

    test("Distribute with singular elements", () => {
        expect(
            JSON.parse(
                (operatorFromString("(a+x+z)*3") as BracketedMultiplication).DistributeMODIFICATION().getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_sum",
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
                            type: "number",
                            value: "3",
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
                            value: "x",
                            children: [],
                        },
                        {
                            type: "number",
                            value: "3",
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
                            type: "number",
                            value: "3",
                            children: [],
                        },
                    ],
                },
            ],
        });
    });
});
