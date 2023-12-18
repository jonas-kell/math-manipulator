import { beforeEach, describe, expect, test, jest } from "@jest/globals";
jest.useFakeTimers();
import mockPinia from "./setupPiniaForTesting";
import { BracketedMultiplication, BracketedSum, Operator, generateOperatorConfig } from "../functions";

describe("operator module - commute with subsequent", () => {
    beforeEach(() => {
        mockPinia();
    });
    const testConfig = generateOperatorConfig();

    test("Select right one from a longer string", () => {
        const input = Operator.generateStructure(
            testConfig,
            JSON.stringify({
                type: "bracketed_sum",
                value: "",
                children: [
                    {
                        type: "variable",
                        value: "y",
                        children: [],
                        uuid: "3a45c19e-626d-4424-a375-db308c5d8345",
                    },
                    {
                        type: "variable",
                        value: "x",
                        children: [],
                        uuid: "aa9dbee0-26b1-4666-aac9-29f9d8462ca9",
                    },
                    {
                        type: "variable",
                        value: "z",
                        children: [],
                        uuid: "28e699f7-e16c-4a1e-a2ae-c89c3c047cc8",
                    },
                ],
                uuid: "a4411408-3a02-4d13-9944-18b406af2097",
            }),
            true
        ) as BracketedSum;

        expect(
            JSON.parse(
                input
                    .commuteChildAndSubsequent("3a45c19e-626d-4424-a375-db308c5d8345")
                    .getCopyWithGottenRidOfUnnecessaryTerms()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_sum",
            value: "",
            children: [
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
                    type: "variable",
                    value: "z",
                    children: [],
                },
            ],
        });
    });

    test("Select right one from a longer string", () => {
        const input = Operator.generateStructure(
            testConfig,
            JSON.stringify({
                type: "bracketed_multiplication",
                value: "",
                children: [
                    {
                        type: "fermionic_annihilation",
                        value: "c",
                        children: [
                            {
                                type: "number",
                                value: "2",
                                children: [],
                                uuid: "d66fd16b-fb5d-4318-8f03-0b0e823dfdfc",
                            },
                        ],
                        uuid: "87603594-7029-4f94-b400-5c371184487a",
                    },
                    {
                        type: "fermionic_annihilation",
                        value: "c",
                        children: [
                            {
                                type: "number",
                                value: "0",
                                children: [],
                                uuid: "9d41cb04-52a0-498c-be9e-370c3723fb70",
                            },
                        ],
                        uuid: "f52e6dc0-7a5d-4037-93d4-77d7e68c785f",
                    },
                    {
                        type: "fermionic_annihilation",
                        value: "c",
                        children: [
                            {
                                type: "number",
                                value: "1",
                                children: [],
                                uuid: "7bccfe82-a26d-4582-a773-01cfc612f4d0",
                            },
                        ],
                        uuid: "c6770e8c-2dd4-4fe0-ba53-1063ffb6522e",
                    },
                ],
                uuid: "1e0b18e2-b38c-44eb-b80b-6bd94cf84ade",
            }),
            true
        ) as BracketedMultiplication;

        expect(
            JSON.parse(
                input
                    .commuteChildAndSubsequent("87603594-7029-4f94-b400-5c371184487a")
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
                            type: "fermionic_annihilation",
                            value: "c",
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
                            value: "c",
                            children: [
                                {
                                    type: "number",
                                    value: "2",
                                    children: [],
                                },
                            ],
                        },
                        {
                            type: "fermionic_annihilation",
                            value: "c",
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
            ],
        });
    });

    test("Test fermionic annihilation commutation", () => {
        const input = Operator.generateStructure(
            testConfig,
            JSON.stringify({
                type: "bracketed_multiplication",
                value: "",
                children: [
                    {
                        type: "fermionic_annihilation",
                        value: "c",
                        children: [
                            {
                                type: "number",
                                value: "2",
                                children: [],
                                uuid: "3d156be7-c74c-4e26-bc17-341c852d9175",
                            },
                        ],
                        uuid: "4d6add6e-9b46-47f5-a11c-b743f8d9a2b5",
                    },
                    {
                        type: "fermionic_annihilation",
                        value: "c",
                        children: [
                            {
                                type: "number",
                                value: "0",
                                children: [],
                                uuid: "5c5250ba-1c54-4cad-b673-285e25697401",
                            },
                        ],
                        uuid: "bcf5c45c-ed61-426c-8834-94112cb1c192",
                    },
                ],
                uuid: "46774884-afde-484c-9d87-8e8225670d53",
            }),
            true
        ) as BracketedMultiplication;

        expect(
            JSON.parse(
                input
                    .commuteChildAndSubsequent("4d6add6e-9b46-47f5-a11c-b743f8d9a2b5")
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
                            type: "fermionic_annihilation",
                            value: "c",
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
                            value: "c",
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

    test("Test fermionic annihilation to creation commutation", () => {
        const input = Operator.generateStructure(
            testConfig,
            JSON.stringify({
                type: "bracketed_multiplication",
                value: "",
                children: [
                    {
                        type: "fermionic_annihilation",
                        value: "c",
                        children: [
                            {
                                type: "number",
                                value: "4",
                                children: [],
                                uuid: "efb25d78-a2e8-41a8-94ba-635743f9da9e",
                            },
                        ],
                        uuid: "2e1b9f26-8be3-4a95-9d13-1b1bf660f0c4",
                    },
                    {
                        type: "fermionic_creation",
                        value: "c",
                        children: [
                            {
                                type: "variable",
                                value: "n",
                                children: [],
                                uuid: "f83994e2-34bb-4361-81ea-688bad8e2c1b",
                            },
                        ],
                        uuid: "374bbab6-56e7-418e-a7b4-35338591f803",
                    },
                ],
                uuid: "b16eb298-86fa-4204-9811-4be2561b2410",
            }),
            true
        ) as BracketedMultiplication;

        expect(
            JSON.parse(
                input
                    .commuteChildAndSubsequent("2e1b9f26-8be3-4a95-9d13-1b1bf660f0c4")
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
                            type: "bracketed_multiplication",
                            value: "",
                            children: [
                                {
                                    type: "fermionic_creation",
                                    value: "c",
                                    children: [
                                        {
                                            type: "variable",
                                            value: "n",
                                            children: [],
                                        },
                                    ],
                                },
                                {
                                    type: "fermionic_annihilation",
                                    value: "c",
                                    children: [
                                        {
                                            type: "number",
                                            value: "4",
                                            children: [],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    type: "kronecker_delta",
                    value: "",
                    children: [
                        {
                            type: "number",
                            value: "4",
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
        });
    });

    test("Test fermionic annihilation to number commutation", () => {
        const input = Operator.generateStructure(
            testConfig,
            JSON.stringify({
                type: "bracketed_multiplication",
                value: "",
                children: [
                    {
                        type: "fermionic_annihilation",
                        value: "c",
                        children: [
                            {
                                type: "number",
                                value: "2",
                                children: [],
                                uuid: "499d4b1f-cd51-4776-9cdb-544a4b69afec",
                            },
                        ],
                        uuid: "ee07c030-600e-4d36-aa2c-fde418634f4e",
                    },
                    {
                        type: "number",
                        value: "4",
                        children: [],
                        uuid: "c4c4c7c0-c7fd-4fda-ac37-555ae49cec68",
                    },
                ],
                uuid: "5a4c7e14-6bef-429f-9be4-5ca1f7608fdc",
            }),
            true
        ) as BracketedMultiplication;

        expect(
            JSON.parse(
                input
                    .commuteChildAndSubsequent("ee07c030-600e-4d36-aa2c-fde418634f4e")
                    .getCopyWithGottenRidOfUnnecessaryTerms()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_multiplication",
            value: "",
            children: [
                {
                    type: "number",
                    value: "4",
                    children: [],
                },
                {
                    type: "fermionic_annihilation",
                    value: "c",
                    children: [
                        {
                            type: "number",
                            value: "2",
                            children: [],
                        },
                    ],
                },
            ],
        });
    });

    test("Test fermionic creation commutation", () => {
        const input = Operator.generateStructure(
            testConfig,
            JSON.stringify({
                type: "bracketed_multiplication",
                value: "",
                children: [
                    {
                        type: "fermionic_creation",
                        value: "c",
                        children: [
                            {
                                type: "variable",
                                value: "n",
                                children: [],
                                uuid: "b793dc3f-9005-47d2-97c4-f712680426da",
                            },
                        ],
                        uuid: "4383d87d-5fa9-49ff-8f7c-c00df5c5f2ef",
                    },
                    {
                        type: "fermionic_creation",
                        value: "c",
                        children: [
                            {
                                type: "number",
                                value: "0",
                                children: [],
                                uuid: "427663d0-d2ea-4104-a4e3-56b59c0d3f75",
                            },
                        ],
                        uuid: "ad0e55b7-f0fb-4402-bee7-1480036cc572",
                    },
                ],
                uuid: "428dcf6e-d7aa-4a7a-a784-88796463b278",
            }),
            true
        ) as BracketedMultiplication;

        expect(
            JSON.parse(
                input
                    .commuteChildAndSubsequent("4383d87d-5fa9-49ff-8f7c-c00df5c5f2ef")
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
                            value: "c",
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
                            value: "c",
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

    test("Test fermionic creation to annihilation commutation", () => {
        const input = Operator.generateStructure(
            testConfig,
            JSON.stringify({
                type: "bracketed_multiplication",
                value: "",
                children: [
                    {
                        type: "fermionic_creation",
                        value: "c",
                        children: [
                            {
                                type: "variable",
                                value: "n",
                                children: [],
                                uuid: "a4e34123-5f82-47da-b196-dd3f5f154ca2",
                            },
                        ],
                        uuid: "0b841ae4-2802-49de-811b-81b57d1efc16",
                    },
                    {
                        type: "fermionic_annihilation",
                        value: "c",
                        children: [
                            {
                                type: "number",
                                value: "0",
                                children: [],
                                uuid: "17975335-d51e-4ee3-b641-6caba1fbb792",
                            },
                        ],
                        uuid: "546ed4f4-db32-4d2d-b74b-aa20a35afd12",
                    },
                ],
                uuid: "4818a41f-a66a-49d8-9f6f-49cd9bda6bde",
            }),
            true
        ) as BracketedMultiplication;

        expect(
            JSON.parse(
                input
                    .commuteChildAndSubsequent("0b841ae4-2802-49de-811b-81b57d1efc16")
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
                            type: "bracketed_multiplication",
                            value: "",
                            children: [
                                {
                                    type: "fermionic_annihilation",
                                    value: "c",
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
                                    value: "c",
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
                            value: "0",
                            children: [],
                        },
                    ],
                },
            ],
        });
    });

    test("Test fermionic creation to number commutation", () => {
        const input = Operator.generateStructure(
            testConfig,
            JSON.stringify({
                type: "bracketed_multiplication",
                value: "",
                children: [
                    {
                        type: "fermionic_creation",
                        value: "c",
                        children: [
                            {
                                type: "variable",
                                value: "n",
                                children: [],
                                uuid: "6213bed5-4e2c-4988-9b8b-69aa5589985a",
                            },
                        ],
                        uuid: "241097f2-90b6-44e9-a150-f3afefe14311",
                    },
                    {
                        type: "number",
                        value: "2",
                        children: [],
                        uuid: "3cd58eeb-e337-40eb-8025-44281cea45ea",
                    },
                ],
                uuid: "eab9fac6-c213-46e7-932b-87f2fc044ff7",
            }),
            true
        ) as BracketedMultiplication;

        expect(
            JSON.parse(
                input
                    .commuteChildAndSubsequent("241097f2-90b6-44e9-a150-f3afefe14311")
                    .getCopyWithGottenRidOfUnnecessaryTerms()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_multiplication",
            value: "",
            children: [
                {
                    type: "number",
                    value: "2",
                    children: [],
                },
                {
                    type: "fermionic_creation",
                    value: "c",
                    children: [
                        {
                            type: "variable",
                            value: "n",
                            children: [],
                        },
                    ],
                },
            ],
        });
    });

    test("Test bosonic annihilation commutation", () => {
        const input = Operator.generateStructure(
            testConfig,
            JSON.stringify({
                type: "bracketed_multiplication",
                value: "",
                children: [
                    {
                        type: "bosonic_annihilation",
                        value: "b",
                        children: [
                            {
                                type: "number",
                                value: "2",
                                children: [],
                                uuid: "3d156be7-c74c-4e26-bc17-341c852d9175",
                            },
                        ],
                        uuid: "4d6add6e-9b46-47f5-a11c-b743f8d9a2b5",
                    },
                    {
                        type: "bosonic_annihilation",
                        value: "b",
                        children: [
                            {
                                type: "number",
                                value: "0",
                                children: [],
                                uuid: "5c5250ba-1c54-4cad-b673-285e25697401",
                            },
                        ],
                        uuid: "bcf5c45c-ed61-426c-8834-94112cb1c192",
                    },
                ],
                uuid: "46774884-afde-484c-9d87-8e8225670d53",
            }),
            true
        ) as BracketedMultiplication;

        expect(
            JSON.parse(
                input
                    .commuteChildAndSubsequent("4d6add6e-9b46-47f5-a11c-b743f8d9a2b5")
                    .getCopyWithGottenRidOfUnnecessaryTerms()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_multiplication",
            value: "",
            children: [
                {
                    type: "bosonic_annihilation",
                    value: "b",
                    children: [
                        {
                            type: "number",
                            value: "0",
                            children: [],
                        },
                    ],
                },
                {
                    type: "bosonic_annihilation",
                    value: "b",
                    children: [
                        {
                            type: "number",
                            value: "2",
                            children: [],
                        },
                    ],
                },
            ],
        });
    });

    test("Test bosonic annihilation to creation commutation", () => {
        const input = Operator.generateStructure(
            testConfig,
            JSON.stringify({
                type: "bracketed_multiplication",
                value: "",
                children: [
                    {
                        type: "bosonic_annihilation",
                        value: "b",
                        children: [
                            {
                                type: "number",
                                value: "4",
                                children: [],
                                uuid: "efb25d78-a2e8-41a8-94ba-635743f9da9e",
                            },
                        ],
                        uuid: "2e1b9f26-8be3-4a95-9d13-1b1bf660f0c4",
                    },
                    {
                        type: "bosonic_creation",
                        value: "b",
                        children: [
                            {
                                type: "variable",
                                value: "n",
                                children: [],
                                uuid: "f83994e2-34bb-4361-81ea-688bad8e2c1b",
                            },
                        ],
                        uuid: "374bbab6-56e7-418e-a7b4-35338591f803",
                    },
                ],
                uuid: "b16eb298-86fa-4204-9811-4be2561b2410",
            }),
            true
        ) as BracketedMultiplication;

        expect(
            JSON.parse(
                input
                    .commuteChildAndSubsequent("2e1b9f26-8be3-4a95-9d13-1b1bf660f0c4")
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
                            type: "bosonic_creation",
                            value: "b",
                            children: [
                                {
                                    type: "variable",
                                    value: "n",
                                    children: [],
                                },
                            ],
                        },
                        {
                            type: "bosonic_annihilation",
                            value: "b",
                            children: [
                                {
                                    type: "number",
                                    value: "4",
                                    children: [],
                                },
                            ],
                        },
                    ],
                },
                {
                    type: "kronecker_delta",
                    value: "",
                    children: [
                        {
                            type: "number",
                            value: "4",
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
        });
    });

    test("Test bosonic annihilation to number commutation", () => {
        const input = Operator.generateStructure(
            testConfig,
            JSON.stringify({
                type: "bracketed_multiplication",
                value: "",
                children: [
                    {
                        type: "bosonic_annihilation",
                        value: "b",
                        children: [
                            {
                                type: "number",
                                value: "2",
                                children: [],
                                uuid: "499d4b1f-cd51-4776-9cdb-544a4b69afec",
                            },
                        ],
                        uuid: "ee07c030-600e-4d36-aa2c-fde418634f4e",
                    },
                    {
                        type: "number",
                        value: "4",
                        children: [],
                        uuid: "c4c4c7c0-c7fd-4fda-ac37-555ae49cec68",
                    },
                ],
                uuid: "5a4c7e14-6bef-429f-9be4-5ca1f7608fdc",
            }),
            true
        ) as BracketedMultiplication;

        expect(
            JSON.parse(
                input
                    .commuteChildAndSubsequent("ee07c030-600e-4d36-aa2c-fde418634f4e")
                    .getCopyWithGottenRidOfUnnecessaryTerms()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_multiplication",
            value: "",
            children: [
                {
                    type: "number",
                    value: "4",
                    children: [],
                },
                {
                    type: "bosonic_annihilation",
                    value: "b",
                    children: [
                        {
                            type: "number",
                            value: "2",
                            children: [],
                        },
                    ],
                },
            ],
        });
    });

    test("Test bosonic creation commutation", () => {
        const input = Operator.generateStructure(
            testConfig,
            JSON.stringify({
                type: "bracketed_multiplication",
                value: "",
                children: [
                    {
                        type: "bosonic_creation",
                        value: "b",
                        children: [
                            {
                                type: "variable",
                                value: "n",
                                children: [],
                                uuid: "b793dc3f-9005-47d2-97c4-f712680426da",
                            },
                        ],
                        uuid: "4383d87d-5fa9-49ff-8f7c-c00df5c5f2ef",
                    },
                    {
                        type: "bosonic_creation",
                        value: "b",
                        children: [
                            {
                                type: "number",
                                value: "0",
                                children: [],
                                uuid: "427663d0-d2ea-4104-a4e3-56b59c0d3f75",
                            },
                        ],
                        uuid: "ad0e55b7-f0fb-4402-bee7-1480036cc572",
                    },
                ],
                uuid: "428dcf6e-d7aa-4a7a-a784-88796463b278",
            }),
            true
        ) as BracketedMultiplication;

        expect(
            JSON.parse(
                input
                    .commuteChildAndSubsequent("4383d87d-5fa9-49ff-8f7c-c00df5c5f2ef")
                    .getCopyWithGottenRidOfUnnecessaryTerms()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_multiplication",
            value: "",
            children: [
                {
                    type: "bosonic_creation",
                    value: "b",
                    children: [
                        {
                            type: "number",
                            value: "0",
                            children: [],
                        },
                    ],
                },
                {
                    type: "bosonic_creation",
                    value: "b",
                    children: [
                        {
                            type: "variable",
                            value: "n",
                            children: [],
                        },
                    ],
                },
            ],
        });
    });

    test("Test bosonic creation to annihilation commutation", () => {
        const input = Operator.generateStructure(
            testConfig,
            JSON.stringify({
                type: "bracketed_multiplication",
                value: "",
                children: [
                    {
                        type: "bosonic_creation",
                        value: "b",
                        children: [
                            {
                                type: "variable",
                                value: "n",
                                children: [],
                                uuid: "a4e34123-5f82-47da-b196-dd3f5f154ca2",
                            },
                        ],
                        uuid: "0b841ae4-2802-49de-811b-81b57d1efc16",
                    },
                    {
                        type: "bosonic_annihilation",
                        value: "b",
                        children: [
                            {
                                type: "number",
                                value: "0",
                                children: [],
                                uuid: "17975335-d51e-4ee3-b641-6caba1fbb792",
                            },
                        ],
                        uuid: "546ed4f4-db32-4d2d-b74b-aa20a35afd12",
                    },
                ],
                uuid: "4818a41f-a66a-49d8-9f6f-49cd9bda6bde",
            }),
            true
        ) as BracketedMultiplication;

        expect(
            JSON.parse(
                input
                    .commuteChildAndSubsequent("0b841ae4-2802-49de-811b-81b57d1efc16")
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
                            type: "bosonic_annihilation",
                            value: "b",
                            children: [
                                {
                                    type: "number",
                                    value: "0",
                                    children: [],
                                },
                            ],
                        },
                        {
                            type: "bosonic_creation",
                            value: "b",
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
                            value: "0",
                            children: [],
                        },
                    ],
                },
            ],
        });
    });

    test("Test bosonic creation to number commutation", () => {
        const input = Operator.generateStructure(
            testConfig,
            JSON.stringify({
                type: "bracketed_multiplication",
                value: "",
                children: [
                    {
                        type: "bosonic_creation",
                        value: "b",
                        children: [
                            {
                                type: "variable",
                                value: "n",
                                children: [],
                                uuid: "6213bed5-4e2c-4988-9b8b-69aa5589985a",
                            },
                        ],
                        uuid: "241097f2-90b6-44e9-a150-f3afefe14311",
                    },
                    {
                        type: "number",
                        value: "2",
                        children: [],
                        uuid: "3cd58eeb-e337-40eb-8025-44281cea45ea",
                    },
                ],
                uuid: "eab9fac6-c213-46e7-932b-87f2fc044ff7",
            }),
            true
        ) as BracketedMultiplication;

        expect(
            JSON.parse(
                input
                    .commuteChildAndSubsequent("241097f2-90b6-44e9-a150-f3afefe14311")
                    .getCopyWithGottenRidOfUnnecessaryTerms()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_multiplication",
            value: "",
            children: [
                {
                    type: "number",
                    value: "2",
                    children: [],
                },
                {
                    type: "bosonic_creation",
                    value: "b",
                    children: [
                        {
                            type: "variable",
                            value: "n",
                            children: [],
                        },
                    ],
                },
            ],
        });
    });

    test("Force swap when element has no special logic attached", () => {
        const input = Operator.generateStructure(
            testConfig,
            JSON.stringify({
                type: "bracketed_multiplication",
                value: "",
                children: [
                    {
                        type: "variable",
                        value: "x",
                        children: [],
                        uuid: "59d9c330-1edc-418e-85c5-95f6e4deb715",
                    },
                    {
                        type: "big_sum",
                        value: "",
                        children: [
                            {
                                type: "empty_argument",
                                value: "",
                                children: [],
                                uuid: "7bed93e4-3a10-4690-894a-a4377113789a",
                            },
                            {
                                type: "empty_argument",
                                value: "",
                                children: [],
                                uuid: "f6c9efd3-b3f0-4848-8691-daa87d38cfe2",
                            },
                            {
                                type: "empty_argument",
                                value: "",
                                children: [],
                                uuid: "c4703e83-61ee-4e56-b849-e34fb7140016",
                            },
                        ],
                        uuid: "99968424-c522-4d02-94ed-bbbc531b6a9c",
                    },
                ],
                uuid: "6b724cc0-3944-4ff8-9d63-7b4dcc49dad0",
            }),
            true
        ) as BracketedMultiplication;

        expect(
            JSON.parse(
                input
                    .commuteChildAndSubsequent("59d9c330-1edc-418e-85c5-95f6e4deb715")
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
            ],
        });
    });
});
