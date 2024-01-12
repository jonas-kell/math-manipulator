import { beforeEach, describe, expect, test, jest } from "@jest/globals";
jest.useFakeTimers();
import mockPinia from "./setupPiniaForTesting";
import { generateOperatorConfig, useVariablesStore, operatorFromString } from "../functions";
import { v4 as uuidv4 } from "uuid";

describe("operator module - general some variable functions", () => {
    beforeEach(() => {
        mockPinia();
    });

    test("Peeralteration: pack-same-into-variable", () => {
        const variableTestConfig = generateOperatorConfig(uuidv4(), uuidv4(), uuidv4());

        // variable test is currently empty
        expect(
            JSON.parse(operatorFromString(variableTestConfig, "test").getCopyWithNumbersFolded().getSerializedStructure())
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
});
