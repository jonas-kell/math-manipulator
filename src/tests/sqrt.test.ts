import { beforeEach, describe, expect, test, jest } from "@jest/globals";
jest.useFakeTimers();
import mockPinia from "./setupPiniaForTesting";
import { operatorFromString, generateOperatorConfig } from "../functions";

describe("operator implementation delta", () => {
    beforeEach(() => {
        mockPinia();
    });
    const testConfig = generateOperatorConfig();

    test("Parsing", () => {
        expect(JSON.parse(operatorFromString(testConfig, "sqrt( x**2)").getSerializedStructure())).toMatchObject({
            type: "sqrt",
            value: "",
            children: [
                {
                    type: "power",
                    value: "",
                    children: [
                        { type: "variable", value: "x", children: [] },
                        { type: "number", value: "2", children: [] },
                    ],
                },
            ],
        });
    });

    test("Rendering", () => {
        expect(operatorFromString(testConfig, "sqrt (x**2)").getExportFormulaString()).toEqual("\\sqrt{{{x}}^{2}}");
    });

    test("Numerical Value", () => {
        expect(
            JSON.parse(operatorFromString(testConfig, "sqrt (5)").getCopyWithNumbersFolded().getSerializedStructure())
        ).toMatchObject({ type: "number", value: "2.2361", children: [] });
        expect(
            JSON.parse(operatorFromString(testConfig, "sqrt (9765625)").getCopyWithNumbersFolded().getSerializedStructure())
        ).toMatchObject({ type: "number", value: "3125", children: [] });
        expect(
            JSON.parse(operatorFromString(testConfig, "sqrt (x)").getCopyWithNumbersFolded().getSerializedStructure())
        ).toMatchObject({
            type: "sqrt",
            value: "",
            children: [{ type: "variable", value: "x", children: [] }],
        });
    });
});
