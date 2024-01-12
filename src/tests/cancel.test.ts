import { beforeEach, describe, expect, test, jest } from "@jest/globals";
jest.useFakeTimers();
import mockPinia from "./setupPiniaForTesting";
import { operatorFromString, BracketedSum, generateOperatorConfig, Operator, BracketedMultiplication } from "../functions";

describe("operator module - cancel from sums feature", () => {
    beforeEach(() => {
        mockPinia();
    });
    const testConfig = generateOperatorConfig();

    test("nothing to fold", () => {
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "x+--x") as BracketedSum)
                    .EliminateCancelingTermsMODIFICATION()
                    .getSerializedStructure()
            )
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
                    type: "negation",
                    value: "",
                    children: [
                        {
                            type: "negation",
                            value: "",
                            children: [
                                {
                                    type: "variable",
                                    value: "x",
                                    children: [],
                                },
                            ],
                        },
                    ],
                },
            ],
        });
    });

    test("only fold one element if multiple are present", () => {
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "x-x+x") as BracketedSum)
                    .EliminateCancelingTermsMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "variable",
            value: "x",
            children: [],
        });
    });

    test("Different order and elements left", () => {
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "-x+z+y+x") as BracketedSum)
                    .EliminateCancelingTermsMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_sum",
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

    test("More complex and pulls out minus smartly", () => {
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "x/(2-y)+zxa+(-x/(2-y))") as BracketedSum)
                    .EliminateCancelingTermsMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "variable",
            value: "zxa",
            children: [],
        });
    });

    test("Advanced Cancel adjacent sum", () => {
        const operator = operatorFromString(testConfig, "b+a+b+c+c+b+a+c+c");

        expect(
            JSON.parse(
                Operator.processPeerAlterationResult(
                    operator,
                    (operator as BracketedSum).adjacentElementsCancelPEERALTERATION([
                        operatorFromString(testConfig, "c"),
                        operatorFromString(testConfig, "b"),
                    ])
                ).getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_sum",
            value: "",
            children: [
                { type: "variable", value: "b", children: [] },
                { type: "variable", value: "a", children: [] },
                { type: "variable", value: "a", children: [] },
                { type: "variable", value: "c", children: [] },
                { type: "variable", value: "c", children: [] },
            ],
        });
    });
    test("Advanced Cancel non-adjacent sum", () => {
        const operator = operatorFromString(testConfig, "b+a+b+c+c+b+a+c+c");

        expect(
            JSON.parse(
                Operator.processPeerAlterationResult(
                    operator,
                    (operator as BracketedSum).elementsCancelPEERALTERATION([
                        operatorFromString(testConfig, "c"),
                        operatorFromString(testConfig, "b"),
                    ])
                ).getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_sum",
            value: "",
            children: [
                { type: "variable", value: "a", children: [] },
                { type: "variable", value: "a", children: [] },
                { type: "variable", value: "c", children: [] },
            ],
        });

        // wrong input
        expect((operator as BracketedSum).elementsCancelPEERALTERATION([operatorFromString(testConfig, "c")]).length).toBe(0);
    });

    test("Advanced Cancel adjacent product", () => {
        const operator = operatorFromString(testConfig, "b a b c c b a c c");

        expect(
            JSON.parse(
                Operator.processPeerAlterationResult(
                    operator,
                    (operator as BracketedMultiplication).adjacentElementsCancelPEERALTERATION([
                        operatorFromString(testConfig, "c"),
                        operatorFromString(testConfig, "b"),
                    ])
                ).getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_multiplication",
            value: "",
            children: [
                { type: "variable", value: "b", children: [] },
                { type: "variable", value: "a", children: [] },
                { type: "variable", value: "a", children: [] },
                { type: "variable", value: "c", children: [] },
                { type: "variable", value: "c", children: [] },
            ],
        });
    });
    test("Advanced Cancel non-adjacent product", () => {
        const operator = operatorFromString(testConfig, "b a b c c b a c c");

        expect(
            JSON.parse(
                Operator.processPeerAlterationResult(
                    operator,
                    (operator as BracketedMultiplication).elementsCancelPEERALTERATION([
                        operatorFromString(testConfig, "c"),
                        operatorFromString(testConfig, "b"),
                    ])
                ).getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_multiplication",
            value: "",
            children: [
                { type: "variable", value: "a", children: [] },
                { type: "variable", value: "a", children: [] },
                { type: "variable", value: "c", children: [] },
            ],
        });
    });
});
