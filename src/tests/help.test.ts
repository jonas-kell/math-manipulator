import { beforeEach, describe, expect, test, jest } from "@jest/globals";
jest.useFakeTimers();
import mockPinia from "./setupPiniaForTesting";
import { Operator } from "../functions";
import helpDatabaseImport from "./../pages/helpDatabase.json";
import { HelpElement } from "./../pages/helpElement";

const helpDatabase = helpDatabaseImport as HelpElement[];

describe("Test-Page initial render", () => {
    beforeEach(() => {
        mockPinia();
    });

    helpDatabase.forEach((elem) => {
        for (const uuid in elem.storage) {
            test(`Help: ${elem.title}, uuid: ${uuid}`, () => {
                const text = elem.storage[uuid];
                if (text != undefined) {
                    const value: any = JSON.parse(text);
                    // Don't test for text blocks and variables //TODO do separately
                    if (value.variables == undefined && value.textValue == undefined && value.operator != undefined) {
                        const structure = JSON.parse(value.operator);
                        expect(() => Operator.generateStructure(JSON.stringify(structure), true)).not.toThrow();
                    }
                }
            });
        }
    });
});
