import { beforeEach, describe, expect, test, jest } from "@jest/globals";
jest.useFakeTimers();
import mockPinia from "./setupPiniaForTesting";
import { generateOperatorConfig, useVariablesStore, operatorFromString, Variable, BracketedMultiplication } from "../functions";
import { v4 as uuidv4 } from "uuid";

describe("operator module - general some variable functions", () => {
    beforeEach(() => {
        mockPinia();
    });

    test("store and get values from content or default", () => {
        const variableTestConfig = generateOperatorConfig(uuidv4(), uuidv4(), uuidv4());

        // variable test is currently empty
        expect(
            JSON.parse(operatorFromString(variableTestConfig, "test").getCopyWithNumbersFolded().getSerializedStructure())
        ).toMatchObject({
            type: "variable",
            value: "test",
            children: [],
        });
        expect(
            JSON.parse((operatorFromString(variableTestConfig, "test") as Variable).UnpackMODIFICATION().getSerializedStructure())
        ).toMatchObject({
            type: "variable",
            value: "test",
            children: [],
        });

        // set variable test
        useVariablesStore().setOperatorForVariable(variableTestConfig, "test", operatorFromString(variableTestConfig, "3!"));

        // variable test is now has content
        expect(
            JSON.parse(operatorFromString(variableTestConfig, "test").getCopyWithNumbersFolded().getSerializedStructure())
        ).toMatchObject({ type: "number", value: "6", children: [] });
        expect(
            JSON.parse(
                operatorFromString(variableTestConfig, "test").getCopyWithGottenRidOfUnnecessaryTerms().getSerializedStructure()
            )
        ).toMatchObject({ type: "variable", value: "test", children: [] });
    });

    test("commutable argument having variables", () => {
        const variableTestConfig = generateOperatorConfig(uuidv4(), uuidv4(), uuidv4());

        // variable test is currently empty
        expect(
            JSON.parse(
                (operatorFromString(variableTestConfig, 'cvc("b"; m)cvc("b"; l)cvc("asd"; m)') as BracketedMultiplication)
                    .orderOperatorStrings()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_multiplication",
            value: "",
            children: [
                {
                    type: "commutable_variable_container",
                    value: "asd",
                    children: [{ type: "variable", value: "m", children: [] }],
                },
                { type: "commutable_variable_container", value: "b", children: [{ type: "variable", value: "l", children: [] }] },
                { type: "commutable_variable_container", value: "b", children: [{ type: "variable", value: "m", children: [] }] },
            ],
        });
    });
});
