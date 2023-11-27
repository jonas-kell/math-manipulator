import { beforeEach, describe, expect, test, jest } from "@jest/globals";
jest.useFakeTimers();
import mockPinia from "./setupPiniaForTesting";
import { operatorFromString, Operator, generateOperatorConfig } from "../functions";

describe("operator module - equivalence assertion", () => {
    beforeEach(() => {
        mockPinia();
    });
    const testConfig = generateOperatorConfig();

    test("Default comparison, type and value", () => {
        expect(
            Operator.assertOperatorsEquivalent(operatorFromString(testConfig, "x"), operatorFromString(testConfig, "x"))
        ).toBeTruthy();
        expect(
            Operator.assertOperatorsEquivalent(operatorFromString(testConfig, "x"), operatorFromString(testConfig, "pi"))
        ).toBeFalsy();
        expect(
            Operator.assertOperatorsEquivalent(operatorFromString(testConfig, "x"), operatorFromString(testConfig, "y"))
        ).toBeFalsy();
    });

    test("Number children", () => {
        expect(
            Operator.assertOperatorsEquivalent(operatorFromString(testConfig, "x+y"), operatorFromString(testConfig, "x+y"))
        ).toBeTruthy();
        expect(
            Operator.assertOperatorsEquivalent(operatorFromString(testConfig, "x+y"), operatorFromString(testConfig, "x+y+z"))
        ).toBeFalsy();
    });

    test("Different children", () => {
        expect(
            Operator.assertOperatorsEquivalent(operatorFromString(testConfig, "x+y"), operatorFromString(testConfig, "x+y"))
        ).toBeTruthy();
        expect(
            Operator.assertOperatorsEquivalent(operatorFromString(testConfig, "x+y"), operatorFromString(testConfig, "x+z"))
        ).toBeFalsy();
    });

    test("Numerical Values match", () => {
        expect(
            Operator.assertOperatorsEquivalent(operatorFromString(testConfig, "1+2+x"), operatorFromString(testConfig, "6"))
        ).toBeFalsy();
        expect(
            Operator.assertOperatorsEquivalent(operatorFromString(testConfig, "6"), operatorFromString(testConfig, "1+2+x"))
        ).toBeFalsy();
        expect(
            Operator.assertOperatorsEquivalent(operatorFromString(testConfig, "1+2+3"), operatorFromString(testConfig, "6"))
        ).toBeTruthy();
    });
});
