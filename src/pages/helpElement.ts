export type HelpElement = {
    title: string;
    description: string;
    storage: { [key: string]: string | undefined };
    showVariables: boolean;
    mainUuid: string;
    variablesUuid: string;
};
