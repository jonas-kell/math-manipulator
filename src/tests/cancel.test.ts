import { beforeEach, describe, expect, test, jest } from "@jest/globals";
jest.useFakeTimers();
import mockPinia from "./setupPiniaForTesting";
import { operatorFromString, BracketedSum } from "../functions";

describe("operator module - cancel from sums feature", () => {
    beforeEach(() => {
        mockPinia();
    });

    test("nothing to fold", () => {
        expect(
            JSON.parse(
                (operatorFromString("x+--x") as BracketedSum).EliminateCancelingTermsMODIFICATION().getSerializedStructure()
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
                (operatorFromString("x-x+x") as BracketedSum).EliminateCancelingTermsMODIFICATION().getSerializedStructure()
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
                (operatorFromString("-x+z+y+x") as BracketedSum).EliminateCancelingTermsMODIFICATION().getSerializedStructure()
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
                (operatorFromString("x/(2-y)+zxa+(-x/(2-y))") as BracketedSum)
                    .EliminateCancelingTermsMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "variable",
            value: "zxa",
            children: [],
        });
    });
});
