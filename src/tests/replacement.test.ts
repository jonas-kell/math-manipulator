import { describe, expect, test } from "@jest/globals";
import { Numerical, Operator } from "../functions/operator";

describe("operator module - replace operator feature", () => {
    const testOp = Operator.generateStructure(
        JSON.stringify({
            type: "exp_function",
            value: "",
            children: [
                {
                    type: "bracketed_sum",
                    value: "",
                    children: [
                        {
                            type: "number",
                            value: "1",
                            children: [],
                            uuid: "c0dc69c0-f5af-48ea-b8a5-b96870d595da",
                        },
                        {
                            type: "number",
                            value: "4",
                            children: [],
                            uuid: "f7f98f57-4211-4cc4-9182-dfb0fd5ed470",
                        },
                    ],
                    uuid: "be603e6b-8dda-4eaf-84bd-3ac74b107940",
                },
            ],
            uuid: "9e546568-4914-4a8a-bce5-e90aa6ded1dd",
        }),
        true
    );

    test("replace an operator from nested", () => {
        expect(
            JSON.parse(
                testOp
                    .getCopyWithReplaced(Operator.uuidFromUUIDRef("ref_f7f98f57-4211-4cc4-9182-dfb0fd5ed470"), new Numerical(5))
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "exp_function",
            value: "",
            children: [
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
                            type: "number",
                            value: "5",
                            children: [],
                        },
                    ],
                },
            ],
        });
    });

    test("get operator from nested", () => {
        expect(
            JSON.parse(
                testOp
                    .getOperatorByUUID(Operator.uuidFromUUIDRef("ref_c0dc69c0-f5af-48ea-b8a5-b96870d595da"))!
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "number",
            value: "1",
            children: [],
            uuid: "c0dc69c0-f5af-48ea-b8a5-b96870d595da",
        });
    });

    test("get operator where it cannot be found", () => {
        expect(testOp.getOperatorByUUID(Operator.uuidFromUUIDRef("ref_c0dc69c0-f5af-48ea-b8a5-b96870d595d9"))).toBeNull();
    });
});
