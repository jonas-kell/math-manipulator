import { beforeEach, describe, expect, test } from "@jest/globals";
import mockPinia from "./setupPiniaForTesting";
import { constructContainerOrFirstChild, OperatorType, EmptyArgument, operatorFromString } from "../functions";

describe("operator module - create container function", () => {
    beforeEach(() => {
        mockPinia();
    });

    test("Not implemented type", () => {
        expect(() => constructContainerOrFirstChild(OperatorType.BigInt as any, [])).toThrow();
        expect(() =>
            constructContainerOrFirstChild(OperatorType.BigInt as any, [new EmptyArgument(), new EmptyArgument()])
        ).toThrow();
    });

    test("Default initialization", () => {
        expect(JSON.parse(constructContainerOrFirstChild(OperatorType.BracketedSum, []).getSerializedStructure())).toMatchObject({
            type: "number",
            value: "0",
            children: [],
        });
        expect(
            JSON.parse(constructContainerOrFirstChild(OperatorType.BracketedMultiplication, []).getSerializedStructure())
        ).toMatchObject({
            type: "number",
            value: "1",
            children: [],
        });
        expect(
            JSON.parse(constructContainerOrFirstChild(OperatorType.StructuralContainer, []).getSerializedStructure())
        ).toMatchObject({
            type: "empty_argument",
            value: "",
            children: [],
        });
    });

    test("Associative bracket handling", () => {
        expect(JSON.parse(operatorFromString("1+(2+3)-(2+3)").getSerializedStructure())).toMatchObject({
            type: "bracketed_sum",
            value: "",
            children: [
                {
                    type: "number",
                    value: "1",
                    children: [],
                },
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
        });
        expect(JSON.parse(operatorFromString("x*y*z*(2*pi)").getSerializedStructure())).toMatchObject({
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
                {
                    type: "number",
                    value: "2",
                    children: [],
                },
                {
                    type: "constant_pi",
                    value: "",
                    children: [],
                },
            ],
        });
    });
});
