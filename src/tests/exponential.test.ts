import { beforeEach, describe, expect, test, jest } from "@jest/globals";
jest.useFakeTimers();
import mockPinia from "./setupPiniaForTesting";
import { operatorFromString, generateOperatorConfig, Exp } from "../functions";

describe("operator module - exponential feature", () => {
    beforeEach(() => {
        mockPinia();
    });
    const testConfig = generateOperatorConfig();

    test("Write exponential as sum", () => {
        expect(
            JSON.parse((operatorFromString(testConfig, "exp(a)") as Exp).WriteAsSeriesMODIFICATION().getSerializedStructure())
        ).toMatchObject({
            type: "big_sum",
            value: "",
            children: [
                {
                    type: "structural_container",
                    value: "",
                    children: [
                        { type: "variable", value: "n", children: [] },
                        { type: "equals", value: "", children: [] },
                        { type: "number", value: "0", children: [] },
                    ],
                },
                { type: "infinity", value: "", children: [] },
                {
                    type: "fraction",
                    value: "",
                    children: [
                        {
                            type: "power",
                            value: "",
                            children: [
                                { type: "variable", value: "a", children: [] },
                                { type: "variable", value: "n", children: [] },
                            ],
                        },
                        { type: "faculty", value: "", children: [{ type: "variable", value: "n", children: [] }] },
                    ],
                },
            ],
        });
    });

    test("Use Euler's Formula", () => {
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "exp(complex(0 phi))") as Exp)
                    .UseEulersFormulaMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_sum",
            value: "",
            children: [
                { type: "cos", value: "", children: [{ type: "op_phi", value: "", children: [] }] },
                {
                    type: "complex_operator_construct",
                    value: "",
                    children: [
                        { type: "number", value: "0", children: [] },
                        { type: "sin", value: "", children: [{ type: "op_phi", value: "", children: [] }] },
                    ],
                },
            ],
        });
        expect(
            JSON.parse((operatorFromString(testConfig, "exp(a)") as Exp).UseEulersFormulaMODIFICATION().getSerializedStructure())
        ).toMatchObject({ type: "exp_function", value: "", children: [{ type: "variable", value: "a", children: [] }] });
    });
});
