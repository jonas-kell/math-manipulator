import { beforeEach, describe, expect, test, jest } from "@jest/globals";
jest.useFakeTimers();
import mockPinia from "./setupPiniaForTesting";
import { operatorFromString, Operator } from "../functions";

describe("operator module - equivalence assertion", () => {
    beforeEach(() => {
        mockPinia();
    });

    test("Default comparison, type and value", () => {
        expect(Operator.assertOperatorsEquivalent(operatorFromString("x"), operatorFromString("x"))).toBeTruthy();
        expect(Operator.assertOperatorsEquivalent(operatorFromString("x"), operatorFromString("pi"))).toBeFalsy();
        expect(Operator.assertOperatorsEquivalent(operatorFromString("x"), operatorFromString("y"))).toBeFalsy();
    });

    test("Number children", () => {
        expect(Operator.assertOperatorsEquivalent(operatorFromString("x+y"), operatorFromString("x+y"))).toBeTruthy();
        expect(Operator.assertOperatorsEquivalent(operatorFromString("x+y"), operatorFromString("x+y+z"))).toBeFalsy();
    });

    test("Different children", () => {
        expect(Operator.assertOperatorsEquivalent(operatorFromString("x+y"), operatorFromString("x+y"))).toBeTruthy();
        expect(Operator.assertOperatorsEquivalent(operatorFromString("x+y"), operatorFromString("x+z"))).toBeFalsy();
    });

    test("Numerical Values match", () => {
        expect(Operator.assertOperatorsEquivalent(operatorFromString("1+2+x"), operatorFromString("6"))).toBeFalsy();
        expect(Operator.assertOperatorsEquivalent(operatorFromString("6"), operatorFromString("1+2+x"))).toBeFalsy();
        expect(Operator.assertOperatorsEquivalent(operatorFromString("1+2+3"), operatorFromString("6"))).toBeTruthy();
    });
});
