import { beforeEach, describe, expect, test, jest } from "@jest/globals";
jest.useFakeTimers();
import mockPinia from "./setupPiniaForTesting";
import { operatorFromString } from "../functions";

describe("operator implementation delta", () => {
    beforeEach(() => {
        mockPinia();
    });

    test("Parsing", () => {
        expect(JSON.parse(operatorFromString("delta(1 2)").getSerializedStructure())).toMatchObject({
            type: "kronecker_delta",
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
            ],
        });
    });

    test("Rendering", () => {
        expect(operatorFromString("delta(x y)").getExportFormulaString()).toEqual("\\delta_{{x},{y}}");
    });

    test("Numerical Value", () => {
        expect(JSON.parse(operatorFromString("delta(1 2)").getCopyWithNumbersFolded().getSerializedStructure())).toMatchObject({
            type: "number",
            value: "0",
            children: [],
        });
        expect(
            JSON.parse(operatorFromString("delta(2 (1+1))").getCopyWithNumbersFolded().getSerializedStructure())
        ).toMatchObject({
            type: "number",
            value: "1",
            children: [],
        });
        expect(
            JSON.parse(operatorFromString("delta(x (x+1))").getCopyWithNumbersFolded().getSerializedStructure())
        ).toMatchObject({
            type: "kronecker_delta",
            value: "",
            children: [
                {
                    type: "variable",
                    value: "x",
                    children: [],
                },
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
            ],
        });
    });
});
