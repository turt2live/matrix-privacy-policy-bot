import * as config from "config";
import { LogConfig } from "matrix-js-snippets";

interface IConfig {
    homeserverUrl: string;
    asToken: string;
    userId: string;
    listener: {
        bind: string;
        port: number;
        path: string;
        repoOwner: string;
        repoName: string;
        branch: string;
        file: string;
        secret: string;
        effectiveKeyword: string;
    };
    message: {
        delaySeconds: number;
        htmlTemplate: string;
        textTemplate: string;
    };

    logging: LogConfig;
}

export default <IConfig>config;