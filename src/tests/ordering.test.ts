import { beforeEach, describe, expect, test, jest } from "@jest/globals";
jest.useFakeTimers();
import mockPinia from "./setupPiniaForTesting";
import { BracketedMultiplication, operatorFromString, generateOperatorConfig } from "../functions";

describe("operator module - ordering of operators", () => {
    beforeEach(() => {
        mockPinia();
    });
    const testConfig = generateOperatorConfig();

    test("Default implementation", () => {
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "sum({} {} {}) x sum({} {} {})") as BracketedMultiplication)
                    .orderOperatorStrings()
                    .getCopyWithGottenRidOfUnnecessaryTerms()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_multiplication",
            value: "",
            children: [
                {
                    type: "big_sum",
                    value: "",
                    children: [
                        {
                            type: "empty_argument",
                            value: "",
                            children: [],
                        },
                        {
                            type: "empty_argument",
                            value: "",
                            children: [],
                        },
                        {
                            type: "empty_argument",
                            value: "",
                            children: [],
                        },
                    ],
                },
                {
                    type: "variable",
                    value: "x",
                    children: [],
                },
                {
                    type: "big_sum",
                    value: "",
                    children: [
                        {
                            type: "empty_argument",
                            value: "",
                            children: [],
                        },
                        {
                            type: "empty_argument",
                            value: "",
                            children: [],
                        },
                        {
                            type: "empty_argument",
                            value: "",
                            children: [],
                        },
                    ],
                },
            ],
        });
    });

    test("Correct detection of substrings and local ordering", () => {
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "c#(0)c#(2)c#(1)sum({} {} {})c(2)c(0)c(1)") as BracketedMultiplication)
                    .orderOperatorStrings()
                    .getCopyWithGottenRidOfUnnecessaryTerms()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "negation",
            value: "",
            children: [
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        {
                            type: "fermionic_creation",
                            value: "",
                            children: [
                                {
                                    type: "number",
                                    value: "0",
                                    children: [],
                                },
                            ],
                        },
                        {
                            type: "fermionic_creation",
                            value: "",
                            children: [
                                {
                                    type: "number",
                                    value: "1",
                                    children: [],
                                },
                            ],
                        },
                        {
                            type: "fermionic_creation",
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
                            type: "big_sum",
                            value: "",
                            children: [
                                {
                                    type: "empty_argument",
                                    value: "",
                                    children: [],
                                },
                                {
                                    type: "empty_argument",
                                    value: "",
                                    children: [],
                                },
                                {
                                    type: "empty_argument",
                                    value: "",
                                    children: [],
                                },
                            ],
                        },
                        {
                            type: "fermionic_annihilation",
                            value: "",
                            children: [
                                {
                                    type: "number",
                                    value: "0",
                                    children: [],
                                },
                            ],
                        },
                        {
                            type: "fermionic_annihilation",
                            value: "",
                            children: [
                                {
                                    type: "number",
                                    value: "1",
                                    children: [],
                                },
                            ],
                        },
                        {
                            type: "fermionic_annihilation",
                            value: "",
                            children: [
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

    test("Complex ordering with different number of terms", () => {
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "c#(0)c#(2)c#(1)c(1)c(0)c(2)") as BracketedMultiplication)
                    .orderOperatorStrings()
                    .getCopyWithGottenRidOfUnnecessaryTerms()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_sum",
            value: "",
            children: [
                {
                    type: "negation",
                    value: "",
                    children: [
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
                            type: "fermionic_annihilation",
                            value: "",
                            children: [
                                {
                                    type: "number",
                                    value: "0",
                                    children: [],
                                },
                            ],
                        },
                        {
                            type: "fermionic_creation",
                            value: "",
                            children: [
                                {
                                    type: "number",
                                    value: "0",
                                    children: [],
                                },
                            ],
                        },
                    ],
                },
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        {
                            type: "fermionic_annihilation",
                            value: "",
                            children: [
                                {
                                    type: "number",
                                    value: "1",
                                    children: [],
                                },
                            ],
                        },
                        {
                            type: "fermionic_creation",
                            value: "",
                            children: [
                                {
                                    type: "number",
                                    value: "1",
                                    children: [],
                                },
                            ],
                        },
                    ],
                },
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        {
                            type: "fermionic_annihilation",
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
                            type: "fermionic_creation",
                            value: "",
                            children: [
                                {
                                    type: "number",
                                    value: "2",
                                    children: [],
                                },
                            ],
                        },
                    ],
                },
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        {
                            type: "fermionic_annihilation",
                            value: "",
                            children: [
                                {
                                    type: "number",
                                    value: "0",
                                    children: [],
                                },
                            ],
                        },
                        {
                            type: "fermionic_annihilation",
                            value: "",
                            children: [
                                {
                                    type: "number",
                                    value: "1",
                                    children: [],
                                },
                            ],
                        },
                        {
                            type: "fermionic_creation",
                            value: "",
                            children: [
                                {
                                    type: "number",
                                    value: "0",
                                    children: [],
                                },
                            ],
                        },
                        {
                            type: "fermionic_creation",
                            value: "",
                            children: [
                                {
                                    type: "number",
                                    value: "1",
                                    children: [],
                                },
                            ],
                        },
                    ],
                },
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        {
                            type: "fermionic_annihilation",
                            value: "",
                            children: [
                                {
                                    type: "number",
                                    value: "0",
                                    children: [],
                                },
                            ],
                        },
                        {
                            type: "fermionic_annihilation",
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
                            type: "fermionic_creation",
                            value: "",
                            children: [
                                {
                                    type: "number",
                                    value: "0",
                                    children: [],
                                },
                            ],
                        },
                        {
                            type: "fermionic_creation",
                            value: "",
                            children: [
                                {
                                    type: "number",
                                    value: "2",
                                    children: [],
                                },
                            ],
                        },
                    ],
                },
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        {
                            type: "fermionic_annihilation",
                            value: "",
                            children: [
                                {
                                    type: "number",
                                    value: "1",
                                    children: [],
                                },
                            ],
                        },
                        {
                            type: "fermionic_annihilation",
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
                            type: "fermionic_creation",
                            value: "",
                            children: [
                                {
                                    type: "number",
                                    value: "1",
                                    children: [],
                                },
                            ],
                        },
                        {
                            type: "fermionic_creation",
                            value: "",
                            children: [
                                {
                                    type: "number",
                                    value: "2",
                                    children: [],
                                },
                            ],
                        },
                    ],
                },
                {
                    type: "negation",
                    value: "",
                    children: [
                        {
                            type: "bracketed_multiplication",
                            value: "",
                            children: [
                                {
                                    type: "fermionic_annihilation",
                                    value: "",
                                    children: [
                                        {
                                            type: "number",
                                            value: "0",
                                            children: [],
                                        },
                                    ],
                                },
                                {
                                    type: "fermionic_annihilation",
                                    value: "",
                                    children: [
                                        {
                                            type: "number",
                                            value: "1",
                                            children: [],
                                        },
                                    ],
                                },
                                {
                                    type: "fermionic_annihilation",
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
                                    type: "fermionic_creation",
                                    value: "",
                                    children: [
                                        {
                                            type: "number",
                                            value: "0",
                                            children: [],
                                        },
                                    ],
                                },
                                {
                                    type: "fermionic_creation",
                                    value: "",
                                    children: [
                                        {
                                            type: "number",
                                            value: "1",
                                            children: [],
                                        },
                                    ],
                                },
                                {
                                    type: "fermionic_creation",
                                    value: "",
                                    children: [
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
                },
            ],
        });
    });

    test("More orderable types and getting type ordering correct", () => {
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "pi pi 3 c#(1)c(n)b(2) 1") as BracketedMultiplication)
                    .orderOperatorStrings()
                    .getCopyWithGottenRidOfUnnecessaryTerms()
                    .getSerializedStructure()
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
                            type: "number",
                            value: "3",
                            children: [],
                        },
                        {
                            type: "constant_pi",
                            value: "",
                            children: [],
                        },
                        {
                            type: "constant_pi",
                            value: "",
                            children: [],
                        },
                        {
                            type: "bosonic_annihilation",
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
                            type: "kronecker_delta",
                            value: "",
                            children: [
                                {
                                    type: "number",
                                    value: "1",
                                    children: [],
                                },
                                {
                                    type: "variable",
                                    value: "n",
                                    children: [],
                                },
                            ],
                        },
                    ],
                },
                {
                    type: "negation",
                    value: "",
                    children: [
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
                                    type: "constant_pi",
                                    value: "",
                                    children: [],
                                },
                                {
                                    type: "constant_pi",
                                    value: "",
                                    children: [],
                                },
                                {
                                    type: "fermionic_annihilation",
                                    value: "",
                                    children: [
                                        {
                                            type: "variable",
                                            value: "n",
                                            children: [],
                                        },
                                    ],
                                },
                                {
                                    type: "fermionic_creation",
                                    value: "",
                                    children: [
                                        {
                                            type: "number",
                                            value: "1",
                                            children: [],
                                        },
                                    ],
                                },
                                {
                                    type: "bosonic_annihilation",
                                    value: "",
                                    children: [
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
                },
            ],
        });
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "x y b#(n)b(2)pi") as BracketedMultiplication)
                    .orderOperatorStrings()
                    .getCopyWithGottenRidOfUnnecessaryTerms()
                    .getSerializedStructure()
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
                            type: "constant_pi",
                            value: "",
                            children: [],
                        },
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
                            type: "kronecker_delta",
                            value: "",
                            children: [
                                {
                                    type: "variable",
                                    value: "n",
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
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        {
                            type: "constant_pi",
                            value: "",
                            children: [],
                        },
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
                            type: "bosonic_annihilation",
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
                            type: "bosonic_creation",
                            value: "",
                            children: [
                                {
                                    type: "variable",
                                    value: "n",
                                    children: [],
                                },
                            ],
                        },
                    ],
                },
            ],
        });
    });
});
